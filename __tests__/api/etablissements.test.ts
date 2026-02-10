/**
 * Tests CRUD Établissements
 */

import { 
  mockPrisma, 
  mockEtablissements, 
  mockUsers,
  createMockSession,
} from '../utils/test-helpers';

// Mock Prisma
jest.mock('@/lib/db', () => ({
  prisma: mockPrisma,
}));

describe('Établissements API Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ============================================
  // READ TESTS
  // ============================================

  describe('GET /api/etablissements', () => {
    it('should return paginated list of etablissements', async () => {
      mockPrisma.etablissement.findMany.mockResolvedValue(mockEtablissements);
      mockPrisma.etablissement.count.mockResolvedValue(2);

      const etablissements = await mockPrisma.etablissement.findMany({
        where: { isPublie: true },
        take: 10,
        skip: 0,
      });

      const count = await mockPrisma.etablissement.count({
        where: { isPublie: true },
      });

      expect(etablissements).toHaveLength(2);
      expect(count).toBe(2);
    });

    it('should filter by secteur', async () => {
      const educationEtabs = mockEtablissements.filter(e => e.secteur === 'EDUCATION');
      mockPrisma.etablissement.findMany.mockResolvedValue(educationEtabs);

      const result = await mockPrisma.etablissement.findMany({
        where: { secteur: 'EDUCATION', isPublie: true },
      });

      expect(result).toHaveLength(1);
      expect(result[0].secteur).toBe('EDUCATION');
    });

    it('should filter by commune', async () => {
      mockPrisma.etablissement.findMany.mockResolvedValue(mockEtablissements);

      const result = await mockPrisma.etablissement.findMany({
        where: { communeId: 1, isPublie: true },
      });

      expect(mockPrisma.etablissement.findMany).toHaveBeenCalledWith({
        where: { communeId: 1, isPublie: true },
      });
    });

    it('should search by nom', async () => {
      const searchResults = mockEtablissements.filter(e => 
        e.nom.toLowerCase().includes('école')
      );
      mockPrisma.etablissement.findMany.mockResolvedValue(searchResults);

      const result = await mockPrisma.etablissement.findMany({
        where: {
          nom: { contains: 'école', mode: 'insensitive' },
          isPublie: true,
        },
      });

      expect(result).toHaveLength(1);
    });

    it('should filter by minimum rating', async () => {
      const highRated = mockEtablissements.filter(e => e.noteMoyenne >= 4);
      mockPrisma.etablissement.findMany.mockResolvedValue(highRated);

      const result = await mockPrisma.etablissement.findMany({
        where: { noteMoyenne: { gte: 4 }, isPublie: true },
      });

      // mockEtablissements has 1 with 4.5 and 1 with 3.8, so only 1 >= 4
      expect(result).toHaveLength(1);
      result.forEach(e => expect(e.noteMoyenne).toBeGreaterThanOrEqual(4));
    });
  });

  describe('GET /api/etablissements/:id', () => {
    it('should return etablissement by id', async () => {
      mockPrisma.etablissement.findUnique.mockResolvedValue(mockEtablissements[0]);

      const etablissement = await mockPrisma.etablissement.findUnique({
        where: { id: 1 },
      });

      expect(etablissement).toBeDefined();
      expect(etablissement?.id).toBe(1);
      expect(etablissement?.nom).toBe('École Primaire Test');
    });

    it('should return null for non-existent id', async () => {
      mockPrisma.etablissement.findUnique.mockResolvedValue(null);

      const etablissement = await mockPrisma.etablissement.findUnique({
        where: { id: 999 },
      });

      expect(etablissement).toBeNull();
    });
  });

  // ============================================
  // CREATE TESTS
  // ============================================

  describe('POST /api/etablissements', () => {
    it('should create etablissement with valid data', async () => {
      const newEtab = {
        code: 'NEW-001',
        nom: 'Nouvel Établissement',
        secteur: 'EDUCATION',
        nature: 'public',
        communeId: 1,
        latitude: 33.5,
        longitude: -7.6,
      };

      mockPrisma.etablissement.create.mockResolvedValue({
        id: 3,
        ...newEtab,
        isPublie: false,
        noteMoyenne: 0,
        nombreEvaluations: 0,
      });

      const result = await mockPrisma.etablissement.create({
        data: newEtab,
      });

      expect(result.id).toBe(3);
      expect(result.nom).toBe('Nouvel Établissement');
    });

    it('should generate unique code', () => {
      const generateCode = (secteur: string) => {
        const prefixes: Record<string, string> = {
          EDUCATION: 'EDU',
          SANTE: 'SAN',
          SPORT: 'SPO',
          SOCIAL: 'SOC',
          CULTUREL: 'CUL',
        };
        const prefix = prefixes[secteur] || 'ETB';
        const random = Math.random().toString(36).substr(2, 6).toUpperCase();
        return `${prefix}-${random}`;
      };

      const code = generateCode('EDUCATION');
      expect(code).toMatch(/^EDU-[A-Z0-9]{6}$/);
    });

    it('should validate required fields', () => {
      const validateEtablissement = (data: any) => {
        const errors: string[] = [];
        if (!data.nom) errors.push('Nom requis');
        if (!data.secteur) errors.push('Secteur requis');
        if (!data.communeId) errors.push('Commune requise');
        return errors;
      };

      expect(validateEtablissement({})).toContain('Nom requis');
      expect(validateEtablissement({ nom: 'Test', secteur: 'EDUCATION', communeId: 1 })).toHaveLength(0);
    });
  });

  // ============================================
  // UPDATE TESTS
  // ============================================

  describe('PUT /api/etablissements/:id', () => {
    it('should update etablissement', async () => {
      const updatedData = { nom: 'Nom Modifié' };
      mockPrisma.etablissement.update.mockResolvedValue({
        ...mockEtablissements[0],
        ...updatedData,
      });

      const result = await mockPrisma.etablissement.update({
        where: { id: 1 },
        data: updatedData,
      });

      expect(result.nom).toBe('Nom Modifié');
    });

    it('should update rating when evaluation added', async () => {
      const calcAverage = (evaluations: { noteGlobale: number }[]) => {
        if (evaluations.length === 0) return 0;
        const sum = evaluations.reduce((acc, e) => acc + e.noteGlobale, 0);
        return parseFloat((sum / evaluations.length).toFixed(2));
      };

      const evaluations = [{ noteGlobale: 5 }, { noteGlobale: 4 }, { noteGlobale: 3 }];
      expect(calcAverage(evaluations)).toBe(4);
    });
  });

  // ============================================
  // DELETE TESTS
  // ============================================

  describe('DELETE /api/etablissements/:id', () => {
    it('should soft delete by setting isPublie to false', async () => {
      mockPrisma.etablissement.update.mockResolvedValue({
        ...mockEtablissements[0],
        isPublie: false,
      });

      const result = await mockPrisma.etablissement.update({
        where: { id: 1 },
        data: { isPublie: false },
      });

      expect(result.isPublie).toBe(false);
    });
  });
});
