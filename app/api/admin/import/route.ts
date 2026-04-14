import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { withPermission } from '@/lib/auth/api-guard';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { SystemLogger } from '@/lib/system-logger';

// --- SCHÉMAS DE VALIDATION ---
const ImportSchema = z.object({
  entity: z.enum(['etablissement', 'evenement', 'activite', 'commune', 'annexe']),
});

// --- HELPERS DE NETTOYAGE ---
const normalizeKey = (k: string) => k.toLowerCase().trim().replace(/['"«»]/g, '').replace(/\s+/g, '_').normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const parseIntSafe = (val: any) => {
  if (val === null || val === undefined || val === '') return null;
  const n = parseInt(String(val).replace(/[^0-9-]/g, ''));
  return isNaN(n) ? null : n;
};

const parseFloatSafe = (val: any) => {
  if (val === null || val === undefined || val === '') return null;
  const n = parseFloat(String(val).replace(',', '.').replace(/[^0-9.-]/g, ''));
  return isNaN(n) ? null : n;
};

const safeDate = (val: any) => {
  if (!val) return undefined;
  const d = new Date(String(val).trim());
  return isNaN(d.getTime()) ? undefined : d;
};

const parseBool = (val: any) => {
  if (val === null || val === undefined || val === '') return null;
  const s = String(val).toLowerCase().trim();
  return ['oui', 'yes', 'true', '1', 'disponible', 'ok'].includes(s);
};

const getValue = (row: any, keys: string[]) => {
  for (const k of keys) {
    if (row[k] !== undefined) return row[k];
    const norm = normalizeKey(k);
    if (row[norm] !== undefined) return row[norm];
  }
  return undefined;
};

// --- HANDLER PRINCIPAL ---
export const POST = withPermission('system.import', withErrorHandler(async (req: NextRequest, { session }) => {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const entityRaw = formData.get('entity');

  // 1. Validation de base
  const { entity } = ImportSchema.parse({ entity: entityRaw });

  if (!file) {
    return errorResponse('Fichier manquant', 'MISSING_FILE', 400);
  }

  const buffer = await file.arrayBuffer();
  let rows: any[] = [];

  // 2. Parsing Excel / CSV
  if (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls')) {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawJson = XLSX.utils.sheet_to_json(sheet);
    
    rows = rawJson.map((row: any) => {
      const newRow: any = {};
      Object.keys(row).forEach(key => {
        newRow[normalizeKey(key)] = row[key];
        newRow[key] = row[key]; // Keep original
      });
      return newRow;
    });
  } else {
    // CSV Handling basic
    const text = new TextDecoder().decode(buffer);
    const lines = text.split('\n').filter(line => line.trim() !== '');
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

  if (rows.length === 0) {
    return errorResponse('Fichier vide ou format non reconnu', 'EMPTY_OR_INVALID_FILE', 400);
  }

  SystemLogger.info('admin-import', `Début de l'import : ${rows.length} lignes pour l'entité ${entity}`, {
    userId: session.user.id,
    fileName: file.name
  });

  let count = 0;
  const errors: string[] = [];

  // 3. Traitement par entité
  switch (entity) {
    case 'etablissement':
      for (const row of rows) {
        try {
          // Logic Etablissement (Preserved from existing code)
          const nom = getValue(row, ['nom', 'etablissement', 'nom_de_letablissement', 'structure', 'nom_structure', 'nom_fr', 'intitule', 'designation', 'libelle', 'ecole', 'nom_ecole', 'titre', 'name']);
          if (!nom) continue;

          // Sector detection
          let secteurRaw = getValue(row, ['secteur', 'domaine', 'categorie']);
          let secteur = 'AUTRE';
          if (secteurRaw) {
            const s = secteurRaw.toString().toUpperCase().trim();
            if (s.includes('CULTURE') || s.includes('COLTURE') || s.includes('JEUNES') || s.includes('BIBLIO')) secteur = 'CULTUREL';
            else if (s.includes('SPORT')) secteur = 'SPORT';
            else if (s.includes('SANTE') || s.includes('MEDECIN') || s.includes('HOPITAL') || s.includes('CSU') || s.includes('CSR')) secteur = 'SANTE';
            else if (s.includes('SOCIAL') || s.includes('FEMININ') || s.includes('FOYER') || s.includes('ENTRAIDE')) secteur = 'SOCIAL';
            else if (s.includes('EDUC') || s.includes('ECOLE') || s.includes('LYCEE') || s.includes('COLLEGE')) secteur = 'EDUCATION';
          }

          // Commune & Annexe Logic
          let communeId = null;
          let annexeId = null;
          const COMMUNE_MAPPING: Record<string, string> = {
            "Sidi Hajjaj Oued Hassar": "SIDI HAJJAJ", "Sidi Hajjaj": "SIDI HAJJAJ", "SIDI HAJJAJ OUED HASSAR": "SIDI HAJJAJ",
            "Médiouna": "MEDIOUNA", "Mediouna": "MEDIOUNA", "MEDIOUNA": "MEDIOUNA",
            "Mejjatia Ouled Taleb": "MAJJATIA", "Al Majjatiya Ouled Taleb": "MAJJATIA", "MEJJATIA OLD TALEB": "MAJJATIA", "MAJJATIA": "MAJJATIA",
            "Lahraouiyine": "LAHRAOUIYINE", "LAHRAOUIYINE": "LAHRAOUIYINE",
            "Tit Mellil": "TIT MELLIL", "TIT MELLIL": "TIT MELLIL"
          };
          
          let communeNom = getValue(row, ['commune', 'adresse', 'ville']) || 'Médiouna';
          if (typeof communeNom === 'string' && COMMUNE_MAPPING[communeNom]) {
            communeNom = COMMUNE_MAPPING[communeNom];
          }

          if (communeNom && typeof communeNom === 'string') {
            const cleanCommune = communeNom.trim();
            let commune = await prisma.commune.findFirst({
              where: {
                OR: [
                  { nom: { equals: cleanCommune, mode: 'insensitive' } },
                  { code: { equals: cleanCommune, mode: 'insensitive' } }
                ]
              }
            });
            if (!commune) {
              commune = await prisma.commune.create({
                data: {
                  nom: cleanCommune,
                  code: cleanCommune.toUpperCase().substring(0, 5),
                  province: 'Médiouna',
                  region: 'Casablanca-Settat'
                }
              });
            }
            communeId = commune.id;

            const annexeNomRaw = getValue(row, ['annexe', 'annexe_administrative', 'caqd', 'district']);
            if (annexeNomRaw && typeof annexeNomRaw === 'string') {
              const cleanAnnexe = annexeNomRaw.trim();
              let annexe = await prisma.annexe.findFirst({
                where: { nom: { equals: cleanAnnexe, mode: 'insensitive' }, communeId }
              });
              if (!annexe) {
                annexe = await prisma.annexe.create({
                  data: {
                    nom: cleanAnnexe,
                    code: `ANX-${cleanAnnexe.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${communeId}`,
                    communeId
                  }
                });
              }
              annexeId = annexe.id;
            }
          }

          if (!communeId) {
             const first = await prisma.commune.findFirst();
             communeId = first?.id || 1;
          }

          // Coordinates cleaning
          let latStr = getValue(row, ['latitude', 'lat', 'gps_lat', 'y']);
          let lngStr = getValue(row, ['longitude', 'lon', 'lng', 'long', 'gps_lng', 'x']);
          
          const cleanCoord = (val: any, type: 'lat' | 'lng') => {
            let num = 0;
            if (typeof val === 'number') num = val;
            else if (val) num = parseFloat(val.toString().replace(',', '.').replace(/[^0-9.-]/g, ''));
            if (isNaN(num) || num === 0) return 0;
            if (type === 'lat') { while (Math.abs(num) > 90) num /= 10; }
            else { while (Math.abs(num) > 180) num /= 10; }
            return num;
          };
          const latitude = cleanCoord(latStr, 'lat');
          const longitude = cleanCoord(lngStr, 'lng');

          // Deterministic Code Generation
          let code = getValue(row, ['code', 'reference', 'ref']);
          if (!code) {
            const slug = nom.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '').substring(0, 40).toUpperCase();
            code = `${secteur.substring(0,3)}-${slug}-${(communeNom || 'UNK').substring(0,3).toUpperCase()}`;
          }

          // Special Data Extraction (Preserved filter)
          const standardKeys = ['nom', 'etablissement', 'secteur', 'commune', 'annexe', 'code', 'latitude', 'longitude', 'lat', 'lon', 'lng', 'adresse', 'adresse_complete', 'quartier', 'douar'];
          const technicalKeys = ['geometry', 'geometrie', 'objectid', 'fid', 'gid', 'shape', 'coord', 'x', 'y'];
          const donneesSpecifiques: Record<string, any> = {};
          
          Object.keys(row).forEach(k => {
            const norm = normalizeKey(k);
            if (standardKeys.some(sk => normalizeKey(sk) === norm)) return;
            if (technicalKeys.some(tk => norm.includes(normalizeKey(tk)))) return;
            const val = row[k];
            if (val === undefined || val === null || val === '') return;
            donneesSpecifiques[k] = val;
          });

          // Upsert Data
          const updateData = {
            nom,
            latitude,
            longitude,
            secteur: secteur as any,
            adresseComplete: getValue(row, ['adresse', 'adresse_complete']) || (communeNom as string),
            quartierDouar: getValue(row, ['quartier', 'douar']),
            email: getValue(row, ['email']),
            telephone: getValue(row, ['telephone']),
            typeEtablissement: getValue(row, ['categorie', 'type_etablissement', 'nature']) || 'Autre',
            surfaceTotale: parseFloatSafe(getValue(row, ['surface', 'surface_totale'])),
            nombreSalles: parseIntSafe(getValue(row, ['salles', 'nb_salles'])),
            capaciteAccueil: parseIntSafe(getValue(row, ['capacite', 'accueil'])),
            disponibiliteEau: parseBool(getValue(row, ['eau'])),
            disponibiliteElectricite: parseBool(getValue(row, ['electricite'])),
            connexionInternet: parseBool(getValue(row, ['internet'])),
            donneesSpecifiques
          };

          await prisma.etablissement.upsert({
            where: { code },
            update: { ...updateData, annexeId },
            create: { code, communeId: communeId!, annexeId, ...updateData }
          });
          count++;
        } catch (err) {
          errors.push(`Ligne ${count + 1}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      break;

    case 'evenement':
      for (const row of rows) {
        try {
          const titre = getValue(row, ['titre', 'nom', 'event']);
          const code = getValue(row, ['etablissement_code', 'code_etablissement', 'code']);
          const dateDebut = getValue(row, ['date_debut', 'date']);
          
          if (!titre || !code || !dateDebut) continue;

          const etab = await prisma.etablissement.findUnique({ where: { code } });
          if (!etab) {
            errors.push(`Etablissement ${code} introuvable pour évent ${titre}`);
            continue;
          }

          await prisma.evenement.create({
            data: {
              titre,
              description: getValue(row, ['description', 'desc']) || '',
              dateDebut: safeDate(dateDebut) || new Date(),
              dateFin: safeDate(getValue(row, ['date_fin', 'end'])),
              lieu: getValue(row, ['lieu']),
              etablissementId: etab.id,
              secteur: etab.secteur,
              communeId: etab.communeId,
              typeCategorique: getValue(row, ['type', 'categorie']) || 'Standard',
              createdBy: parseInt(session.user.id),
            }
          });
          count++;
        } catch (err) {
          errors.push(`Erreur event : ${err instanceof Error ? err.message : String(err)}`);
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
          
          const etab = await prisma.etablissement.findUnique({ where: { code } });
          if (!etab) continue;

          await prisma.programmeActivite.create({
            data: {
              titre,
              description: getValue(row, ['description', 'detail']),
              etablissementId: etab.id,
              date: safeDate(date) || new Date(),
              heureDebut: getValue(row, ['heure_debut', 'debut']) || '09:00',
              heureFin: getValue(row, ['heure_fin', 'fin']) || '10:00',
              typeActivite: getValue(row, ['type']) || 'Autre',
              createdBy: parseInt(session.user.id),
            }
          });
          count++;
        } catch (err) {
          errors.push(`Erreur activité : ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      break;

    case 'commune':
      for (const row of rows) {
        try {
          const nom = getValue(row, ['nom', 'commune', 'ville']);
          if (!nom) continue;
          const code = getValue(row, ['code', 'ref']) || (nom as string).substring(0, 5).toUpperCase();
          
          await prisma.commune.upsert({
            where: { code },
            update: {
              nom,
              population: parseIntSafe(getValue(row, ['population'])),
              superficieKm2: parseFloatSafe(getValue(row, ['superficie'])),
              province: 'Médiouna',
              region: 'Casablanca-Settat'
            },
            create: {
              code,
              nom,
              population: parseIntSafe(getValue(row, ['population'])),
              superficieKm2: parseFloatSafe(getValue(row, ['superficie'])),
              province: 'Médiouna',
              region: 'Casablanca-Settat'
            }
          });
          count++;
        } catch (err) {
          errors.push(`Erreur commune : ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      break;

    case 'annexe':
      for (const row of rows) {
        try {
          const nom = getValue(row, ['nom', 'annexe']);
          const communeNom = getValue(row, ['commune', 'ville']);
          if (!nom || !communeNom) continue;

          const commune = await prisma.commune.findFirst({
            where: { OR: [{ nom: { contains: communeNom, mode: 'insensitive' } }, { code: { contains: communeNom, mode: 'insensitive' } }] }
          });

          if (!commune) {
            errors.push(`Commune ${communeNom} introuvable pour l'annexe ${nom}`);
            continue;
          }

          const code = getValue(row, ['code']) || `ANX-${(nom as string).substring(0,10).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${commune.id}`;
          
          await prisma.annexe.upsert({
            where: { code },
            update: { nom, communeId: commune.id },
            create: { code, nom, communeId: commune.id }
          });
          count++;
        } catch (err) {
          errors.push(`Erreur annexe : ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      break;

    default:
      return errorResponse(`Type d'import inconnu: ${entity}`, 'INVALID_ENTITY', 400);
  }

  return successResponse({ count, errors: errors.length > 0 ? errors : undefined }, `Import réussi: ${count} éléments traités.`);
}));

