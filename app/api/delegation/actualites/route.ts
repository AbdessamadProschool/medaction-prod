import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, NotFoundError } from '@/lib/exceptions';

// GET - Liste des actualités de la délégation
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100);
  const search = searchParams.get('search') || '';
  const statut = searchParams.get('statut') || '';

  const where: Record<string, unknown> = {
    createdBy: userId,
  };

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { contenu: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (statut === 'PUBLIEE') {
    where.isPublie = true;
  } else if (statut === 'BROUILLON') {
    where.isPublie = false;
  }

  const [actualites, total] = await Promise.all([
    prisma.actualite.findMany({
      where,
      include: {
        etablissement: { select: { nom: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.actualite.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: actualites,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST - Créer une actualité
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour créer une actualité');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  // Validation détaillée
  const errors: Array<{ field: string; message: string }> = [];

  if (!body.titre || body.titre.trim().length < 5) {
    errors.push({ field: 'titre', message: 'Le titre est obligatoire (minimum 5 caractères)' });
  }
  if (body.titre && body.titre.length > 100) {
    errors.push({ field: 'titre', message: 'Le titre ne doit pas dépasser 100 caractères' });
  }

  if (!body.contenu || body.contenu.trim().length < 20) {
    errors.push({ field: 'contenu', message: 'Le contenu est obligatoire (minimum 20 caractères)' });
  }

  if (!body.etablissementId) {
    errors.push({ field: 'etablissementId', message: 'Veuillez sélectionner un établissement' });
  }

  if (errors.length > 0) {
    throw new ValidationError(
      errors.length === 1 ? errors[0].message : `${errors.length} erreurs de validation`,
      { 
        fieldErrors: errors.reduce((acc, e) => {
          if (!acc[e.field]) acc[e.field] = [];
          acc[e.field].push(e.message);
          return acc;
        }, {} as Record<string, string[]>)
      }
    );
  }

  // Vérifier que l'établissement existe
  if (body.etablissementId) {
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: parseInt(body.etablissementId) }
    });
    if (!etablissement) {
      throw new NotFoundError("L'établissement sélectionné n'existe pas");
    }
  }

  const actualite = await prisma.actualite.create({
    data: {
      titre: body.titre.trim(),
      contenu: body.contenu?.trim() || '',
      description: body.resume?.trim() || body.description?.trim(),
      categorie: body.categorie,
      etablissementId: parseInt(body.etablissementId),
      isPublie: body.isPublie || false,
      isValide: false, // Nécessite validation admin
      statut: 'EN_ATTENTE_VALIDATION',
      createdBy: userId,
    },
  });

  // Création du média si image fournie
  if (body.imagePrincipale) {
    await prisma.media.create({
      data: {
        nomFichier: 'Image Principale',
        cheminFichier: body.imagePrincipale,
        urlPublique: body.imagePrincipale,
        type: 'IMAGE',
        mimeType: 'image/jpeg',
        actualiteId: actualite.id,
        uploadePar: userId
      }
    });
  }

  // Notification aux admins (non bloquant)
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true }
    });
    
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'ACTUALITE_CREATION',
          titre: 'Nouvelle actualité à valider',
          message: `L'actualité "${body.titre}" a été créée par la délégation et attend votre validation.`,
          lien: `/admin/actualites`,
          isLue: false,
          createdAt: new Date()
        }))
      });
    }
  } catch (notifError) {
    console.error('Erreur notification (non bloquante):', notifError);
  }

  return NextResponse.json({
    success: true,
    message: 'Actualité créée avec succès. Elle sera visible après validation par un administrateur.',
    data: actualite,
  }, { status: 201 });
});
