import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { StatutSuggestion } from '@prisma/client';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { SecurityValidation } from '@/lib/security/validation';
import { z } from 'zod';
import { ForbiddenError } from '@/lib/exceptions';

// GET /api/suggestions - Liste des suggestions (Public + Staff)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  // SECURITY FIX: Use secure pagination validation
  const { page, limit } = SecurityValidation.validatePagination(
    searchParams.get('page'),
    searchParams.get('limit')
  );
  
  const statut = searchParams.get('statut') as StatutSuggestion | null;
  const categorie = searchParams.get('categorie');
  const search = searchParams.get('search');
  const userIdRaw = searchParams.get('userId');

  const skip = (page - 1) * limit;

  // Construire les filtres
  const where: any = {};

  // Get current user to determine visibility
  const session = await getServerSession(authOptions);
  const currentUser = session?.user;
  const isAdmin = currentUser && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'DELEGATION', 'AUTORITE_LOCALE'].includes(currentUser.role);

  // Visibility Logic:
  // - Admin/Staff: Can see everything
  // - Public/Citizen: Can see 'APPROUVEE' or 'IMPLEMENTEE'
  // - Owner: Can see their own suggestions
  const publicStatuses = ['APPROUVEE', 'IMPLEMENTEE'];

  if (!isAdmin) {
    if (currentUser) {
       where.OR = [
         { statut: { in: publicStatuses } },
         { userId: parseInt(currentUser.id) }
       ];
    } else {
       where.statut = { in: publicStatuses };
    }
  }

  // Explicit filters
  if (statut) {
    if (where.OR) {
      where.AND = [
         { OR: where.OR },
         { statut }
      ];
      delete where.OR;
    } else {
       // Guest check
       if (!isAdmin && !currentUser && !publicStatuses.includes(statut)) {
           return NextResponse.json({ 
             data: [], 
             pagination: { page, limit, total: 0, totalPages: 0 }, 
             stats: { total: 0, parStatut: {} } 
           });
       }
       where.statut = statut;
    }
  }

  if (categorie) {
    where.categorie = SecurityValidation.sanitizeString(categorie);
  }

  if (userIdRaw) {
    const userIdValid = SecurityValidation.validateId(userIdRaw);
    if (userIdValid) where.userId = userIdValid;
  }

  if (search) {
    const sanitizedSearch = SecurityValidation.sanitizeString(search);
    const searchFilter = {
       OR: [
        { titre: { contains: sanitizedSearch, mode: 'insensitive' as const } },
        { description: { contains: sanitizedSearch, mode: 'insensitive' as const } },
      ]
    };
    
    if (where.AND) {
       where.AND.push(searchFilter);
    } else if (where.OR) {
       where.AND = [
          { OR: where.OR },
          searchFilter
       ];
       delete where.OR;
    } else {
       where.OR = searchFilter.OR;
    }
  }

  // Récupérer les suggestions avec pagination
  const [suggestions, total] = await Promise.all([
    prisma.suggestion.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            nom: true,
            prenom: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.suggestion.count({ where }),
  ]);

  // Stats par statut
  const statsParStatut = await prisma.suggestion.groupBy({
    by: ['statut'],
    _count: { id: true },
  });

  const stats = {
    total,
    parStatut: Object.fromEntries(
      statsParStatut.map((s) => [s.statut, s._count.id])
    ),
  };

  return NextResponse.json({
    data: suggestions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
    stats,
  });
});

// POST /api/suggestions - Soumettre une nouvelle suggestion
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const userId = parseInt(session.user.id);
  
  // Vérifier la permission
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'suggestions.create');

  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission de soumettre une suggestion");
  }

  // Rate Limiting métier : 6 suggestions par mois par utilisateur
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const count = await prisma.suggestion.count({
    where: {
      userId,
      createdAt: { gte: startOfMonth }
    }
  });

  if (count >= 6) {
     const nextReset = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString();
     return NextResponse.json(
       { 
         success: false, 
         error: 'LIMIT_EXCEEDED', 
         resetDate: nextReset, 
         message: 'Limite mensuelle de suggestions atteinte (6).' 
       }, 
       { status: 429 }
     );
  }

  // Validation sécurisée
  const suggestionSchema = z.object({
    titre: SecurityValidation.schemas.title,
    description: SecurityValidation.schemas.description,
    categorie: z.string().max(50).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  });

  const body = await request.json();
  const validation = suggestionSchema.safeParse(body);
  
  if (!validation.success) {
    throw validation.error;
  }

  const { titre, description, categorie } = validation.data;

  // Créer la suggestion
  const suggestion = await prisma.suggestion.create({
    data: {
      userId,
      titre,
      description,
      categorie: categorie || null,
      statut: 'SOUMISE',
    },
    include: {
      user: {
        select: {
          id: true,
          nom: true,
          prenom: true,
        },
      },
    },
  });

  // Notifier les admins (non-bloquant)
  try {
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'SUPER_ADMIN'] },
        isActive: true,
      },
      select: { id: true },
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: 'NOUVELLE_SUGGESTION',
          titre: 'Nouvelle suggestion reçue',
          message: `${session.user.prenom} ${session.user.nom} a soumis une suggestion : "${titre.substring(0, 50)}${titre.length > 50 ? '...' : ''}"`,
          lien: `/admin/suggestions/${suggestion.id}`,
        })),
      });
    }
  } catch (notifError) {
    console.warn('Erreur notification suggestion:', notifError);
  }

  return successResponse(suggestion, 'Suggestion soumise avec succès', 201);
});
