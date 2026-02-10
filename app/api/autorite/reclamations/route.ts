import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, AppError } from '@/lib/exceptions';

// GET - Réclamations de la commune de l'autorité locale
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  // Vérifier le rôle
  if (session.user.role !== 'AUTORITE_LOCALE') {
    throw new ForbiddenError('Accès réservé aux autorités locales');
  }

  const autoriteId = parseInt(session.user.id);

  // Récupérer la commune responsable de l'autorité
  const autorite = await prisma.user.findUnique({
    where: { id: autoriteId },
    select: { communeResponsableId: true }
  });

  if (!autorite?.communeResponsableId) {
    throw new AppError(
      'Aucune commune assignée à votre compte. Contactez un administrateur pour lier votre compte à une commune.',
      'VALIDATION_ERROR',
      400
    );
  }

  const communeId = autorite.communeResponsableId;
  const { searchParams } = new URL(request.url);
  
  // Paramètres de filtrage
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);
  const skip = (page - 1) * limit;
  
  const statut = searchParams.get('statut');
  const categorie = searchParams.get('categorie');
  const search = searchParams.get('search');
  const etablissementId = searchParams.get('etablissementId');
  const sortBy = searchParams.get('sortBy') || 'dateAffectation';
  const sortOrder = searchParams.get('sortOrder') === 'asc' ? 'asc' : 'desc';

  // Construire le filtre - basé sur la commune
  const where: any = {
    communeId,
    affectationReclamation: 'AFFECTEE',
  };

  // Filtre par statut de résolution
  if (statut === 'en_attente') {
    where.dateResolution = null;
  } else if (statut === 'resolue') {
    where.dateResolution = { not: null };
  }

  // Filtre par catégorie
  if (categorie) {
    where.categorie = categorie;
  }

  // Filtre par établissement
  if (etablissementId) {
    where.etablissementId = parseInt(etablissementId);
  }

  // Recherche textuelle
  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { quartierDouar: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Récupérer les réclamations
  const [reclamations, total] = await Promise.all([
    prisma.reclamation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
            telephone: true,
            email: true,
          }
        },
        commune: {
          select: { id: true, nom: true }
        },
        etablissement: {
          select: { id: true, nom: true, secteur: true }
        },
        medias: {
          take: 3,
          select: { id: true, urlPublique: true, type: true }
        },
        _count: {
          select: { historique: true }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    prisma.reclamation.count({ where }),
  ]);

  // Récupérer les catégories pour les filtres
  const categories = await prisma.reclamation.groupBy({
    by: ['categorie'],
    where: { 
      communeId,
      affectationReclamation: 'AFFECTEE',
    },
    _count: true,
  });

  // Récupérer les établissements de la commune pour filtres
  const etablissements = await prisma.etablissement.findMany({
    where: { communeId },
    select: { id: true, nom: true, secteur: true },
    orderBy: { nom: 'asc' }
  });

  return NextResponse.json({
    success: true,
    data: reclamations.map(r => ({
      ...r,
      isResolue: r.dateResolution !== null,
      joursDepuisAffectation: r.dateAffectation 
        ? Math.floor((Date.now() - new Date(r.dateAffectation).getTime()) / (1000 * 60 * 60 * 24))
        : null,
    })),
    categories: categories.map(c => ({
      value: c.categorie,
      label: c.categorie,
      count: c._count,
    })),
    etablissements: etablissements.map(e => ({
      value: e.id.toString(),
      label: e.nom,
      secteur: e.secteur,
    })),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  });
});
