import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError, ConflictError } from '@/lib/exceptions';
import { withPermission } from '@/lib/auth/api-guard';
import { auditLog } from '@/lib/logger';

// Schéma de validation pour la création d'utilisateur
const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  nom: z.string().min(2, 'Le nom est requis'),
  prenom: z.string().min(2, 'Le prénom est requis'),
  role: z.enum(['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR']),
  telephone: z.string().optional(),
  secteurResponsable: z.any().optional(),
  etablissementId: z.number().optional(),
});

// GET /api/admin/users - Lister les utilisateurs
export const GET = withPermission('users.read', withErrorHandler(async (request: NextRequest) => {
  const searchParams = request.nextUrl.searchParams;
  const page = safeParseInt(searchParams.get('page') || '1', 0);
  const limit = Math.min(safeParseInt(searchParams.get('limit') || '10', 0), 100);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role');

  const skip = (page - 1) * limit;

  const where: any = {};
  if (search) {
    where.OR = [
      { nom: { contains: search, mode: 'insensitive' } },
      { prenom: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (role && role !== 'ALL') {
    where.role = role;
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        photo: true,
        isActive: true,
        lastFailedLogin: true,
        dateInscription: true,
        derniereConnexion: true,
      },
      skip,
      take: limit,
      orderBy: { dateInscription: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return successResponse({
    users,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  });
}));

// POST /api/admin/users - Créer un utilisateur
export const POST = withPermission('users.create', withErrorHandler(async (request: NextRequest, { session }) => {
  const body = await request.json();
  const { email, password, nom, prenom, role, telephone, secteurResponsable, etablissementId } = createUserSchema.parse(body);

  // 🛡️ Anti-escalade : seul SUPER_ADMIN peut créer des comptes ADMIN ou SUPER_ADMIN
  if (['ADMIN', 'SUPER_ADMIN'].includes(role) && session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Seul un Super Admin peut créer des comptes administrateurs');
  }

  // Vérifier unicité email
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new ConflictError('Cet email est déjà utilisé');
  }

  const hashedPassword = await hashPassword(password);

  const userData: any = {
    email: email.toLowerCase(),
    motDePasse: hashedPassword,
    nom,
    prenom,
    role,
    telephone,
    isActive: true,
    isEmailVerifie: true,
    dateInscription: new Date(),
  };

  if (role === 'DELEGATION' && secteurResponsable) {
    userData.secteurResponsable = secteurResponsable;
  }

  if (role === 'AUTORITE_LOCALE' && etablissementId) {
    userData.etablissementId = etablissementId;
  }

  const newUser = await prisma.user.create({
    data: userData,
    select: {
      id: true,
      email: true,
      nom: true,
      prenom: true,
      role: true,
    },
  });

  // Audit log
  await auditLog({
    action: 'CREATE_USER',
    resource: 'USER',
    resourceId: String(newUser.id),
    userId: session.user.id,
    details: {
      email: newUser.email,
      role: newUser.role
    },
    status: 'SUCCESS',
    ipAddress: request.headers.get('x-forwarded-for') || '0.0.0.0',
    userAgent: request.headers.get('user-agent') || 'unknown'
  });

  return successResponse(newUser, 'Utilisateur créé avec succès', 201);
}));
