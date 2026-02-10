/**
 * Utilitaire de formatage des erreurs pour l'API
 * Transforme les erreurs Zod et Prisma en messages lisibles pour l'utilisateur
 * Compatible avec Zod v3 et v4
 */

import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

// Labels français pour les champs courants
const FIELD_LABELS: Record<string, string> = {
  // Établissement
  code: 'Code établissement',
  nom: 'Nom',
  nomArabe: 'Nom en arabe',
  secteur: 'Secteur',
  communeId: 'Commune',
  annexeId: 'Annexe',
  quartierDouar: 'Quartier/Douar',
  adresseComplete: 'Adresse complète',
  latitude: 'Latitude',
  longitude: 'Longitude',
  altitude: 'Altitude',
  zoneTypologie: 'Type de zone',
  accessibilite: 'Accessibilité',
  voieAcces: 'Voie d\'accès',
  distanceChefLieu: 'Distance au chef-lieu',
  transportPublic: 'Transport public',
  nature: 'Nature',
  tutelle: 'Tutelle',
  statutJuridique: 'Statut juridique',
  gestionnaire: 'Gestionnaire',
  responsableNom: 'Nom du responsable',
  anneeCreation: 'Année de création',
  anneeOuverture: 'Année d\'ouverture',
  telephone: 'Téléphone',
  email: 'Email',
  siteWeb: 'Site web',
  etatInfrastructure: 'État de l\'infrastructure',
  surfaceTotale: 'Surface totale',
  disponibiliteEau: 'Disponibilité eau',
  disponibiliteElectricite: 'Disponibilité électricité',
  connexionInternet: 'Connexion internet',
  effectifTotal: 'Effectif total',
  capaciteAccueil: 'Capacité d\'accueil',
  services: 'Services',
  programmes: 'Programmes',
  photoPrincipale: 'Photo principale',
  isPublie: 'Publié',
  isValide: 'Validé',
  isMisEnAvant: 'Mis en avant',
  statutFonctionnel: 'Statut fonctionnel',
  budgetAnnuel: 'Budget annuel',
  
  // Événements
  titre: 'Titre',
  description: 'Description',
  typeCategorique: 'Type d\'événement',
  dateDebut: 'Date de début',
  dateFin: 'Date de fin',
  heureDebut: 'Heure de début',
  heureFin: 'Heure de fin',
  lieu: 'Lieu',
  adresse: 'Adresse',
  capaciteMax: 'Capacité maximale',
  organisateur: 'Organisateur',
  contactOrganisateur: 'Contact organisateur',
  emailContact: 'Email de contact',
  inscriptionsOuvertes: 'Inscriptions ouvertes',
  lienInscription: 'Lien d\'inscription',
  etablissementId: 'Établissement',
  
  // Campagnes
  type: 'Type',
  contenu: 'Contenu',
  objectifParticipations: 'Objectif participations',
  couleurTheme: 'Couleur du thème',
  statut: 'Statut',
  
  // Actualités
  categorie: 'Catégorie',
  
  // Utilisateurs
  prenom: 'Prénom',
  motDePasse: 'Mot de passe',
  role: 'Rôle',
  
  // Réclamations  
  objet: 'Objet',
  message: 'Message',
  priorite: 'Priorité',
};

/**
 * Obtient le label français d'un champ
 */
function getFieldLabel(field: string): string {
  if (!field) return 'Ce champ';
  return FIELD_LABELS[field] || field.charAt(0).toUpperCase() + field.slice(1).replace(/([A-Z])/g, ' $1');
}

/**
 * Formate un message d'erreur Zod en message lisible
 */
