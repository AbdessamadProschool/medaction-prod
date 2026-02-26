import { z } from 'zod';
import { SECURITY_LIMITS, sanitizeString } from '@/lib/security/validation';

// Schéma de validation sécurisé pour la réclamation (OWASP compliant)
export const reclamationSchema = z.object({
  // Section 1: Localisation - SECURITY FIX: Add positive() validation
  communeId: z.number({ message: 'Veuillez sélectionner une commune' }).int().positive('ID commune invalide').max(SECURITY_LIMITS.ID_MAX),
  quartierDouar: z.string().max(200).transform(val => val ? sanitizeString(val) : undefined).optional(),
  adresseComplete: z.string().max(500).transform(val => val ? sanitizeString(val) : undefined).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  
  // Section 2: Détails - SECURITY FIX: Add positive() and proper limits
  etablissementId: z.number().int().positive('ID établissement invalide').max(SECURITY_LIMITS.ID_MAX).optional(),
  categorie: z.string().min(1, 'Veuillez sélectionner une catégorie').max(50),
  titre: z.string()
    .min(SECURITY_LIMITS.TITLE_MIN, `Le titre doit contenir au moins ${SECURITY_LIMITS.TITLE_MIN} caractères`)
    .max(SECURITY_LIMITS.TITLE_MAX, `Le titre ne doit pas dépasser ${SECURITY_LIMITS.TITLE_MAX} caractères`)
    .transform(sanitizeString),
  description: z.string()
    .min(20, 'La description doit contenir au moins 20 caractères')
    .max(SECURITY_LIMITS.DESCRIPTION_MAX, `La description ne doit pas dépasser ${SECURITY_LIMITS.DESCRIPTION_MAX} caractères`)
    .transform(sanitizeString),
});

export type ReclamationFormData = z.infer<typeof reclamationSchema>;

// Catégories de réclamation
export const categories = [
  { id: 'infrastructure', label: 'Infrastructure & Voirie', icon: '🛣️' },
  { id: 'proprete', label: 'Propreté & Environnement', icon: '🗑️' },
  { id: 'eclairage', label: 'Éclairage Public', icon: '💡' },
  { id: 'eau', label: 'Eau & Assainissement', icon: '💧' },
  { id: 'securite', label: 'Sécurité', icon: '🛡️' },
  { id: 'education', label: 'Éducation', icon: '🎓' },
  { id: 'sante', label: 'Santé', icon: '🏥' },
  { id: 'sport', label: 'Sport & Loisirs', icon: '⚽' },
  { id: 'social', label: 'Services Sociaux', icon: '🤝' },
  { id: 'autre', label: 'Autre', icon: '📋' },
];
