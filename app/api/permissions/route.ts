import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Liste de toutes les permissions disponibles
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seuls les admins peuvent voir les permissions
    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    // Récupérer toutes les permissions (actives et inactives pour SUPER_ADMIN)
    const showAll = session.user.role === 'SUPER_ADMIN';
    const permissions = await prisma.permission.findMany({
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

    return NextResponse.json({
      permissions,
      grouped,
      stats,
    });

  } catch (error) {
    console.error('Erreur GET permissions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une nouvelle permission (SUPER_ADMIN uniquement)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seul SUPER_ADMIN peut créer des permissions
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux Super Administrateurs' }, { status: 403 });
    }

    const body = await request.json();
    const { code, nom, description, groupe, groupeLabel } = body;

    // Validation
    if (!code || !nom || !groupe) {
      return NextResponse.json(
        { error: 'Code, nom et groupe sont requis' },
        { status: 400 }
      );
    }

    // Vérifier si le code existe déjà
    const existing = await prisma.permission.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'Une permission avec ce code existe déjà' },
        { status: 409 }
      );
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

    return NextResponse.json({
      message: 'Permission créée avec succès',
      permission,
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST permission:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
