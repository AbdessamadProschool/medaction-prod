const fs = require('fs');

const frPath = 'locales/fr/common.json';
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// ============================================================
// INJECT ALL MISSING ADMIN/SUPER-ADMIN TRANSLATION KEYS
// ============================================================

// ---- admin.news_page ----
if (!fr.admin) fr.admin = {};
if (!fr.admin.news_page) fr.admin.news_page = {};
Object.assign(fr.admin.news_page, {
    page: "Page",
    limit: "Limite",
});

// ---- admin.articles_page ----
if (!fr.admin.articles_page) fr.admin.articles_page = {};
Object.assign(fr.admin.articles_page, {
    page: "Page",
    limit: "Limite",
});

// ---- admin_campaigns.new ----
if (!fr.admin_campaigns) fr.admin_campaigns = {};
if (!fr.admin_campaigns.new) fr.admin_campaigns.new = {};
Object.assign(fr.admin_campaigns.new, {
    BROUILLON: "Brouillon",
    EN_ATTENTE: "En attente",
    PUBLIEE: "Publiée",
    TERMINEE: "Terminée",
    ANNULEE: "Annulée",
});

// ---- admin_campagnes ----
if (!fr.admin_campagnes) fr.admin_campagnes = {};
Object.assign(fr.admin_campagnes, {
    page: "Page",
    limit: "Limite",
    ...(fr.admin_campagnes || {}),
});

// ---- admin.establishments_page ----
if (!fr.admin.establishments_page) fr.admin.establishments_page = {};
Object.assign(fr.admin.establishments_page, {
    page: "Page",
    limit: "Limite",
    includeNonPublie: "Inclure non publiés",
});

// ---- admin.events_page ----
if (!fr.admin.events_page) fr.admin.events_page = {};
Object.assign(fr.admin.events_page, {
    communeId: "Commune",
    dateDebut: "Date de début",
    dateFin: "Date de fin",
    page: "Page",
    limit: "Limite",
});

// ---- admin.dashboard ----
if (!fr.admin.dashboard) fr.admin.dashboard = {};
Object.assign(fr.admin.dashboard, {
    no_data: "Aucune donnée disponible",
    total: "Total",
});

// ---- common ----
if (!fr.common) fr.common = {};
Object.assign(fr.common, {
    cancel: "Annuler",
    confirm: "Confirmer",
    save: "Enregistrer",
    delete: "Supprimer",
    edit: "Modifier",
    close: "Fermer",
    loading: "Chargement...",
    error: "Erreur",
    success: "Succès",
    yes: "Oui",
    no: "Non",
});

// ---- admin.reports_page ----
if (!fr.admin.reports_page) fr.admin.reports_page = {};
Object.assign(fr.admin.reports_page, {
    loading: "Chargement des données...",
    title: "Rapports & Statistiques",
    date_range_to: "à",
    excel: "Exporter Excel",
    no_data: "Aucune donnée disponible pour cette période",
});

// ---- admin.reclamations_page ----
if (!fr.admin.reclamations_page) fr.admin.reclamations_page = {};
Object.assign(fr.admin.reclamations_page, {
    page: "Page",
    limit: "Limite",
    affectation: "Affectation",
    communeId: "Commune",
    categorie: "Catégorie",
    ACCEPTEE: "Acceptée",
    REJETEE: "Rejetée",
});

// ---- admin.suggestions_page ----
if (!fr.admin.suggestions_page) fr.admin.suggestions_page = {};
Object.assign(fr.admin.suggestions_page, {
    page: "Page",
    limit: "Limite",
    page_info: "Page {current} sur {total}",
});

// ---- admin.users_page.edit_role_modal ----
if (!fr.admin.users_page) fr.admin.users_page = {};
if (!fr.admin.users_page.edit_role_modal) fr.admin.users_page.edit_role_modal = {};
Object.assign(fr.admin.users_page.edit_role_modal, {
    loading: "Chargement...",
});

// ---- admin_portal.messages ----
if (!fr.admin_portal) fr.admin_portal = {};
if (!fr.admin_portal.messages) fr.admin_portal.messages = {};
Object.assign(fr.admin_portal.messages, {
    title: "Messages",
    subtitle: "Gestion des messages reçus",
    messages_count: "{count} messages",
    search_placeholder: "Rechercher un message...",
    db_error_title: "Erreur de base de données",
    author: "Expéditeur",
    date: "Date",
    member: "Membre",
    subject_message: "Sujet / Message",
    actions: "Actions",
    view: "Voir",
    reply: "Répondre",
    received_on: "Reçu le",
    reply_email: "Répondre par email",
    no_messages: "Aucun message",
    loading: "Chargement des messages...",
    mark_read: "Marquer comme lu",
    delete: "Supprimer",
    categories: {
        info: "Information",
        tech: "Technique",
        question: "Question",
        complaint: "Réclamation",
        suggestion: "Suggestion"
    }
});

// Write FR
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
console.log('✅ FR file updated with all admin/super-admin missing keys');
