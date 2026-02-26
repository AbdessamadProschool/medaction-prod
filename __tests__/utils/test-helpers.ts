/**
 * Utilitaires de test - Mocks et helpers
 */

// ============================================
// MOCK PRISMA CLIENT
// ============================================

export const mockPrismaUser = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaEtablissement = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaReclamation = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaEvaluation = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
};

export const mockPrismaEvenement = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  count: jest.fn(),
};

export const mockPrismaCommune = {
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
};

export const mockPrismaHistoriqueReclamation = {
  create: jest.fn(),
  findMany: jest.fn(),
};

export const mockPrismaNotification = {
  create: jest.fn(),
  findMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
};

export const mockPrisma = {
  user: mockPrismaUser,
  etablissement: mockPrismaEtablissement,
  reclamation: mockPrismaReclamation,
  evaluation: mockPrismaEvaluation,
  evenement: mockPrismaEvenement,
  commune: mockPrismaCommune,
  historiqueReclamation: mockPrismaHistoriqueReclamation,
  notification: mockPrismaNotification,
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

// ============================================
// MOCK DATA
// ============================================

export const mockUsers = {
  citoyen: {
    id: 1,
    email: 'citoyen@test.com',
    nom: 'Dupont',
    prenom: 'Jean',
    role: 'CITOYEN',
    isActive: true,
    isEmailVerifie: true,
    password: 'hashedpassword',
  },
  admin: {
    id: 2,
    email: 'admin@test.com',
    nom: 'Admin',
    prenom: 'Super',
    role: 'ADMIN',
    isActive: true,
    isEmailVerifie: true,
    password: 'hashedpassword',
  },
  delegation: {
    id: 3,
    email: 'delegation@test.com',
    nom: 'Delegation',
    prenom: 'User',
    role: 'DELEGATION',
    isActive: true,
    isEmailVerifie: true,
    password: 'hashedpassword',
    communeId: 1,
  },
  autoriteLocale: {
    id: 4,
    email: 'autorite@test.com',
    nom: 'Autorite',
    prenom: 'Locale',
    role: 'AUTORITE_LOCALE',
    isActive: true,
    isEmailVerifie: true,
    password: 'hashedpassword',
    communeId: 1,
  },
  gouverneur: {
    id: 5,
    email: 'gouverneur@test.com',
    nom: 'Gouverneur',
    prenom: 'Provincial',
    role: 'GOUVERNEUR',
    isActive: true,
    isEmailVerifie: true,
    password: 'hashedpassword',
  },
};

export const mockEtablissements = [
  {
    id: 1,
    code: 'EDU-001',
    nom: 'École Primaire Test',
    secteur: 'EDUCATION',
    nature: 'public',
    isPublie: true,
    noteMoyenne: 4.5,
    nombreEvaluations: 10,
    latitude: 33.5,
    longitude: -7.6,
    communeId: 1,
    commune: { id: 1, nom: 'Médiouna' },
  },
  {
    id: 2,
    code: 'SAN-001',
    nom: 'Centre de Santé Test',
    secteur: 'SANTE',
    nature: 'public',
    isPublie: true,
    noteMoyenne: 3.8,
    nombreEvaluations: 5,
    latitude: 33.51,
    longitude: -7.61,
    communeId: 1,
    commune: { id: 1, nom: 'Médiouna' },
  },
];

export const mockReclamations = [
  {
    id: 1,
    titre: 'Problème d\'éclairage',
    description: 'Les lumières ne fonctionnent pas',
    categorie: 'INFRASTRUCTURE',
    statut: 'SOUMISE',
    userId: 1,
    communeId: 1,
    etablissementId: 1,
    createdAt: new Date(),
    user: mockUsers.citoyen,
    commune: { id: 1, nom: 'Médiouna' },
    etablissement: mockEtablissements[0],
  },
  {
    id: 2,
    titre: 'Problème de propreté',
    description: 'Les locaux sont sales',
    categorie: 'HYGIENE',
    statut: 'EN_COURS',
    affectationReclamation: 'AUTORITE_LOCALE',
    userId: 1,
    communeId: 1,
    etablissementId: 1,
    createdAt: new Date(),
    dateAffectation: new Date(),
    user: mockUsers.citoyen,
    commune: { id: 1, nom: 'Médiouna' },
    etablissement: mockEtablissements[0],
  },
];

export const mockEvaluations = [
  {
    id: 1,
    noteGlobale: 5,
    commentaire: 'Excellent établissement',
    isValidee: true,
    userId: 1,
    etablissementId: 1,
    createdAt: new Date(),
    user: mockUsers.citoyen,
  },
  {
    id: 2,
    noteGlobale: 4,
    commentaire: 'Très bien',
    isValidee: true,
    userId: 1,
    etablissementId: 1,
    createdAt: new Date(),
    user: mockUsers.citoyen,
  },
];

// ============================================
// MOCK SESSION
// ============================================

export const createMockSession = (user: typeof mockUsers.citoyen) => ({
  user: {
    id: user.id.toString(),
    email: user.email,
    nom: user.nom,
    prenom: user.prenom,
    role: user.role,
    isActive: user.isActive,
  },
  expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
});

// ============================================
// RESPONSE HELPERS
// ============================================

export async function parseJsonResponse(response: Response) {
  const text = await response.text();
  return JSON.parse(text);
}

// ============================================
// RESET HELPERS
// ============================================

export function resetAllMocks() {
  Object.values(mockPrisma).forEach((model) => {
    if (typeof model === 'object') {
      Object.values(model).forEach((fn) => {
        if (typeof fn === 'function' && 'mockReset' in fn) {
          (fn as jest.Mock).mockReset();
        }
      });
    }
  });
}

