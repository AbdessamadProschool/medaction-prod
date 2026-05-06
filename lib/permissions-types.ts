// 🔹 DÉFINITIONS DES TYPES DE PERMISSIONS (Pure TS, aucun import DB)

// Type pour les codes de permission - Exhaustif selon la mission RBAC
export type PermissionCode = 
  // --- AUTHENTIFICATION ---
  | 'auth.login' 
  | 'auth.register'
  | 'auth.logout'
  | 'auth.reset-password'
  
  // --- UTILISATEURS ---
  | 'users.read'       
  | 'users.read.full'  
  | 'users.create'
  | 'users.edit'
  | 'users.edit.role'
  | 'users.delete'     
  | 'users.hard-delete' 
  | 'users.activate'
  | 'users.reset-password'  // Réinitialiser le mot de passe d'un autre utilisateur
  | 'users.manage-2fa'      // Gérer le 2FA d'un autre utilisateur
  | 'users.delete.all'      // Supprimer n'importe quel utilisateur (sauf SUPER_ADMIN)
  | 'users.security'   
  | 'users.me.read'    
  | 'users.me.edit'    

  // --- RÉCLAMATIONS ---
  | 'reclamations.read'       
  | 'reclamations.read.all'   
  | 'reclamations.read.assigned' 
  | 'reclamations.create'
  | 'reclamations.edit'       
  | 'reclamations.delete'
  | 'reclamations.archive'
  | 'reclamations.assign'    
  | 'reclamations.validate'   
  | 'reclamations.resolve'    
  | 'reclamations.comment.internal' 

  // --- ÉVÉNEMENTS ---
  | 'evenements.read'
  | 'evenements.read.all'     
  | 'evenements.create'
  | 'evenements.edit'
  | 'evenements.edit.all'     
  | 'evenements.delete'
  | 'evenements.validate'     
  | 'evenements.feature'      
  | 'evenements.subscribe'
  | 'evenements.participate'
  | 'evenements.report'

  // --- ACTUALITÉS ---
  | 'actualites.read'
  | 'actualites.create'
  | 'actualites.edit'
  | 'actualites.delete'
  | 'actualites.publish'      
  | 'actualites.validate'

  // --- ÉTABLISSEMENTS ---
  | 'etablissements.read'
  | 'etablissements.create'
  | 'etablissements.edit'
  | 'etablissements.delete'
  | 'etablissements.validate'
  | 'etablissements.publish'
  | 'etablissements.subscribe'
  | 'etablissements.request.create'
  | 'etablissements.request.edit'

  // --- ÉVALUATIONS ---
  | 'evaluations.read'
  | 'evaluations.create'
  | 'evaluations.edit'
  | 'evaluations.delete'
  | 'evaluations.validate'   
  | 'evaluations.report'     

  // --- CAMPAGNES ---
  | 'campagnes.read'
  | 'campagnes.create'
  | 'campagnes.edit'
  | 'campagnes.delete'
  | 'campagnes.activate'     
  | 'campagnes.participate'

  // --- PROGRAMMES ACTIVITÉS ---
  | 'programmes.read'
  | 'programmes.create'
  | 'programmes.edit'
  | 'programmes.delete'
  | 'programmes.validate'
  | 'programmes.report'      

  // --- SUGGESTIONS ---
  | 'suggestions.create'
  | 'suggestions.read.own'
  | 'suggestions.validate'
  | 'suggestions.read.all'

  // --- STATS & RAPPORTS ---
  | 'stats.view.global'      
  | 'stats.view.secteur'
  | 'stats.view.commune'
  | 'stats.view.etablissement'
  | 'reports.export'         
  | 'bilans.read'            

  // --- CARTOGRAPHIE ---
  | 'map.view'
  | 'map.view.full'          

  // --- SYSTÈME & ADMIN ---
  | 'system.settings.read'
  | 'system.settings.edit'
  | 'system.logs.view'
  | 'system.backup'
  | 'system.restore'
  | 'system.import'
  | 'system.license.read'
  | 'permissions.manage'     
  | 'communes.manage';       

