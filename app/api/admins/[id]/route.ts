import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError, AppError } from '@/lib/exceptions';

const updateAdminSchema = z.object({
  nom: z.string().min(2).optional(),
  prenom: z.string().min(2).optional(),
  email: z.string().email().optional(),
  telephone: z.string().optional().nullable(),
  password: z.string().min(8).optional(), // Si fourni, réinitialise le mot de passe
  isActive: z.boolean().optional(),
});

// GET /api/admins/[id] - Récupérer un admin spécifique
export const GET = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès non autorisé');
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    throw new ValidationError('ID invalide');
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
    throw new NotFoundError('Administrateur non trouvé');
  }

  if (admin.role !== 'ADMIN' && admin.role !== 'SUPER_ADMIN') {
    throw new ValidationError('Cet utilisateur n\'est pas un administrateur');
  }

  return successResponse(admin);
});

// PUT /api/admins/[id] - Mettre à jour un admin
export const PUT = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès non autorisé');
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    throw new ValidationError('ID invalide');
  }

    // Protection contre l'auto-modification via cette API (le profil a sa propre API)
    // Mais un Super Admin peut vouloir se modifier, donc on permet, mais avec prudence sur le rôle
    
  const body = await request.json();
  const validation = updateAdminSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError(validation.error.issues[0].message);
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
      throw new ValidationError('Vous ne pouvez pas désactiver votre propre compte');
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
      throw new ValidationError('Cet email est déjà utilisé');
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

  return successResponse({ 
    admin: updatedAdmin 
  }, 'Administrateur mis à jour avec succès');
});

// DELETE /api/admins/[id] - Supprimer un admin
export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const session = await getServerSession(authOptions);
  if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès non autorisé');
  }

  const id = parseInt(params.id);
  if (isNaN(id)) {
    throw new ValidationError('ID invalide');
  }

  // Protection contre l'auto-suppression
  if (id === parseInt(session.user.id)) {
    throw new ValidationError('Vous ne pouvez pas supprimer votre propre compte');
  }

  try {
    // Vérifier s'il a des activités critiques (optionnel, sinon le FK constraint échouera)
    // On tente la suppression
    await prisma.user.delete({
      where: { id },
    });

    return successResponse(null, 'Administrateur supprimé avec succès');
  } catch (error: any) {
    console.error('Erreur DELETE admin:', error);
    
    // Gestion des contraintes de clé étrangère
    if (error.code === 'P2003') {
      throw new AppError('Impossible de supprimer cet administrateur car il est lié à d\'autres données (logs, actions, etc.). Veuillez plutôt le désactiver.', 'CONFLICT', 409);
    }

    if (error.code === 'P2025') {
      throw new NotFoundError('Administrateur introuvable');
    }

    throw error;
  }
});