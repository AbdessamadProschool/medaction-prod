import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, ValidationError } from '@/lib/exceptions';
import { z } from 'zod';

// Schéma de validation pour création d'événement (compatible Zod v4)
const createEvenementSchema = z.object({
  etablissementId: z.number(),
  communeId: z.number(),
  secteur: z.enum(['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE']),
  titre: z.string().min(5, "Le titre doit contenir au moins 5 caractères").max(200, "Le titre ne doit pas dépasser 200 caractères"),
  description: z.string().min(20, "La description doit contenir au moins 20 caractères").max(5000, "La description ne doit pas dépasser 5000 caractères"),
  typeCategorique: z.string().min(1, "Le type d'événement est obligatoire"),
  categorie: z.string().optional(),
  tags: z.array(z.string()).optional(),
  dateDebut: z.string().min(1, "La date de début est obligatoire"),
  dateFin: z.string().optional(),
  heureDebut: z.string().optional(),
  heureFin: z.string().optional(),
  lieu: z.string().max(200, "Le lieu ne doit pas dépasser 200 caractères").optional(),
  adresse: z.string().max(300, "L'adresse ne doit pas dépasser 300 caractères").optional(),
  quartierDouar: z.string().max(100, "Le quartier/douar ne doit pas dépasser 100 caractères").optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  organisateur: z.string().max(100, "Le nom de l'organisateur ne doit pas dépasser 100 caractères").optional(),
  contactOrganisateur: z.string().max(50, "Le contact ne doit pas dépasser 50 caractères").optional(),
  emailContact: z.string().email("L'adresse email n'est pas valide").optional().or(z.literal('')),
  capaciteMax: z.number().min(0, "La capacité ne peut pas être négative").optional(),
  inscriptionsOuvertes: z.boolean().optional(),
  lienInscription: z.string().url("Le lien d'inscription doit être une URL valide").optional().or(z.literal('')),
});

// POST - Créer un événement (DELEGATION uniquement)
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté pour créer un événement');
  }

  // Vérifier la permission
  const userId = parseInt(session.user.id);
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'evenements.create');

  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission de créer des événements");
  }

  const body = await request.json();
  const validation = createEvenementSchema.safeParse(body);

  if (!validation.success) {
    // Formater les erreurs Zod en messages lisibles
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path.join('.') || 'general';
      if (!fieldErrors[field]) fieldErrors[field] = [];
      fieldErrors[field].push(issue.message);
    }
    
    const errorMessages = Object.values(fieldErrors).flat();
    throw new ValidationError(
      errorMessages.length === 1 ? errorMessages[0] : `${errorMessages.length} erreurs de validation`,
      { fieldErrors }
    );
  }

  const data = validation.data;

  // Créer l'événement avec statut EN_ATTENTE_VALIDATION
  const evenement = await prisma.evenement.create({
    data: {
      etablissementId: data.etablissementId,
      communeId: data.communeId,
      secteur: data.secteur,
      titre: data.titre.trim(),
      description: data.description.trim(),
      typeCategorique: data.typeCategorique,
      categorie: data.categorie,
      tags: data.tags || [],
      dateDebut: new Date(data.dateDebut),
      dateFin: data.dateFin ? new Date(data.dateFin) : null,
      heureDebut: data.heureDebut,
      heureFin: data.heureFin,
      lieu: data.lieu?.trim(),
      adresse: data.adresse?.trim(),
      quartierDouar: data.quartierDouar?.trim(),
      latitude: data.latitude,
      longitude: data.longitude,
      organisateur: data.organisateur?.trim(),
      contactOrganisateur: data.contactOrganisateur?.trim(),
      emailContact: data.emailContact?.trim() || undefined,
      capaciteMax: data.capaciteMax,
      inscriptionsOuvertes: data.inscriptionsOuvertes || false,
      lienInscription: data.lienInscription?.trim() || undefined,
      statut: 'EN_ATTENTE_VALIDATION',
      createdBy: userId,
    },
    include: {
      etablissement: { select: { nom: true } },
      commune: { select: { nom: true } },
    }
  });

  // Notifier les admins (non bloquant)
  try {
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          type: 'NOUVEL_EVENEMENT',
          titre: 'Nouvel événement à valider',
          message: `L'événement "${evenement.titre}" attend votre validation.`,
          lien: `/admin/evenements/${evenement.id}`,
        }))
      });
    }
  } catch (notifError) {
    console.error('Erreur notification (non bloquante):', notifError);
  }

  return NextResponse.json({
    success: true,
    message: 'Événement créé avec succès. Il sera visible après validation par un administrateur.',
    data: evenement 
  }, { status: 201 });
});

// GET - Liste des événements (Public: PUBLIEE/EN_ACTION/CLOTUREE)
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 100);
  const secteur = searchParams.get('secteur');
  const statut = searchParams.get('statut');
  const communeId = searchParams.get('communeId');
  const etablissementId = searchParams.get('etablissementId');
  const search = searchParams.get('search');
  const upcoming = searchParams.get('upcoming');

  const session = await getServerSession(authOptions);
  const isAdmin = session?.user?.role && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);
  const isDelegation = session?.user?.role === 'DELEGATION';

  // Construction du filtre
  const where: any = {};
  const now = new Date();

  // Pour le public: uniquement les événements publiés/en action/clôturés
  if (!isAdmin) {
    where.statut = { in: ['PUBLIEE', 'EN_ACTION', 'CLOTUREE'] };
  } else if (statut) {
    if (statut === 'EN_ACTION') {
      where.AND = [
        { statut: 'EN_ACTION' },
        {
          OR: [
            { dateFin: null },
            { dateFin: { gte: now } }
          ]
        }
      ];
    } else if (statut === 'A_CLOTURER') {
      where.dateFin = { lt: now };
      where.statut = { not: 'CLOTUREE' };
    } else {
      where.statut = statut;
    }
  }

  // Si délégation, montrer aussi ses propres événements en attente
  if (isDelegation && session?.user?.id) {
    where.OR = [
      { statut: { in: ['PUBLIEE', 'EN_ACTION', 'CLOTUREE'] } },
      { createdBy: parseInt(session.user.id) }
    ];
    delete where.statut;
  }

  // Filtres additionnels
  if (secteur) where.secteur = secteur;
  if (communeId) where.communeId = parseInt(communeId);
  if (etablissementId) where.etablissementId = parseInt(etablissementId);

  if (search) {
    where.OR = [
      { titre: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  // Événements à venir
  if (upcoming === 'true') {
    where.dateDebut = { gte: new Date() };
  }

  // Requête avec pagination
  const [evenements, total] = await Promise.all([
    prisma.evenement.findMany({
      where,
      include: {
        etablissement: { select: { nom: true, secteur: true } },
        commune: { select: { nom: true } },
        medias: { take: 1, select: { urlPublique: true } },
      },
      orderBy: isAdmin ? { createdAt: 'desc' } : { dateDebut: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evenement.count({ where })
  ]);

  return NextResponse.json(
    {
      success: true,
      data: evenements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    },
    {
      headers: {
        'Cache-Control': isAdmin ? 'no-store' : 'public, max-age=60, s-maxage=60',
      }
    }
  );
});
