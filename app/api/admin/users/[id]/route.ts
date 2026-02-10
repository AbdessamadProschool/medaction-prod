import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';

const updateUserSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.enum(['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR']).optional(),
  password: z.string().min(8).optional(),
  isActive: z.boolean().optional(),
  telephone: z.string().optional().nullable(),
  secteurResponsable: z.any().optional(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        telephone: true,
        photo: true,
        isActive: true,
        secteurResponsable: true,
        dateInscription: true,
        derniereConnexion: true,
        loginAttempts: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json(user);
  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Action réservée aux Super Admins' }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    
    const validation = updateUserSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const data = validation.data;
    const updateData: any = { ...data };

    // Gestion du mot de passe
    if (data.password) {
      updateData.motDePasse = await hashPassword(data.password);
      delete updateData.password;
    } else {
      delete updateData.password;
    }

    // Protection contre l'auto-dégradation
    if (id === parseInt(session.user.id) && data.role && data.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Vous ne pouvez pas modifier votre propre rôle' }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
      },
    });

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error('Erreur PUT user:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Action réservée aux Super Admins' }, { status: 403 });
    }

    const id = parseInt(params.id);

    // Protection contre l'auto-suppression
    if (id === parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Utilisateur supprimé' });
  } catch (error) {
    // Si échec (clés étrangères), proposer désactivation
    console.error('Erreur DELETE user:', error);
    return NextResponse.json({ 
      error: 'Impossible de supprimer cet utilisateur (données liées). Essayez de le désactiver.' 
    }, { status: 400 });
  }
}
