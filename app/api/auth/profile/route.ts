import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, NotFoundError, ValidationError } from '@/lib/exceptions';
import { ActivityLogger } from '@/lib/activity-logger';

// GET - Récupérer le profil de l'utilisateur connecté
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

  const userId = parseInt(session.user.id);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      telephone: true,
      nom: true,
      prenom: true,
      photo: true,
      role: true,
      isActive: true,
      isEmailVerifie: true,
      isTelephoneVerifie: true,
      derniereConnexion: true,
      dateInscription: true,
      createdAt: true,
    }
  });

  if (!user) {
    throw new NotFoundError('Utilisateur non trouvé');
  }

  return successResponse(user, 'Profil récupéré avec succès');
});

export const PATCH = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non authentifié');
  }

  const userId = parseInt(session.user.id);
  
  if (!request.headers.get('content-type')?.includes('application/json')) {
    throw new ValidationError('Content-Type must be application/json');
  }

  const body = await request.json();

  // Champs modifiables
  const allowedFields = ['nom', 'prenom', 'telephone'];
  const updateData: any = {};

  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updateData[field] = body[field] || null;
    }
  }

  if (Object.keys(updateData).length === 0) {
    throw new ValidationError('Aucun champ à mettre à jour');
  }

  // Vérification basique
  if (updateData.telephone && !/^[0-9+ ]{8,15}$/.test(updateData.telephone)) {
    throw new ValidationError('Format de téléphone invalide');
  }

  // Vérifier si le téléphone est déjà utilisé
  if (updateData.telephone) {
    const existingPhone = await prisma.user.findFirst({
      where: {
        telephone: updateData.telephone,
        id: { not: userId }
      }
    });

    if (existingPhone) {
      throw new ValidationError('Ce numéro de téléphone est déjà utilisé');
    }
  }

  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      email: true,
      telephone: true,
      nom: true,
      prenom: true,
      photo: true,
      role: true,
    }
  });

  // Log l'activité
  await ActivityLogger.custom({
    action: 'UPDATE_PROFILE',
    entity: 'User',
    entityId: userId,
    details: { updatedFields: Object.keys(updateData) },
    userId
  });

  return successResponse(updatedUser, 'Profil mis à jour');
});
