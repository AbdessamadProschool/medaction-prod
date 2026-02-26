import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { StatutEvenement, StatutActualite } from '@prisma/client';

// GET - Suggestions d'autocomplétion rapides
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = searchParams.get('type') || 'all';

    if (!query || query.length < 2) {
      return NextResponse.json({ suggestions: [] });
    }

    const searchTerm = query.trim().toLowerCase();
    const suggestions: Array<{
      id: number;
      text: string;
      type: string;
      icon: string;
      url: string;
    }> = [];

    // Recherche rapide dans les établissements
    if (type === 'all' || type === 'etablissements') {
      const etablissements = await prisma.etablissement.findMany({
        where: {
          nom: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { id: true, nom: true, secteur: true },
        take: 3,
        orderBy: { nom: 'asc' }
      });

      suggestions.push(...etablissements.map(e => ({
        id: e.id,
        text: e.nom,
        type: 'etablissement',
        icon: getSecteurIcon(e.secteur),
        url: `/etablissements/${e.id}`
      })));
    }

    // Recherche rapide dans les événements
    if (type === 'all' || type === 'evenements') {
      const evenements = await prisma.evenement.findMany({
        where: {
          statut: StatutEvenement.PUBLIEE,
          titre: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { id: true, titre: true, typeCategorique: true },
        take: 3,
        orderBy: { dateDebut: 'desc' }
      });

      suggestions.push(...evenements.map(e => ({
        id: e.id,
        text: e.titre,
        type: 'evenement',
        icon: '📅',
        url: `/evenements/${e.id}`
      })));
    }

    // Recherche rapide dans les actualités
    if (type === 'all' || type === 'actualites') {
      const actualites = await prisma.actualite.findMany({
        where: {
          statut: StatutActualite.PUBLIEE,
          titre: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { id: true, titre: true, categorie: true },
        take: 3,
        orderBy: { datePublication: 'desc' }
      });

      suggestions.push(...actualites.map(a => ({
        id: a.id,
        text: a.titre,
        type: 'actualite',
        icon: '📰',
        url: `/actualites/${a.id}`
      })));
    }

    // Recherche rapide dans les communes
    if (type === 'all' || type === 'communes') {
      const communes = await prisma.commune.findMany({
        where: {
          nom: { contains: searchTerm, mode: 'insensitive' }
        },
        select: { id: true, nom: true },
        take: 2,
        orderBy: { nom: 'asc' }
      });

      suggestions.push(...communes.map(c => ({
        id: c.id,
        text: c.nom,
        type: 'commune',
        icon: '📍',
        url: `/communes/${c.id}`
      })));
    }

    // Suggestions de recherche populaires basées sur les logs récents
    const recentSearches = await getPopularSearchTerms(searchTerm);

    return NextResponse.json({
      suggestions: suggestions.slice(0, 8),
      popularSearches: recentSearches,
    });

  } catch (error) {
    console.error('Erreur suggestions:', error);
    return NextResponse.json({ suggestions: [] });
  }
}

// Obtenir l'icône selon le secteur
function getSecteurIcon(secteur: string): string {
  const icons: Record<string, string> = {
    'SANTE': '🏥',
    'EDUCATION': '🎓',
    'SPORT': '⚽',
    'CULTURE': '🎭',
    'JEUNESSE': '👥',
    'ADMINISTRATION': '🏛️',
    'SOCIAL': '🤝',
    'ENVIRONNEMENT': '🌳',
  };
  return icons[secteur] || '🏢';
}

// Recherches populaires (mock - à remplacer par vraie logique)
async function getPopularSearchTerms(query: string): Promise<string[]> {
  // En production, utilisez une table de recherches populaires ou un cache Redis
  const popularTerms = [
    'Hôpital',
    'École',
    'Terrain de sport',
    'Centre culturel',
    'Maison de jeunes',
    'Marché',
    'Parc',
    'Bibliothèque',
  ];
  
  return popularTerms
    .filter(term => term.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 3);
}
