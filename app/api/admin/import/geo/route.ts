import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// Mapping table for older GeoJSON files
// Updated to match verified DB Commune Names: 'MEDIOUNA', 'TIT MELLIL', 'LAHRAOUIYINE', 'SIDI HAJJAJ', 'MAJJATIA'
const COMMUNE_MAPPING: Record<string, string> = {
    // Standardizations -> DB Name
    "Sidi Hajjaj Oued Hassar": "SIDI HAJJAJ",
    "Sidi Hajjaj": "SIDI HAJJAJ",
    "SIDI HAJJAJ OUED HASSAR": "SIDI HAJJAJ",
    
    "Médiouna": "MEDIOUNA",
    "Mediouna": "MEDIOUNA",
    
    "Mejjatia Ouled Taleb": "MAJJATIA",
    "Al Majjatiya Ouled Taleb": "MAJJATIA",
    "MEJJATIA OLD TALEB": "MAJJATIA",
    
    "Lahraouiyine": "LAHRAOUIYINE",
    
    "Tit Mellil": "TIT MELLIL",

    // Pachalik Prefixes -> DB Name
    "Pachalik Mejjatia Old Taleb": "MAJJATIA",
    "Pachalik Mediouna": "MEDIOUNA",
    "Pachalik Tit Mellil": "TIT MELLIL",
    "Pachalik Lahraouiyine": "LAHRAOUIYINE",
    "Pachalik Sidi Hajjaj Oued Hassar": "SIDI HAJJAJ"
};

// Precise Mapping based on User Data: Annexe Name -> Parent Commune (DB NAME)
const ANNEXE_TO_COMMUNE: Record<string, string> = {
    // --- MEJJATIA (DB: MAJJATIA) ---
    "CENTRE EL MAJATIYA": "MAJJATIA",
    "AA ARRACHAD": "MAJJATIA",
    "AA AL HAMD": "MAJJATIA",
    "AA ABBERAR": "MAJJATIA",
    "AA AL ABRAR": "MAJJATIA",
    "CENTRE": "MAJJATIA",
    
    // --- MEDIOUNA (DB: MEDIOUNA) ---
    "AA ZERKTOUNI": "MEDIOUNA",
    "PREMIERE ZARKTOUNI": "MEDIOUNA",
    "AA NASR ALLAH": "MEDIOUNA",
    "AA NASER ALLAH": "MEDIOUNA", // Variant found in errors
    "DEUXIEME NASR ALLAH": "MEDIOUNA",

    // --- TIT MELLIL (DB: TIT MELLIL) ---
    "AA BADR": "TIT MELLIL",
    "AA ERRAHMA": "TIT MELLIL",
    "AA HAJ MOUSSA": "TIT MELLIL",

    // --- LAHRAOUIYINE (DB: LAHRAOUIYINE) ---
    "AA NOUVELLE VILLE": "LAHRAOUIYINE",
    "AA N VILLE": "LAHRAOUIYINE",
    "AA QUARTIER INDUSTRIEL": "LAHRAOUIYINE",
    "AA Q INDUSTRIELLE": "LAHRAOUIYINE",
    "AA OULED MELLOUK": "LAHRAOUIYINE",
    "AA AL BASSATINE": "LAHRAOUIYINE",
    "AA ALBASSATINE": "LAHRAOUIYINE",
    "AA AL HALHAL": "LAHRAOUIYINE",
    "AA HALHAL LAHRAOUYINE": "LAHRAOUIYINE",
    "AA HALHAL LAHRAOUIYINE": "LAHRAOUIYINE", // Variant found in errors

    // --- SIDI HAJJAJ (DB: SIDI HAJJAJ) ---
    "AA AL ALIA": "SIDI HAJJAJ",
    "AA ALALIA": "SIDI HAJJAJ",
    "AA ALIA BADER": "SIDI HAJJAJ", // Variant found in errors
    "AA CHAMS AL MADINA": "SIDI HAJJAJ",
    "AA SHAMS ALMADINA": "SIDI HAJJAJ",
    "AA SIDI HAJJAJ CENTRE": "SIDI HAJJAJ",
    "AA NAJAH": "SIDI HAJJAJ",
    "AA RIYAD": "SIDI HAJJAJ",
    "AA OULED HADDA": "SIDI HAJJAJ"
};

