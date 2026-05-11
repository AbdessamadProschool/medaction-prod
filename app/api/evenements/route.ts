import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { withErrorHandler } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError } from '@/lib/exceptions';
import { z } from 'zod';
import { SecurityValidation } from '@/lib/security/validation';

// Schéma de validation sécurisé pour création d'événement
const createEvenementSchema = z.object({
  etablissementId: SecurityValidation.schemas.id,
  communeId: SecurityValidation.schemas.id,
  secteur: z.enum(['EDUCATION', 'SANTE', 'SPORT', 'SOCIAL', 'CULTUREL', 'AUTRE']),
  titre: SecurityValidation.schemas.title,
  description: SecurityValidation.schemas.description,
  typeCategorique: z.string().min(1, "Le type d'événement est obligatoire").transform(SecurityValidation.sanitizeString),
  categorie: z.string().max(50).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  tags: z.array(z.string().max(30)).max(10).optional(),
  dateDebut: z.string().min(1, "La date de début est obligatoire"),
  dateFin: z.string().optional(),
  heureDebut: z.string().optional(),
  heureFin: z.string().optional(),
  lieu: z.string().max(200).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  adresse: z.string().max(300).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  quartierDouar: z.string().max(100).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  organisateur: z.string().max(100).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  contactOrganisateur: z.string().max(50).optional().transform(v => v ? SecurityValidation.sanitizeString(v) : undefined),
  emailContact: z.string().email().optional().or(z.literal('')),
  capaciteMax: z.number().int().min(0).optional(),
  inscriptionsOuvertes: z.boolean().optional(),
  lienInscription: z.string().url().optional().or(z.literal('')),
  isOrganiseParProvince: z.boolean().optional(),
  sousCouvertProvince: z.boolean().optional(),
});

// POST - Créer un événement
export const POST = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    throw new UnauthorizedError('Vous devez être connecté pour créer un événement');
  }

  const userId = parseInt(session.user.id);
  
  // Vérifier la permission
  const { checkPermission } = await import("@/lib/permissions");
  const hasPermission = await checkPermission(userId, 'evenements.create');

  if (!hasPermission) {
    throw new ForbiddenError("Vous n'avez pas la permission de créer des événements");
  }

  const body = await request.json();
  const validation = createEvenementSchema.safeParse(body);

  if (!validation.success) {
    throw validation.error;
  }

  const data = validation.data;

  // Créer l'événement
  const evenement = await prisma.evenement.create({
    data: {
      etablissementId: data.etablissementId,
      communeId: data.communeId,
      secteur: data.secteur,
      titre: data.titre,
      description: data.description,
      typeCategorique: data.typeCategorique,
      categorie: data.categorie,
      tags: data.tags || [],
      dateDebut: new Date(data.dateDebut),
      dateFin: data.dateFin ? new Date(data.dateFin) : null,
      heureDebut: data.heureDebut,
      heureFin: data.heureFin,
      lieu: data.lieu,
      adresse: data.adresse,
      quartierDouar: data.quartierDouar,
      latitude: data.latitude,
      longitude: data.longitude,
      organisateur: data.organisateur,
      contactOrganisateur: data.contactOrganisateur,
      emailContact: data.emailContact || undefined,
      capaciteMax: data.capaciteMax,
      inscriptionsOuvertes: data.inscriptionsOuvertes || false,
      lienInscription: data.lienInscription || undefined,
      isOrganiseParProvince: data.isOrganiseParProvince || false,
      sousCouvertProvince: data.sousCouvertProvince || false,
      statut: 'EN_ATTENTE_VALIDATION',
      createdBy: userId,
    },
    include: {
      etablissement: { select: { nom: true, nomArabe: true } },
      commune: { select: { nom: true, nomArabe: true } },
    }
  });

  // Notifier les admins (non-bloquant)
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
    console.warn('Erreur notification événement:', notifError);
  }

  // Use dynamic import for auditLog since it's used after response, or static import at top. Let's do static import.
  const { auditLog } = await import("@/lib/logger");
  auditLog('CREATE_EVENEMENT', 'Evenement', evenement.id, userId, {
    title: evenement.titre,
    secteur: evenement.secteur,
    etablissementId: evenement.etablissementId
  });

  return NextResponse.json({
    success: true,
    message: 'Événement créé avec succès. Il sera visible après validation.',
    data: evenement 
  }, { status: 201 });
});

