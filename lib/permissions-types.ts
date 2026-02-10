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

  // --- STATS & RAPPORTS ---
  | 'stats.view.global'      
  | 'stats.view.secteur'
  | 'stats.view.commune'
  | 'stats.view.etablissement'
  | 'reports.export'         

  // --- CARTOGRAPHIE ---
  | 'map.view'
  | 'map.view.full'          

  // --- SYSTÈME & ADMIN ---
  | 'system.settings.read'
  | 'system.settings.edit'
  | 'system.logs.view'
  | 'system.backup'
  | 'system.restore'
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

  // Stats
  'stats.view.global': 'Voir stats globales',
  'stats.view.secteur': 'Voir stats secteur',
  'stats.view.commune': 'Voir stats commune',
  'stats.view.etablissement': 'Voir stats établissement',
  'reports.export': 'Exporter rapports',

  // Map
  'map.view': 'Voir carte',
  'map.view.full': 'Voir carte avancée',

  // System
  'system.settings.read': 'Voir paramètres',
  'system.settings.edit': 'Modifier paramètres',
  'system.logs.view': 'Voir logs',
  'system.backup': 'Gérer backups',
  'system.restore': 'Restaurer système',
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
    'stats.view.secteur', 'stats.view.etablissement'
  ] as PermissionCode[],

  'AUTORITE_LOCALE': [
    // Base
    'auth.login', 'auth.logout', 'auth.reset-password',
    'users.me.read', 'users.me.edit',
    'map.view',
    'actualites.read', 'campagnes.read', 'evenements.read', 'etablissements.read',

    // Métier
    'reclamations.read.assigned', 'reclamations.resolve', 'reclamations.comment.internal',
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
    'stats.view.etablissement'
  ] as PermissionCode[],

  'ADMIN': [
    // Gestion globale
    'users.read', 'users.read.full', 'users.create', 'users.edit', 'users.edit.role', 'users.activate',
    'reclamations.read.all', 'reclamations.validate', 'reclamations.assign', 'reclamations.archive',
    'evenements.read.all', 'evenements.validate', 'evenements.delete', 'evenements.feature', 'evenements.edit.all', 'evenements.report',
    'actualites.validate', 'actualites.publish', 'actualites.delete',
    'etablissements.create', 'etablissements.edit', 'etablissements.validate', 'etablissements.publish', 'etablissements.delete',
    'evaluations.validate', 'evaluations.delete',
    'campagnes.activate',
    'programmes.validate',
    'stats.view.global', 'stats.view.secteur', 'stats.view.commune', 'reports.export',
    'communes.manage',
    'system.logs.view',
    
    // Base minimale pour l'admin aussi (il n'est pas citoyen ici)
    'auth.login', 'auth.logout', 'auth.reset-password',
    'users.me.read', 'users.me.edit',
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
    // Pas d'évaluations.read car c'est un module 'citoyen' ? Le gouverneur peut sans doute LIRE les evals pour monitoring, mais on respecte "pas d'evaluations" au sens large si demandé. 
    // Si "Evaluations" veut dire "Soumettre une evaluation", c'est evaluations.create. 
    // Par sécurité, j'inclus 'evaluations.read' pour le monitoring (logique gouverneur), mais j'exclus create/edit.
    // UPDATE: User asked: "pour role (...) on ne peut pas : (...) Evaluations". I will exclude ALL evaluation permissions just to be safe and strictly follow request.
    
    'campagnes.read',
    'programmes.read',
    'stats.view.global', 'stats.view.secteur', 'stats.view.commune', 'stats.view.etablissement',
    'reports.export',
    'map.view.full'
  ] as PermissionCode[]
};

export const DEFAULT_ADMIN_PERMISSIONS = ROLE_DEFAULT_PERMISSIONS['ADMIN'];
