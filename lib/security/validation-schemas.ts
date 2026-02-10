/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          SCHÉMAS DE VALIDATION ZOD - SÉCURITÉ                               ║
 * ║                    Portail Mediouna Action                                   ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 * 
 * Schémas de validation stricts pour toutes les entrées utilisateur.
 * Utilise Zod pour une validation type-safe.
 */

import { z } from 'zod';

// ============================================
// 🔐 VALIDATION MOT DE PASSE
// ============================================

/**
 * Schéma de mot de passe sécurisé
 * Exigences:
 * - Minimum 8 caractères
 * - Au moins une majuscule
 * - Au moins une minuscule
 * - Au moins un chiffre
 * - Au moins un caractère spécial
 */
export const passwordSchema = z
  .string()
  .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
  .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères')
  .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
  .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
  .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
  .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial (!@#$%^&*)');

/**
 * Validation de la force du mot de passe (0-4)
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;
  
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  
  const strengths = [
    { label: 'Très faible', color: 'red' },
    { label: 'Faible', color: 'orange' },
    { label: 'Moyen', color: 'yellow' },
    { label: 'Fort', color: 'lime' },
    { label: 'Très fort', color: 'green' },
  ];
  
  return {
    score: Math.min(score, 4),
    ...strengths[Math.min(score, 4)],
  };
}

// ============================================
// 📧 VALIDATION EMAIL
// ============================================

export const emailSchema = z
  .string()
  .email('Adresse email invalide')
  .min(5, 'Email trop court')
  .max(255, 'Email trop long')
  .transform(email => email.toLowerCase().trim());

// ============================================
// 👤 VALIDATION UTILISATEUR
// ============================================

export const userNameSchema = z
  .string()
  .min(2, 'Le nom doit contenir au moins 2 caractères')
  .max(50, 'Le nom ne peut pas dépasser 50 caractères')
  .regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Le nom contient des caractères invalides');

export const phoneSchema = z
  .string()
  .regex(/^(\+212|0)[5-7]\d{8}$/, 'Numéro de téléphone marocain invalide')
  .optional()
  .or(z.literal(''));

export const cinSchema = z
  .string()
  .regex(/^[A-Z]{1,2}\d{5,6}$/, 'CIN invalide (format: AB123456)')
  .optional()
  .or(z.literal(''));

// ============================================
// 📝 VALIDATION TEXTE SÉCURISÉ
// ============================================

/**
 * Nettoie le texte des caractères dangereux (XSS)
 */
export const sanitizedTextSchema = z
  .string()
  .transform(text => {
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  });

/**
 * Titre (pour réclamations, événements, etc.)
 */
export const titleSchema = z
  .string()
  .min(5, 'Le titre doit contenir au moins 5 caractères')
  .max(200, 'Le titre ne peut pas dépasser 200 caractères')
  .refine(
    val => !/<script|javascript:|on\w+=/i.test(val),
    'Le titre contient des caractères non autorisés'
  );

/**
 * Description longue
 */
export const descriptionSchema = z
  .string()
  .min(10, 'La description doit contenir au moins 10 caractères')
  .max(5000, 'La description ne peut pas dépasser 5000 caractères')
  .refine(
    val => !/<script|javascript:|on\w+=/i.test(val),
    'La description contient des caractères non autorisés'
  );

// ============================================
// 🆔 VALIDATION IDs
// ============================================

export const idSchema = z
  .number()
  .int('ID invalide')
  .positive('ID doit être positif');

export const idStringSchema = z
  .string()
  .regex(/^\d+$/, 'ID invalide')
  .transform(val => parseInt(val, 10));

// ============================================
// 📅 VALIDATION DATES
// ============================================

export const futureDateSchema = z
  .string()
  .refine(
    val => new Date(val) > new Date(),
    'La date doit être dans le futur'
  );

export const pastDateSchema = z
  .string()
  .refine(
    val => new Date(val) < new Date(),
    'La date doit être dans le passé'
  );

// ============================================
// 🔗 VALIDATION URL
// ============================================

export const urlSchema = z
  .string()
  .url('URL invalide')
  .refine(
    url => url.startsWith('https://') || url.startsWith('http://localhost'),
    'Les URLs doivent utiliser HTTPS'
  );

// ============================================
// 📦 SCHÉMAS COMPOSÉS
// ============================================

/**
 * Schéma complet pour inscription
 */
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  nom: userNameSchema,
  prenom: userNameSchema,
  telephone: phoneSchema,
}).refine(
  data => data.password === data.confirmPassword,
  {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  }
);

/**
 * Schéma pour connexion
 */
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis'),
  captchaToken: z.string().optional(),
});

/**
 * Schéma pour changement de mot de passe
 */
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine(
  data => data.newPassword === data.confirmPassword,
  {
    message: 'Les nouveaux mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  }
).refine(
  data => data.currentPassword !== data.newPassword,
  {
    message: 'Le nouveau mot de passe doit être différent de l\'ancien',
    path: ['newPassword'],
  }
);

/**
 * Schéma pour réclamation
 */
export const reclamationSchema = z.object({
  titre: titleSchema,
  description: descriptionSchema,
  categorie: z.enum([
    'INFRASTRUCTURE',
    'PROPRETE',
    'SECURITE',
    'ECLAIRAGE',
    'ENVIRONNEMENT',
    'AUTRE',
  ]),
  communeId: idSchema,
  etablissementId: idSchema.optional(),
  quartierDouar: z.string().max(100).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

// ============================================
// 🛡️ HELPERS
// ============================================

/**
 * Valide et retourne les données ou lance une erreur formatée
 */
export function validateOrThrow<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    const errors = result.error.issues.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    
    throw new ValidationError('Données invalides', errors);
  }
  
  return result.data;
}

/**
 * Erreur de validation personnalisée
 */
export class ValidationError extends Error {
  public errors: Array<{ field: string; message: string }>;
  
  constructor(message: string, errors: Array<{ field: string; message: string }>) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export default {
  passwordSchema,
  emailSchema,
  userNameSchema,
  titleSchema,
  descriptionSchema,
  registerSchema,
  loginSchema,
  changePasswordSchema,
  reclamationSchema,
  validateOrThrow,
  getPasswordStrength,
};
