const fs = require('fs');

const frPath = 'locales/fr/common.json';
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// ============================================================
// INJECT MISSING KEYS FOR AUTHORITY AND COORDINATOR
// ============================================================

// ---- authority_reclamations_page ----
if (!fr.authority_reclamations_page) fr.authority_reclamations_page = {};
Object.assign(fr.authority_reclamations_page, {
    page: "Page",
    limit: "Limite",
    statut: "Statut",
    categorie: "Catégorie",
    search: "Rechercher...",
    all: "Toutes les réclamations"
});

// ---- coordinator.navigation ----
if (!fr.coordinator) fr.coordinator = {};
if (!fr.coordinator.navigation) fr.coordinator.navigation = {};
Object.assign(fr.coordinator.navigation, {
    dashboard: "Tableau de bord",
    dashboard_desc: "Vue d'ensemble des activités",
    calendar: "Calendrier",
    calendar_desc: "Planification des activités",
    establishments: "Établissements",
    establishments_desc: "Gestion des structures",
    reports: "Rapports",
    reports_desc: "Comptes-rendus d'activités",
    profile: "Mon profil",
    home_access: "Accès Portail",
    logout: "Déconnexion"
});

// ---- coordinator.calendar.create_panel ----
if (!fr.coordinator.calendar) fr.coordinator.calendar = {};
if (!fr.coordinator.calendar.create_panel) fr.coordinator.calendar.create_panel = {};
Object.assign(fr.coordinator.calendar.create_panel, {
    activite: "Activité",
    title: "Ajouter une activité",
    subtitle: "Planifiez une nouvelle activité dans le calendrier",
    today: "Aujourd'hui",
    submit_all: "Tout enregistrer",
    import: "Importer des activités",
    new_activity: "Nouvelle activité",
    loading: "Chargement...",
    add: "Ajouter",
    confirm_delete: "Confirmer la suppression ?",
    error_delete: "Erreur lors de la suppression",
    date: "Date",
    time_start: "Heure de début",
    time_end: "Heure de fin",
    location: "Lieu",
    responsible: "Responsable",
    description: "Description",
    is_recurrent: "Activité récurrente",
    recurrence_end: "Fin de récurrence",
    delete: "Supprimer",
    edit: "Modifier",
    success_update: "Mise à jour réussie",
    success_create: "Création réussie",
    success_message: "L'activité a été enregistrée",
    edit_title: "Modifier l'activité",
    activity_title: "Titre de l'activité",
    activity_title_placeholder: "Entrez le titre...",
    establishment: "Établissement",
    select_establishment: "Sélectionner un établissement",
    type: "Type d'activité",
    select_type: "Choisir un type...",
    description_placeholder: "Détails de l'activité...",
    participants: "Nombre de participants",
    recurrence_pattern: "Modèle de récurrence",
    daily: "Quotidien",
    weekly: "Hebdomadaire",
    monthly: "Mensuel",
    daily_no_weekend: "Tous les jours (sauf week-end)",
    select_days: "Sélectionner les jours",
    save_changes: "Enregistrer les modifications",
    create: "Créer l'activité"
});

// ---- coordinator.establishments ----
if (!fr.coordinator.establishments) fr.coordinator.establishments = {};
Object.assign(fr.coordinator.establishments, {
    title: "Établissements",
    subtitle: "Liste des établissements sous votre coordination",
    search_placeholder: "Rechercher par nom ou code...",
    view_details: "Voir les détails"
});

// ---- coordinator.reports ----
if (!fr.coordinator.reports) fr.coordinator.reports = {};
Object.assign(fr.coordinator.reports, {
    title: "Rapports d'activités",
    subtitle: "Consultation et gestion des rapports",
    all: "Tous les rapports",
    pending: "En attente",
    completed: "Terminés",
    search_placeholder: "Filtrer les rapports..."
});

// ---- sectors ----
if (!fr.sectors) fr.sectors = {};
fr.sectors.culturel = "Culturel";

// Save FR
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
console.log('✅ FR file updated for Authority & Coordinator');
