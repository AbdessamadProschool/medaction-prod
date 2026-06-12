import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/auth/password';
import { z } from 'zod';
import { grantPermissions, DEFAULT_ADMIN_PERMISSIONS } from '@/lib/permissions';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from '@/lib/exceptions';

// Schéma de validation pour création d'admin
const createAdminSchema = z.object({
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  motDePasse: z.string().min(8, 'Minimum 8 caractères'),
  nom: z.string().min(2, 'Minimum 2 caractères'),
  prenom: z.string().min(2, 'Minimum 2 caractères'),
  permissions: z.array(z.string()).optional(),
});

// POST - Créer un admin (SUPER_ADMIN uniquement)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  // Seul SUPER_ADMIN peut créer des admins
  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Seul un Super Admin peut créer des administrateurs');
  }

  const body = await request.json();
  const validation = createAdminSchema.safeParse(body);

  if (!validation.success) {
    throw new ValidationError('Données invalides');
  }

    const data = validation.data;

    // Vérifier que l'email n'existe pas
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

  if (existingUser) {
    throw new AppError('Cet email est déjà utilisé', 'CONFLICT', 409);
  }

    // Vérifier les permissions sont valides
    const permissionsToGrant = data.permissions || DEFAULT_ADMIN_PERMISSIONS;
    
    // Vérifier que les permissions existent en base
    const validPermissions = await prisma.permission.findMany({
      where: { code: { in: permissionsToGrant }, isActive: true },
      select: { code: true }
    });
    
    const validCodes = validPermissions.map(p => p.code);
    const invalidPermissions = permissionsToGrant.filter(p => !validCodes.includes(p));
    
  if (invalidPermissions.length > 0) {
    throw new ValidationError(`Permissions invalides: ${invalidPermissions.join(', ')}`);
  }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(data.motDePasse);

    // Créer l'admin
    const admin = await prisma.user.create({
      data: {
        email: data.email,
        telephone: data.telephone || null,
        motDePasse: hashedPassword,
        nom: data.nom,
        prenom: data.prenom,
        role: 'ADMIN',
        isActive: true,
        isEmailVerifie: true,
      },
      select: {
        id: true,
        email: true,
        nom: true,
        prenom: true,
        role: true,
        isActive: true,
        createdAt: true,
      }
    });

    // Accorder les permissions
    await grantPermissions(admin.id, validCodes, parseInt(session.user.id));

    // Créer une notification
    await prisma.notification.create({
      data: {
        userId: admin.id,
        type: 'COMPTE_CREE',
        titre: 'Bienvenue !',
        message: `Votre compte administrateur a été créé. Vous avez ${validCodes.length} permissions.`,
        lien: '/admin',
      }
    });
    
  return successResponse({
    ...admin,
    permissions: validCodes,
  }, 'Administrateur créé avec succès', 201);
});

// GET - Liste des admins (SUPER_ADMIN uniquement)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Non authentifié');
  }

  if (session.user.role !== 'SUPER_ADMIN') {
    throw new ForbiddenError('Accès non autorisé');
  }

    const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1') || 1;
  const limit = parseInt(searchParams.get('limit') || '20') || 20;
    const search = searchParams.get('search') || '';

    const where: any = {
      role: { in: ['ADMIN', 'SUPER_ADMIN'] }
    };

    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [admins, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          telephone: true,
          nom: true,
          prenom: true,
          photo: true,
          role: true,
          isActive: true,
          twoFactorEnabled: true,
          derniereConnexion: true,
          createdAt: true,
          userPermissions: {
            where: { isActive: true },
            include: {
              permission: {
                select: { code: true, nom: true, groupe: true, groupeLabel: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where })
    ]);

    // Transformer les données pour inclure les permissions
    const adminsWithPermissions = admins.map(admin => ({
      ...admin,
      permissions: admin.userPermissions.map(up => up.permission.code),
      permissionsDetails: admin.userPermissions.map(up => up.permission),
      userPermissions: undefined, // Retirer le champ brut
    }));

  return successResponse({
    data: adminsWithPermissions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});