// Labels pour l'affichage (UI)
export const PERMISSION_LABELS: Record<PermissionCode, string> = {
  // Auth
  'auth.login': 'Se connecter',
  'auth.register': "S'inscrire",
  'auth.logout': 'Se déconnecter',
  'auth.reset-password': 'Réinitialiser mot de passe',

  // Users
  'users.read': 'Voir utilisateurs (basique)',
  'users.read.full': 'Voir utilisateurs (complet)',
  'users.create': 'Créer utilisateur',
  'users.edit': 'Modifier utilisateur',
  'users.edit.role': 'Changer rôle',
  'users.delete': 'Supprimer utilisateur (Soft)',
  'users.hard-delete': 'Supprimer définitivement (Hard)',
  'users.activate': 'Activer/Désactiver compte',
  'users.reset-password': 'Réinitialiser mot de passe utilisateur',
  'users.manage-2fa': 'Gérer 2FA utilisateur',
  'users.delete.all': 'Supprimer tout utilisateur (sauf Super Admin)',
  'users.security': 'Voir infos sécurité',
  'users.me.read': 'Voir mon profil',
  'users.me.edit': 'Modifier mon profil',

  // Reclamations
  'reclamations.read': 'Voir ses réclamations',
  'reclamations.read.all': 'Voir toutes les réclamations',
  'reclamations.read.assigned': 'Voir réclamations affectées',
  'reclamations.create': 'Créer réclamation',
  'reclamations.edit': 'Modifier réclamation',
  'reclamations.delete': 'Supprimer réclamation',
  'reclamations.archive': 'Archiver réclamation',
  'reclamations.assign': 'Affecter réclamation',
  'reclamations.validate': 'Valider/Rejeter décision',
  'reclamations.resolve': 'Marquer comme résolue',
  'reclamations.comment.internal': 'Ajouter commentaire interne',

  // Evenements
  'evenements.read': 'Voir événements',
  'evenements.read.all': 'Voir tous événements (admin)',
  'evenements.create': 'Créer événement',
  'evenements.edit': 'Modifier événement propre',
  'evenements.edit.all': 'Modifier tout événement',
  'evenements.delete': 'Supprimer événement',
  'evenements.validate': 'Valider événement',
  'evenements.feature': 'Mettre événement en avant',
  'evenements.subscribe': "S'inscrire à un événement",
  'evenements.participate': "Participer à un événement",
  'evenements.report': "Voir bilan événement",

  // Actualites
  'actualites.read': 'Lire actualités',
  'actualites.create': 'Créer actualité',
  'actualites.edit': 'Modifier actualité',
  'actualites.delete': 'Supprimer actualité',
  'actualites.publish': 'Publier actualité',
  'actualites.validate': 'Valider actualité',

  // Etablissements
  'etablissements.read': 'Voir établissements',
  'etablissements.create': 'Créer établissement',
  'etablissements.edit': 'Modifier établissement',
  'etablissements.delete': 'Supprimer établissement',
  'etablissements.validate': 'Valider établissement',
  'etablissements.publish': 'Publier établissement',
  'etablissements.subscribe': "S'abonner établissement",
  'etablissements.request.create': "Demander la création d'établissement",
  'etablissements.request.edit': "Demander la modification d'établissement",

  // Evaluations
  'evaluations.read': 'Lire évaluations',
  'evaluations.create': 'Evaluer',
  'evaluations.edit': 'Modifier évaluation',
  'evaluations.delete': 'Supprimer évaluation',
  'evaluations.validate': 'Modérer évaluation',
  'evaluations.report': 'Signaler évaluation',

  // Campagnes
  'campagnes.read': 'Voir campagnes',
  'campagnes.create': 'Créer campagne',
  'campagnes.edit': 'Modifier campagne',
  'campagnes.delete': 'Supprimer campagne',
  'campagnes.activate': 'Gérer statut campagne',
  'campagnes.participate': 'Participer campagne',

  // Programmes
  'programmes.read': 'Voir programmes',
  'programmes.create': 'Créer programme',
  'programmes.edit': 'Modifier programme',
  'programmes.delete': 'Supprimer programme',
  'programmes.validate': 'Valider programme',
  'programmes.report': 'Remplir rapport activité',

  // Suggestions
  'suggestions.create': 'Créer suggestion',
  'suggestions.read.own': 'Voir mes suggestions',
  'suggestions.validate': 'Valider/Répondre aux suggestions',
  'suggestions.read.all': 'Voir toutes les suggestions',

  // Stats
  'stats.view.global': 'Voir stats globales',
  'stats.view.secteur': 'Voir stats secteur',
  'stats.view.commune': 'Voir stats commune',
  'stats.view.etablissement': 'Voir stats établissement',
  'reports.export': 'Exporter rapports',
  'bilans.read': 'Consulter les bilans et rapports récapitulatifs',

  // Map
  'map.view': 'Voir carte',
  'map.view.full': 'Voir carte avancée',

  // System
  'system.settings.read': 'Voir paramètres',
  'system.settings.edit': 'Modifier paramètres',
  'system.logs.view': 'Voir logs',
  'system.backup': 'Gérer backups',
  'system.restore': 'Restaurer système',
  'system.import': 'Importer des données Excel/CSV',
  'system.license.read': 'Consulter les informations de licence',
  'permissions.manage': 'Gérer permissions',
  'communes.manage': 'Gérer communes',
};

// --- MAPPING RÔLES PAR DÉFAUT ---

