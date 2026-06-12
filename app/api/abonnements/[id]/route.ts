import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, NotFoundError } from '@/lib/exceptions';

// GET - Obtenir un abonnement spécifique
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const { id } = await _p;
    const abonnementId = safeParseInt(id, 0);
    const userId = parseInt(session.user.id);

    const abonnement = await prisma.abonnementEtablissement.findFirst({
      where: {
        id: abonnementId,
        userId: userId,
      },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
            adresseComplete: true,
            secteur: true,
            photoPrincipale: true,
            commune: { select: { nom: true } },
          }
        }
      }
    });

  if (!abonnement) {
    throw new NotFoundError('Abonnement non trouvé');
  }

  return successResponse(abonnement);
});

// PATCH - Mettre à jour un abonnement (notifications)
export const PATCH = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const { id } = await _p;
    const abonnementId = safeParseInt(id, 0);
    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { notificationsActives } = body;

    // Vérifier que l'abonnement appartient à l'utilisateur
    const existing = await prisma.abonnementEtablissement.findFirst({
      where: {
        id: abonnementId,
        userId: userId,
      }
    });

  if (!existing) {
    throw new NotFoundError('Abonnement non trouvé');
  }

    const abonnement = await prisma.abonnementEtablissement.update({
      where: { id: abonnementId },
      data: {
        notificationsActives: notificationsActives ?? existing.notificationsActives,
      },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
          }
        }
      }
    });

  return successResponse(abonnement, 'Abonnement mis à jour');
});

// DELETE - Supprimer un abonnement
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const { id } = await _p;
    const abonnementId = safeParseInt(id, 0);
    const userId = parseInt(session.user.id);

    // Vérifier que l'abonnement appartient à l'utilisateur
    const abonnement = await prisma.abonnementEtablissement.findFirst({
      where: {
        id: abonnementId,
        userId: userId,
      },
      include: {
        etablissement: {
          select: { nom: true }
        }
      }
    });

  if (!abonnement) {
    throw new NotFoundError('Abonnement non trouvé');
  }

  await prisma.abonnementEtablissement.delete({
    where: { id: abonnementId }
  });

  return successResponse(null, `Vous êtes désabonné de ${abonnement.etablissement.nom}`);
});