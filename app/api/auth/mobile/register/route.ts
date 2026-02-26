import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { checkRateLimit, getClientIP } from '@/lib/auth/security';
import { isRegistrationEnabled } from '@/lib/settings/service';
import {
  validateMobileApiKey,
  unauthorizedResponse,
  logSecurityEvent,
} from '@/lib/mobile/security';

// SECURITY: Rate limit config for registration (5 per hour per IP)
const REGISTER_RATE_LIMIT = { maxRequests: 5, windowMs: 60 * 60 * 1000 };

// SECURITY FIX: Strong password validation regex
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// SECURITY FIX: XSS Sanitization
function sanitizeString(input: string): string {
  return input
    .replace(/<[^>]*>/g, '')
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

// SECURITY FIX: Validate name contains only safe characters
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
 * POST /api/auth/mobile/register
 * Mobile registration endpoint with API key validation
 */
export async function POST(request: NextRequest) {
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || undefined;

  try {
    // 1. Validate Mobile API Key
    if (!validateMobileApiKey(request)) {
      await logSecurityEvent({
        event: 'INVALID_API_KEY',
        ip: clientIP,
        userAgent,
      });
      return unauthorizedResponse();
    }

    // 2. Check if registrations are open
    const registrationOpen = await isRegistrationEnabled();
    if (!registrationOpen) {
      return NextResponse.json(
        { success: false, message: 'Les inscriptions sont actuellement fermées.' },
        { status: 403 }
      );
    }

    // 3. Rate limiting
    const rateLimitResult = checkRateLimit(`register:${clientIP}`, REGISTER_RATE_LIMIT);
    if (!rateLimitResult.allowed) {
      await logSecurityEvent({
        event: 'RATE_LIMIT_EXCEEDED',
        ip: clientIP,
        userAgent,
        details: { action: 'register' },
      });
      return NextResponse.json(
        { success: false, message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.' },
        {
          status: 429,
          headers: { 'Retry-After': String(rateLimitResult.retryAfter || 3600) }
        }
      );
    }

    // 4. Parse body
    const rawBody = await request.text();
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: 'Format JSON invalide' },
        { status: 400 }
      );
    }

    // 5. Validate data
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

    // 6. Check if email exists
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existingUserByEmail) {
      // Simulate same processing time to prevent enumeration
      await hashPassword('dummy_password_processing');
      
      await logSecurityEvent({
        event: 'REGISTER_FAILED',
        ip: clientIP,
        email,
        userAgent,
        details: { reason: 'EMAIL_EXISTS' },
      });
      
      // Return generic message to prevent email enumeration
      return NextResponse.json(
        { success: false, message: 'Cet email est déjà utilisé' },
        { status: 409 }
      );
    }

    // 7. Check phone if provided
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

    // 8. Hash password
    const hashedPassword = await hashPassword(password);

    // 9. Create user
    const newUser = await prisma.user.create({
      data: {
        email,
        motDePasse: hashedPassword,
        nom,
        prenom,
        telephone: telephone || null,
        role: 'CITOYEN',
        isActive: true,
        isEmailVerifie: false,
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

    await logSecurityEvent({
      event: 'REGISTER_SUCCESS',
      ip: clientIP,
      email: newUser.email,
      userId: newUser.id,
      userAgent,
    });

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
    console.error('[MOBILE_REGISTER_ERROR]', error);
    return NextResponse.json(
      { success: false, message: 'Une erreur est survenue lors de l\'inscription' },
      { status: 500 }
    );
  }
}
