import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { addDays, addWeeks, addMonths, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

// Schéma de validation pour création d'activité avec messages d'erreur clairs
const createActivitySchema = z.object({
  etablissementId: z.number({ message: "L'établissement est obligatoire" })
    .int()
    .positive({ message: "L'établissement sélectionné est invalide" }),
  
  date: z.string({ message: "La date est obligatoire" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (attendu: AAAA-MM-JJ)"),
  
  // Heures: accepte format simple (9, 10) ou HH:MM (09:00, 10:00)
  heureDebut: z.string({ message: "L'heure de début est obligatoire" })
    .refine(
      (val) => /^\d{1,2}(:\d{2})?$/.test(val),
      "Format d'heure invalide (ex: 9 ou 09:00)"
    ),
  
  heureFin: z.string({ message: "L'heure de fin est obligatoire" })
    .refine(
      (val) => /^\d{1,2}(:\d{2})?$/.test(val),
      "Format d'heure invalide (ex: 12 ou 12:00)"
    ),
  
  titre: z.string({ message: "Le titre est obligatoire" })
    .min(5, "Le titre doit contenir au moins 5 caractères")
    .max(150, "Le titre ne peut pas dépasser 150 caractères"),
  
  description: z.string().optional(),
  
  typeActivite: z.string({ message: "Le type d'activité est obligatoire" })
    .min(2, "Veuillez sélectionner un type d'activité valide"),
  
  responsableNom: z.string().optional(),
  participantsAttendus: z.number()
    .int()
    .positive("Le nombre de participants doit être positif")
    .optional(),
  lieu: z.string().optional(),
  isVisiblePublic: z.boolean().default(true),
  requireValidation: z.boolean().default(true),
  
  // Récurrence V1
  isRecurrent: z.boolean().default(false),
  recurrencePattern: z.enum(['DAILY', 'WEEKLY', 'MONTHLY', 'DAILY_NO_WEEKEND'], { 
    message: "Fréquence de récurrence invalide" 
  }).optional(),
  recurrenceEndDate: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date de fin de récurrence invalide")
    .optional(),
  recurrenceDays: z.array(z.number().min(0).max(6)).optional(), // 0=Sun, 1=Mon, etc.
});


// GET - Liste des programmes d'activités (avec filtres)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : null;
    const userRole = session?.user?.role;
    const { searchParams } = new URL(request.url);

    // Si non connecté ou public, appliquer filtres stricts
    const isPublic = !userId || userRole === 'CITOYEN';


    // Paramètres de filtrage
    const etablissementId = searchParams.get('etablissementId');
    const dateDebut = searchParams.get('dateDebut');
    const dateFin = searchParams.get('dateFin');
    const statut = searchParams.get('statut');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const skip = (page - 1) * limit;

    // Construire le filtre de base
    const where: any = {};

    // COORDINATEUR_ACTIVITES: Voir seulement ses établissements gérés
    if (userRole === 'COORDINATEUR_ACTIVITES' && userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { etablissementsGeres: true }
      });
      
      if (!user?.etablissementsGeres.length) {
        return NextResponse.json({
          success: true,
          data: [],
          message: 'Aucun établissement assigné'
        });
      }
      
      where.etablissementId = { in: user.etablissementsGeres };
    }

    // Public: Seulement activités validées et publiques
    if (isPublic) {
      where.isVisiblePublic = true;
      // where.statut = 'PUBLIEE'; // Si le champ est statut. Vérifier le schema.
      // Le code existant utilisait isValideParAdmin. Je garde ça.
      where.isValideParAdmin = true;
    }

    // Filtres additionnels
    if (etablissementId) {
      where.etablissementId = parseInt(etablissementId);
    }

    if (dateDebut && dateFin) {
      where.date = {
        gte: startOfDay(new Date(dateDebut)),
        lte: endOfDay(new Date(dateFin)),
      };
    } else if (dateDebut) {
      where.date = { gte: startOfDay(new Date(dateDebut)) };
    }

    if (statut) {
      // Support pour filtrer par plusieurs statuts séparés par des virgules
      if (statut.includes(',')) {
        where.statut = { in: statut.split(',') };
      } else {
        where.statut = statut;
      }
    }

    // Récupérer les activités
    const [activites, total] = await Promise.all([
      prisma.programmeActivite.findMany({
        where,
        include: {
          etablissement: {
            select: { id: true, nom: true, secteur: true }
          },
          createdByUser: {
            select: { id: true, nom: true, prenom: true }
          },
        },
        orderBy: [
          { date: 'asc' },
          { heureDebut: 'asc' }
        ],
        skip,
        take: limit,
      }),
      prisma.programmeActivite.count({ where }),
    ]);

    // Pour citoyens, cacher les infos de rapport
    const data = activites.map(a => {
      if (userRole === 'CITOYEN') {
        const { 
          presenceEffective, tauxPresence, commentaireDeroulement,
          difficultes, pointsPositifs, photosRapport, noteQualite,
          recommandations, rapportComplete, dateRapport,
          ...publicData 
        } = a;
        return publicData;
      }
      return a;
    });

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error('Erreur GET programmes-activites:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer un nouveau programme d'activité
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Vérifier la permission
    const userId = parseInt(session.user.id);
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(userId, 'programmes.create');

    if (!hasPermission) {
      return NextResponse.json({ 
        error: 'Accès non autorisé',
        message: 'Vous n\'avez pas la permission de créer des programmes'
      }, { status: 403 });
    }


    const body = await request.json();
    
    // Valider les données
    const parsed = createActivitySchema.safeParse(body);
    if (!parsed.success) {
      // Formater les erreurs de façon lisible
      const errorMessages = parsed.error.issues.map(issue => {
        const field = issue.path.join('.');
        return `${issue.message}`;
      });
      
      console.error('[API] Erreurs validation programme-activité:', {
        errors: parsed.error.issues,
        body
      });
      
      return NextResponse.json({
        error: 'Erreur de validation',
        message: errorMessages.join('. '),
        details: parsed.error.issues.map(issue => ({
          champ: issue.path.join('.') || 'formulaire',
          message: issue.message
        })),
      }, { status: 400 });
    }

    const data = parsed.data;

    // Si coordinateur, vérifier qu'il gère cet établissement
    if (session.user.role === 'COORDINATEUR_ACTIVITES') {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { etablissementsGeres: true }
      });

      if (!user?.etablissementsGeres.includes(data.etablissementId)) {
        return NextResponse.json({
          error: 'Établissement non autorisé',
          message: 'Vous ne gérez pas cet établissement'
        }, { status: 403 });
      }
    }

    // Vérifier que l'établissement existe
    const etablissement = await prisma.etablissement.findUnique({
      where: { id: data.etablissementId }
    });

    if (!etablissement) {
      return NextResponse.json({
        error: 'Établissement introuvable'
      }, { status: 404 });
    }

    // Créer l'activité principale en BROUILLON (visible uniquement par le coordinateur)
    const activite = await prisma.programmeActivite.create({
      data: {
        etablissementId: data.etablissementId,
        date: new Date(data.date),
        heureDebut: data.heureDebut,
        heureFin: data.heureFin,
        titre: data.titre,
        description: data.description,
        typeActivite: data.typeActivite,
        responsableNom: data.responsableNom,
        participantsAttendus: data.participantsAttendus,
        lieu: data.lieu,
        statut: 'BROUILLON' as any,           // Nouveau: commence en brouillon
        isVisiblePublic: false,         // Nouveau: visible seulement par coordinateur
        isValideParAdmin: false,        // Non validé par défaut
        requireValidation: data.requireValidation,
        isRecurrent: data.isRecurrent,
        recurrencePattern: data.recurrencePattern,
        recurrenceEndDate: data.recurrenceEndDate ? new Date(data.recurrenceEndDate) : null,
        recurrenceDays: data.recurrenceDays, // Save specific days for WEEKLY
        createdBy: userId,
      },
      include: {
        etablissement: {
          select: { id: true, nom: true, secteur: true }
        }
      }
    });

    // Si récurrence activée, générer les occurrences
    if (data.isRecurrent && data.recurrencePattern && data.recurrenceEndDate) {
      const endDate = new Date(data.recurrenceEndDate);
      const occurrences: any[] = [];
      let currentDate = new Date(data.date);
      
      // Setup for WEEKLY specific days
      const hasSpecificDays = data.recurrencePattern === 'WEEKLY' && data.recurrenceDays && data.recurrenceDays.length > 0;

      // Fonction pour calculer la prochaine date
      const getNextDate = (date: Date, pattern: string): Date => {
        switch (pattern) {
          case 'DAILY': return addDays(date, 1);
          case 'DAILY_NO_WEEKEND': {
              let next = addDays(date, 1);
              // Si Samedi (6), ajouter 2 jours -> Lundi (1)
              if (next.getDay() === 6) next = addDays(next, 2);
              // Si Dimanche (0), ajouter 1 jour -> Lundi (1)
              else if (next.getDay() === 0) next = addDays(next, 1);
              return next;
          }
          case 'WEEKLY': return addWeeks(date, 1); 
          case 'MONTHLY': return addMonths(date, 1);
          default: return addDays(date, 1);
        }
      };
      
      // Custom loop for WEEKLY with specific days
      if (hasSpecificDays) {
          // Iterate day by day until end date, checking if day is in recurrenceDays
           let iterDate = addDays(currentDate, 1); // Start checking from tomorrow
           let count = 0;
           const maxOccurrences = 100; // Safe limit

           while (count < maxOccurrences && !isAfter(iterDate, endDate)) {
               // Check if current day of week is in requested days
               if (data.recurrenceDays!.includes(iterDate.getDay())) {
                   occurrences.push({
                        etablissementId: data.etablissementId,
                        date: iterDate,
                        heureDebut: data.heureDebut,
                        heureFin: data.heureFin,
                        titre: data.titre,
                        description: data.description,
                        typeActivite: data.typeActivite,
                        responsableNom: data.responsableNom,
                        participantsAttendus: data.participantsAttendus,
                        lieu: data.lieu,
                        isVisiblePublic: data.isVisiblePublic,
                        requireValidation: data.requireValidation,
                        isRecurrent: true,
                        recurrencePattern: data.recurrencePattern,
                        recurrenceParentId: activite.id,
                        createdBy: userId,
                   });
                   count++;
               }
               iterDate = addDays(iterDate, 1);
           }
      } else {
        // Standard interval logic (DAILY, MONTHLY, or simple WEEKLY)
        let count = 0;
        const maxOccurrences = 52;
        
        while (count < maxOccurrences) {
            currentDate = getNextDate(currentDate, data.recurrencePattern);
            if (isAfter(currentDate, endDate)) break;
            
            occurrences.push({
            etablissementId: data.etablissementId,
            date: currentDate,
            heureDebut: data.heureDebut,
            heureFin: data.heureFin,
            titre: data.titre,
            description: data.description,
            typeActivite: data.typeActivite,
            responsableNom: data.responsableNom,
            participantsAttendus: data.participantsAttendus,
            lieu: data.lieu,
            isVisiblePublic: data.isVisiblePublic,
            requireValidation: data.requireValidation,
            isRecurrent: true,
            recurrencePattern: data.recurrencePattern,
            recurrenceParentId: activite.id,
            createdBy: userId,
            });
            
            count++;
        }
      }

      if (occurrences.length > 0) {
        await prisma.programmeActivite.createMany({
          data: occurrences
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: activite,
      message: data.isRecurrent 
        ? 'Activité récurrente créée avec succès' 
        : 'Activité créée avec succès'
    }, { status: 201 });

  } catch (error) {
    console.error('Erreur POST programmes-activites:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
