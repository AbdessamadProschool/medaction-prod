import { z } from 'zod';
import { SECURITY_LIMITS, sanitizeString } from '@/lib/security/validation';

export const evenementSchema = z.object({
  titre: z.string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(100, 'Le titre ne doit pas dépasser 100 caractères')
    .transform(sanitizeString),
  description: z.string()
    .min(20, 'La description doit contenir au moins 20 caractères')
    .max(SECURITY_LIMITS.DESCRIPTION_MAX, `La description ne doit pas dépasser ${SECURITY_LIMITS.DESCRIPTION_MAX} caractères`)
    .transform(sanitizeString),
  etablissementId: z.number().int().positive('ID établissement invalide').max(SECURITY_LIMITS.ID_MAX),
  typeCategorique: z.string().min(1, "Le type d'événement est obligatoire").max(50),
  dateDebut: z.string().or(z.date()).transform(val => new Date(val)),
  dateFin: z.string().or(z.date()).transform(val => new Date(val)).optional().nullable(),
  heureDebut: z.string().max(20).optional().nullable(),
  heureFin: z.string().max(20).optional().nullable(),
  lieu: z.string().max(200).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  adresse: z.string().max(300).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  quartierDouar: z.string().max(200).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  tags: z.array(z.string().max(50)).optional().default([]),
  organisateur: z.string().max(100).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  contactOrganisateur: z.string().max(100).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  emailContact: z.string().email('Email contact invalide').or(z.literal('')).optional().nullable(),
  capaciteMax: z.number().int().positive().max(1000000).optional().nullable(),
  inscriptionsOuvertes: z.boolean().optional().default(false),
  lienInscription: z.string().url('Lien d\'inscription invalide').or(z.literal('')).optional().nullable(),
  isOrganiseParProvince: z.boolean().optional().default(false),
  sousCouvertProvince: z.boolean().optional().default(false),
  secteur: z.enum(['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE']).optional(),
  imagePrincipale: z.string().max(500).optional().nullable(),
});

export const actualiteSchema = z.object({
  titre: z.string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(100, 'Le titre ne doit pas dépasser 100 caractères')
    .transform(sanitizeString),
  contenu: z.string()
    .min(20, 'Le contenu doit contenir au moins 20 caractères')
    .transform(sanitizeString),
  resume: z.string().max(500).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  description: z.string().max(500).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  categorie: z.string().max(50).optional().nullable(),
  etablissementId: z.number().int().positive('ID établissement invalide').max(SECURITY_LIMITS.ID_MAX),
  isPublie: z.boolean().optional().default(false),
  imagePrincipale: z.string().max(500).optional().nullable(),
});

export const articleSchema = z.object({
  titre: z.string()
    .min(5, 'Le titre doit contenir au moins 5 caractères')
    .max(100, 'Le titre ne doit pas dépasser 100 caractères')
    .transform(sanitizeString),
  contenu: z.string()
    .min(20, 'Le contenu doit contenir au moins 20 caractères')
    .transform(sanitizeString),
  resume: z.string().max(500).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  description: z.string().max(500).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  categorie: z.string().max(50).optional().nullable(),
  tags: z.array(z.string().max(50)).optional().default([]),
  imagePrincipale: z.string().max(500).optional().nullable(),
  isPublie: z.boolean().optional().default(false),
});

export const campagneSchema = z.object({
  nom: z.string().min(2, 'Le nom est obligatoire').max(100).transform(sanitizeString),
  titre: z.string().min(5, 'Le titre doit contenir au moins 5 caractères').max(150).transform(sanitizeString),
  description: z.string().max(2000).transform(val => val ? sanitizeString(val) : undefined).optional().nullable(),
  contenu: z.string().min(20, 'Le contenu doit contenir au moins 20 caractères').transform(sanitizeString),
  type: z.string().min(1, 'Le type de campagne est obligatoire').max(100),
  objectifParticipations: z.number().int().positive().max(1000000).optional().nullable(),
  dateDebut: z.string().or(z.date()).transform(val => new Date(val)).optional().nullable(),
  dateFin: z.string().or(z.date()).transform(val => new Date(val)).optional().nullable(),
  couleurTheme: z.string().max(50).optional().nullable(),
  imagePrincipale: z.string().max(500).optional().nullable(),
  statut: z.string().max(50).optional().default('EN_ATTENTE'),
});
