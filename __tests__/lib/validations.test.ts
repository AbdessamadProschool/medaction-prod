/**
 * Tests d'intégration des validations
 */

import { z } from 'zod';

// Schémas de validation directement testés
const emailSchema = z.string().email('Email invalide');

const passwordSchema = z
  .string()
  .min(8, 'Minimum 8 caractères')
  .regex(/[A-Z]/, 'Une majuscule requise')
  .regex(/[a-z]/, 'Une minuscule requise')
  .regex(/[0-9]/, 'Un chiffre requis');

const phoneSchema = z
  .string()
  .regex(/^(\+212|0)[5-7]\d{8}$/, 'Format marocain invalide')
  .optional();

const reclamationSchema = z.object({
  titre: z.string().min(10, 'Minimum 10 caractères'),
  description: z.string().min(20, 'Minimum 20 caractères'),
  categorie: z.enum(['INFRASTRUCTURE', 'HYGIENE', 'SECURITE', 'SERVICE', 'AUTRE']),
  communeId: z.number().int().positive(),
  etablissementId: z.number().int().positive().optional(),
  quartierDouar: z.string().optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

const etablissementFilterSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  secteur: z.string().optional(),
  communeId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  noteMin: z.coerce.number().min(0).max(5).optional(),
  sortBy: z.enum(['nom', 'noteMoyenne', 'nombreEvaluations']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

describe('Validation Schemas Tests', () => {
  // ============================================
  // EMAIL VALIDATION
  // ============================================

  describe('Email Schema', () => {
    it('should accept valid email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid');
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = emailSchema.safeParse('test@');
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // PASSWORD VALIDATION
  // ============================================

  describe('Password Schema', () => {
    it('should accept strong password', () => {
      const result = passwordSchema.safeParse('Password123');
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = passwordSchema.safeParse('Pass1');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('8');
      }
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('password123');
      expect(result.success).toBe(false);
    });

    it('should reject password without lowercase', () => {
      const result = passwordSchema.safeParse('PASSWORD123');
      expect(result.success).toBe(false);
    });

    it('should reject password without number', () => {
      const result = passwordSchema.safeParse('PasswordABC');
      expect(result.success).toBe(false);
    });
  });

  // ============================================
  // PHONE VALIDATION
  // ============================================

  describe('Phone Schema', () => {
    it('should accept valid Moroccan phone with +212', () => {
      const result = phoneSchema.safeParse('+212612345678');
      expect(result.success).toBe(true);
    });

    it('should accept valid Moroccan phone with 0', () => {
      const result = phoneSchema.safeParse('0612345678');
      expect(result.success).toBe(true);
    });

    it('should reject invalid phone format', () => {
      const result = phoneSchema.safeParse('123456');
      expect(result.success).toBe(false);
    });

    it('should accept undefined (optional)', () => {
      const result = phoneSchema.safeParse(undefined);
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // RECLAMATION VALIDATION
  // ============================================

  describe('Reclamation Schema', () => {
    const validReclamation = {
      titre: 'Problème avec les lampadaires du quartier',
      description: 'Les lampadaires de notre quartier ne fonctionnent plus depuis 2 semaines',
      categorie: 'INFRASTRUCTURE',
      communeId: 1,
    };

    it('should accept valid reclamation', () => {
      const result = reclamationSchema.safeParse(validReclamation);
      expect(result.success).toBe(true);
    });

    it('should reject short titre', () => {
      const result = reclamationSchema.safeParse({ ...validReclamation, titre: 'Short' });
      expect(result.success).toBe(false);
    });

    it('should reject short description', () => {
      const result = reclamationSchema.safeParse({ ...validReclamation, description: 'Too short' });
      expect(result.success).toBe(false);
    });

    it('should reject invalid categorie', () => {
      const result = reclamationSchema.safeParse({ ...validReclamation, categorie: 'INVALID' });
      expect(result.success).toBe(false);
    });

    it('should accept reclamation with optional fields', () => {
      const result = reclamationSchema.safeParse({
        ...validReclamation,
        etablissementId: 5,
        quartierDouar: 'Hay Mohammadi',
        latitude: 33.5,
        longitude: -7.6,
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // ETABLISSEMENT FILTER VALIDATION
  // ============================================

  describe('Etablissement Filter Schema', () => {
    it('should use default values', () => {
      const result = etablissementFilterSchema.safeParse({});
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(10);
        expect(result.data.sortOrder).toBe('desc');
      }
    });

    it('should accept valid filters', () => {
      const result = etablissementFilterSchema.safeParse({
        page: 2,
        limit: 20,
        secteur: 'EDUCATION',
        communeId: 1,
        search: 'école',
        noteMin: 3.5,
        sortBy: 'noteMoyenne',
        sortOrder: 'desc',
      });
      expect(result.success).toBe(true);
    });

    it('should coerce string numbers', () => {
      const result = etablissementFilterSchema.safeParse({
        page: '3',
        limit: '15',
        communeId: '5',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(3);
        expect(result.data.limit).toBe(15);
        expect(result.data.communeId).toBe(5);
      }
    });

    it('should reject limit above max', () => {
      const result = etablissementFilterSchema.safeParse({ limit: 500 });
      expect(result.success).toBe(false);
    });

    it('should reject invalid sortBy', () => {
      const result = etablissementFilterSchema.safeParse({ sortBy: 'invalid' });
      expect(result.success).toBe(false);
    });

    it('should reject noteMin above 5', () => {
      const result = etablissementFilterSchema.safeParse({ noteMin: 6 });
      expect(result.success).toBe(false);
    });
  });
});
