const fs = require('fs');

const frPath = 'locales/fr/common.json';
const fr = JSON.parse(fs.readFileSync(frPath, 'utf8'));

// 1. Fix admin.sidebar
if (!fr.admin) fr.admin = {};
if (!fr.admin.sidebar) fr.admin.sidebar = {};

Object.assign(fr.admin.sidebar, {
    messages: "Messages",
    notifications: "Notifications",
    audit_logs: "Logs d'audit",
    system_config: "Configuration Système",
    backup: "Sauvegarde",
    legal: "Mentions Légales",
    help: "Aide & Support"
});

// 2. Add/Fix super_admin namespace
if (!fr.super_admin) fr.super_admin = {};
Object.assign(fr.super_admin, {
    title: "Administration Globale",
    subtitle: "Gestion complète de la plateforme Medaction",
    dashboard: {
        total_users: "Utilisateurs Totaux",
        active_sessions: "Sessions Actives",
        database_size: "Taille BDD",
        server_status: "État du Serveur"
    },
    permissions: {
        title: "Gestion des Permissions",
        subtitle: "Définir les accès granulaires par rôle",
        add_role: "Ajouter un rôle",
        edit_permission: "Modifier permission",
        role_name: "Nom du rôle",
        permissions_list: "Liste des permissions",
        save_changes: "Enregistrer les modifications",
        delete_role: "Supprimer le rôle"
    },
    backups: {
        title: "Sauvegardes Système",
        subtitle: "Historique et création de points de restauration",
        create_now: "Sauvegarder maintenant",
        restore: "Restaurer",
        download: "Télécharger",
        last_backup: "Dernière sauvegarde",
        status: "État"
    }
});

// 3. Fix admin_portal translations (based on user's previous screenshot)
if (!fr.admin_portal) fr.admin_portal = {};
if (!fr.admin_portal.messages) fr.admin_portal.messages = {};
Object.assign(fr.admin_portal.messages, {
    title: "Boîte de réception",
    subtitle: "Gérez les messages de la plateforme",
    messages_count: "{count} messages au total",
    search_placeholder: "Rechercher par expéditeur ou sujet...",
    author: "Expéditeur",
    date: "Date de réception",
    member: "Type de membre",
    subject_message: "Message & Sujet",
    actions: "Actions",
    view: "Détails",
    reply: "Répondre",
    received_on: "Reçu le",
    reply_email: "Répondre par e-mail"
});

// Write back to FR
fs.writeFileSync(frPath, JSON.stringify(fr, null, 2), 'utf8');
console.log('✅ FR file updated with Sidebar and SuperAdmin keys');