function formatZodIssueMessage(issue: any): string {
  const fieldPath = issue.path?.join('.') || '';
  const lastField = issue.path?.[issue.path.length - 1] || fieldPath;
  const fieldLabel = getFieldLabel(String(lastField));
  
  // Utiliser directement le message Zod s'il existe (personnalisé dans le schéma)
  if (issue.message && !issue.message.includes('Expected') && !issue.message.includes('Required')) {
    // Si c'est un message personnalisé, l'utiliser
    return issue.message;
  }
  
  const code = issue.code;
  
  // Cas: champ requis mais absent
  if (code === 'invalid_type') {
    const received = issue.received;
    if (received === 'undefined' || received === 'null' || !received) {
      return `Le champ "${fieldLabel}" est obligatoire`;
    }
    const expected = issue.expected || 'valide';
    return `Le champ "${fieldLabel}" doit être de type ${expected}`;
  }
  
  // Cas: valeur trop petite
  if (code === 'too_small') {
    const minimum = issue.minimum;
    const valueType = issue.type;
    
    if (valueType === 'string') {
      if (minimum === 1) {
        return `Le champ "${fieldLabel}" est obligatoire`;
      }
      return `Le champ "${fieldLabel}" doit contenir au moins ${minimum} caractère(s)`;
    }
    if (valueType === 'number') {
      return `Le champ "${fieldLabel}" doit être supérieur ou égal à ${minimum}`;
    }
    if (valueType === 'array') {
      return `Le champ "${fieldLabel}" doit contenir au moins ${minimum} élément(s)`;
    }
    return `Le champ "${fieldLabel}" est trop petit`;
  }
  
  // Cas: valeur trop grande
  if (code === 'too_big') {
    const maximum = issue.maximum;
    const valueType = issue.type;
    
    if (valueType === 'string') {
      return `Le champ "${fieldLabel}" ne doit pas dépasser ${maximum} caractère(s)`;
    }
    if (valueType === 'number') {
      return `Le champ "${fieldLabel}" doit être inférieur ou égal à ${maximum}`;
    }
    return `Le champ "${fieldLabel}" est trop grand`;
  }
  
  // Cas: valeur enum invalide
  if (code === 'invalid_enum_value' || code === 'invalid_value') {
    const options = issue.options?.slice(0, 5).join(', ') || '';
    if (options) {
      return `Le champ "${fieldLabel}" doit être l'une des valeurs: ${options}`;
    }
    return `Valeur invalide pour le champ "${fieldLabel}"`;
  }
  
  // Cas: format string invalide (email, url, etc.)
  if (code === 'invalid_string' || code === 'invalid_format') {
    const validation = issue.validation || issue.format;
    if (validation === 'email') {
      return `Le champ "${fieldLabel}" doit être une adresse email valide`;
    }
    if (validation === 'url') {
      return `Le champ "${fieldLabel}" doit être une URL valide`;
    }
    return `Le format du champ "${fieldLabel}" est invalide`;
  }
  
  // Cas: date invalide
  if (code === 'invalid_date') {
    return `Le champ "${fieldLabel}" doit être une date valide`;
  }
  
  // Cas: erreur personnalisée
  if (code === 'custom') {
    return issue.message || `Erreur de validation sur "${fieldLabel}"`;
  }
  
  // Fallback: utiliser le message Zod directement
  return issue.message || `Erreur sur le champ "${fieldLabel}"`;
}

/**
 * Formate les erreurs Zod en un format lisible
 */
export function formatZodErrors(error: ZodError): {
  message: string;
  details: Array<{ field: string; message: string }>;
  fieldErrors: Record<string, string[]>;
} {
  const details: Array<{ field: string; message: string }> = [];
  const fieldErrors: Record<string, string[]> = {};
  
  const issues = error.issues || [];
  
  for (const issue of issues) {
    const field = issue.path?.join('.') || 'general';
    const message = formatZodIssueMessage(issue);
    
    details.push({ field, message });
    
    if (!fieldErrors[field]) {
      fieldErrors[field] = [];
    }
    fieldErrors[field].push(message);
  }
  
  // Message résumé
  const errorCount = issues.length;
  let summaryMessage: string;
  
  if (errorCount === 0) {
    summaryMessage = 'Données invalides';
  } else if (errorCount === 1) {
    summaryMessage = details[0].message;
  } else {
    summaryMessage = `${errorCount} erreurs de validation détectées`;
  }
  
  return {
    message: summaryMessage,
    details,
    fieldErrors,
  };
}

/**
 * Formate les erreurs Prisma en messages lisibles
 */
export function formatPrismaError(error: Prisma.PrismaClientKnownRequestError): {
  code: string;
  message: string;
  field?: string;
} {
  const meta = error.meta as Record<string, any> | undefined;
  
  switch (error.code) {
    case 'P2002': // Unique constraint violation
      const target = meta?.target as string[] | undefined;
      const field = target?.[0];
      const fieldLabel = field ? getFieldLabel(field) : 'Cette valeur';
      return {
        code: 'CONFLICT',
        message: `${fieldLabel} existe déjà. Veuillez utiliser une valeur différente.`,
        field,
      };
      
    case 'P2003': // Foreign key constraint failed
      const fkField = meta?.field_name as string | undefined;
      return {
        code: 'INVALID_REFERENCE',
        message: fkField 
          ? `La référence "${getFieldLabel(fkField)}" n'existe pas ou est invalide.`
          : 'Une référence vers une autre ressource est invalide.',
        field: fkField,
      };
      
    case 'P2025': // Record not found
      return {
        code: 'NOT_FOUND',
        message: 'La ressource demandée n\'existe pas ou a été supprimée.',
      };
      
    case 'P2014': // Required relation violation
      return {
        code: 'MISSING_RELATION',
        message: 'Une relation requise est manquante.',
      };
      
    case 'P2021': // Table does not exist
    case 'P2022': // Column does not exist
      return {
        code: 'DATABASE_ERROR',
        message: 'Erreur de configuration de la base de données. Contactez l\'administrateur.',
      };
      
    default:
      return {
        code: 'DATABASE_ERROR',
        message: 'Une erreur de base de données est survenue. Veuillez réessayer.',
      };
  }
}

/**
 * Crée une réponse d'erreur API standardisée
 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
    fieldErrors?: Record<string, string[]>;
    field?: string;
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  extra?: {
    details?: Array<{ field: string; message: string }>;
    fieldErrors?: Record<string, string[]>;
    field?: string;
  }
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      ...extra,
    },
  };
}
