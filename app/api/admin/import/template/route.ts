import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const TEMPLATES: Record<string, string> = {
  etablissement: "Code Établissement,Nom de l'établissement,Secteur (Éducation-Santé-etc),Commune,Annexe Administrative,Adresse détaillée,Quartier ou Douar,Latitude (GPS),Longitude (GPS),Téléphone,Email de contact,Nature (Public-Privé),Cycle d'enseignement,Nombre de classes,Nombre d'enseignants,Nombre de cadres admin,Total élèves,Total filles,Filles préscolaire,Filles dernière année,Disponibilité Eau (Oui-Non),Électricité (Oui-Non),Accès Internet (Oui-Non)",
  commune: "Nom de la commune,Code Commune,Population,Superficie (km2),Latitude,Longitude",
  annexe: "Nom de l'Annexe,Code Annexe,Nom de la Commune,Latitude,Longitude",
  evenement: "Titre de l'événement,Description détaillée,Date de début,Date de fin,Lieu exact,Code Établissement organisateur,Type d'événement,Statut,Capacité d'accueil",
  campagne: "Titre de la campagne,Description,Date de début,Date de fin,Public cible,Budget estimé,Statut,Type de campagne",
  activite: "Titre de l'activité,Type,Date prévue,Nombre de bénéficiaires,Code Établissement,Description,Programme rattaché",
  article: "Titre de l'article,Contenu,Email de l'auteur,Date de publication,Catégorie,Tags,Statut"
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'SUPER_ADMIN' && session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const entity = searchParams.get('entity');

  if (!entity || !TEMPLATES[entity]) {
    return NextResponse.json({ error: 'Entité invalide' }, { status: 400 });
  }

  const csvContent = TEMPLATES[entity];

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="template_${entity}.csv"`,
    },
  });
}
