import { z } from "zod";
import { Secteur, TypeZone, Accessibilite, EtatInfrastructure } from "@prisma/client";

// Schéma de validation des établissements (compatible Zod v4)
export const etablissementSchema = z.object({
    // Identification - REQUIS
    code: z.string()
      .min(1, "Le code d'établissement est obligatoire")
      .max(50, "Le code ne doit pas dépasser 50 caractères"),
    
    nom: z.string()
      .min(1, "Le nom de l'établissement est obligatoire")
      .max(200, "Le nom ne doit pas dépasser 200 caractères"),
    
    nomArabe: z.string()
      .max(200, "Le nom arabe ne doit pas dépasser 200 caractères")
      .optional()
      .nullable(),
    
    secteur: z.nativeEnum(Secteur),

    // Relations - REQUIS
    communeId: z.number()
      .int("L'identifiant de commune doit être un nombre entier")
      .positive("Veuillez sélectionner une commune"),
    
    annexeId: z.number()
      .int("L'identifiant d'annexe doit être un nombre entier")
      .positive("Identifiant d'annexe invalide")
      .optional()
      .nullable(),

    // Localisation
    quartierDouar: z.string()
      .max(100, "Le quartier/douar ne doit pas dépasser 100 caractères")
      .optional()
      .nullable(),
    
    adresseComplete: z.string()
      .max(500, "L'adresse ne doit pas dépasser 500 caractères")
      .optional()
      .nullable(),
    
    // Coordonnées GPS - REQUIS
    latitude: z.number()
      .min(-90, "La latitude doit être entre -90 et 90")
      .max(90, "La latitude doit être entre -90 et 90"),
    
    longitude: z.number()
      .min(-180, "La longitude doit être entre -180 et 180")
      .max(180, "La longitude doit être entre -180 et 180"),
    
    altitude: z.number()
      .optional()
      .nullable(),

    // Caractéristiques
    zoneTypologie: z.nativeEnum(TypeZone).optional().nullable(),
    
    accessibilite: z.nativeEnum(Accessibilite).optional().nullable(),
    
    voieAcces: z.string()
      .max(200, "La voie d'accès ne doit pas dépasser 200 caractères")
      .optional()
      .nullable(),
    
    distanceChefLieu: z.number()
      .min(0, "La distance ne peut pas être négative")
      .optional()
      .nullable(),
    
    transportPublic: z.string()
      .max(200, "Le transport public ne doit pas dépasser 200 caractères")
      .optional()
      .nullable(),

    // Infos Administratives
    nature: z.string()
      .max(100, "La nature ne doit pas dépasser 100 caractères")
      .optional()
      .nullable(),
    
    tutelle: z.string()
      .max(150, "La tutelle ne doit pas dépasser 150 caractères")
      .optional()
      .nullable(),
    
    statutJuridique: z.string()
      .max(100, "Le statut juridique ne doit pas dépasser 100 caractères")
      .optional()
      .nullable(),
    
    gestionnaire: z.string()
      .max(150, "Le gestionnaire ne doit pas dépasser 150 caractères")
      .optional()
      .nullable(),
    
    responsableNom: z.string()
      .max(150, "Le nom du responsable ne doit pas dépasser 150 caractères")
      .optional()
      .nullable(),
    
    anneeCreation: z.number()
      .int("L'année doit être un nombre entier")
      .min(1800, "L'année de création semble incorrecte (avant 1800)")
      .max(2100, "L'année de création semble incorrecte (après 2100)")
      .optional()
      .nullable(),
    
    anneeOuverture: z.number()
      .int("L'année doit être un nombre entier")
      .min(1800, "L'année d'ouverture semble incorrecte (avant 1800)")
      .max(2100, "L'année d'ouverture semble incorrecte (après 2100)")
      .optional()
      .nullable(),

    // Contact
    telephone: z.string()
      .max(20, "Le numéro de téléphone ne doit pas dépasser 20 caractères")
      .optional()
      .nullable(),
    
    email: z.string()
      .email("L'adresse email n'est pas valide")
      .max(100, "L'email ne doit pas dépasser 100 caractères")
      .optional()
      .nullable()
      .or(z.literal("")),
    
    siteWeb: z.string()
      .url("L'URL du site web n'est pas valide")
      .max(200, "L'URL ne doit pas dépasser 200 caractères")
      .optional()
      .nullable()
      .or(z.literal("")),

    // Infrastructure
    etatInfrastructure: z.nativeEnum(EtatInfrastructure).optional().nullable(),
    
    surfaceTotale: z.number()
      .min(0, "La surface ne peut pas être négative")
      .optional()
      .nullable(),
    
    disponibiliteEau: z.boolean().optional().nullable(),
    disponibiliteElectricite: z.boolean().optional().nullable(),
    connexionInternet: z.boolean().optional().nullable(),

    // RH & Capacité
    effectifTotal: z.number()
      .int("L'effectif doit être un nombre entier")
      .min(0, "L'effectif ne peut pas être négatif")
      .optional()
      .nullable(),
    
    capaciteAccueil: z.number()
      .int("La capacité doit être un nombre entier")
      .min(0, "La capacité ne peut pas être négative")
      .optional()
      .nullable(),

    // Services & Programmes
    services: z.array(z.string()).optional(),
    programmes: z.array(z.string()).optional(),

    // Données spécifiques
    donneesSpecifiques: z.record(z.any(), z.any()).optional(),

    // Médias & 3D
    photoPrincipale: z.string().max(500).optional().nullable(),
    modele3DUrl: z.string().max(500).optional().nullable(),
    couleurAffichage: z.string().max(20).optional().nullable(),
    iconePersonnalise: z.string().max(100).optional().nullable(),

    // Statut
    isPublie: z.boolean().optional(),
    isValide: z.boolean().optional(),
    isMisEnAvant: z.boolean().optional(),
    statutFonctionnel: z.string().max(50).optional().nullable(),

    // Financement
    sourcesFinancement: z.string().max(500).optional().nullable(),
    budgetAnnuel: z.number().min(0).optional().nullable(),
    partenaires: z.string().max(500).optional().nullable(),

    // Observations
    remarques: z.string().max(2000).optional().nullable(),
    besoinsUrgents: z.string().max(1000).optional().nullable(),
    projetsFuturs: z.string().max(1000).optional().nullable(),

    annee: z.number().int().default(2025),
});

export const etablissementUpdateSchema = etablissementSchema.partial();

export const etablissementFilterSchema = z.object({
    page: z.coerce.number()
      .int("Le numéro de page doit être un nombre entier")
      .positive("Le numéro de page doit être positif")
      .default(1),
    
    // SECURITY FIX: Limit max items to prevent data scraping
    limit: z.coerce.number()
      .int("La limite doit être un nombre entier")
      .positive("La limite doit être positive")
      .max(100, "La limite maximale est de 100 éléments par page")
      .default(4),
    
    search: z.string()
      .max(100, "La recherche ne doit pas dépasser 100 caractères")
      .optional(),
    
    secteur: z.nativeEnum(Secteur).optional(),
    
    communeId: z.coerce.number().int().positive().optional(),
    
    isPublie: z.string()
      .transform((val) => val === 'true')
      .optional(),
    
    isValide: z.string()
      .transform((val) => val === 'true')
      .optional(),
});
