import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { withPermission } from '@/lib/auth/api-guard';
import { withErrorHandler, successResponse, errorResponse } from '@/lib/api-handler';
import { SystemLogger } from '@/lib/system-logger';

// ─── SECURITY CONSTANTS ────────────────────────────────────────────────────
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB - CVE hardening
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls', '.csv'] as const;
// Magic bytes for Excel files
const XLSX_MAGIC = Buffer.from([0x50, 0x4b, 0x03, 0x04]); // PK ZIP header
const XLS_MAGIC  = Buffer.from([0xd0, 0xcf, 0x11, 0xe0]); // OLE2 header

// ─── SCHEMAS ───────────────────────────────────────────────────────────────
const ImportSchema = z.object({
  entity: z.enum(['etablissement', 'evenement', 'activite', 'commune', 'annexe']),
});

// ─── HELPERS ───────────────────────────────────────────────────────────────
const normalizeKey = (k: string) =>
  k.toLowerCase().trim()
   .replace(/['\"«»]/g, '')
   .replace(/\s+/g, '_')
   .normalize('NFD')
   .replace(/[\u0300-\u036f]/g, '');

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

// ─── MIME / MAGIC BYTES VALIDATION ─────────────────────────────────────────
function validateFileType(buffer: Buffer, filename: string): { ok: boolean; error?: string } {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  if (!ALLOWED_EXTENSIONS.includes(ext as any)) {
    return { ok: false, error: `Extension non autorisée: ${ext}. Autorisées: ${ALLOWED_EXTENSIONS.join(', ')}` };
  }
  if (ext === '.xlsx') {
    if (!buffer.slice(0, 4).equals(XLSX_MAGIC)) {
      return { ok: false, error: 'Contenu XLSX invalide (magic bytes incorrects)' };
    }
  } else if (ext === '.xls') {
    if (!buffer.slice(0, 4).equals(XLS_MAGIC)) {
      return { ok: false, error: 'Contenu XLS invalide (magic bytes incorrects)' };
    }
  }
  return { ok: true };
}

// ─── EXCEL PARSING WITH EXCELJS (no prototype pollution risk) ─────────────
async function parseExcel(buffer: any): Promise<Record<string, any>[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];
  if (!worksheet) return [];

  const rows: Record<string, any>[] = [];
  let headers: string[] = [];

  worksheet.eachRow((row: any, rowNumber: number) => {
    const values = (row.values as any[]).slice(1); // exceljs is 1-indexed, index 0 is null
    if (rowNumber === 1) {
      headers = values.map((v: any) => {
        const raw = v === null || v === undefined ? '' : String(v);
        return normalizeKey(raw);
      });
      return;
    }
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      const cell = values[i];
      // Safely extract cell value — no prototype manipulation
      if (cell !== null && cell !== undefined) {
        if (typeof cell === 'object' && 'result' in cell) {
          obj[h] = cell.result; // formula cell
        } else if (typeof cell === 'object' && 'text' in cell) {
          obj[h] = cell.text; // rich text
        } else {
          obj[h] = cell;
        }
      }
    });
    rows.push(obj);
  });

  return rows;
}

