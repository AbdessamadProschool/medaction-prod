import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from '@/lib/exceptions';

// GET - Liste de toutes les permissions disponibles
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  // Seuls les admins peuvent voir les permissions
  if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
    throw new ForbiddenError('Accès non autorisé');
  }

    // Récupérer toutes les permissions (actives et inactives pour SUPER_ADMIN)
    const showAll = session.user.role === 'SUPER_ADMIN';
    const permissions = await prisma.permission.findMany({
      take: 100,
      where: showAll ? {} : { isActive: true },
      orderBy: [
        { groupe: 'asc' },
        { ordre: 'asc' }
      ],
      select: {
        id: true,
        code: true,
        nom: true,
        description: true,
        groupe: true,
        groupeLabel: true,
        ordre: true,
        isActive: true,
      }
    });

    // Grouper par groupeLabel pour l'affichage
    const grouped: Record<string, typeof permissions> = {};
    for (const perm of permissions) {
      if (!grouped[perm.groupeLabel]) {
        grouped[perm.groupeLabel] = [];
      }
      grouped[perm.groupeLabel].push(perm);
    }

    // Statistiques
    const stats = {
      total: permissions.length,
      active: permissions.filter(p => p.isActive).length,
      inactive: permissions.filter(p => !p.isActive).length,
      groupes: Object.keys(grouped).length,
    };

  return successResponse({
    permissions,
    grouped,
    stats,
  });
});

// POST - Créer une nouvelle permission (SUPER_ADMIN uniquement)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  // Seul SUPER_ADMIN peut créer des permissions
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès réservé aux Super Administrateurs');
  }

    const body = await request.json();
    const { code, nom, description, groupe, groupeLabel } = body;

  // Validation
  if (!code || !nom || !groupe) {
    throw new ValidationError('Code, nom et groupe sont requis');
  }

    // Vérifier si le code existe déjà
    const existing = await prisma.permission.findUnique({
      where: { code: code.toUpperCase() },
    });

  if (existing) {
    throw new AppError('Une permission avec ce code existe déjà', 'CONFLICT', 409);
  }

    // Trouver le prochain ordre dans le groupe
    const lastInGroup = await prisma.permission.findFirst({
      where: { groupe },
      orderBy: { ordre: 'desc' },
    });
    const newOrdre = (lastInGroup?.ordre || 0) + 1;

    // Créer la permission
    const permission = await prisma.permission.create({
      data: {
        code: code.toUpperCase(),
        nom,
        description: description || null,
        groupe,
        groupeLabel: groupeLabel || groupe,
        ordre: newOrdre,
        isActive: true,
      },
    });

  // Audit log
  await ActivityLogger.custom({
    action: 'CREATE_PERMISSION',
    entity: 'Permission',
    entityId: permission.id,
    userId: parseInt(session.user.id),
    details: {
      code: permission.code,
      nom: permission.nom
    }
  });

  return successResponse({
    permission,
  }, 'Permission créée avec succès', 201);
});
