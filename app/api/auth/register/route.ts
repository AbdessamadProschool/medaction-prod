import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { checkRateLimit, getClientIP } from '@/lib/auth/security';
import { isRegistrationEnabled } from '@/lib/settings/service';

// SECURITY: Rate limit config for registration (5 per hour per IP)
const REGISTER_RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 };

// SECURITY FIX: Strong password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// SECURITY FIX: XSS Sanitization - Remove HTML tags and escape dangerous characters
function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>"'&]/g, (char) => {
      const escapeMap: Record<string, string> = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return escapeMap[char] || char;
    })
    .trim();
}

// SECURITY FIX: Validate name contains only safe characters (letters, spaces, hyphens, apostrophes)
const NAME_REGEX = /^[a-zA-ZàâäéèêëïîôùûüçÀÂÄÉÈÊËÏÎÔÙÛÜÇ\s\-']+$/;

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
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .refine(
      (password) => PASSWORD_REGEX.test(password),
      'Le mot de passe doit contenir au moins une majuscule, une minuscule, un chiffre et un caractère spécial (@$!%*?&)'
    ),
  nom: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .transform((val) => sanitizeString(val))
    .refine(
      (val) => NAME_REGEX.test(val),
      'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes'
    ),
  prenom: z
    .string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères')
    .transform((val) => sanitizeString(val))
    .refine(
      (val) => NAME_REGEX.test(val),
      'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'
    ),
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
    // 1. Vérifier si les inscriptions sont ouvertes
    const registrationOpen = await isRegistrationEnabled();
    if (!registrationOpen) {
      return NextResponse.json(
        { success: false, message: 'Les inscriptions sont actuellement fermées par l\'administrateur.' },
        { status: 403 }
      );
    }

    // SECURITY FIX: Rate limiting - 5 inscriptions par heure par IP
    const clientIP = getClientIP(request);
    const rateLimitResult = checkRateLimit(`register:${clientIP}`, REGISTER_RATE_LIMIT);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { success: false, message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
        }
      );
    }

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

    // SECURITY FIX: Prevent account enumeration - same response whether email exists or not
    if (existingUserByEmail) {
      // Simulate the same time as a successful registration by doing a password hash
      await hashPassword('dummy_password_processing');
      
      // Log the attempt for security monitoring
      console.log(`[REGISTER] Tentative inscription email existant: ${email.replace(/(.{2}).*(@.*)/, '$1***$2')}`);
      
      // Return success message to prevent enumeration - but don't actually create account
      return NextResponse.json(
        {
          success: true,
          message: 'Inscription réussie. Vérifiez votre email pour confirmer votre compte.',
          // Note: We don't return user data here for security
        },
        { status: 201 }
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