export const ROLE_DEFAULT_PERMISSIONS: Record<string, PermissionCode[]> = {
  'CITOYEN': [
    'auth.login', 'auth.logout', 'auth.reset-password',
    'users.me.read', 'users.me.edit',
    'reclamations.create', 'reclamations.read', 'reclamations.edit', 'reclamations.delete',
    'etablissements.read', 'etablissements.subscribe',
    'evenements.read', 'evenements.subscribe', 'evenements.participate',
    'evaluations.create', 'evaluations.read', 'evaluations.edit', 'evaluations.delete', 'evaluations.report',
    'actualites.read',
    'campagnes.read', 'campagnes.participate',
    'suggestions.create', 'suggestions.read.own',
    'map.view'
  ] as PermissionCode[],

  'DELEGATION': [
    // Base - SANS héritage complet CITOYEN
    'auth.login', 'auth.logout', 'auth.reset-password',
    'users.me.read', 'users.me.edit',
    'map.view',
    'actualites.read', 'campagnes.read', 'evenements.read', 'etablissements.read', // Lecture de base

    // Métier Spécifique
    'evenements.create', 'evenements.edit', 'evenements.delete', 'evenements.report', // Scope secteur
    'actualites.create', 'actualites.edit', 'actualites.delete', 'actualites.publish',
    'campagnes.create', 'campagnes.edit', 'campagnes.activate', // Scope
    'etablissements.request.create', 'etablissements.request.edit',
    'stats.view.secteur', 'stats.view.etablissement'
  ] as PermissionCode[],

  'AUTORITE_LOCALE': [
    // Base
    'auth.login', 'auth.logout', 'auth.reset-password',
    'users.me.read', 'users.me.edit',
    'map.view',
    'actualites.read', 'campagnes.read', 'evenements.read', 'etablissements.read',

    // Métier
    'users.read',
    'reclamations.read.assigned', 'reclamations.resolve', 'reclamations.comment.internal',
    'reclamations.assign',
    'evenements.report',
    'stats.view.commune', 'stats.view.etablissement'
  ] as PermissionCode[],

  'COORDINATEUR_ACTIVITES': [
    // Base
    'auth.login', 'auth.logout', 'auth.reset-password',
    'users.me.read', 'users.me.edit',
    'map.view',
    'actualites.read', 'campagnes.read', 'evenements.read', 'etablissements.read',

    // Métier
    'programmes.create', 'programmes.edit', 'programmes.delete', 'programmes.report',
    'programmes.read', 
    'etablissements.request.create', 'etablissements.request.edit',
    'stats.view.etablissement'
  ] as PermissionCode[],

  'ADMIN': [
    // ROLE "ADMIN" DE BASE : ACCÈS STRICTEMENT LIMITÉ
    // Le Super Admin doit attribuer explicitement les permissions via le panneau RBAC.
    
    // Base minimale (Login, Profil)
    'auth.login', 'auth.logout', 'auth.reset-password',
    'users.me.read', 'users.me.edit',
    
    // Lecture de base (Citoyen-like) pour ne pas casser l'interface
    'map.view',
    'actualites.read', 'campagnes.read', 'evenements.read', 'etablissements.read'
  ] as PermissionCode[],

  'GOUVERNEUR': [
    // Base
    'auth.login', 'auth.logout', 'auth.reset-password',
    'users.me.read', 'users.me.edit',
    
    // Read-only Global
    'users.read',
    'reclamations.read.all',
    'evenements.read.all',
    'actualites.read',
    'etablissements.read',
    'campagnes.read',
    'programmes.read',
    'bilans.read',
    'stats.view.global', 'stats.view.secteur', 'stats.view.commune', 'stats.view.etablissement',
    'reports.export',
    'map.view.full',
    'reclamations.read',
    'reclamations.assign'
  ] as PermissionCode[]
};

// LISTE COMPLÈTE DISPONIBLE POUR LES ADMINS (A attribuer via l'UI)
export const AVAILABLE_ADMIN_PERMISSIONS: PermissionCode[] = [
    // --- Gestion Utilisateurs ---
    'users.read', 'users.read.full', 'users.create', 'users.edit', 'users.edit.role',
    'users.activate', 'users.delete', 'users.delete.all', 'users.hard-delete',
    'users.reset-password', 'users.manage-2fa', 'users.security',

    // --- Réclamations ---
    'reclamations.read.all', 'reclamations.validate', 'reclamations.assign', 'reclamations.archive',

    // --- Événements ---
    'evenements.read.all', 'evenements.validate', 'evenements.delete', 'evenements.feature', 'evenements.edit.all', 'evenements.report',

    // --- Actualités ---
    'actualites.validate', 'actualites.publish', 'actualites.delete',

    // --- Établissements ---
    'etablissements.create', 'etablissements.edit', 'etablissements.validate', 'etablissements.publish', 'etablissements.delete',
    'etablissements.request.create', 'etablissements.request.edit',

    // --- Évaluations ---
    'evaluations.validate', 'evaluations.delete',

    // --- Suggestions ---
    'suggestions.validate', 'suggestions.read.all',

    // --- Campagnes ---
    'campagnes.activate',

    // --- Programmes ---
    'programmes.validate',

    // --- Statistiques & Rapports ---
    'stats.view.global', 'stats.view.secteur', 'stats.view.commune', 'reports.export',
    'bilans.read',

    // --- Système & Administration ---
    'communes.manage',
    'system.settings.read', 'system.logs.view', 'system.import',
    'permissions.manage'
];

export const DEFAULT_ADMIN_PERMISSIONS = ROLE_DEFAULT_PERMISSIONS['ADMIN'];
