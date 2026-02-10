import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';
import { z } from 'zod';

// Schéma de validation pour création d'actualité (compatible Zod v4)
const createActualiteSchema = z.object({
  etablissementId: z.number().int().positive(),
  titre: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(200, "Le titre ne doit pas dépasser 200 caractères"),
  description: z.string().max(500, "La description ne doit pas dépasser 500 caractères").optional(),
  contenu: z.string().min(50, "Le contenu doit contenir au moins 50 caractères"),
  categorie: z.string().optional(),
  tags: z.array(z.string()).optional(),
  imagePrincipale: z.string().optional(),
});


// POST - Créer une actualité (DELEGATION uniquement)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté pour créer une actualité');
  }

  const userId = parseInt(session.user.id);
  
  // Vérifier la permission
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'actualites.create');

  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission de créer des actualités");
  }

  const body = await request.json();
  
  // Validation avec Zod (les erreurs seront automatiquement formatées par le handler)
  const validation = createActualiteSchema.safeParse(body);

  if (!validation.success) {
    // Transformer les erreurs Zod en format lisible
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path.join('.') || 'general';
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    
    const errorMessages = Object.values(fieldErrors).flat();
    throw new ValidationError(
      errorMessages.length === 1 ? errorMessages[0] : `${errorMessages.length} erreurs de validation`,
      { fieldErrors }
    );
  }

  const data = validation.data;

  // Vérifier que l'établissement existe
  const etablissement = await prisma.etablissement.findUnique({
    where: { id: data.etablissementId },
    select: { id: true, nom: true }
  });

  if (!etablissement) {
    throw new NotFoundError("L'établissement sélectionné n'existe pas");
  }

  // Créer l'actualité
  const actualite = await prisma.actualite.create({
    data: {
      etablissementId: data.etablissementId,
      titre: data.titre.trim(),
      description: data.description?.trim(),
      contenu: data.contenu.trim(),
      categorie: data.categorie,
      tags: data.tags || [],
      statut: 'EN_ATTENTE_VALIDATION',
      isPublie: false,
      isValide: false,
      createdBy: userId,
    },
    include: {
      etablissement: { select: { nom: true } },
    }
  });

  // Notifier les admins (non bloquant)
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'NOUVELLE_ACTUALITE',
          titre: 'Nouvelle actualité à valider',
          message: `L'actualité "${actualite.titre}" attend votre validation.`,
          lien: `/admin/actualites/${actualite.id}`,
        }))
      });
    }
  } catch (notifError) {
    console.error('Erreur notification (non bloquante):', notifError);
  }

  return NextResponse.json({
    success: true,
    message: 'Actualité créée avec succès. Elle sera visible après validation par un administrateur.',
    data: actualite 
  }, { status: 201 });
});

// GET - Liste des actualités
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
  const categorie = searchParams.get('categorie');
  const etablissementId = searchParams.get('etablissementId');
  const search = searchParams.get('search');
  const statut = searchParams.get('statut');

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  const isDelegation = session?.user?.role === 'DELEGATION';

  // Construction du filtre
  const where: any = {};

  // Pour le public: uniquement les actualités publiées et validées
  if (!isAdmin) {
    where.isPublie = true;
    where.isValide = true;
    where.statut = 'PUBLIEE';
  } else if (statut) {
    where.statut = statut;
  }

  // Si délégation, montrer aussi ses propres actualités
  if (isDelegation && session?.user?.id) {
    where.OR = [
      { isPublie: true, isValide: true, statut: 'PUBLIEE' },
      { createdBy: parseInt(session.user.id) }
    ];
    delete where.isPublie;
    delete where.isValide;
    delete where.statut;
  }

  // Filtres additionnels
  if (categorie) {
    where.categorie = categorie;
  }

  if (etablissementId) {
    where.etablissementId = parseInt(etablissementId);
  }

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { contenu: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Requête avec pagination
  const [actualites, total] = await Promise.all([
    prisma.actualite.findMany({
      where,
      include: {
        etablissement: { select: { id: true, nom: true, secteur: true } },
        medias: { take: 1, select: { urlPublique: true } },
        createdByUser: { select: { nom: true, prenom: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.actualite.count({ where })
  ]);

  return NextResponse.json(
    {
      success: true,
      data: actualites,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    },
    {
      headers: {
        'Cache-Control': isAdmin ? 'no-store' : 'public, max-age=60, s-maxage=60',
      }
    }
  );
});
