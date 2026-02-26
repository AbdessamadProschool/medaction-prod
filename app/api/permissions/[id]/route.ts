import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Récupérer une permission par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const permission = await prisma.permission.findUnique({
      where: { id },
      include: {
        _count: {
          select: { userPermissions: true },
        },
      },
    });

    if (!permission) {
      return NextResponse.json({ error: 'Permission non trouvée' }, { status: 404 });
    }

    return NextResponse.json(permission);

  } catch (error) {
    console.error('Erreur GET permission:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier une permission (SUPER_ADMIN uniquement)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux Super Administrateurs' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { code, nom, description, groupe, groupeLabel, isActive, ordre } = body;

    // Vérifier que la permission existe
    const existing = await prisma.permission.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Permission non trouvée' }, { status: 404 });
    }

    // Si le code change, vérifier qu'il n'existe pas déjà
    if (code && code.toUpperCase() !== existing.code) {
      const duplicate = await prisma.permission.findUnique({
        where: { code: code.toUpperCase() },
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Une permission avec ce code existe déjà' },
          { status: 409 }
        );
      }
    }

    // Mettre à jour
    const permission = await prisma.permission.update({
      where: { id },
      data: {
        ...(code && { code: code.toUpperCase() }),
        ...(nom && { nom }),
        ...(description !== undefined && { description }),
        ...(groupe && { groupe }),
        ...(groupeLabel && { groupeLabel }),
        ...(isActive !== undefined && { isActive }),
        ...(ordre !== undefined && { ordre }),
      },
    });

    return NextResponse.json({
      message: 'Permission mise à jour',
      permission,
    });

  } catch (error) {
    console.error('Erreur PATCH permission:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une permission (SUPER_ADMIN uniquement)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès réservé aux Super Administrateurs' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Vérifier que la permission existe
    const existing = await prisma.permission.findUnique({
      where: { id },
      include: {
        _count: { select: { userPermissions: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Permission non trouvée' }, { status: 404 });
    }

    // Avertir si des admins ont cette permission
    if (existing._count.userPermissions > 0) {
      // Option: désactiver au lieu de supprimer
      await prisma.permission.update({
        where: { id },
        data: { isActive: false },
      });

      return NextResponse.json({
        message: `Permission désactivée (utilisée par ${existing._count.userPermissions} admin(s))`,
        deactivated: true,
      });
    }

    // Supprimer la permission
    await prisma.permission.delete({ where: { id } });

    return NextResponse.json({
      message: 'Permission supprimée',
    });

  } catch (error) {
    console.error('Erreur DELETE permission:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
