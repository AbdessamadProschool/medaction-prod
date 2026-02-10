import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { StatutSuggestion } from '@prisma/client';

// GET /api/suggestions - Liste des suggestions
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const statut = searchParams.get('statut') as StatutSuggestion | null;
    const categorie = searchParams.get('categorie');
    const search = searchParams.get('search');
    const userId = searchParams.get('userId');

    const skip = (page - 1) * limit;

    // Construire les filtres
    const where: any = {};

    // Get current user to determine visibility
    const session = await getServerSession(authOptions);
    const currentUser = session?.user;
    const isAdmin = currentUser && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'DELEGATION', 'AUTORITE_LOCALE'].includes(currentUser.role);

    // Visibility Logic:
    // - Admin/Staff: Can see everything (subject to other filters)
    // - Public/Citizen: Can see 'APPROUVEE' or 'IMPLEMENTEE'
    // - Owner: Can see their own suggestions regardless of status

    const publicStatuses = ['APPROUVEE', 'IMPLEMENTEE'];

    if (!isAdmin) {
      // If specific status requested (e.g. filter by 'SOUMISE'), only allow if it's my own.
      // But typically, we want to return a mixed list: (Public AND Approved) OR (Mine)
      
      if (currentUser) {
         // Logged in citizen
         where.OR = [
           { statut: { in: publicStatuses } },
           { userId: parseInt(currentUser.id) }
         ];
      } else {
         // Guest
         where.statut = { in: publicStatuses };
      }
    }

    // Apply explicit filters (intersecting with visibility)
    if (statut) {
      if (where.OR) {
        // If we have mixed visibility, we need to enforce that the requested status matches one of the allowed conditions
        // BUT prisma doesn't support AND inside OR easily for this logic without nested groups.
        // Easier: where.AND = [ { OR: [...] }, { statut } ]
        where.AND = [
           { OR: where.OR },
           { statut }
        ];
        delete where.OR; // Moved to AND
      } else {
         // If we had a single condition (Guest), Just add/overwrite statut if logical.
         // If guest requests 'SOUMISE', they get nothing (since publicStatuses mismatch).
         // So:
         where.statut = statut;
         // If not admin, and requesting non-public status, and not owner (handled above), it will return empty if we just set status.
         // Wait, for Guest: where.statut was set to publicStatuses. If param statut provides 'SOUMISE', we get conflict.
         // We should probably just let the explicit filter override IF it doesn't violate security?
         // NO, security first.
         
         if (!isAdmin && !currentUser) {
            // Guest requesting something
             if (!publicStatuses.includes(statut)) {
                 // Requesting hidden status
                 return NextResponse.json({ data: [], pagination: { page, limit, total: 0, totalPages: 0 }, stats: { total: 0, parStatut: {} } });
             }
         }
      }
    }

    // Categories
    if (categorie) {
      where.categorie = categorie;
    }

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (search) {
      const searchFilter = {
         OR: [
          { titre: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ]
      };
      
      if (where.AND) {
         where.AND.push(searchFilter);
      } else if (where.OR) {
         // wrap existing OR and search OR
         where.AND = [
            { OR: where.OR },
            searchFilter
         ];
         delete where.OR;
      } else {
         // Merge
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
  } catch (error) {
    console.error('Erreur GET /api/suggestions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST /api/suggestions - Soumettre une nouvelle suggestion
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { titre, description, categorie } = body;

    // Vérifier la permission
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(parseInt(session.user.id), 'suggestions.create');

    if (!hasPermission) {
      return NextResponse.json({ error: "Vous n'avez pas la permission de soumettre une suggestion" }, { status: 403 });
    }

    // Validation
    if (!titre?.trim()) {
      return NextResponse.json(
        { error: 'Le titre est requis' },
        { status: 400 }
      );
    }

    if (!description?.trim()) {
      return NextResponse.json(
        { error: 'La description est requise' },
        { status: 400 }
      );
    }

    if (titre.length > 200) {
      return NextResponse.json(
        { error: 'Le titre ne peut pas dépasser 200 caractères' },
        { status: 400 }
      );
    }

    if (description.length > 5000) {
      return NextResponse.json(
        { error: 'La description ne peut pas dépasser 5000 caractères' },
        { status: 400 }
      );
    }

    // Créer la suggestion
    const suggestion = await prisma.suggestion.create({
      data: {
        userId: parseInt(session.user.id),
        titre: titre.trim(),
        description: description.trim(),
        categorie: categorie?.trim() || null,
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

    // Notifier les admins (optionnel)
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

    return NextResponse.json({
      data: suggestion,
      message: 'Suggestion soumise avec succès',
    }, { status: 201 });
  } catch (error) {
    console.error('Erreur POST /api/suggestions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
