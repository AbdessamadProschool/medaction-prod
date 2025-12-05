import { z } from "zod";
import { Secteur, TypeZone, Accessibilite, EtatInfrastructure, StatutReclamation } from "@prisma/client";

// Helper for optional empty string to undefined
const emptyStringToUndefined = z.literal("").transform(() => undefined);

export const etablissementSchema = z.object({
    code: z.string().min(1, "Le code est requis"),
    nom: z.string().min(1, "Le nom est requis"),
    nomArabe: z.string().optional().nullable(),
    secteur: z.nativeEnum(Secteur),

    // Relations
    communeId: z.number().int().positive(),
    annexeId: z.number().int().positive().optional().nullable(),

    // Localisation
    quartierDouar: z.string().optional().nullable(),
    adresseComplete: z.string().optional().nullable(),
    latitude: z.number(),
    longitude: z.number(),
    altitude: z.number().optional().nullable(),

    // Caractéristiques
    zoneTypologie: z.nativeEnum(TypeZone).optional().nullable(),
    accessibilite: z.nativeEnum(Accessibilite).optional().nullable(),
    voieAcces: z.string().optional().nullable(),
    distanceChefLieu: z.number().optional().nullable(),
    transportPublic: z.string().optional().nullable(),

    // Infos Admin
    nature: z.string().optional().nullable(),
    tutelle: z.string().optional().nullable(),
    statutJuridique: z.string().optional().nullable(),
    gestionnaire: z.string().optional().nullable(),
    responsableNom: z.string().optional().nullable(),
    anneeCreation: z.number().int().optional().nullable(),
    anneeOuverture: z.number().int().optional().nullable(),

    // Contact
    telephone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable().or(z.literal("")),
    siteWeb: z.string().url().optional().nullable().or(z.literal("")),

    // Infrastructure
    etatInfrastructure: z.nativeEnum(EtatInfrastructure).optional().nullable(),
    surfaceTotale: z.number().optional().nullable(),
    disponibiliteEau: z.boolean().optional().nullable(),
    disponibiliteElectricite: z.boolean().optional().nullable(),
    connexionInternet: z.boolean().optional().nullable(),

    // RH & Capacité
    effectifTotal: z.number().int().optional().nullable(),
    capaciteAccueil: z.number().int().optional().nullable(),

    // Services & Programmes
    services: z.array(z.string()).optional(),
    programmes: z.array(z.string()).optional(),

    // Données spécifiques
    donneesSpecifiques: z.record(z.any(), z.any()).optional(),

    // Médias & 3D
    photoPrincipale: z.string().optional().nullable(),
    modele3DUrl: z.string().optional().nullable(),
    couleurAffichage: z.string().optional().nullable(),
    iconePersonnalise: z.string().optional().nullable(),

    // Statut
    isPublie: z.boolean().optional(),
    isValide: z.boolean().optional(),
    isMisEnAvant: z.boolean().optional(),
    statutFonctionnel: z.string().optional().nullable(),

    // Financement
    sourcesFinancement: z.string().optional().nullable(),
    budgetAnnuel: z.number().optional().nullable(),
    partenaires: z.string().optional().nullable(),

    // Observations
    remarques: z.string().optional().nullable(),
    besoinsUrgents: z.string().optional().nullable(),
    projetsFuturs: z.string().optional().nullable(),

    annee: z.number().int().default(2025),
});

export const etablissementUpdateSchema = etablissementSchema.partial();

export const etablissementFilterSchema = z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().default(4),
    search: z.string().optional(),
    secteur: z.nativeEnum(Secteur).optional(),
    communeId: z.coerce.number().int().positive().optional(),
    isPublie: z.string().transform((val) => val === 'true').optional(),
    isValide: z.string().transform((val) => val === 'true').optional(),
});
