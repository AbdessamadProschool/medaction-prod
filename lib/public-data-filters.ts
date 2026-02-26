/**
 * ════════════════════════════════════════════════════════════════════════════
 * FILTRES DE DONNÉES PUBLIQUES - MEDACTION
 * ════════════════════════════════════════════════════════════════════════════
 * 
 * Ces utilitaires filtrent les données sensibles avant de les renvoyer
 * dans les réponses API publiques (non authentifiées).
 * 
 * Principe de sécurité:
 * - Les APIs publiques ne renvoient JAMAIS de données sensibles
 * - Les champs personnels (emails, téléphones) sont exclus
 * - Seules les données publiées/validées sont retournées
 * 
 * ════════════════════════════════════════════════════════════════════════════
 */

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════

export interface PublicEtablissement {
  id: number;
  code: string;
  nom: string;
  nomArabe?: string | null;
  secteur: string;
  latitude: number;
  longitude: number;
  adresse?: string | null;
  description?: string | null;
  photoUrl?: string | null;
  commune?: {
    id: number;
    nom: string;
    nomArabe?: string | null;
  } | null;
  annexe?: {
    id: number;
    nom: string;
  } | null;
  // Note moyenne (calculée)
  noteMoyenne?: number | null;
  // Nombre d'événements associés
  nombreEvenements?: number;
  // Nombre de réclamations (sans détails!)
  nombreReclamations?: number;
}

export interface PublicEvenement {
  id: number;
  titre: string;
  description?: string | null;
  dateDebut: Date | string;
  dateFin?: Date | string | null;
  lieu?: string | null;
  imageUrl?: string | null;
  statut: string;
  categorie?: string | null;
  etablissement?: {
    id: number;
    nom: string;
  } | null;
}

export interface PublicActualite {
  id: number;
  titre: string;
  contenu?: string | null;
  resume?: string | null;
  imageUrl?: string | null;
  datePublication: Date | string;
  categorie?: string | null;
  auteur?: string | null; // Nom public uniquement, pas d'email
}

export interface PublicArticle {
  id: number;
  titre: string;
  contenu?: string | null;
  resume?: string | null;
  imageUrl?: string | null;
  datePublication: Date | string;
  categorie?: string | null;
  tags?: string[];
}

export interface PublicCampagne {
  id: number;
  titre: string;
  description?: string | null;
  dateDebut: Date | string;
  dateFin?: Date | string | null;
  imageUrl?: string | null;
  statut: string;
  objectif?: string | null;
}

// ═══════════════════════════════════════════════════════════════════
// FONCTIONS DE FILTRAGE
// ═══════════════════════════════════════════════════════════════════

/**
 * Filtre un établissement pour l'API publique
 * Retire les informations sensibles (contacts, budgets, etc.)
 */
export function filterPublicEtablissement(etablissement: any): PublicEtablissement {
  return {
    id: etablissement.id,
    code: etablissement.code,
    nom: etablissement.nom,
    nomArabe: etablissement.nomArabe || null,
    secteur: etablissement.secteur,
    latitude: etablissement.latitude,
    longitude: etablissement.longitude,
    adresse: etablissement.adresse || null,
    description: etablissement.description || null,
    photoUrl: etablissement.photoUrl || null,
    commune: etablissement.commune ? {
      id: etablissement.commune.id,
      nom: etablissement.commune.nom,
      nomArabe: etablissement.commune.nomArabe || null,
    } : null,
    annexe: etablissement.annexe ? {
      id: etablissement.annexe.id,
      nom: etablissement.annexe.nom,
    } : null,
    noteMoyenne: etablissement.evaluations 
      ? calculateAverageRating(etablissement.evaluations)
      : null,
    nombreEvenements: etablissement._count?.evenements || 0,
    nombreReclamations: etablissement._count?.reclamations || 0,
  };
}

/**
 * Filtre un événement pour l'API publique
 */
