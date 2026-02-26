import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST /api/dev/seed-social - Mise à jour des établissements SOCIAL
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Mise à jour des établissements du secteur SOCIAL...');

    // 1. Récupérer et supprimer les établissements SOCIAL sans coordonnées valides
    const toDelete = await prisma.etablissement.findMany({
      where: { secteur: 'SOCIAL' },
      select: { id: true, nom: true, latitude: true, longitude: true }
    });
    
    const idsToDelete = toDelete
      .filter(e => e.latitude === null || e.longitude === null || e.latitude === 0 || e.longitude === 0)
      .map(e => e.id);
    
    if (idsToDelete.length > 0) {
      await prisma.etablissement.deleteMany({
        where: { id: { in: idsToDelete } }
      });
    }
    console.log(`🗑️  ${idsToDelete.length} établissements SOCIAL sans localisation supprimés.`);

    // 2. Données des établissements SOCIAL à créer/mettre à jour
    const etablissementsSocial = [
      {
        code: 'BNART-CASABL',
        nom: 'CENTRE D\'ORIENTATION D\'AIDE AUX PERSONNES EN SITUATION DE HANDICAP',
        nomArabe: 'مركز التوجيه لمساعدة الأشخاص في وضعية إعاقة',
        secteur: 'SOCIAL',
        nature: 'Public',
        tutelle: 'Min. de la Solidarité, de l\'Insertion Sociale et de la Famille - Entraide Nationale',
        latitude: 33.539654,
        longitude: -7.4843,
        communeNom: 'Médiouna',
        adresse: 'Rue Mohamed VI',
        telephone: '05 22 65 99 51',
        description: 'Accueil, Formation, Entraide, Handicap, Coopératives, Associations',
      },
      {
        code: 'EN-MED-1',
        nom: 'ESPACE MULTIFONCTIONNEL POUR FEMMES MEJJATIA',
        nomArabe: 'فضاء متعدد الوظائف للنساء مجاطية',
        secteur: 'SOCIAL',
        nature: 'Public',
        tutelle: 'Province de Médiouna',
        latitude: 33.63521,
        longitude: -7.5011,
        communeNom: 'Mejjatia Ouled Taleb',
        adresse: 'Commune rurale Mejjatia',
        description: 'Espace multifonctionnel offrant des services aux femmes',
      },
      {
        code: 'EN-SMLR2',
        nom: 'DÉLÉGATION DE LA SOLIDARITÉ ET DES RELATIONS AVEC LE PARLEMENT',
        nomArabe: 'مندوبية التضامن والعلاقات مع البرلمان',
        secteur: 'SOCIAL',
        nature: 'Public',
        tutelle: 'Min. de la Solidarité',
        latitude: 33.56009,
        longitude: -7.55,
        communeNom: 'Médiouna',
        adresse: 'Centre administratif',
        description: 'Délégation provinciale de la solidarité',
      },
      {
        code: 'EN-CMSY-1',
        nom: 'CENTRE DE VALORISATION FÉMININE',
        nomArabe: 'مركز تثمين المرأة',
        secteur: 'SOCIAL',
        nature: 'Public',
        tutelle: 'Province de Médiouna',
        latitude: 33.6289,
        longitude: -7.4797,
        communeNom: 'Sidi Hajjaj Oued Hassar',
        adresse: 'Centre ville',
        description: 'Centre dédié à la valorisation et l\'accompagnement des femmes',
      },
      {
        code: 'EN-CMF-1',
        nom: 'CENTRE MULTIFONCTIONNEL FEMME',
        nomArabe: 'مركز متعدد الوظائف للمرأة',
        secteur: 'SOCIAL',
        nature: 'Public',
        tutelle: 'Province de Médiouna',
        latitude: 33.582,
        longitude: -7.505,
        communeNom: 'Médiouna',
        adresse: 'Secteur administratif',
        description: 'Centre multifonctionnel offrant divers services aux femmes',
      },
    ];

    // 3. Récupérer la commune par défaut
    let communeDefault = await prisma.commune.findFirst({
      where: { nom: { contains: 'Médiouna' } }
    });

    if (!communeDefault) {
      communeDefault = await prisma.commune.findFirst();
    }

    if (!communeDefault) {
      return NextResponse.json({ error: 'Aucune commune trouvée' }, { status: 400 });
    }

    const results: string[] = [];

    // 4. Créer ou mettre à jour les établissements
    for (const etab of etablissementsSocial) {
      let commune = await prisma.commune.findFirst({
        where: { nom: { contains: etab.communeNom || 'Médiouna' } }
      });
      
      if (!commune) {
        commune = communeDefault;
      }

      const existingEtab = await prisma.etablissement.findUnique({
        where: { code: etab.code }
      });

      if (existingEtab) {
        await prisma.etablissement.update({
          where: { code: etab.code },
          data: {
            nom: etab.nom,
            nomArabe: etab.nomArabe,
            secteur: etab.secteur as any,
            nature: etab.nature,
            tutelle: etab.tutelle,
            latitude: etab.latitude,
            longitude: etab.longitude,
            adresseComplete: etab.adresse,
            telephone: etab.telephone,
            remarques: etab.description,
            isPublie: true,
            isValide: true,
            communeId: commune.id,
          } as any,
        });
        results.push(`✅ Mis à jour: ${etab.code}`);
      } else {
        await prisma.etablissement.create({
          data: {
            code: etab.code,
            nom: etab.nom,
            nomArabe: etab.nomArabe,
            secteur: etab.secteur as any,
            nature: etab.nature,
            tutelle: etab.tutelle,
            latitude: etab.latitude,
            longitude: etab.longitude,
            adresseComplete: etab.adresse,
            telephone: etab.telephone,
            remarques: etab.description,
            isPublie: true,
            isValide: true,
            communeId: commune.id,
            donneesSpecifiques: {},
          } as any,
        });
        results.push(`➕ Créé: ${etab.code}`);
      }
    }

    // 5. Vérification finale
    const countSocial = await prisma.etablissement.count({
      where: { secteur: 'SOCIAL', isPublie: true }
    });

    return NextResponse.json({
      success: true,
      deleted: idsToDelete.length,
      created: results.filter(r => r.startsWith('➕')).length,
      updated: results.filter(r => r.startsWith('✅')).length,
      totalSocial: countSocial,
      details: results,
    });

  } catch (error: any) {
    console.error('Erreur seed-social:', error);
    return NextResponse.json({ 
      error: 'Erreur serveur', 
      details: error?.message || String(error) 
    }, { status: 500 });
  }
}
