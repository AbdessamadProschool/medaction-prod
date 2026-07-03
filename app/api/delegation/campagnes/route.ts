import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';
import { notifyAdmins } from '@/lib/notifications';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

// GET - Liste des campagnes
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  if (isNaN(userId)) {
    throw new ValidationError('ID utilisateur invalide');
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, safeParseInt(searchParams.get('page') || '1', 1));
  const limit = Math.max(1, safeParseInt(searchParams.get('limit') || '12', 12));
  const search = searchParams.get('search') || '';
  const statut = searchParams.get('statut') || '';

  const where: any = {
    createdBy: userId,
  };

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { nom: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (statut === 'ACTIVE') {
    where.isActive = true;
  } else if (statut === 'INACTIVE') {
    where.isActive = false;
  } else if (statut === 'A_CLOTURER') {
    where.statut = { notIn: ['TERMINEE', 'CLOTUREE', 'ARCHIVEE'] };
    where.dateFin = { lt: new Date() };
  }

  const [campagnes, total] = await Promise.all([
    prisma.campagne.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campagne.count({ where }),
  ]);

  return successResponse({
    campagnes,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST - Créer une campagne
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
    const body = await request.json();

    // Génération du slug
    let baseSlug = slugify(body.nom);
    let slug = baseSlug;
    let counter = 1;
    
    // Check uniqueness (simple implementation)
    while (await prisma.campagne.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const campagne = await prisma.campagne.create({
      data: {
        nom: body.nom,
        slug: slug,
        titre: body.titre,
        description: body.description,
        contenu: body.contenu,
        type: body.type,
        objectifParticipations: body.objectifParticipations,
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : undefined,
        dateFin: body.dateFin ? new Date(body.dateFin) : undefined,
        couleurTheme: body.couleurTheme,
        imagePrincipale: body.imagePrincipale,
        statut: 'EN_ATTENTE', // Force validation
        isActive: false,      // Inactive par défaut
        createdBy: userId,
      },
    });

    if (body.imagePrincipale) {
      await prisma.media.create({
        data: {
          nomFichier: 'Bannière campagne',
          cheminFichier: body.imagePrincipale,
          urlPublique: body.imagePrincipale,
          type: 'IMAGE',
          mimeType: 'image/jpeg',
          campagneId: campagne.id,
          uploadePar: userId
        }
      });
    }

    // === NOTIFICATION AUX ADMINS ===
    await notifyAdmins({
      type: 'CAMPAGNE_CREATION',
      titre: 'Nouvelle campagne créée',
      message: `La campagne "${body.titre}" a été créée par la délégation et est en attente de validation.`,
      lien: `/admin/campagnes`,
    });

  return successResponse(campagne);
});