export function filterPublicEvenement(evenement: any): PublicEvenement {
  return {
    id: evenement.id,
    titre: evenement.titre,
    description: evenement.description || null,
    dateDebut: evenement.dateDebut,
    dateFin: evenement.dateFin || null,
    lieu: evenement.lieu || null,
    imageUrl: evenement.imageUrl || null,
    statut: evenement.statut,
    categorie: evenement.categorie || null,
    etablissement: evenement.etablissement ? {
      id: evenement.etablissement.id,
      nom: evenement.etablissement.nom,
    } : null,
  };
}

/**
 * Filtre une actualité pour l'API publique
 */
export function filterPublicActualite(actualite: any): PublicActualite {
  return {
    id: actualite.id,
    titre: actualite.titre,
    contenu: actualite.contenu || null,
    resume: actualite.resume || null,
    imageUrl: actualite.imageUrl || null,
    datePublication: actualite.datePublication || actualite.createdAt,
    categorie: actualite.categorie || null,
    // Nom public de l'auteur uniquement (pas d'email!)
    auteur: actualite.auteur?.prenom && actualite.auteur?.nom 
      ? `${actualite.auteur.prenom} ${actualite.auteur.nom}`
      : null,
  };
}

/**
 * Filtre un article pour l'API publique
 */
export function filterPublicArticle(article: any): PublicArticle {
  return {
    id: article.id,
    titre: article.titre,
    contenu: article.contenu || null,
    resume: article.resume || null,
    imageUrl: article.imageUrl || null,
    datePublication: article.datePublication || article.createdAt,
    categorie: article.categorie || null,
    tags: article.tags || [],
  };
}

/**
 * Filtre une campagne pour l'API publique
 */
export function filterPublicCampagne(campagne: any): PublicCampagne {
  return {
    id: campagne.id,
    titre: campagne.titre,
    description: campagne.description || null,
    dateDebut: campagne.dateDebut,
    dateFin: campagne.dateFin || null,
    imageUrl: campagne.imageUrl || null,
    statut: campagne.statut,
    objectif: campagne.objectif || null,
  };
}

// ═══════════════════════════════════════════════════════════════════
// UTILITAIRES
// ═══════════════════════════════════════════════════════════════════

/**
 * Calcule la note moyenne à partir des évaluations
 */
function calculateAverageRating(evaluations: any[]): number | null {
  if (!evaluations || evaluations.length === 0) return null;
  
  const total = evaluations.reduce((sum, e) => sum + (e.note || 0), 0);
  return Math.round((total / evaluations.length) * 10) / 10;
}

/**
 * Filtre les données pour la carte (version légère)
 */
export function filterMapData(etablissements: any[]): any[] {
  return etablissements.map(e => ({
    id: e.id,
    nom: e.nom,
    secteur: e.secteur,
    latitude: e.latitude,
    longitude: e.longitude,
    photoUrl: e.photoUrl || null,
    noteMoyenne: e.evaluations 
      ? calculateAverageRating(e.evaluations)
      : null,
    nombreEvenements: e._count?.evenements || 0,
    nombreReclamations: e._count?.reclamations || 0,
  }));
}

// ═══════════════════════════════════════════════════════════════════
// CHAMPS SENSIBLES À NE JAMAIS EXPOSER
// ═══════════════════════════════════════════════════════════════════

/**
 * Liste des champs à ne JAMAIS inclure dans les réponses publiques
 */
export const SENSITIVE_FIELDS = [
  'email',
  'telephone',
  'motDePasse',
  'passwordHash',
  'password',
  'token',
  'refreshToken',
  'secret',
  'apiKey',
  'budgetAnnuel',
  'sourcesFinancement',
  'ipAddress',
  'userAgent',
  'cin',
  'dateNaissance',
  'adressePersonnelle',
] as const;

/**
 * Supprime les champs sensibles d'un objet
 */
export function removeSensitiveFields<T extends Record<string, any>>(obj: T): Partial<T> {
  const result: Record<string, any> = { ...obj };
  
  for (const field of SENSITIVE_FIELDS) {
    if (field in result) {
      delete result[field];
    }
  }
  
  // Récursion pour les objets imbriqués
  for (const key in result) {
    if (result[key] && typeof result[key] === 'object' && !Array.isArray(result[key])) {
      result[key] = removeSensitiveFields(result[key] as Record<string, any>);
    }
  }
  
  return result as Partial<T>;
}
