import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from '@/lib/exceptions';

// Schéma de validation pour la création d'utilisateur
const createUserSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  nom: z.string().min(2, 'Le nom est requis'),
  prenom: z.string().min(2, 'Le prénom est requis'),
  role: z.enum(['CITOYEN', 'DELEGATION', 'AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR']),
  telephone: z.string().optional(),
  secteurResponsable: z.any().optional(), // Sera validé si le rôle est DELEGATION
  etablissementId: z.number().optional(), // Sera validé si le rôle est AUTORITE_LOCALE
});

// GET /api/admin/users - Lister les utilisateurs
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    throw new ForbiddenError('Accès non autorisé');
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role');

  const skip = (page - 1) * limit;

  // Construction du filtre
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

  // Récupérer les données
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
        createdAt: true, // Note: using createdAt/updatedAt if available or dateInscription
        dateInscription: true,
        derniereConnexion: true,
      },
      skip,
      take: limit,
      orderBy: { dateInscription: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  return NextResponse.json({
    users,
    pagination: {
      total,
      pages: Math.ceil(total / limit),
      page,
      limit,
    },
  });
});

// POST /api/admin/users - Créer un utilisateur
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError();
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Seul un Super Admin peut créer des administrateurs');
  }

  const body = await request.json();
  
  // Validation
  const validation = createUserSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError(validation.error.issues[0].message);
  }

  const { email, password, nom, prenom, role, telephone, secteurResponsable, etablissementId } = validation.data;

  // Vérifier unicité email
  const existingUser = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new AppError('Cet email est déjà utilisé', 'CONFLICT', 409);
  }

  // Hasher le mot de passe
  const hashedPassword = await hashPassword(password);

  // Préparer les données
  const userData: any = {
    email: email.toLowerCase(),
    motDePasse: hashedPassword,
    nom,
    prenom,
    role,
    telephone,
    isActive: true,
    isEmailVerifie: true, // Admin created users are verified by default
    dateInscription: new Date(),
  };

  // Gestion des champs spécifiques aux rôles
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

  return NextResponse.json(newUser, { status: 201 });
});
