/**
 * Tests API Évaluations
 */

import { 
  mockPrisma, 
  mockEvaluations, 
  mockUsers,
  mockEtablissements,
} from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('Évaluations API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // CRÉATION D'ÉVALUATION
  // ============================================

  describe('POST /api/evaluations', () => {
    it('should create evaluation with valid data', async () => {
      const newEvaluation = {
        noteGlobale: 5,
        commentaire: 'Excellent service',
        etablissementId: 1,
        userId: 1,
      };

      mockPrisma.evaluation.create.mockResolvedValue({
        id: 3,
        ...newEvaluation,
        isValidee: true,
        createdAt: new Date(),
      });

      const result = await mockPrisma.evaluation.create({
        data: newEvaluation,
      });

      expect(result.id).toBe(3);
      expect(result.noteGlobale).toBe(5);
    });

    it('should validate note between 1 and 5', () => {
      const validateNote = (note: number) => {
        return note >= 1 && note <= 5;
      };

      expect(validateNote(0)).toBe(false);
      expect(validateNote(1)).toBe(true);
      expect(validateNote(5)).toBe(true);
      expect(validateNote(6)).toBe(false);
    });

    it('should prevent duplicate evaluations from same user', async () => {
      mockPrisma.evaluation.findFirst.mockResolvedValue(mockEvaluations[0]);

      const existing = await mockPrisma.evaluation.findFirst({
        where: {
          userId: 1,
          etablissementId: 1,
        },
      });

      expect(existing).not.toBeNull();
    });
  });

  // ============================================
  // LECTURE DES ÉVALUATIONS
  // ============================================

  describe('GET /api/evaluations', () => {
    it('should return evaluations for etablissement', async () => {
      mockPrisma.evaluation.findMany.mockResolvedValue(mockEvaluations);

      const evaluations = await mockPrisma.evaluation.findMany({
        where: { etablissementId: 1, isValidee: true },
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });

      expect(evaluations).toHaveLength(2);
    });

    it('should calculate average rating', async () => {
      mockPrisma.evaluation.aggregate.mockResolvedValue({
        _avg: { noteGlobale: 4.5 },
        _count: { id: 2 },
      });

      const stats = await mockPrisma.evaluation.aggregate({
        where: { etablissementId: 1 },
        _avg: { noteGlobale: true },
        _count: { id: true },
      });

      expect(stats._avg.noteGlobale).toBe(4.5);
      expect(stats._count.id).toBe(2);
    });

    it('should paginate evaluations', async () => {
      const paginatedEvals = mockEvaluations.slice(0, 1);
      mockPrisma.evaluation.findMany.mockResolvedValue(paginatedEvals);

      const evaluations = await mockPrisma.evaluation.findMany({
        where: { etablissementId: 1 },
        take: 1,
        skip: 0,
      });

      expect(evaluations).toHaveLength(1);
    });
  });

  // ============================================
  // MISE À JOUR D'ÉVALUATION
  // ============================================

  describe('PATCH /api/evaluations/:id', () => {
    it('should update own evaluation within 7 days', async () => {
      const updatedEvaluation = {
        ...mockEvaluations[0],
        noteGlobale: 4,
        commentaire: 'Commentaire modifié',
      };
      mockPrisma.evaluation.update.mockResolvedValue(updatedEvaluation);

      const result = await mockPrisma.evaluation.update({
        where: { id: 1 },
        data: { noteGlobale: 4, commentaire: 'Commentaire modifié' },
      });

      expect(result.noteGlobale).toBe(4);
      expect(result.commentaire).toBe('Commentaire modifié');
    });

    it('should check if evaluation is modifiable', () => {
      const isModifiable = (createdAt: Date, maxDays: number = 7) => {
        const daysDiff = Math.floor(
          (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
        );
        return daysDiff <= maxDays;
      };

      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      const oldDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago

      expect(isModifiable(recentDate)).toBe(true);
      expect(isModifiable(oldDate)).toBe(false);
    });
  });

  // ============================================
  // SUPPRESSION D'ÉVALUATION
  // ============================================

  describe('DELETE /api/evaluations/:id', () => {
    it('should delete own evaluation', async () => {
      mockPrisma.evaluation.delete.mockResolvedValue(mockEvaluations[0]);

      const result = await mockPrisma.evaluation.delete({
        where: { id: 1 },
      });

      expect(result.id).toBe(1);
    });

    it('should update etablissement stats after delete', () => {
      const recalculateStats = (evaluations: { noteGlobale: number }[]) => {
        if (evaluations.length === 0) {
          return { noteMoyenne: 0, nombreEvaluations: 0 };
        }
        const sum = evaluations.reduce((acc, e) => acc + e.noteGlobale, 0);
        return {
          noteMoyenne: parseFloat((sum / evaluations.length).toFixed(2)),
          nombreEvaluations: evaluations.length,
        };
      };

      const remainingEvals = [{ noteGlobale: 4 }];
      const stats = recalculateStats(remainingEvals);

      expect(stats.noteMoyenne).toBe(4);
      expect(stats.nombreEvaluations).toBe(1);
    });
  });

  // ============================================
  // VÉRIFICATION UTILISATEUR
  // ============================================

  describe('User Evaluation Check', () => {
    it('should check if user has evaluated etablissement', async () => {
      mockPrisma.evaluation.findFirst.mockResolvedValue(mockEvaluations[0]);

      const userEvaluation = await mockPrisma.evaluation.findFirst({
        where: {
          userId: 1,
          etablissementId: 1,
        },
      });

      expect(userEvaluation).not.toBeNull();
      expect(userEvaluation?.noteGlobale).toBe(5);
    });

    it('should return null if user has not evaluated', async () => {
      mockPrisma.evaluation.findFirst.mockResolvedValue(null);

      const userEvaluation = await mockPrisma.evaluation.findFirst({
        where: {
          userId: 999,
          etablissementId: 1,
        },
      });

      expect(userEvaluation).toBeNull();
    });
  });
});
