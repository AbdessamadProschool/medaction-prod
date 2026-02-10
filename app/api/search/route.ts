import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { StatutEvenement, StatutActualite } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

// Types de recherche disponibles
type SearchType = 'all' | 'etablissements' | 'evenements' | 'actualites' | 'users' | 'reclamations';

interface SearchResult {
  id: number;
  type: SearchType;
  title: string;
  subtitle?: string;
  description?: string;
  image?: string | null;
  url: string;
  score?: number;
  metadata?: Record<string, unknown>;
}

// GET - Recherche globale
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const type = (searchParams.get('type') || 'all') as SearchType;
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
    const autocomplete = searchParams.get('autocomplete') === 'true';

    if (!query || query.length < 2) {
      return NextResponse.json({ 
        error: 'La recherche doit contenir au moins 2 caractères' 
      }, { status: 400 });
    }

    // Préparer le terme de recherche pour PostgreSQL
    const searchTerm = query.trim().toLowerCase();

    const results: SearchResult[] = [];

    // Recherche dans les établissements
    if (type === 'all' || type === 'etablissements') {
      const etablissements = await prisma.etablissement.findMany({
        where: {
          OR: [
            { nom: { contains: searchTerm, mode: 'insensitive' } },
            { adresseComplete: { contains: searchTerm, mode: 'insensitive' } },
            { quartierDouar: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          nom: true,
          adresseComplete: true,
          secteur: true,
          photoPrincipale: true,
          commune: { select: { nom: true } },
        },
        take: autocomplete ? 5 : limit,
        orderBy: { nom: 'asc' }
      });

      results.push(...etablissements.map(e => ({
        id: e.id,
        type: 'etablissements' as SearchType,
        title: e.nom,
        subtitle: e.commune?.nom || '',
        description: e.adresseComplete || undefined,
        image: e.photoPrincipale,
        url: `/etablissements/${e.id}`,
        metadata: { secteur: e.secteur }
      })));
    }

    // Recherche dans les événements
    if (type === 'all' || type === 'evenements') {
      const evenements = await prisma.evenement.findMany({
        where: {
          statut: StatutEvenement.PUBLIEE,
          OR: [
            { titre: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
            { lieu: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          titre: true,
          description: true,
          dateDebut: true,
          lieu: true,
          typeCategorique: true,
          categorie: true,
        },
        take: autocomplete ? 5 : limit,
        orderBy: { dateDebut: 'desc' }
      });

      results.push(...evenements.map(e => ({
        id: e.id,
        type: 'evenements' as SearchType,
        title: e.titre,
        subtitle: e.lieu || '',
        description: e.description?.substring(0, 150) || undefined,
        image: null, // Pas de photo directe, utiliser medias
        url: `/evenements/${e.id}`,
        metadata: { 
          date: e.dateDebut,
          typeCategorique: e.typeCategorique,
          categorie: e.categorie 
        }
      })));
    }

    // Recherche dans les actualités
    if (type === 'all' || type === 'actualites') {
      const actualites = await prisma.actualite.findMany({
        where: {
          statut: StatutActualite.PUBLIEE,
          OR: [
            { titre: { contains: searchTerm, mode: 'insensitive' } },
            { contenu: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          titre: true,
          description: true,
          datePublication: true,
          categorie: true,
        },
        take: autocomplete ? 5 : limit,
        orderBy: { datePublication: 'desc' }
      });

      results.push(...actualites.map(a => ({
        id: a.id,
        type: 'actualites' as SearchType,
        title: a.titre,
        subtitle: a.categorie || '',
        description: a.description?.substring(0, 150) || undefined,
        image: null,
        url: `/actualites/${a.id}`,
        metadata: { 
          date: a.datePublication,
          categorie: a.categorie 
        }
      })));
    }

    // Recherche dans les utilisateurs (citoyens)
    // Sécurisé : visible seulement pour les rôles administratifs
    const session = await getServerSession(authOptions);
    const canViewUsers = session?.user && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'DELEGATION', 'AUTORITE_LOCALE'].includes(session.user.role);

    if ((type === 'all' || type === 'users') && canViewUsers) {
      const users = await prisma.user.findMany({
        where: {
          isActive: true,
          role: 'CITOYEN',
          OR: [
            { nom: { contains: searchTerm, mode: 'insensitive' } },
            { prenom: { contains: searchTerm, mode: 'insensitive' } },
            { email: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          nom: true,
          prenom: true,
          photo: true,
          role: true,
        },
        take: autocomplete ? 5 : limit,
        orderBy: { nom: 'asc' }
      });

      results.push(...users.map(u => ({
        id: u.id,
        type: 'users' as SearchType,
        title: `${u.prenom} ${u.nom}`,
        subtitle: 'Citoyen',
        image: u.photo,
        url: `/profil/${u.id}`,
        metadata: { role: u.role }
      })));
    }

    // Recherche dans les réclamations (admin uniquement - à protéger côté UI)
    if (type === 'reclamations') {
      const reclamations = await prisma.reclamation.findMany({
        where: {
          OR: [
            { titre: { contains: searchTerm, mode: 'insensitive' } },
            { description: { contains: searchTerm, mode: 'insensitive' } },
          ]
        },
        select: {
          id: true,
          titre: true,
          statut: true,
          createdAt: true,
          categorie: true,
        },
        take: autocomplete ? 5 : limit,
        orderBy: { createdAt: 'desc' }
      });

      results.push(...reclamations.map(r => ({
        id: r.id,
        type: 'reclamations' as SearchType,
        title: r.titre,
        subtitle: `#${r.id}`,
        description: `Statut: ${r.statut || 'En attente'}`,
        url: `/admin/reclamations/${r.id}`,
        metadata: { 
          statut: r.statut,
          categorie: r.categorie 
        }
      })));
    }

    // Trier les résultats par pertinence (titre exact match en premier)
    results.sort((a, b) => {
      const aExact = a.title.toLowerCase().includes(searchTerm) ? 1 : 0;
      const bExact = b.title.toLowerCase().includes(searchTerm) ? 1 : 0;
      return bExact - aExact;
    });

    // Limiter le nombre total de résultats
    const limitedResults = results.slice(0, limit);

    // Générer des suggestions d'autocomplete si demandé
    let suggestions: string[] = [];
    if (autocomplete) {
      const uniqueTitles = new Set(results.map(r => r.title));
      suggestions = Array.from(uniqueTitles).slice(0, 8);
    }

    // Statistiques par type
    const stats = {
      total: results.length,
      byType: {
        etablissements: results.filter(r => r.type === 'etablissements').length,
        evenements: results.filter(r => r.type === 'evenements').length,
        actualites: results.filter(r => r.type === 'actualites').length,
        users: results.filter(r => r.type === 'users').length,
        reclamations: results.filter(r => r.type === 'reclamations').length,
      }
    };

    return NextResponse.json({
      query,
      type,
      results: limitedResults,
      suggestions: autocomplete ? suggestions : undefined,
      stats,
      pagination: {
        limit,
        returned: limitedResults.length,
      }
    });

  } catch (error) {
    console.error('Erreur recherche globale:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
