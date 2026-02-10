import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';

const updateAdminSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telephone: z.string().optional().nullable(),
  password: z.string().min(8).optional(), // Si fourni, réinitialise le mot de passe
  isActive: z.boolean().optional(),
});

// GET /api/admins/[id] - Récupérer un admin spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const admin = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        telephone: true,
        nom: true,
        prenom: true,
        photo: true,
        role: true,
        isActive: true,
        derniereConnexion: true,
        createdAt: true,
        // Ne pas retourner le mot de passe
      },
    });

    if (!admin) {
      return NextResponse.json({ error: 'Administrateur non trouvé' }, { status: 404 });
    }

    if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Cet utilisateur n\'est pas un administrateur' }, { status: 400 });
    }

    return NextResponse.json(admin);
  } catch (error) {
    console.error('Erreur GET admin:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT /api/admins/[id] - Mettre à jour un admin
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Protection contre l'auto-modification via cette API (le profil a sa propre API)
    // Mais un Super Admin peut vouloir se modifier, donc on permet, mais avec prudence sur le rôle
    
    const body = await request.json();
    const validation = updateAdminSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ error: validation.error.issues[0].message }, { status: 400 });
    }

    const data = validation.data;
    const updateData: any = {};

    if (data.nom) updateData.nom = data.nom;
    if (data.prenom) updateData.prenom = data.prenom;
    if (data.email) updateData.email = data.email.toLowerCase();
    if (data.telephone !== undefined) updateData.telephone = data.telephone;
    if (data.isActive !== undefined) {
      // Protection: un Super Admin ne peut pas se désactiver lui-même
      if (id === parseInt(session.user.id) && data.isActive === false) {
        return NextResponse.json({ error: 'Vous ne pouvez pas désactiver votre propre compte' }, { status: 400 });
      }
      updateData.isActive = data.isActive;
    }

    if (data.password) {
      updateData.motDePasse = await hashPassword(data.password);
    }

    // Vérifier l'unicité de l'email si changé
    if (data.email) {
      const existingUser = await prisma.user.findFirst({
        where: { 
          email: data.email,
          NOT: { id }
        }
      });
      if (existingUser) {
        return NextResponse.json({ error: 'Cet email est déjà utilisé' }, { status: 400 });
      }
    }

    const updatedAdmin = await prisma.user.update({
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

    return NextResponse.json({ 
      message: 'Administrateur mis à jour avec succès',
      admin: updatedAdmin 
    });

  } catch (error) {
    console.error('Erreur PUT admin:', error);
    return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
  }
}

// DELETE /api/admins/[id] - Supprimer un admin
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Protection contre l'auto-suppression
    if (id === parseInt(session.user.id)) {
      return NextResponse.json({ error: 'Vous ne pouvez pas supprimer votre propre compte' }, { status: 400 });
    }

    // Vérifier s'il a des activités critiques (optionnel, sinon le FK constraint échouera)
    // On tente la suppression
    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Administrateur supprimé avec succès' });

  } catch (error: any) {
    console.error('Erreur DELETE admin:', error);
    
    // Gestion des contraintes de clé étrangère
    if (error.code === 'P2003') {
      return NextResponse.json({ 
        error: 'Impossible de supprimer cet administrateur car il est lié à d\'autres données (logs, actions, etc.). Veuillez plutôt le désactiver.' 
      }, { status: 409 });
    }

    if (error.code === 'P2025') {
      return NextResponse.json({ error: 'Administrateur introuvable' }, { status: 404 });
    }

    return NextResponse.json({ error: 'Erreur serveur lors de la suppression' }, { status: 500 });
  }
}
