import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

const TEMPLATES: Record<string, string> = {
  etablissement: 'code,nom,secteur,commune,annexe,adresse,latitude,longitude,responsable_nom,telephone,email',
  evenement: 'titre,description,date_debut,date_fin,lieu,etablissement_code,type,statut,capacite',
  campagne: 'titre,description,date_debut,date_fin,cible,budget,statut,type',
  activite: 'titre,type,date,beneficiaires_count,etablissement_code,description,programme',
  article: 'titre,contenu,auteur_email,date_publication,categorie,tags,statut'
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
