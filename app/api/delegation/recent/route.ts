import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';

// GET - Contenus récents de la délégation
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userIdStr = session.user.id;
  const userId = parseInt(userIdStr);
  
  if (!userIdStr || isNaN(userId)) {
    throw new ValidationError('ID utilisateur invalide');
  }

    // Récupérer les contenus récents
    const [evenements, actualites, articles, campagnes] = await Promise.all([
      prisma.evenement.findMany({
        where: { createdBy: userId },
        select: { id: true, titre: true, statut: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.actualite.findMany({
        where: { createdBy: userId },
        select: { id: true, titre: true, statut: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.article.findMany({
        where: { createdBy: userId },
        select: { id: true, titre: true, isPublie: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
      prisma.campagne.findMany({
        where: { createdBy: userId },
        select: { id: true, titre: true, isActive: true, createdAt: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
      }),
    ]);

    // Combiner et trier par date
    const allItems = [
      ...evenements.map(e => ({
        id: e.id,
        titre: e.titre,
        type: 'evenement' as const,
        statut: e.statut,
        date: e.createdAt.toISOString(),
      })),
      ...actualites.map(a => ({
        id: a.id,
        titre: a.titre,
        type: 'actualite' as const,
        statut: a.statut,
        date: a.createdAt.toISOString(),
      })),
      ...articles.map(a => ({
        id: a.id,
        titre: a.titre,
        type: 'article' as const,
        statut: a.isPublie ? 'PUBLIE' : 'BROUILLON',
        date: a.createdAt.toISOString(),
      })),
      ...campagnes.map(c => ({
        id: c.id,
        titre: c.titre,
        type: 'campagne' as const,
        statut: c.isActive ? 'PUBLIEE' : 'BROUILLON',
        date: c.createdAt.toISOString(),
      })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
     .slice(0, 10);

  return successResponse(allItems);
});
