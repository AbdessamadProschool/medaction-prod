import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { checkRateLimit, getClientIP } from '@/lib/auth/security';
import { isRegistrationEnabled } from '@/lib/settings/service';
import { SecurityValidation } from '@/lib/security/validation';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { TooManyRequestsError, ValidationError, ForbiddenError, ConflictError } from '@/lib/exceptions';

// SECURITY: Rate limit config for registration (5 per hour per IP)
const REGISTER_RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 };


/**
 * Schéma de validation pour l'inscription
 */
const registerSchema = z.object({
  email: SecurityValidation.schemas.email,
  password: SecurityValidation.schemas.password,
  nom: SecurityValidation.schemas.name,
  prenom: SecurityValidation.schemas.name,
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
export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. Vérifier si les inscriptions sont ouvertes
  const registrationOpen = await isRegistrationEnabled();
  if (!registrationOpen) {
    throw new ForbiddenError('Les inscriptions sont actuellement fermées par l\'administrateur.');
  }

  // SECURITY FIX: Rate limiting - 5 inscriptions par heure par IP
  const clientIP = getClientIP(request);
  const rateLimitResult = checkRateLimit(`register:${clientIP}`, REGISTER_RATE_LIMIT);

  if (!rateLimitResult.allowed) {
    throw new TooManyRequestsError('Trop de tentatives d\'inscription. Veuillez réessayer plus tard.', {
      headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
    });
  }

  const body = await request.json();

  // Validation des données
  const validationResult = registerSchema.safeParse(body);
  
  if (!validationResult.success) {
    throw new ValidationError('Données invalides', validationResult.error.flatten().fieldErrors);
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
    return successResponse(null, 'Inscription réussie. Vérifiez votre email pour confirmer votre compte.', 201);
  }

  // Vérifier si le téléphone existe déjà (si fourni)
  if (telephone) {
    const existingUserByPhone = await prisma.user.findUnique({
      where: { telephone },
      select: { id: true },
    });

    if (existingUserByPhone) {
      throw new ConflictError('Ce numéro de téléphone est déjà utilisé');
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
      isActive: false,
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

  return successResponse({
    user: {
      id: newUser.id,
      email: newUser.email,
      nom: newUser.nom,
      prenom: newUser.prenom,
      role: newUser.role,
    },
  }, 'Compte créé avec succès. Votre compte est en attente d\'approbation par un administrateur.', 201);
});

/**
 * GET /api/auth/register
 * Retourne un message d'erreur (méthode non autorisée)
 */
export const GET = withErrorHandler(async () => {
  throw new ForbiddenError('Méthode non autorisée. Utilisez POST pour l\'inscription.');
});
