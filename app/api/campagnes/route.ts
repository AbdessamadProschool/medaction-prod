import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler, errorResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';

// GET - Liste des campagnes (Publique + Admin)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  const isAdminOrDelegation = session?.user && ['ADMIN', 'SUPER_ADMIN', 'DELEGATION', 'GOUVERNEUR'].includes(session.user.role || '');

  const { searchParams } = new URL(request.url);
  
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '12'), 100); // Max 100
  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const featured = searchParams.get('featured') === 'true';
  const statutParam = searchParams.get('statut');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: any = {};

  // Filtres de base
  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { nom: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (type) where.type = type;
  if (featured) where.isFeatured = true;

  // GESTION DES DROITS D'ACCÈS ET STATUTS
  if (isAdminOrDelegation) {
    // Admin/Délégation : Peut voir tout, ou filtrer par statut spécifique
    if (statutParam) {
      where.statut = statutParam;
    }
  } else {
    // Public : VOIT UNIQUEMENT "ACTIVE" (et publié)
    where.statut = 'ACTIVE';
    where.isActive = true; 
  }

  const [campagnes, total, types] = await Promise.all([
    prisma.campagne.findMany({
      where,
      include: {
        _count: {
          select: { participations: true },
        },
      },
      orderBy: [
        { isFeatured: 'desc' },
        { createdAt: 'desc' },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.campagne.count({ where }),
    prisma.campagne.groupBy({
      by: ['type'],
      where: isAdminOrDelegation ? {} : { statut: 'ACTIVE' },
      _count: { type: true },
    }),
  ]);

  // Formater les données
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const formattedCampagnes = campagnes.map((c: any) => ({
    id: c.id,
    titre: c.titre,
    nom: c.nom,
    slug: c.slug,
    description: c.description,
    contenu: c.contenu,
    type: c.type,
    statut: c.statut,
    imageCouverture: c.imageCouverture || c.imagePrincipale,
    couleurTheme: c.couleurTheme,
    objectifParticipations: c.objectifParticipations,
    nombreParticipations: c._count?.participations || 0,
    dateDebut: c.dateDebut,
    dateFin: c.dateFin,
    isFeatured: c.isFeatured,
    createdAt: c.createdAt,
  }));

  return NextResponse.json({
    success: true,
    data: formattedCampagnes,
    types: types.map(t => ({
      nom: t.type,
      count: t._count.type,
    })),
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
    throw new UnauthorizedError('Vous devez être connecté pour créer une campagne');
  }

  const userId = parseInt(session.user.id);

  // Vérifier la permission via RBAC
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'campagnes.create');

  if (!hasPermission) {
    throw new ForbiddenError('Vous n\'avez pas la permission de créer des campagnes');
  }

  const body = await request.json();

  // Validation des champs requis
  const errors: Array<{ field: string; message: string }> = [];
  
  if (!body.titre || body.titre.trim().length < 5) {
    errors.push({ field: 'titre', message: 'Le titre est obligatoire (minimum 5 caractères)' });
  }
  
  if (!body.nom || body.nom.trim().length < 2) {
    errors.push({ field: 'nom', message: 'Le nom court est obligatoire (minimum 2 caractères)' });
  }
  
  if (!body.contenu || body.contenu.trim().length < 20) {
    errors.push({ field: 'contenu', message: 'Le contenu détaillé est obligatoire (minimum 20 caractères)' });
  }
  
  if (!body.type) {
    errors.push({ field: 'type', message: 'Le type de campagne est obligatoire' });
  }

  if (errors.length > 0) {
    throw new ValidationError(
      errors.length === 1 ? errors[0].message : `${errors.length} erreurs de validation`,
      { fieldErrors: errors.reduce((acc, e) => ({ ...acc, [e.field]: [e.message] }), {}) }
    );
  }

  // Générer un slug unique
  const slug = (body.slug || body.titre)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    + '-' + Date.now();

  const campagne = await prisma.campagne.create({
    data: {
      nom: body.nom || body.titre,
      titre: body.titre,
      slug,
      description: body.description || '',
      contenu: body.contenu || '',
      type: body.type || 'Général',
      statut: body.statut || 'BROUILLON',
      imagePrincipale: body.imagePrincipale || body.imageCouverture,
      imageCouverture: body.imageCouverture,
      couleurTheme: body.couleurTheme || '#1e40af',
      objectifParticipations: body.objectifParticipations ? parseInt(body.objectifParticipations) : null,
      dateDebut: body.dateDebut ? new Date(body.dateDebut) : null,
      dateFin: body.dateFin ? new Date(body.dateFin) : null,
      isActive: body.statut === 'ACTIVE',
      isFeatured: body.isFeatured || false,
      createdBy: userId,
    },
  });

  return NextResponse.json({
    success: true,
    message: 'Campagne créée avec succès',
    data: campagne,
  }, { status: 201 });
});
