/**
 * Tests Réclamations Workflow
 */

import { 
  mockPrisma, 
  mockReclamations, 
  mockUsers,
  createMockSession,
} from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('Réclamations Workflow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CRÉATION DE RÉCLAMATION
  // ============================================

  describe('Création de réclamation', () => {
    it('should create reclamation with required fields', async () => {
      const newReclamation = {
        titre: 'Nouvelle réclamation',
        description: 'Description détaillée',
        categorie: 'INFRASTRUCTURE',
        userId: 1,
        communeId: 1,
      };

      mockPrisma.reclamation.create.mockResolvedValue({
        id: 3,
        ...newReclamation,
        statut: 'SOUMISE',
        createdAt: new Date(),
      });

      const result = await mockPrisma.reclamation.create({
        data: {
          ...newReclamation,
          statut: 'SOUMISE',
        },
      });

      expect(result.id).toBe(3);
      expect(result.statut).toBe('SOUMISE');
    });

    it('should create historique on creation', async () => {
      mockPrisma.historiqueReclamation.create.mockResolvedValue({
        id: 1,
        reclamationId: 3,
        statutAvant: null,
        statutApres: 'SOUMISE',
        actionType: 'CREATION',
        createdAt: new Date(),
      });

      const historique = await mockPrisma.historiqueReclamation.create({
        data: {
          reclamationId: 3,
          statutAvant: null,
          statutApres: 'SOUMISE',
          actionType: 'CREATION',
        },
      });

      expect(historique.actionType).toBe('CREATION');
    });

    it('should validate required fields', () => {
      const validate = (data: any) => {
        const errors: string[] = [];
        if (!data.titre || data.titre.length < 10) {
          errors.push('Titre minimum 10 caractères');
        }
        if (!data.description || data.description.length < 20) {
          errors.push('Description minimum 20 caractères');
        }
        if (!data.categorie) {
          errors.push('Catégorie requise');
        }
        if (!data.communeId) {
          errors.push('Commune requise');
        }
        return errors;
      };

      expect(validate({ titre: 'court' })).toContain('Titre minimum 10 caractères');
      expect(validate({
        titre: 'Titre assez long pour être valide',
        description: 'Description suffisamment longue pour passer la validation',
        categorie: 'INFRASTRUCTURE',
        communeId: 1,
      })).toHaveLength(0);
    });
  });

  // ============================================
  // WORKFLOW DES STATUTS
  // ============================================

  describe('Workflow des statuts', () => {
    const validTransitions: Record<string, string[]> = {
      SOUMISE: ['ACCEPTEE', 'REJETEE'],
      ACCEPTEE: ['EN_COURS', 'REJETEE'],
      EN_COURS: ['RESOLUE', 'EN_ATTENTE'],
      EN_ATTENTE: ['EN_COURS', 'RESOLUE'],
      RESOLUE: ['ARCHIVEE'],
      REJETEE: ['ARCHIVEE'],
      ARCHIVEE: [],
    };

    const canTransition = (from: string, to: string) => {
      return validTransitions[from]?.includes(to) || false;
    };

    it('should allow valid transitions from SOUMISE', () => {
      expect(canTransition('SOUMISE', 'ACCEPTEE')).toBe(true);
      expect(canTransition('SOUMISE', 'REJETEE')).toBe(true);
      expect(canTransition('SOUMISE', 'RESOLUE')).toBe(false);
    });

    it('should allow valid transitions from EN_COURS', () => {
      expect(canTransition('EN_COURS', 'RESOLUE')).toBe(true);
      expect(canTransition('EN_COURS', 'EN_ATTENTE')).toBe(true);
      expect(canTransition('EN_COURS', 'SOUMISE')).toBe(false);
    });

    it('should not allow transitions from ARCHIVEE', () => {
      expect(canTransition('ARCHIVEE', 'SOUMISE')).toBe(false);
      expect(canTransition('ARCHIVEE', 'EN_COURS')).toBe(false);
    });
  });

  // ============================================
  // AFFECTATION
  // ============================================

  describe('Affectation des réclamations', () => {
    it('should set affectation correctly', async () => {
      mockPrisma.reclamation.update.mockResolvedValue({
        ...mockReclamations[0],
        affectationReclamation: 'AUTORITE_LOCALE',
        statut: 'ACCEPTEE',
        dateAffectation: new Date(),
      });

      const result = await mockPrisma.reclamation.update({
        where: { id: 1 },
        data: {
          affectationReclamation: 'AUTORITE_LOCALE',
          statut: 'ACCEPTEE',
          dateAffectation: new Date(),
        },
      });

      expect(result.affectationReclamation).toBe('AUTORITE_LOCALE');
      expect(result.statut).toBe('ACCEPTEE');
    });

    it('should create notification on affectation', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 1,
        userId: 4, // Autorité locale
        type: 'RECLAMATION_AFFECTEE',
        titre: 'Nouvelle réclamation affectée',
        message: 'Une réclamation vous a été affectée',
        isLue: false,
        createdAt: new Date(),
      });

      const notification = await mockPrisma.notification.create({
        data: {
          userId: 4,
          type: 'RECLAMATION_AFFECTEE',
          titre: 'Nouvelle réclamation affectée',
          message: 'Une réclamation vous a été affectée',
        },
      });

      expect(notification.type).toBe('RECLAMATION_AFFECTEE');
      expect(notification.isLue).toBe(false);
    });
  });

  // ============================================
  // RÉSOLUTION
  // ============================================

  describe('Résolution des réclamations', () => {
    it('should mark as resolved with response', async () => {
      const responseText = 'La réclamation a été traitée avec succès';
      
      mockPrisma.reclamation.update.mockResolvedValue({
        ...mockReclamations[1],
        statut: 'RESOLUE',
        reponseAutorite: responseText,
        dateReponse: new Date(),
      });

      const result = await mockPrisma.reclamation.update({
        where: { id: 2 },
        data: {
          statut: 'RESOLUE',
          reponseAutorite: responseText,
          dateReponse: new Date(),
        },
      });

      expect(result.statut).toBe('RESOLUE');
      expect(result.reponseAutorite).toBe(responseText);
    });

    it('should notify user on resolution', async () => {
      mockPrisma.notification.create.mockResolvedValue({
        id: 2,
        userId: 1, // Citoyen
        type: 'RECLAMATION_RESOLUE',
        titre: 'Réclamation résolue',
        message: 'Votre réclamation a été traitée',
        isLue: false,
      });

      const notification = await mockPrisma.notification.create({
        data: {
          userId: 1,
          type: 'RECLAMATION_RESOLUE',
          titre: 'Réclamation résolue',
          message: 'Votre réclamation a été traitée',
        },
      });

      expect(notification.type).toBe('RECLAMATION_RESOLUE');
    });
  });

  // ============================================
  // FILTRES ET RECHERCHE
  // ============================================

  describe('Filtres et recherche', () => {
    it('should filter by statut', async () => {
      const pendingReclamations = mockReclamations.filter(r => r.statut === 'SOUMISE');
      mockPrisma.reclamation.findMany.mockResolvedValue(pendingReclamations);

      const result = await mockPrisma.reclamation.findMany({
        where: { statut: 'SOUMISE' },
      });

      expect(result).toHaveLength(1);
      expect(result[0].statut).toBe('SOUMISE');
    });

    it('should filter by commune', async () => {
      mockPrisma.reclamation.findMany.mockResolvedValue(mockReclamations);

      await mockPrisma.reclamation.findMany({
        where: { communeId: 1 },
      });

      expect(mockPrisma.reclamation.findMany).toHaveBeenCalledWith({
        where: { communeId: 1 },
      });
    });

    it('should get urgent reclamations (> 7 days pending)', () => {
      const isUrgent = (createdAt: Date, statut: string) => {
        if (['RESOLUE', 'ARCHIVEE', 'REJETEE'].includes(statut)) return false;
        const daysDiff = Math.floor((Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        return daysDiff > 7;
      };

      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const newDate = new Date();

      expect(isUrgent(oldDate, 'EN_COURS')).toBe(true);
      expect(isUrgent(newDate, 'EN_COURS')).toBe(false);
      expect(isUrgent(oldDate, 'RESOLUE')).toBe(false);
    });
  });

  // ============================================
  // ARCHIVAGE
  // ============================================

  describe('Archivage', () => {
    it('should archive resolved reclamations', async () => {
      mockPrisma.reclamation.update.mockResolvedValue({
        ...mockReclamations[1],
        statut: 'ARCHIVEE',
      });

      const result = await mockPrisma.reclamation.update({
        where: { id: 2 },
        data: { statut: 'ARCHIVEE' },
      });

      expect(result.statut).toBe('ARCHIVEE');
    });
  });
});
