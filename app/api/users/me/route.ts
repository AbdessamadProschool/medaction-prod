import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

/**
 * Schéma de validation pour la mise à jour du profil
 */
const updateProfileSchema = z.object({
  nom: z.string().min(2).max(50).optional(),
  prenom: z.string().min(2).max(50).optional(),
  telephone: z
    .string()
    .regex(/^(\+212|0)[5-7]\d{8}$/, 'Numéro de téléphone marocain invalide')
    .nullable()
    .optional(),
});

/**
 * GET /api/users/me
 * Récupère les informations du profil de l'utilisateur connecté
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: parseInt(session.user.id) },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        photo: true,
        role: true,
        isActive: true,
        isEmailVerifie: true,
        isTelephoneVerifie: true,
        secteurResponsable: true,
        communeResponsableId: true,
        etablissementsGeres: true,
        dateInscription: true,
        derniereConnexion: true,
        createdAt: true,
        updatedAt: true,
        // Relations optionnelles
        communeResponsable: {
          select: {
            id: true,
            nom: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Utilisateur non trouvé' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('[GET /api/users/me] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/users/me
 * Met à jour les informations du profil de l'utilisateur connecté
 */
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validation = updateProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Données invalides',
          errors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { nom, prenom, telephone } = validation.data;

    // Vérifier si le téléphone est déjà utilisé
    if (telephone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          telephone,
          id: { not: parseInt(session.user.id) },
        },
      });

      if (existingPhone) {
        return NextResponse.json(
          { success: false, message: 'Ce numéro de téléphone est déjà utilisé' },
          { status: 409 }
        );
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: {
        ...(nom && { nom }),
        ...(prenom && { prenom }),
        ...(telephone !== undefined && { telephone }),
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        telephone: true,
        photo: true,
        role: true,
        updatedAt: true,
      },
    });

    console.log(`[PATCH /api/users/me] Profil mis à jour pour: ${updatedUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Profil mis à jour avec succès',
      data: updatedUser,
    });
  } catch (error) {
    console.error('[PATCH /api/users/me] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