// GET - Liste des événements
export const GET = withErrorHandler(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  
  // SECURITY FIX: Use secure pagination
  const { page, limit } = SecurityValidation.validatePagination(
    searchParams.get('page'),
    searchParams.get('limit')
  );
  
  const secteur = searchParams.get('secteur');
  const statut = searchParams.get('statut');
  const communeIdRaw = searchParams.get('communeId');
  const etablissementIdRaw = searchParams.get('etablissementId');
  const annexeIdRaw = searchParams.get('annexeId');
  const search = searchParams.get('search');
  const upcoming = searchParams.get('upcoming');

  const session = await getServerSession(authOptions);
  const isAdminOrGouv = session?.user?.role && ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR'].includes(session.user.role);
  const isDelegation = session?.user?.role === 'DELEGATION';

  // Construction du filtre sécurisé
  const andConditions: any[] = [];
  const now = new Date();

  // 1. Filtrage de base selon le rôle
  if (!isAdminOrGouv && !isDelegation) {
    andConditions.push({ statut: { in: ['PUBLIEE', 'EN_ACTION', 'CLOTUREE'] } });
  } else if (isDelegation && session?.user?.id) {
    andConditions.push({
      OR: [
        { statut: { in: ['PUBLIEE', 'EN_ACTION', 'CLOTUREE'] } },
        { createdBy: parseInt(session.user.id) }
      ]
    });
  }

  // 2. Filtres optionnels
  if (statut) {
    if (statut === 'EN_ACTION') {
      // Un événement est "en cours" s'il a le statut EN_ACTION 
      // OU s'il est PUBLIE et que nous sommes entre la date de début et la date de fin
      andConditions.push({
        OR: [
          { statut: 'EN_ACTION' },
          {
            AND: [
              { statut: 'PUBLIEE' },
              { dateDebut: { lte: now } },
              { OR: [{ dateFin: null }, { dateFin: { gte: now } }] }
            ]
          }
        ]
      });
    } else if (statut === 'CLOTUREE') {
      // Un événement est "terminé" s'il a le statut CLOTUREE
      // OU s'il est PUBLIE et que la date de fin est passée
      andConditions.push({
        OR: [
          { statut: 'CLOTUREE' },
          {
            AND: [
              { statut: 'PUBLIEE' },
              { dateFin: { not: null } },
              { dateFin: { lt: now } }
            ]
          }
        ]
      });
    } else if (statut === 'A_CLOTURER' && isAdminOrGouv) {
      andConditions.push({ dateFin: { lt: now } });
      andConditions.push({ statut: { not: 'CLOTUREE' } });
    } else if (statut !== 'all' && statut !== 'upcoming' && statut !== 'A_CLOTURER') {
      andConditions.push({ statut });
    }
  }

  if (secteur) andConditions.push({ secteur });
  
  if (communeIdRaw) {
    const id = SecurityValidation.validateId(communeIdRaw);
    if (id) andConditions.push({ communeId: id });
  }
  
  if (etablissementIdRaw) {
    const id = SecurityValidation.validateId(etablissementIdRaw);
    if (id) andConditions.push({ etablissementId: id });
  }
  
  if (annexeIdRaw) {
    const id = SecurityValidation.validateId(annexeIdRaw);
    if (id) andConditions.push({ etablissement: { annexeId: id } });
  }

  if (search) {
    const sanitized = SecurityValidation.sanitizeString(search);
    andConditions.push({
      OR: [
        { titre: { contains: sanitized, mode: 'insensitive' } },
        { description: { contains: sanitized, mode: 'insensitive' } },
      ]
    });
  }

  if (upcoming === 'true') {
    andConditions.push({ dateDebut: { gte: now } });
  }

  const dateDebutRaw = searchParams.get('dateDebut');
  const dateFinRaw = searchParams.get('dateFin');
  if (dateDebutRaw) {
    andConditions.push({ dateDebut: { gte: new Date(dateDebutRaw) } });
  }
  if (dateFinRaw) {
    const dFin = new Date(dateFinRaw);
    dFin.setHours(23, 59, 59, 999);
    andConditions.push({ dateDebut: { lte: dFin } });
  }

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  const [evenements, total] = await Promise.all([
    prisma.evenement.findMany({
      where,
      include: {
        etablissement: { select: { nom: true, nomArabe: true, secteur: true } },
        commune: { select: { nom: true, nomArabe: true } },
        medias: { take: 1, select: { urlPublique: true } },
        createdByUser: { select: { nom: true, prenom: true } },
      },
      orderBy: isAdminOrGouv ? { createdAt: 'desc' } : { dateDebut: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.evenement.count({ where })
  ]);

  return NextResponse.json({
    success: true,
    data: evenements,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  }, {
    headers: {
      'Cache-Control': isAdminOrGouv ? 'no-store' : 'public, max-age=60, s-maxage=60',
    }
  });
});
