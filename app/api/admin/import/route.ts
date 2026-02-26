import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';

const safeString = (val: string) => val ? val.trim() : undefined;
const safeInt = (val: string) => val ? parseInt(val.trim()) : undefined;
const safeFloat = (val: string) => val ? parseFloat(val.trim()) : undefined;
const safeDate = (val: string) => val ? new Date(val.trim()) : undefined;

// Helper to parse Int/Float flexibly
const parseIntSafe = (val: any) => {
   if (!val) return null;
   const n = parseInt(String(val).replace(/[^0-9]/g, ''));
   return isNaN(n) ? null : n;
};
const parseFloatSafe = (val: any) => {
   if (!val) return null;
   const n = parseFloat(String(val).replace(',', '.'));
   return isNaN(n) ? null : n;
};

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const entity = formData.get('entity') as string;

    if (!file || !entity) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    
    let rows: any[] = [];

    // Helper to normalize headers/keys
    const normalizeKey = (k: string) => k.toLowerCase().trim().replace(/['"«»]/g, '').replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
        const workbook = XLSX.read(buffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        // Use sheet_to_json with header: 1 to get raw array of arrays first to find header row, or just simple 'header' option if standard
        // Let's use robust header detection: sheet_to_json treats first row as header by default
        const rawJson = XLSX.utils.sheet_to_json(sheet);
        
        // Normalize keys of each object
        rows = rawJson.map((row: any) => {
            const newRow: any = {};
            Object.keys(row).forEach(key => {
                newRow[normalizeKey(key)] = row[key];
                newRow[key] = row[key]; // Keep original too just in case
            });
            return newRow;
        });

    } else {
        // Legacy CSV handling (kept for fallback but improved)
        const text = new TextDecoder().decode(buffer);
        const lines = text.split('\n').filter(line => line.trim() !== '');
        // ... (CSV logic omitted for brevity, assuming Excel is primary now)
        // For now, let's just make CSV fail gracefully or basic impl if needed, 
        // but user is using Excel now as requested.
        // Let's implement basic CSV to JSON for consistency if they use CSV
        if (lines.length > 0) {
           const headers = lines[0].split(/[;,]/).map(h => normalizeKey(h));
           rows = lines.slice(1).map(line => {
             const vals = line.split(/[;,]/);
             const obj: any = {};
             headers.forEach((h, i) => { if(vals[i]) obj[h] = vals[i].trim(); });
             return obj;
           });
        }
    }

    console.log('[IMPORT] Processed rows:', rows.length);
    if (rows.length === 0) {
         return NextResponse.json({ error: 'Fichier vide ou format non reconnu' }, { status: 400 });
    }

    // Helper to get value flexibly
    const getValue = (row: any, keys: string[]) => {
      for (const k of keys) {
        if (row[k] !== undefined) return row[k];
        const norm = normalizeKey(k);
        if (row[norm] !== undefined) return row[norm];
      }
      return undefined;
    };

    let count = 0;
    const errors = [];

    // Process based on entity
    switch(entity) {
      case 'etablissement':
        for (const row of rows) {
           try {
             // 1. SMART MAPPING
             const nom = getValue(row, ['nom', 'etablissement', 'nom_de_letablissement', 'structure', 'nom_structure', 'nom_fr', 'intitule', 'designation', 'libelle', 'ecole', 'nom_ecole', 'titre', 'name']);
             if (!nom) continue; // Skip if no name

             // 2. SECTOR DETECTION
             let secteurRaw = getValue(row, ['secteur', 'domaine', 'categorie']);
             let secteur = 'AUTRE';
             
             if (secteurRaw) {
                 const s = secteurRaw.toString().toUpperCase().trim();
                 if (s.includes('CULTURE') || s.includes('COLTURE') || s.includes('JEUNES') || s.includes('BIBLIO')) secteur = 'CULTUREL';
                 else if (s.includes('SPORT')) secteur = 'SPORT';
                 else if (s.includes('SANTE') || s.includes('MEDECIN') || s.includes('HOPITAL') || s.includes('CSU') || s.includes('CSR')) secteur = 'SANTE';
                 else if (s.includes('SOCIAL') || s.includes('FEMININ') || s.includes('FOYER') || s.includes('ENTRAIDE')) secteur = 'SOCIAL';
                 else if (s.includes('EDUC') || s.includes('ECOLE') || s.includes('LYCEE') || s.includes('COLLEGE')) secteur = 'EDUCATION';
                 else secteur = 'AUTRE';
             } else {
               // Heuristic detection based on content
               const content = JSON.stringify(row).toLowerCase();
               if (content.includes('medecin') || content.includes('sante') || content.includes('shopital') || content.includes('csu-') || content.includes('csr-')) secteur = 'SANTE';
               else if (content.includes('culture') || content.includes('maison de jeunes') || content.includes('bibliotheque')) secteur = 'CULTUREL';
               else if (content.includes('foot') || content.includes('sport') || content.includes('terrain')) secteur = 'SPORT';
               else if (content.includes('feminin') || content.includes('dar taliba') || content.includes('entraide')) secteur = 'SOCIAL';
               else if (content.includes('ecole') || content.includes('lycee') || content.includes('college') || content.includes('education')) secteur = 'EDUCATION';
               else secteur = 'AUTRE';
             }

             // 3. COMMUNE & ANNEXE DETECTION (Auto-Create)
             let communeId = null;
             let annexeId = null;

             // Helper Mappings (Same as GeoJSON Import)
             const COMMUNE_MAPPING: Record<string, string> = {
                "Sidi Hajjaj Oued Hassar": "SIDI HAJJAJ", "Sidi Hajjaj": "SIDI HAJJAJ", "SIDI HAJJAJ OUED HASSAR": "SIDI HAJJAJ",
                "Médiouna": "MEDIOUNA", "Mediouna": "MEDIOUNA", "MEDIOUNA": "MEDIOUNA",
                "Mejjatia Ouled Taleb": "MAJJATIA", "Al Majjatiya Ouled Taleb": "MAJJATIA", "MEJJATIA OLD TALEB": "MAJJATIA", "MAJJATIA": "MAJJATIA",
                "Lahraouiyine": "LAHRAOUIYINE", "LAHRAOUIYINE": "LAHRAOUIYINE",
                "Tit Mellil": "TIT MELLIL", "TIT MELLIL": "TIT MELLIL",
                "Pachalik Mejjatia Old Taleb": "MAJJATIA", "Pachalik Mediouna": "MEDIOUNA", "Pachalik Tit Mellil": "TIT MELLIL", "Pachalik Lahraouiyine": "LAHRAOUIYINE", "Pachalik Sidi Hajjaj Oued Hassar": "SIDI HAJJAJ"
             };
             
             // Annexe -> Commune Mapping
             const ANNEXE_TO_COMMUNE: Record<string, string> = {
                "CENTRE EL MAJATIYA": "MAJJATIA", "AA ARRACHAD": "MAJJATIA", "AA AL HAMD": "MAJJATIA", "AA ABBERAR": "MAJJATIA", "AA AL ABRAR": "MAJJATIA", "CENTRE": "MAJJATIA",
                "AA ZERKTOUNI": "MEDIOUNA", "PREMIERE ZARKTOUNI": "MEDIOUNA", "AA NASR ALLAH": "MEDIOUNA", "AA NASER ALLAH": "MEDIOUNA", "DEUXIEME NASR ALLAH": "MEDIOUNA",
                "AA BADR": "TIT MELLIL", "AA ERRAHMA": "TIT MELLIL", "AA HAJ MOUSSA": "TIT MELLIL",
                "AA NOUVELLE VILLE": "LAHRAOUIYINE", "AA N VILLE": "LAHRAOUIYINE", "AA QUARTIER INDUSTRIEL": "LAHRAOUIYINE", "AA Q INDUSTRIELLE": "LAHRAOUIYINE", "AA OULED MELLOUK": "LAHRAOUIYINE", "AA AL BASSATINE": "LAHRAOUIYINE", "AA ALBASSATINE": "LAHRAOUIYINE", "AA AL HALHAL": "LAHRAOUIYINE", "AA HALHAL LAHRAOUYINE": "LAHRAOUIYINE", "AA HALHAL LAHRAOUIYINE": "LAHRAOUIYINE",
                "AA AL ALIA": "SIDI HAJJAJ", "AA ALALIA": "SIDI HAJJAJ", "AA ALIA BADER": "SIDI HAJJAJ", "AA CHAMS AL MADINA": "SIDI HAJJAJ", "AA SHAMS ALMADINA": "SIDI HAJJAJ", "AA SIDI HAJJAJ CENTRE": "SIDI HAJJAJ", "AA NAJAH": "SIDI HAJJAJ", "AA RIYAD": "SIDI HAJJAJ", "AA OULED HADDA": "SIDI HAJJAJ"
             };

             let communeNom = getValue(row, ['commune', 'adresse', 'ville']) || 'Médiouna';
             const annexeNom = getValue(row, ['annexe', 'annexe_administrative', 'caqd', 'district']);

             // A. Try to deduce Commune from Annexe First (Stronger link)
             if (annexeNom) {
                 const upperAnnexe = String(annexeNom).toUpperCase().trim();
                 // 1. Check Explicit Mapping
                 if (ANNEXE_TO_COMMUNE[upperAnnexe]) {
                     communeNom = ANNEXE_TO_COMMUNE[upperAnnexe];
                 } else {
                     // 2. Try Partial Match in Mapping
                     const match = Object.keys(ANNEXE_TO_COMMUNE).find(k => k.includes(upperAnnexe) || upperAnnexe.includes(k));
                     if (match) communeNom = ANNEXE_TO_COMMUNE[match];
                 }
             }

             // B. Normalize Commune Name
             if (communeNom && COMMUNE_MAPPING[communeNom]) {
                 communeNom = COMMUNE_MAPPING[communeNom];
             }

             if (communeNom && typeof communeNom === 'string') {
                 // Clean name
                 const cleanCommune = communeNom.trim();
                 if (cleanCommune.length > 2) {
                     // Try find
                     let commune = await prisma.commune.findFirst({
                         where: { 
                             OR: [
                                 { nom: { equals: cleanCommune, mode: 'insensitive' } },
                                 { code: { equals: cleanCommune, mode: 'insensitive' } }
                             ]
                         }
                     });
                     
                     // Create if not found
                     if (!commune) {
                         try {
                              commune = await prisma.commune.create({
                                  data: {
                                      nom: cleanCommune,
                                      code: cleanCommune.toUpperCase().substring(0, 5), // Basic code gen
                                      province: 'Médiouna',
                                      region: 'Casablanca-Settat'
                                  }
                              });
                         } catch (e) {
                             // Fallback in case of race condition or error
                             commune = await prisma.commune.findFirst(); 
                         }
                     }
                     communeId = commune?.id;

                     // Handle Annexe (linked to Commune)
                     const annexeNom = getValue(row, ['annexe', 'annexe_administrative', 'caqd', 'district']);
                     if (annexeNom && typeof annexeNom === 'string' && communeId) {
                         const cleanAnnexe = annexeNom.trim();
                         let annexe = await prisma.annexe.findFirst({
                             where: {
                                 nom: { equals: cleanAnnexe, mode: 'insensitive' },
                                 communeId: communeId
                             }
                         });
                         
                         if (!annexe) {
                             try {
                                 // Generate unique code for Annexe
                                 const anxCode = `ANX-${cleanAnnexe.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${communeId}`;
                                 annexe = await prisma.annexe.create({
                                     data: {
                                         nom: cleanAnnexe,
                                         code: anxCode,
                                         communeId: communeId
                                     }
                                 });
                             } catch (e) { console.log('Annexe creation error', e); }
                         }
                         annexeId = annexe?.id;
                     }
                 }
             }
             
             // Fallback commune if still null
             if (!communeId) {
                 const firstCommune = await prisma.commune.findFirst();
                 communeId = firstCommune?.id;
                 if (!communeId) continue; // Should not happen if DB seeded
             }


             // 4. COORDINATES CLEANING
             let latStr = getValue(row, ['latitude', 'lat', 'gps_lat', 'y']);
             let lngStr = getValue(row, ['longitude', 'lon', 'lng', 'long', 'gps_lng', 'x']);
             
             // Check for merged fields like "Coordonnees" or "GPS" or "Position"
             if (!latStr && !lngStr) {
                 const merged = getValue(row, ['coordonnees', 'gps', 'position', 'localisation']);
                 if (merged && typeof merged === 'string' && merged.includes(',')) {
                      latStr = merged; // Will be split below
                 }
             }
             
             // Handle merged coordinates case "lat, long"
             if (latStr && typeof latStr === 'string' && latStr.includes(',') && !lngStr) {
                 const parts = latStr.split(',');
                 if (parts.length >= 2) {
                     latStr = parts[0];
                     lngStr = parts[1];
                 }
             }
             const cleanCoord = (val: any, type: 'lat' | 'lng') => {
                 let num = 0;
                 if (typeof val === 'number') num = val;
                 else if (val) num = parseFloat(val.toString().replace(',', '.').replace(/[^0-9.-]/g, ''));
                 
                 if (isNaN(num) || num === 0) return 0;

                 // Smart Scaling for missing decimals
                 if (type === 'lat') {
                     // Lat must be [-90, 90]
                     while (Math.abs(num) > 90) num /= 10;
                 } else {
                     // Lng must be [-180, 180]
                     while (Math.abs(num) > 180) num /= 10;
                 }
                 return num;
             };
             const latitude = cleanCoord(latStr, 'lat');
             const longitude = cleanCoord(lngStr, 'lng');

             // 5. DETERMINISTIC CODE GENERATION (Fix Redundancy)
             let code = getValue(row, ['code', 'reference', 'ref']);
             if (!code) {
                 // Create a deterministic slug from the name
                 const slug = nom.toString().toLowerCase()
                    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
                    .replace(/[^a-z0-9]/g, '') // Keep only alphanum
                    .substring(0, 40)
                    .toUpperCase();
                 
                 // FORMAT: SEC-SLUG-COMMUNE (Deterministe !)
                 const comCode = (communeNom || 'UNK').substring(0,3).toUpperCase();
                 let baseCode = `${secteur.substring(0,3)}-${slug}-${comCode}`;
                 
                 // HANDLING DUPLICATES FOR EDUCATION (Cycle check)
                 if (secteur === 'EDUCATION') {
                     const cycle = getValue(row, ['cycle', 'niveau', 'type_etablissement', 'categorie', 'nature']);
                     if (cycle) {
                         const c = cycle.toString().toLowerCase();
                         if (c.includes('prim')) baseCode += '-PRI';
                         else if (c.includes('coll')) baseCode += '-COL';
                         else if (c.includes('lyc')) baseCode += '-LYC';
                         else if (c.includes('pre') || c.includes('matern')) baseCode += '-PRE';
                         else if (c.includes('qual')) baseCode += '-QUA';
                     }
                 }
                 
                 // HANDLING DUPLICATES FOR SANTE/OTHER (Type check if available)
                 if (secteur !== 'EDUCATION') {
                      const type = getValue(row, ['type', 'categorie', 'nature']);
                       if (type) {
                           const t = type.toString().toLowerCase();
                           if (t.includes('urbain')) baseCode += '-URB';
                           else if (t.includes('rural')) baseCode += '-RUR';
                           else if (t.includes('niveau 1') || t.includes('niv 1')) baseCode += '-N1';
                           else if (t.includes('niveau 2') || t.includes('niv 2')) baseCode += '-N2';
                       }
                 }

                 code = baseCode;
             }

             // 6. EXTRACT SPECIFIC DATA
             // Put EVERYTHING else in donneesSpecifiques (excluding technical/useless data)
             const standardKeys = [
                 'nom', 'etablissement', 'secteur', 'commune', 'annexe', 'code', 'latitude', 'longitude', 'lat', 'lon', 'lng', 
                 'telephone', 'email', 'site_web', 'adresse', 'adresse_complete', 'quartier', 'douar',
                 'partenaires', 'partenaire', 'partenariat',
                 'remarques', 'observation', 'obs', 'notes',
                 'etat', 'etat_infrastructure', 'infrastructure',
                 'surface', 'surface_totale', 'superficie',
                 'salles', 'nb_salles', 'nombre_salles',
                 'personnel', 'nombre_personnel', 'staff', 'effectif',
                 'capacite', 'capacite_accueil', 'accueil',
                 'accessibilite', 'acces', 'pmr',
                 'statut', 'statut_fonctionnel', 'fonctionnel',
                 'eau', 'electricite', 'internet', 'wifi',
                 'categorie', 'type_etablissement', 'nature', 'object',
                 // EDU FIELDS
                 'cycle', 'niveau',
                 'nb_classes', 'classes', 'nombre_classes',
                 'nb_enseignants', 'enseignants', 'profs', 'nombre_enseignants', 'nb_personnels_enseignant',
                 'nb_cadres', 'cadres', 'administration', 'nb_cadre',
                 'eleves_prescolaire_filles', 'filles_prescolaire',
                 'filles_derniere_annee', 'dernier_annee_fille',
                 'eleves_prescolaire', 'prescolaire',
                 'eleves_total', 'total_eleves',
                 'eleves_filles', 'filles',
                 'nouveaux_inscrits', 'new_students',
                 'nouveaux_inscrits_filles',
                 'derniere_annee', 'annee_scolaire',
                 'taux_reussite', 'reussite'
             ];
             
             // Clés techniques à exclure complètement (ne pas stocker dans JSON)
             const technicalKeys = [
                 'geometry', 'geometrie', 'type_geometrie', 'typegeometrie', 'geom', 'shape', 'wkt',
                 'zone', 'typologie', 'zone_typologie', 'zonetypologie',
                 'objectid', 'fid', 'gid', 'pk', 'id', 'rowid', 'oid',
                 'coord', 'coordx', 'coordy', 'x', 'y',
                 'province', 'region', 'prefecture',
                 'agr', 'nb_agr', 'nbagr', 'code_insee', 'codeinsee', 'insee',
                 'idem', 'idemcommu', 'idem_commu',
                 'point', 'polygon', 'multipolygon', 'linestring'
             ];
             
             // Valeurs invalides (labels, placeholders, etc.)
             const invalidValues = [
                 'non', 'non disponible', 'non precise', 'non défini', 'neant', 'aucun', 'null', 'undefined',
                 '0', 'n/a', 'na', 'nd', '-', '--', '.', 'oui', 'true', 'false',
                 'année d\'ouverture', 'annee d\'ouverture', 'à préciser', 'en cours', 'inconnu',
                 'point', 'rurale', 'urbaine', 'peri-urbaine'
             ];
             
             const donneesSpecifiques: Record<string, any> = {};
             
             Object.keys(row).forEach(k => {
                 const norm = normalizeKey(k);
                 
                 // Skip if standard key (mapped to schema)
                 if (standardKeys.some(sk => normalizeKey(sk) === norm)) return;
                 
                 // Skip if technical key (useless data)
                 if (technicalKeys.some(tk => norm.includes(normalizeKey(tk)))) return;
                 
                 const val = row[k];
                 if (val === undefined || val === null || val === '') return;
                 
                 // Skip if value is invalid/placeholder
                 const valStr = String(val).toLowerCase().trim();
                 if (valStr.length < 2 || invalidValues.includes(valStr)) return;
                 
                 // Store only meaningful data
                 donneesSpecifiques[k] = val;
             });

             // Helper to parse boolean
             const parseBool = (val: any) => {
                if (!val) return null;
                const s = String(val).toLowerCase();
                return s === 'oui' || s === 'yes' || s === 'true' || s === '1' || s === 'disponible';
             };

             // 8. UPSERT
             const updateData = {
                 nom: nom,
                 latitude: latitude,
                 longitude: longitude,
                 secteur: secteur as any,
                 adresseComplete: getValue(row, ['adresse', 'adresse_complete']) || communeNom,
                 quartierDouar: getValue(row, ['quartier', 'douar']),
                 email: getValue(row, ['email']),
                 siteWeb: getValue(row, ['site_web']),
                 telephone: getValue(row, ['telephone']),
                 typeEtablissement: getValue(row, ['categorie', 'type_etablissement', 'object', 'nature']) || 'Autre',
                 
                 // Mapped Fields
                 partenaires: getValue(row, ['partenaires', 'partenaire', 'partenariats']),
                 remarques: getValue(row, ['remarques', 'observation', 'obs', 'notes']),
                 // etatInfrastructure is an Enum - skip for now to avoid type errors
                 // If needed, implement proper enum mapping later
                 surfaceTotale: parseFloatSafe(getValue(row, ['surface', 'surface_totale', 'superficie'])),
                 nombreSalles: parseIntSafe(getValue(row, ['salles', 'nb_salles', 'nombre_salles'])),
                 nombrePersonnel: parseIntSafe(getValue(row, ['personnel', 'nombre_personnel', 'staff', 'effectif'])),
                 capaciteAccueil: parseIntSafe(getValue(row, ['capacite', 'capacite_accueil', 'accueil'])),
                 statutFonctionnel: getValue(row, ['statut', 'statut_fonctionnel', 'fonctionnel']),
                 
                 disponibiliteEau: parseBool(getValue(row, ['eau'])),
                 disponibiliteElectricite: parseBool(getValue(row, ['electricite', 'elec'])),
                 connexionInternet: parseBool(getValue(row, ['internet', 'wifi'])),
                 
                 // NEW EDU FIELDS
                 cycle: getValue(row, ['cycle', 'niveau']),
                 nbClasses: parseIntSafe(getValue(row, ['nb_classes', 'classes', 'nombre_classes'])),
                 nbEnseignants: parseIntSafe(getValue(row, ['nb_enseignants', 'enseignants', 'profs', 'nombre_enseignants', 'nb_personnels_enseignant'])),
                 nbCadres: parseIntSafe(getValue(row, ['nb_cadres', 'cadres', 'administration', 'nb_cadre'])),
                 
                 elevesPrescolaireFilles: parseIntSafe(getValue(row, ['eleves_prescolaire_filles', 'filles_prescolaire'])),
                 fillesDerniereAnnee: parseIntSafe(getValue(row, ['filles_derniere_annee', 'dernier_annee_fille'])),
                 
                 elevesPrescolaire: parseIntSafe(getValue(row, ['eleves_prescolaire', 'prescolaire'])),
                 elevesTotal: parseIntSafe(getValue(row, ['eleves_total', 'total_eleves'])),
                 elevesFilles: parseIntSafe(getValue(row, ['eleves_filles', 'filles', 'nb_eleves_filles'])),
                 nouveauxInscrits: parseIntSafe(getValue(row, ['nouveaux_inscrits', 'new_students', 'nv_inscrits'])),
                 nouveauxInscritsFilles: parseIntSafe(getValue(row, ['nouveaux_inscrits_filles', 'nv_inscrits_fille'])),
                 derniereAnnee: getValue(row, ['derniere_annee', 'annee_scolaire', 'dernier_annee']),
                 tauxReussite: parseFloatSafe(getValue(row, ['taux_reussite', 'reussite', 'dernier_annee_taux_de_reussit'])),

                 donneesSpecifiques: donneesSpecifiques,
             };

             await prisma.etablissement.upsert({
               where: { code: code },
               update: { ...updateData, annexeId: annexeId },
               create: {
                 code: code,
                 communeId: communeId!,
                 annexeId: annexeId,
                 ...updateData
               }
             });
             count++;
           } catch (err) {
             console.error('Row error:', err);
             errors.push(`Erreur ligne: ${err}`);
           }
        }
        break;

      case 'evenement':
        for (const row of rows) {
          try {
            // Check mandatory fields
            const titre = getValue(row, ['titre', 'nom', 'event']);
            const code = getValue(row, ['etablissement_code', 'code_etablissement', 'code', 'ref']);
            const dateDebut = getValue(row, ['date_debut', 'date', 'start']);
            
            if (!titre || !code || !dateDebut) continue;

            const etab = await prisma.etablissement.findUnique({ where: { code: code } });
            if (!etab) {
               errors.push(`Etablissement ${code} introuvable pour évent ${titre}`);
               continue;
            }

            if (!session?.user?.id) throw new Error("User ID manquant");

            await prisma.evenement.create({
              data: {
                titre: titre,
                description: getValue(row, ['description', 'desc']) || '',
                dateDebut: safeDate(dateDebut) || new Date(),
                dateFin: safeDate(getValue(row, ['date_fin', 'end'])),
                lieu: getValue(row, ['lieu', 'endroit']),
                etablissementId: etab.id,
                secteur: etab.secteur,
                communeId: etab.communeId,
                typeCategorique: getValue(row, ['type', 'categorie']) || 'Standard',
                createdBy: parseInt(session.user.id),
              }
            });
            count++;
          } catch(err) {
            console.error('Event row error:', err);
            errors.push(`Erreur event row`);
          }
        }
        break;

      case 'activite':
        for (const row of rows) {
           try {
              const titre = getValue(row, ['titre', 'nom_activite']);
              const code = getValue(row, ['etablissement_code', 'code_etablissement']);
              const date = getValue(row, ['date', 'jour']);
              
              if (!titre || !code || !date) continue;
              
              const etab = await prisma.etablissement.findUnique({ where: { code: code } });
              if (!etab) continue;

              if (!session?.user?.id) throw new Error("User ID manquant");

              await prisma.programmeActivite.create({
                data: {
                   titre: titre,
                   description: getValue(row, ['description', 'detail']),
                   etablissementId: etab.id,
                   date: safeDate(date) || new Date(),
                   heureDebut: getValue(row, ['heure_debut', 'debut']) || '09:00',
                   heureFin: getValue(row, ['heure_fin', 'fin']) || '10:00',
                   typeActivite: getValue(row, ['type', 'type_activite']) || 'Autre',
                   createdBy: parseInt(session.user.id),
                }
              });
              count++;
           } catch(err) {
             console.error('Activite row error:', err);
             errors.push(`Erreur activite row`);
           }
        }
        break;

      case 'commune':
        for (const row of rows) {
           try {
              const nom = getValue(row, ['nom', 'commune', 'ville', 'name']);
              if (!nom) continue;

              const code = getValue(row, ['code', 'ref', 'code_geographique']) || nom.substring(0, 5).toUpperCase();
              const population = parseIntSafe(getValue(row, ['population', 'habitants']));
              const superficie = parseFloatSafe(getValue(row, ['superficie', 'surface', 'area']));
              
              const lat = parseFloatSafe(getValue(row, ['latitude', 'lat', 'y']));
              const lng = parseFloatSafe(getValue(row, ['longitude', 'lon', 'lng', 'x']));

              await prisma.commune.upsert({
                 where: { code: code },
                 update: {
                    nom: nom,
                    population: population,
                    superficieKm2: superficie,
                    latitude: lat,
                    longitude: lng,
                    province: 'Médiouna',
                    region: 'Casablanca-Settat'
                 },
                 create: {
                    code: code,
                    nom: nom,
                    population: population,
                    superficieKm2: superficie,
                    latitude: lat,
                    longitude: lng,
                    province: 'Médiouna',
                    region: 'Casablanca-Settat'
                 }
              });
              count++;
           } catch(e) {
              console.error('Commune error', e);
              errors.push(`Erreur commune: ${e}`);
           }
        }
        break;

      case 'annexe':
        for (const row of rows) {
           try {
              const nom = getValue(row, ['nom', 'annexe', 'district', 'caqd']);
              if (!nom) continue;

              const communeNom = getValue(row, ['commune', 'ville']);
              if (!communeNom) {
                 errors.push(`Commune manquante pour l'annexe ${nom}`);
                 continue;
              }

              // Find commune
              const commune = await prisma.commune.findFirst({
                 where: { 
                    OR: [
                        { nom: { contains: communeNom, mode: 'insensitive' } },
                        { code: { contains: communeNom, mode: 'insensitive' } }
                    ]
                 }
              });

              if (!commune) {
                 errors.push(`Commune ${communeNom} introuvable pour l'annexe ${nom}`);
                 continue;
              }

              const code = getValue(row, ['code', 'ref']) || `ANX-${nom.substring(0,10).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${commune.id}`;
              
              const lat = parseFloatSafe(getValue(row, ['latitude', 'lat', 'y']));
              const lng = parseFloatSafe(getValue(row, ['longitude', 'lon', 'lng', 'x']));
              
              // Upsert Annexe
              await prisma.annexe.upsert({
                 where: { code: code },
                 update: {
                    nom: nom,
                    communeId: commune.id,
                    latitude: lat,
                    longitude: lng
                 },
                 create: {
                    code: code,
                    nom: nom,
                    communeId: commune.id,
                    latitude: lat,
                    longitude: lng
                 }
              });
              count++;

           } catch(e) {
              console.error('Annexe error', e);
              errors.push(`Erreur annexe: ${e}`);
           }
        }
        break;

      default:
        return NextResponse.json({ error: `Type d'import inconnu: ${entity}` }, { status: 400 });
    }

    if (count === 0 && rows.length > 0) {
        return NextResponse.json({ 
            error: "Aucun élément importé. Vérifiez que votre fichier contient une colonne 'Nom', 'Établissement' ou 'Désignation'.",
            columns_detected: Object.keys(rows[0] || {}).join(', ')
        }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      count: count,
      message: `Import réussi: ${count} éléments traités.`,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Erreur import:', error);
    return NextResponse.json({ error: 'Erreur serveur lors de l\'import', details: String(error) }, { status: 500 });
  }
}