// ─── HANDLER ───────────────────────────────────────────────────────────────
export const POST = withPermission('system.import', withErrorHandler(async (req: NextRequest, { session }) => {
  const formData = await req.formData();
  const file = formData.get('file') as File;
  const entityRaw = formData.get('entity');

  // 1. Validate entity type
  const { entity } = ImportSchema.parse({ entity: entityRaw });

  if (!file) {
    return errorResponse('Fichier manquant', 'MISSING_FILE', 400);
  }

  // 2. File size guard (before reading into memory)
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return errorResponse(
      `Fichier trop volumineux. Maximum: ${MAX_FILE_SIZE_BYTES / 1024 / 1024} MB`,
      'FILE_TOO_LARGE',
      413
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // 3. Magic bytes + extension validation (BLOC 1.2 CVE fix)
  const typeCheck = validateFileType(buffer, file.name);
  if (!typeCheck.ok) {
    SystemLogger.warning('admin-import', `Import bloqué - type invalide: ${typeCheck.error}`, {
      userId: session.user.id,
      fileName: file.name,
    });
    return errorResponse(typeCheck.error ?? 'Type de fichier invalide', 'INVALID_FILE_TYPE', 415);
  }

  let rows: Record<string, any>[] = [];

  // 4. Parse Excel or CSV
  const ext = file.name.toLowerCase().slice(file.name.lastIndexOf('.'));
  if (ext === '.xlsx' || ext === '.xls') {
    rows = await parseExcel(buffer);
  } else {
    // CSV — safe split parsing, no regex user input
    const text = new TextDecoder('utf-8', { fatal: true }).decode(buffer);
    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
    if (lines.length > 0) {
      const delimiter = lines[0].includes(';') ? ';' : ',';
      const rawHeaders = lines[0].split(delimiter).map(h => normalizeKey(h));
      // Guard: at most 100 columns
      const headers = rawHeaders.slice(0, 100);
      rows = lines.slice(1, 50001).map(line => { // Guard: at most 50k rows
        const vals = line.split(delimiter);
        const obj: Record<string, any> = {};
        headers.forEach((h, i) => {
          if (vals[i] !== undefined && vals[i].trim() !== '') {
            obj[h] = vals[i].trim();
          }
        });
        return obj;
      });
    }
  }

  if (rows.length === 0) {
    return errorResponse('Fichier vide ou format non reconnu', 'EMPTY_OR_INVALID_FILE', 400);
  }

  SystemLogger.info('admin-import', `Début import: ${rows.length} lignes pour ${entity}`, {
    userId: session.user.id,
    fileName: file.name,
  });

  let count = 0;
  const errors: string[] = [];

  // 5. Process by entity type
  switch (entity) {
    case 'etablissement':
      for (const row of rows) {
        try {
          const nom = getValue(row, ['nom', 'etablissement', 'nom_de_letablissement', 'structure', 'nom_structure', 'nom_fr', 'intitule', 'designation', 'libelle', 'ecole', 'nom_ecole', 'titre', 'name']);
          if (!nom) continue;

          let secteurRaw = getValue(row, ['secteur', 'domaine', 'categorie']);
          let secteur = 'AUTRE';
          if (secteurRaw) {
            const s = secteurRaw.toString().toUpperCase().trim();
            if (s.includes('CULTURE') || s.includes('JEUNES') || s.includes('BIBLIO')) secteur = 'CULTUREL';
            else if (s.includes('SPORT')) secteur = 'SPORT';
            else if (s.includes('SANTE') || s.includes('MEDECIN') || s.includes('HOPITAL') || s.includes('CSU') || s.includes('CSR')) secteur = 'SANTE';
            else if (s.includes('SOCIAL') || s.includes('FEMININ') || s.includes('FOYER') || s.includes('ENTRAIDE')) secteur = 'SOCIAL';
            else if (s.includes('EDUC') || s.includes('ECOLE') || s.includes('LYCEE') || s.includes('COLLEGE')) secteur = 'EDUCATION';
          }

          let communeId = null;
          let annexeId = null;
          const COMMUNE_MAPPING: Record<string, string> = {
            'Sidi Hajjaj Oued Hassar': 'SIDI HAJJAJ', 'Sidi Hajjaj': 'SIDI HAJJAJ',
            'Médiouna': 'MEDIOUNA', 'Mediouna': 'MEDIOUNA', 'MEDIOUNA': 'MEDIOUNA',
            'Mejjatia Ouled Taleb': 'MAJJATIA', 'MAJJATIA': 'MAJJATIA',
            'Lahraouiyine': 'LAHRAOUIYINE', 'LAHRAOUIYINE': 'LAHRAOUIYINE',
            'Tit Mellil': 'TIT MELLIL', 'TIT MELLIL': 'TIT MELLIL',
          };

          let communeNom = getValue(row, ['commune', 'adresse', 'ville']) || 'Médiouna';
          if (typeof communeNom === 'string' && COMMUNE_MAPPING[communeNom]) {
            communeNom = COMMUNE_MAPPING[communeNom];
          }

          if (communeNom && typeof communeNom === 'string') {
            const cleanCommune = communeNom.trim();
            let commune = await prisma.commune.findFirst({
              where: { OR: [{ nom: { equals: cleanCommune, mode: 'insensitive' } }, { code: { equals: cleanCommune, mode: 'insensitive' } }] },
            });
            if (!commune) {
              commune = await prisma.commune.create({
                data: { nom: cleanCommune, code: cleanCommune.toUpperCase().substring(0, 5), province: 'Médiouna', region: 'Casablanca-Settat' },
              });
            }
            communeId = commune.id;

            const annexeNomRaw = getValue(row, ['annexe', 'annexe_administrative', 'caqd', 'district']);
            if (annexeNomRaw && typeof annexeNomRaw === 'string') {
              const cleanAnnexe = annexeNomRaw.trim();
              let annexe = await prisma.annexe.findFirst({ where: { nom: { equals: cleanAnnexe, mode: 'insensitive' }, communeId } });
              if (!annexe) {
                annexe = await prisma.annexe.create({
                  data: { nom: cleanAnnexe, code: `ANX-${cleanAnnexe.substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${communeId}`, communeId },
                });
              }
              annexeId = annexe.id;
            }
          }

          if (!communeId) {
            const first = await prisma.commune.findFirst();
            communeId = first?.id || 1;
          }

          const cleanCoord = (val: any, type: 'lat' | 'lng') => {
            let num = typeof val === 'number' ? val : parseFloat(String(val ?? '0').replace(',', '.').replace(/[^0-9.-]/g, ''));
            if (isNaN(num) || num === 0) return 0;
            if (type === 'lat') { while (Math.abs(num) > 90) num /= 10; }
            else { while (Math.abs(num) > 180) num /= 10; }
            return num;
          };
          const latitude  = cleanCoord(getValue(row, ['latitude', 'lat', 'gps_lat', 'y']), 'lat');
          const longitude = cleanCoord(getValue(row, ['longitude', 'lon', 'lng', 'long', 'gps_lng', 'x']), 'lng');

          let code = getValue(row, ['code', 'reference', 'ref']);
          if (!code) {
            const slug = nom.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '').substring(0, 40).toUpperCase();
            code = `${secteur.substring(0, 3)}-${slug}-${(communeNom || 'UNK').substring(0, 3).toUpperCase()}`;
          }

          const standardKeys = ['nom', 'etablissement', 'secteur', 'commune', 'annexe', 'code', 'latitude', 'longitude', 'lat', 'lon', 'lng', 'adresse', 'adresse_complete', 'quartier', 'douar'];
          const technicalKeys = ['geometry', 'geometrie', 'objectid', 'fid', 'gid', 'shape', 'coord', 'x', 'y'];
          const donneesSpecifiques: Record<string, any> = {};
          Object.keys(row).forEach(k => {
            const norm = normalizeKey(k);
            if (standardKeys.some(sk => normalizeKey(sk) === norm)) return;
            if (technicalKeys.some(tk => norm.includes(normalizeKey(tk)))) return;
            const val = row[k];
            if (val !== undefined && val !== null && val !== '') donneesSpecifiques[k] = val;
          });

          const updateData = {
            nom, latitude, longitude, secteur: secteur as any,
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
            donneesSpecifiques,
          };

          await prisma.etablissement.upsert({
            where: { code },
            update: { ...updateData, annexeId },
            create: { code, communeId: communeId!, annexeId, ...updateData },
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
          if (!etab) { errors.push(`Etablissement ${code} introuvable pour évent ${titre}`); continue; }
          await prisma.evenement.create({
            data: {
              titre, description: getValue(row, ['description', 'desc']) || '',
              dateDebut: safeDate(dateDebut) || new Date(),
              dateFin: safeDate(getValue(row, ['date_fin', 'end'])),
              lieu: getValue(row, ['lieu']),
              etablissementId: etab.id, secteur: etab.secteur, communeId: etab.communeId,
              typeCategorique: getValue(row, ['type', 'categorie']) || 'Standard',
              createdBy: parseInt(session.user.id),
            },
          });
          count++;
        } catch (err) {
          errors.push(`Erreur event: ${err instanceof Error ? err.message : String(err)}`);
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
              titre, description: getValue(row, ['description', 'detail']),
              etablissementId: etab.id, date: safeDate(date) || new Date(),
              heureDebut: getValue(row, ['heure_debut', 'debut']) || '09:00',
              heureFin: getValue(row, ['heure_fin', 'fin']) || '10:00',
              typeActivite: getValue(row, ['type']) || 'Autre',
              createdBy: parseInt(session.user.id),
            },
          });
          count++;
        } catch (err) {
          errors.push(`Erreur activité: ${err instanceof Error ? err.message : String(err)}`);
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
            update: { nom, population: parseIntSafe(getValue(row, ['population'])), superficieKm2: parseFloatSafe(getValue(row, ['superficie'])), province: 'Médiouna', region: 'Casablanca-Settat' },
            create: { code, nom, population: parseIntSafe(getValue(row, ['population'])), superficieKm2: parseFloatSafe(getValue(row, ['superficie'])), province: 'Médiouna', region: 'Casablanca-Settat' },
          });
          count++;
        } catch (err) {
          errors.push(`Erreur commune: ${err instanceof Error ? err.message : String(err)}`);
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
            where: { OR: [{ nom: { contains: communeNom, mode: 'insensitive' } }, { code: { contains: communeNom, mode: 'insensitive' } }] },
          });
          if (!commune) { errors.push(`Commune ${communeNom} introuvable`); continue; }
          const code = getValue(row, ['code']) || `ANX-${(nom as string).substring(0, 10).toUpperCase().replace(/[^A-Z0-9]/g, '')}-${commune.id}`;
          await prisma.annexe.upsert({
            where: { code },
            update: { nom, communeId: commune.id },
            create: { code, nom, communeId: commune.id },
          });
          count++;
        } catch (err) {
          errors.push(`Erreur annexe: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
      break;

    default:
      return errorResponse(`Type d'import inconnu: ${entity}`, 'INVALID_ENTITY', 400);
  }

  return successResponse({ count, errors: errors.length > 0 ? errors : undefined }, `Import réussi: ${count} éléments traités.`);
}));
