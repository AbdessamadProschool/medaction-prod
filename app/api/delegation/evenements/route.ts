import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError, AppError } from '@/lib/exceptions';

// GET - Liste des événements de la délégation
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
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (statut) {
    where.statut = statut;
  }

  const [evenements, total] = await Promise.all([
    prisma.evenement.findMany({
      where,
      include: {
        etablissement: { select: { nom: true } },
        commune: { select: { nom: true } },
        medias: { take: 1, select: { urlPublique: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evenement.count({ where }),
  ]);

  return NextResponse.json({
    success: true,
    data: evenements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// POST - Créer un événement
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    throw new UnauthorizedError('Vous devez être connecté pour créer un événement');
  }

  if (session.user.role !== 'DELEGATION') {
    throw new ForbiddenError('Accès réservé aux délégations');
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();

  // === VALIDATION DÉTAILLÉE ===
  const errors: Array<{ field: string; message: string }> = [];

  // Champs obligatoires
  if (!body.titre || body.titre.trim().length < 5) {
    errors.push({ field: 'titre', message: 'Le titre est obligatoire (minimum 5 caractères)' });
  }
  if (body.titre && body.titre.length > 100) {
    errors.push({ field: 'titre', message: 'Le titre ne doit pas dépasser 100 caractères' });
  }

  if (!body.description || body.description.trim().length < 20) {
    errors.push({ field: 'description', message: 'La description est obligatoire (minimum 20 caractères)' });
  }

  if (!body.etablissementId) {
    errors.push({ field: 'etablissementId', message: 'Veuillez sélectionner un établissement organisateur' });
  }

  if (!body.typeCategorique) {
    errors.push({ field: 'typeCategorique', message: 'Le type d\'événement est obligatoire' });
  }

  if (!body.dateDebut) {
    errors.push({ field: 'dateDebut', message: 'La date de début est obligatoire' });
  } else {
    const dateDebut = new Date(body.dateDebut);
    if (isNaN(dateDebut.getTime())) {
      errors.push({ field: 'dateDebut', message: 'La date de début n\'est pas valide' });
    }
  }

  // Validation email si fourni
  if (body.emailContact && body.emailContact.trim()) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.emailContact)) {
      errors.push({ field: 'emailContact', message: 'L\'adresse email n\'est pas valide' });
    }
  }

  // Validation URL inscription si fournie
  if (body.lienInscription && body.lienInscription.trim()) {
    try {
      new URL(body.lienInscription);
    } catch {
      errors.push({ field: 'lienInscription', message: 'Le lien d\'inscription doit être une URL valide (commençant par http:// ou https://)' });
    }
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

  // Récupérer la commune de l'établissement
  let communeId = body.communeId;
  let secteur = session.user.secteurResponsable as any || 'AUTRE';

  if (body.etablissementId) {
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: parseInt(body.etablissementId) },
      include: { commune: true }
    });
    
    if (!etablissement) {
      throw new AppError('L\'établissement sélectionné n\'existe pas', 'NOT_FOUND', 400);
    }
    
    if (!communeId) communeId = etablissement.communeId;
    if (etablissement.secteur) secteur = etablissement.secteur;
  }

  if (!communeId) {
    throw new AppError('Impossible de déterminer la commune pour cet établissement', 'VALIDATION_ERROR', 400);
  }

  // Parse tags
  const tagsArray = body.tags ? 
    (Array.isArray(body.tags) ? body.tags : body.tags.split(',').map((t: string) => t.trim()).filter(Boolean)) 
    : [];

  const evenement = await prisma.evenement.create({
    data: {
      titre: body.titre.trim(),
      description: body.description.trim(),
      typeCategorique: body.typeCategorique,
      secteur: secteur,
      dateDebut: new Date(body.dateDebut),
      dateFin: body.dateFin ? new Date(body.dateFin) : undefined,
      heureDebut: body.heureDebut,
      heureFin: body.heureFin,
      lieu: body.lieu?.trim(),
      adresse: body.adresse?.trim(),
      quartierDouar: body.quartierDouar?.trim(),
      tags: tagsArray,
      organisateur: body.organisateur?.trim(),
      contactOrganisateur: body.contactOrganisateur?.trim(),
      emailContact: body.emailContact?.trim(),
      capaciteMax: body.capaciteMax ? parseInt(body.capaciteMax) : undefined,
      inscriptionsOuvertes: body.inscriptionsOuvertes || false,
      lienInscription: body.lienInscription?.trim(),
      etablissementId: parseInt(body.etablissementId),
      communeId: communeId,
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
        evenementId: evenement.id,
        uploadePar: userId
      }
    });
  }

  // Notification aux admins
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
      select: { id: true }
    });
    
    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'EVENT_CREATION',
          titre: 'Nouvel événement à valider',
          message: `L'événement "${body.titre}" a été créé par la délégation (Secteur: ${secteur}) et attend votre validation.`,
          lien: `/admin/evenements`,
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
    message: 'Événement créé avec succès. Il sera visible après validation par un administrateur.',
    data: evenement,
  }, { status: 201 });
});