// Helper: Get First Coordinate from MultiPolygon/Polygon
function getFirstCoord(geometry: any) {
  try {
    if (geometry.type === 'MultiPolygon') {
      return geometry.coordinates[0][0][0]; // [lon, lat]
    } else if (geometry.type === 'Polygon') {
      return geometry.coordinates[0][0]; // [lon, lat]
    }
  } catch (e) {
    return null;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entity') || 'annexe'; // Default to 'annexe' if not specified

    const body = await req.json();
    
    // Support FeatureCollection or direct Geometry
    const features = body.type === 'FeatureCollection' ? body.features : [body];
    
    let processedCount = 0;
    const errors: string[] = [];

    for (const feature of features) {
      if (!feature.properties || !feature.geometry) continue;

      const geometry = feature.geometry;
      const coord = getFirstCoord(geometry);
      
      // Extract common properties
      // Trying various casing - Expanded list
      const name = feature.properties.Name || feature.properties.name || feature.properties.NOM || feature.properties.nom || feature.properties.Commune || feature.properties.commune || feature.properties.ANNEXE || feature.properties.annexe; 
      const pachalik = feature.properties.Pachalik || feature.properties.pachalik || feature.properties.PACHALIK || feature.properties.Province || feature.properties.province || feature.properties.Cercle || feature.properties.cercle;

      if (!name) {
          const props = Object.keys(feature.properties).slice(0, 5).join(', ');
          errors.push(`Feature sans nom ignorée. Propriétés trouvées: ${props}...`);
          continue;
      }

      try {
      // Determine import mode
      let processed = false;

      // 1. Try to process as COMMUNE provided user asked for it OR name matches a known commune
      if (entityType === 'commune') {
            const commune = await prisma.commune.findFirst({
                where: {
                    nom: {
                        equals: name,
                        mode: 'insensitive'
                    }
                }
            });

            if (commune) {
                await prisma.commune.update({
                    where: { id: commune.id },
                    data: { geojsonBoundary: geometry }
                });
                processedCount++;
                processed = true;
            }
      }

      // 2. If not processed (because not found as Commune, or user selected Annexe), try Annexe logic
      // Smart Fallback: If user selected 'Commune' but data has 'Pachalik' or starts with 'AA', treat as Annexe.
      if (!processed) {
            const isExplicitAnnexe = entityType === 'annexe';
            const isImplicitAnnexe = pachalik || name.toUpperCase().startsWith('AA') || name.toUpperCase().startsWith('ANNEXE');

            if (isExplicitAnnexe || isImplicitAnnexe) {
                // --- ANNEXE LOGIC ---
                // 1. Identify Commune (Parent)
                let targetCommuneName = pachalik;
                
                // If no pachalik provided, but user selected Annexe, maybe the filename/context implies it? 
                // Fallback: Check ANNEXE_TO_COMMUNE map
                if (!targetCommuneName) {
                     // Normalize name for lookup (uppercase)
                     const upperName = name.toUpperCase().trim();
                     if (ANNEXE_TO_COMMUNE[upperName]) {
                         targetCommuneName = ANNEXE_TO_COMMUNE[upperName];
                     }
                }

                // Apply Mapping
                if (targetCommuneName && COMMUNE_MAPPING[targetCommuneName]) {
                    targetCommuneName = COMMUNE_MAPPING[targetCommuneName];
                }

                // If still no target name (e.g. implied Annexe but no Pachalik field), skip with error
                if (!targetCommuneName) {
                     const props = Object.keys(feature.properties).slice(0, 5).join(', ');
                     errors.push(`Annexe '${name}': Impossible d'identifier la commune parente (Champ Pachalik manquant). Props: ${props}`);
                     continue;
                }

                // Find Commune
                const commune = await prisma.commune.findFirst({
                    where: { 
                        nom: { 
                            equals: targetCommuneName, 
                            mode: 'insensitive' 
                        } 
                    }
                });

                if (!commune) {
                    const props = Object.keys(feature.properties).slice(0, 5).join(', ');
                    errors.push(`Annexe '${name}': Commune parente '${targetCommuneName}' introuvable. (Pachalik source: ${pachalik}).`);
                    continue; 
                }

                // 2. Identify/Create Annexe
                let annexe = await prisma.annexe.findFirst({
                    where: {
                        nom: { equals: name, mode: 'insensitive' },
                        communeId: commune.id
                    }
                });

                if (annexe) {
                    await prisma.annexe.update({
                        where: { id: annexe.id },
                        data: { geojsonBoundary: geometry }
                    });
                } else {
                    await prisma.annexe.create({
                        data: {
                            nom: name,
                            code: `ANN-${name.substring(0, 5).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${Math.floor(Math.random() * 10000)}`,
                            communeId: commune.id,
                            geojsonBoundary: geometry,
                            latitude: coord ? coord[1] : 0, 
                            longitude: coord ? coord[0] : 0
                        }
                    });
                }
                processedCount++;
                processed = true;

            } else {
                // Was meant to be commune but failed and doesn't look like an Annexe
                errors.push(`Commune '${name}' non trouvée dans la base de données. Impossible de mettre à jour la géométrie.`);
            }
      }

      } catch (err: any) {
          errors.push(`Erreur sur ${name}: ${err.message}`);
      }
    }

    return NextResponse.json({ 
        success: true, 
        count: processedCount, 
        errors: errors,
        message: `${processedCount} zones (${entityType}) mises à jour avec succès.`
    });

  } catch (error: any) {
    console.error('Geo Import Error:', error);
    return NextResponse.json({ error: 'Erreur lors de l\'import des données géographiques' }, { status: 500 });
  }
}
