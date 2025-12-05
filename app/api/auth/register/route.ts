import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';

/**
 * Schéma de validation pour l'inscription
 */
const registerSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .transform((email) => email.toLowerCase().trim()),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères').trim(),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères').trim(),
  telephone: z
    .string()
    .optional()
    .nullable()
    .transform((val) => val || null),
});

/**
 * POST /api/auth/register
 * Inscription d'un nouvel utilisateur avec rôle CITOYEN par défaut
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validation des données
    const validationResult = registerSchema.safeParse(body);
    
    if (!validationResult.success) {
      const errors = validationResult.error.flatten();
      return NextResponse.json(
        {
          success: false,
          message: 'Données invalides',
          errors: errors.fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, nom, prenom, telephone } = validationResult.data;

    // Vérifier si l'email existe déjà
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        {
          success: false,
          message: 'Cet email est déjà utilisé',
          errors: { email: ['Cet email est déjà associé à un compte'] },
        },
        { status: 409 }
      );
    }

    // Vérifier si le téléphone existe déjà (si fourni)
    if (telephone) {
      const existingUserByPhone = await prisma.user.findUnique({
        where: { telephone },
        select: { id: true },
      });

      if (existingUserByPhone) {
        return NextResponse.json(
          {
            success: false,
            message: 'Ce numéro de téléphone est déjà utilisé',
            errors: { telephone: ['Ce numéro est déjà associé à un compte'] },
          },
          { status: 409 }
        );
      }
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Créer l'utilisateur avec le rôle CITOYEN par défaut
    const newUser = await prisma.user.create({
      data: {
        email,
        motDePasse: hashedPassword,
        nom,
        prenom,
        telephone: telephone || null,
        role: 'CITOYEN', // Rôle par défaut
        isActive: true,
        isEmailVerifie: false, // Email non vérifié par défaut
        isTelephoneVerifie: false,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        createdAt: true,
      },
    });

    console.log(`[REGISTER] Nouvel utilisateur créé: ${newUser.email} (ID: ${newUser.id})`);

    return NextResponse.json(
      {
        success: true,
        message: 'Compte créé avec succès',
        data: {
          user: {
            id: newUser.id,
            email: newUser.email,
            nom: newUser.nom,
            prenom: newUser.prenom,
            role: newUser.role,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[REGISTER] Erreur:', error);

    return NextResponse.json(
      {
        success: false,
        message: 'Une erreur est survenue lors de l\'inscription',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/auth/register
 * Retourne un message d'erreur (méthode non autorisée)
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      message: 'Méthode non autorisée. Utilisez POST pour l\'inscription.',
    },
    { status: 405 }
  );
}
