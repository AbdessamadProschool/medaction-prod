import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError, AppError } from '@/lib/exceptions';

// GET - Liste des abonnements de l'utilisateur
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour voir vos abonnements');
  }

  const idRaw = session.user.id;
  const userId = idRaw ? parseInt(idRaw) : NaN;
  
  if (isNaN(userId)) {
    throw new ValidationError('ID utilisateur invalide');
  }

  const { searchParams } = new URL(request.url);
  
  // Safe parsing of page and limit
  const pageParam = searchParams.get('page');
  const page = pageParam ? Math.max(parseInt(pageParam) || 1, 1) : 1;
  
  const limitParam = searchParams.get('limit');
  const limit = limitParam ? Math.min(Math.max(parseInt(limitParam) || 20, 1), 100) : 20;
  
  const skip = (page - 1) * limit;

  const [abonnements, total] = await Promise.all([
    prisma.abonnementEtablissement.findMany({
      where: { userId },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
            adresseComplete: true,
            secteur: true,
            photoPrincipale: true,
            commune: { select: { nom: true } },
            _count: {
              select: {
                evenementsOrganises: true,
                actualites: true,
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.abonnementEtablissement.count({
      where: { userId }
    })
  ]);

  return NextResponse.json({
    success: true,
    data: abonnements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    }
  });
});

// POST - Créer un abonnement
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour vous abonner');
  }

  const idRaw = session.user.id;
  const userId = idRaw ? parseInt(idRaw) : NaN;
  
  if (isNaN(userId)) {
    throw new UnauthorizedError('Identifiant utilisateur invalide');
  }
  
  // Vérifier permission
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'etablissements.subscribe');
  
  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission de vous abonner aux établissements");
  }

  const body = await request.json();
  const { etablissementId, notificationsActives = true } = body;

  if (!etablissementId) {
    throw new ValidationError("L'identifiant de l'établissement est obligatoire", {
      fieldErrors: { etablissementId: ["Veuillez sélectionner un établissement"] }
    });
  }

  // Vérifier que l'établissement existe
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: etablissementId },
    select: { id: true, nom: true }
  });

  if (!etablissement) {
    throw new NotFoundError("L'établissement sélectionné n'existe pas ou a été supprimé");
  }

  // Vérifier si l'abonnement existe déjà
  const existingAbonnement = await prisma.abonnementEtablissement.findUnique({
    where: {
      userId_etablissementId: {
        userId,
        etablissementId
      }
    }
  });

  if (existingAbonnement) {
    throw new AppError(
      `Vous êtes déjà abonné à "${etablissement.nom}"`,
      'CONFLICT',
      409
    );
  }

  // Créer l'abonnement
  const abonnement = await prisma.abonnementEtablissement.create({
    data: {
      userId,
      etablissementId,
      notificationsActives,
    },
    include: {
      etablissement: {
        select: {
          id: true,
          nom: true,
          secteur: true,
        }
      }
    }
  });

  return NextResponse.json({
    success: true,
    message: `Vous êtes maintenant abonné à "${etablissement.nom}"`,
    data: abonnement
  }, { status: 201 });
});
