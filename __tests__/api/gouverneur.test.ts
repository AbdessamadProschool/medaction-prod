import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';

// 1. Mock de @/lib/db défini de manière autonome pour éviter la Temporal Dead Zone (TDZ)
jest.mock('@/lib/db', () => {
  return {
    prisma: {
      etablissement: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      reclamation: {
        groupBy: jest.fn(),
      },
    },
  };
});

// Import après le mock pour que l'instance de prisma soit déjà mockée
import { prisma } from '@/lib/db';
import { GET } from '@/app/api/gouverneur/performance/route';

// Mock NextAuth
jest.mock('next-auth', () => ({
  getServerSession: jest.fn(),
}));

describe('Gouverneur Performance API Route', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return exact resolvedReclamations using database aggregation', async () => {
    // Simuler une session utilisateur Gouverneur active
    (getServerSession as jest.Mock).mockResolvedValue({
      user: {
        id: '5',
        role: 'GOUVERNEUR',
        email: 'gouverneur@test.com',
      },
    });

    // Simuler les établissements en DB
    const etablissementId = 123;
    (prisma.etablissement.findMany as jest.Mock).mockResolvedValue([
      {
        id: etablissementId,
        nom: 'Etablissement de Test A',
        secteur: 'EDUCATION',
        noteMoyenne: 4.5,
        communeId: 1,
        annexeId: null,
        _count: {
          evenementsOrganises: 2,
          reclamations: 3,
          actualites: 1,
          evaluations: 5,
          abonnements: 10,
          activitesOrganisees: 4,
        },
        evenementsOrganises: [],
        actualites: [],
        reclamations: [],
        activitesOrganisees: [],
      },
    ]);

    (prisma.etablissement.count as jest.Mock).mockResolvedValue(1);

    // Simuler le groupBy pour resolvedReclamations
    // Nous simulons que l'établissement 123 a exactement 2 réclamations résolues
    (prisma.reclamation.groupBy as jest.Mock).mockResolvedValue([
      {
        etablissementId: etablissementId,
        _count: { id: 2 },
      },
    ]);

    // Effectuer la requête GET
    const req = new NextRequest('http://localhost:3000/api/gouverneur/performance?page=1&limit=20');
    const response = await GET(req);
    const json = await response.json();

    // Vérifier la réponse
    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    
    // Le wrapper successResponse enveloppe l'objet passé, le tableau est donc dans json.data.data
    expect(json.data.data).toHaveLength(1);
    
    const item = json.data.data[0];
    expect(item.id).toBe(etablissementId);
    expect(item.stats.resolvedReclamations).toBe(2);
    expect(item.stats.reclamations).toBe(3);

    // Vérifier que la requête groupBy a bien été appelée sur Reclamation
    expect(prisma.reclamation.groupBy).toHaveBeenCalledWith(
      expect.objectContaining({
        by: ['etablissementId'],
        where: expect.objectContaining({
          etablissementId: { not: null },
          dateResolution: { not: null },
        }),
      })
    );
  });
});
