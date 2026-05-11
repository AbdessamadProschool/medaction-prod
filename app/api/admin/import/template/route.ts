import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import ExcelJS from 'exceljs';

const MANDATORY_STAR = ' *';

const COMMON_ETAB_COLS = [
  { header: `Code Établissement${MANDATORY_STAR}`, key: 'code', width: 20 },
  { header: `Nom de l'établissement${MANDATORY_STAR}`, key: 'nom', width: 30 },
  { header: `Secteur${MANDATORY_STAR}`, key: 'secteur', width: 15 },
  { header: `Commune${MANDATORY_STAR}`, key: 'commune', width: 20 },
  { header: 'Annexe Administrative', key: 'annexe', width: 20 },
  { header: 'Adresse détaillée', key: 'adresse', width: 40 },
  { header: 'Quartier ou Douar', key: 'quartier', width: 20 },
  { header: `Latitude (GPS)${MANDATORY_STAR}`, key: 'latitude', width: 15 },
  { header: `Longitude (GPS)${MANDATORY_STAR}`, key: 'longitude', width: 15 },
  { header: 'Téléphone', key: 'telephone', width: 15 },
  { header: 'Email de contact', key: 'email', width: 25 },
  { header: 'Nature (Public-Privé)', key: 'nature', width: 15 },
  { header: 'Type (Catégorie)', key: 'type', width: 20 },
  { header: 'Surface Totale (m2)', key: 'surface', width: 15 },
  { header: 'Nombre de Salles', key: 'salles', width: 15 },
  { header: 'Capacité d\'Accueil', key: 'capacite', width: 15 },
  { header: 'Disponibilité Eau (Oui-Non)', key: 'eau', width: 15 },
  { header: 'Électricité (Oui-Non)', key: 'electricite', width: 15 },
  { header: 'Accès Internet (Oui-Non)', key: 'internet', width: 15 },
];

const SECTOR_COLS: Record<string, any[]> = {
  EDUCATION: [
    { header: 'Cycle d\'enseignement', key: 'cycle', width: 20 },
    { header: 'Nombre de classes', key: 'nb_classes', width: 15 },
    { header: 'Nombre d\'enseignants', key: 'nb_enseignants', width: 15 },
    { header: 'Nombre de cadres admin', key: 'nb_cadres', width: 15 },
    { header: 'Total élèves', key: 'eleves_total', width: 15 },
    { header: 'Total filles', key: 'eleves_filles', width: 15 },
    { header: 'Filles préscolaire', key: 'filles_prescolaire', width: 15 },
    { header: 'Filles dernière année', key: 'filles_derniere_annee', width: 15 },
  ],
  SANTE: [
    { header: 'Type d\'établissement de santé', key: 'type_sante', width: 25 },
    { header: 'Nombre de lits', key: 'nb_lits', width: 15 },
    { header: 'Spécialités', key: 'specialites', width: 30 },
  ],
  SPORT: [
    { header: 'Type d\'installation sportive', key: 'type_sport', width: 25 },
    { header: 'Disciplines', key: 'disciplines', width: 30 },
  ],
};

const ENTITY_TEMPLATES: Record<string, any[]> = {
  commune: [
    { header: `Nom de la commune${MANDATORY_STAR}`, key: 'nom', width: 25 },
    { header: `Code Commune${MANDATORY_STAR}`, key: 'code', width: 15 },
    { header: 'Population', key: 'population', width: 15 },
    { header: 'Superficie (km2)', key: 'superficie', width: 15 },
    { header: 'Latitude', key: 'latitude', width: 15 },
    { header: 'Longitude', key: 'longitude', width: 15 },
  ],
  annexe: [
    { header: `Nom de l'Annexe${MANDATORY_STAR}`, key: 'nom', width: 25 },
    { header: `Code Annexe${MANDATORY_STAR}`, key: 'code', width: 15 },
    { header: `Nom de la Commune${MANDATORY_STAR}`, key: 'commune', width: 20 },
    { header: 'Latitude', key: 'latitude', width: 15 },
    { header: 'Longitude', key: 'longitude', width: 15 },
  ],
  evenement: [
    { header: `Titre de l'événement${MANDATORY_STAR}`, key: 'titre', width: 30 },
    { header: 'Description détaillée', key: 'description', width: 50 },
    { header: `Date de début${MANDATORY_STAR}`, key: 'date_debut', width: 15 },
    { header: 'Date de fin', key: 'date_fin', width: 15 },
    { header: 'Lieu exact', key: 'lieu', width: 25 },
    { header: `Code Établissement organisateur${MANDATORY_STAR}`, key: 'etablissement_code', width: 25 },
    { header: 'Type d\'événement', key: 'type', width: 15 },
    { header: 'Statut', key: 'statut', width: 15 },
  ],
  activite: [
    { header: `Titre de l'activité${MANDATORY_STAR}`, key: 'titre', width: 30 },
    { header: 'Type', key: 'type', width: 15 },
    { header: `Date prévue${MANDATORY_STAR}`, key: 'date', width: 15 },
    { header: 'Nombre de bénéficiaires', key: 'beneficiaires', width: 15 },
    { header: `Code Établissement${MANDATORY_STAR}`, key: 'etablissement_code', width: 25 },
    { header: 'Description', key: 'description', width: 50 },
  ],
  campagne: [
    { header: `Titre de la campagne${MANDATORY_STAR}`, key: 'titre', width: 30 },
    { header: 'Description', key: 'description', width: 50 },
    { header: `Date de début${MANDATORY_STAR}`, key: 'date_debut', width: 15 },
    { header: 'Date de fin', key: 'date_fin', width: 15 },
    { header: 'Public cible', key: 'public', width: 20 },
    { header: 'Statut', key: 'statut', width: 15 },
  ],
  article: [
    { header: `Titre de l'article${MANDATORY_STAR}`, key: 'titre', width: 30 },
    { header: 'Contenu', key: 'contenu', width: 100 },
    { header: 'Catégorie', key: 'categorie', width: 15 },
    { header: 'Statut', key: 'statut', width: 15 },
  ],
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');
  const sector = searchParams.get('sector') || 'AUTRE';

  if (!entity) {
    return NextResponse.json({ error: 'Entité manquante' }, { status: 400 });
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Import Template');

  let columns: any[] = [];

  if (entity === 'etablissement') {
    columns = [...COMMON_ETAB_COLS];
    if (SECTOR_COLS[sector]) {
      columns = [...columns, ...SECTOR_COLS[sector]];
    }
  } else if (ENTITY_TEMPLATES[entity]) {
    columns = ENTITY_TEMPLATES[entity];
  } else {
    return NextResponse.json({ error: 'Entité invalide' }, { status: 400 });
  }

  worksheet.columns = columns;

  // Style the header
  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4F46E5' } // Indigo color
  };

  // Add a sample row if needed, or just return empty template
  // worksheet.addRow({ code: 'SAMPLE-001', nom: 'Exemple Nom' });

  const buffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="template_${entity}${entity === 'etablissement' ? '_' + sector : ''}.xlsx"`,
    },
  });
}

