import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const allowedRoles = ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'];
  if (!allowedRoles.includes(session.user.role || '')) {
    throw new ForbiddenError('Accès réservé aux administrateurs et gouverneurs');
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

  const actualites = await prisma.actualite.findMany({
    where: { isPublie: true },
    include: {
      etablissement: {
        select: { 
          nom: true, 
          secteur: true,
          commune: { select: { nom: true } }
        }
      },
      createdByUser: {
        select: { nom: true, prenom: true }
      },
      medias: {
        select: { id: true, urlPublique: true, type: true, nomFichier: true }
      }
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });

  return NextResponse.json({
    success: true,
    data: actualites
  });
});
