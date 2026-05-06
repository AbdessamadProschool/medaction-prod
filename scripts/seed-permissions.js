/**
 * Script de synchronisation des permissions en base de données
 * 
 * Ce script s'assure que toutes les permissions définies dans permissions-types.ts
 * existent dans la table Permission de la base de données.
 * 
 * Usage : node scripts/seed-permissions.js
 * Ou via : npx ts-node scripts/seed-permissions.ts
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Catalogue complet des permissions avec leurs métadonnées
const PERMISSIONS_CATALOG = [
  // --- AUTHENTIFICATION ---
  { code: 'auth.login',          nom: 'Se connecter',                        groupe: 'auth',           groupeLabel: 'Authentification', ordre: 1 },
  { code: 'auth.register',      nom: "S'inscrire",                          groupe: 'auth',           groupeLabel: 'Authentification', ordre: 2 },
  { code: 'auth.logout',        nom: 'Se déconnecter',                      groupe: 'auth',           groupeLabel: 'Authentification', ordre: 3 },
  { code: 'auth.reset-password', nom: 'Réinitialiser son mot de passe',     groupe: 'auth',           groupeLabel: 'Authentification', ordre: 4 },

  // --- UTILISATEURS ---
  { code: 'users.read',           nom: 'Voir utilisateurs (basique)',              groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 1,  description: 'Voir la liste des utilisateurs avec les informations de base' },
  { code: 'users.read.full',      nom: 'Voir utilisateurs (complet)',              groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 2,  description: 'Voir les informations détaillées des utilisateurs' },
  { code: 'users.create',         nom: 'Créer utilisateur',                        groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 3,  description: 'Créer de nouveaux comptes utilisateurs' },
  { code: 'users.edit',           nom: 'Modifier utilisateur',                     groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 4,  description: 'Modifier les informations d\'un utilisateur (nom, email, téléphone...)' },
  { code: 'users.edit.role',      nom: 'Changer rôle utilisateur',                 groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 5,  description: 'Modifier le rôle d\'un utilisateur (sauf vers SUPER_ADMIN)' },
  { code: 'users.delete',         nom: 'Supprimer utilisateur (Soft)',              groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 6,  description: 'Désactiver un compte utilisateur' },
  { code: 'users.hard-delete',    nom: 'Supprimer définitivement (Hard)',           groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 7,  description: 'Supprimer définitivement un utilisateur et toutes ses données' },
  { code: 'users.activate',       nom: 'Activer/Désactiver compte',                groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 8,  description: 'Basculer l\'état actif/inactif d\'un compte' },
  { code: 'users.reset-password', nom: 'Réinitialiser mot de passe utilisateur',   groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 9,  description: 'Réinitialiser le mot de passe d\'un autre utilisateur et générer un nouveau' },
  { code: 'users.manage-2fa',     nom: 'Gérer 2FA utilisateur',                    groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 10, description: 'Voir le statut 2FA et le réinitialiser pour un utilisateur' },
  { code: 'users.delete.all',     nom: 'Supprimer tout utilisateur (sauf SA)',      groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 11, description: 'Supprimer n\'importe quel utilisateur sauf Super Admin' },
  { code: 'users.security',       nom: 'Voir infos sécurité',                      groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 12, description: 'Voir les informations de sécurité des comptes (2FA, tentatives, etc.)' },
  { code: 'users.me.read',        nom: 'Voir mon profil',                          groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 13 },
  { code: 'users.me.edit',        nom: 'Modifier mon profil',                      groupe: 'users', groupeLabel: 'Gestion Utilisateurs', ordre: 14 },

  // --- RÉCLAMATIONS ---
  { code: 'reclamations.read',            nom: 'Voir ses réclamations',           groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 1 },
  { code: 'reclamations.read.all',        nom: 'Voir toutes les réclamations',    groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 2,  description: 'Accès en lecture à toutes les réclamations du système' },
  { code: 'reclamations.read.assigned',   nom: 'Voir réclamations affectées',     groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 3 },
  { code: 'reclamations.create',          nom: 'Créer réclamation',               groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 4 },
  { code: 'reclamations.edit',            nom: 'Modifier réclamation',            groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 5 },
  { code: 'reclamations.delete',          nom: 'Supprimer réclamation',           groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 6 },
  { code: 'reclamations.archive',         nom: 'Archiver réclamation',            groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 7 },
  { code: 'reclamations.assign',          nom: 'Affecter réclamation',            groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 8,  description: 'Affecter une réclamation à une autorité locale' },
  { code: 'reclamations.validate',        nom: 'Valider/Rejeter décision',        groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 9,  description: 'Accepter ou rejeter une réclamation' },
  { code: 'reclamations.resolve',         nom: 'Marquer comme résolue',           groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 10 },
  { code: 'reclamations.comment.internal',nom: 'Ajouter commentaire interne',     groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 11 },

  // --- ÉVÉNEMENTS ---
  { code: 'evenements.read',        nom: 'Voir événements',               groupe: 'evenements', groupeLabel: 'Événements', ordre: 1 },
  { code: 'evenements.read.all',    nom: 'Voir tous événements (admin)',   groupe: 'evenements', groupeLabel: 'Événements', ordre: 2 },
  { code: 'evenements.create',      nom: 'Créer événement',               groupe: 'evenements', groupeLabel: 'Événements', ordre: 3 },
  { code: 'evenements.edit',        nom: 'Modifier événement propre',      groupe: 'evenements', groupeLabel: 'Événements', ordre: 4 },
  { code: 'evenements.edit.all',    nom: 'Modifier tout événement',        groupe: 'evenements', groupeLabel: 'Événements', ordre: 5 },
  { code: 'evenements.delete',      nom: 'Supprimer événement',            groupe: 'evenements', groupeLabel: 'Événements', ordre: 6 },
  { code: 'evenements.validate',    nom: 'Valider événement',              groupe: 'evenements', groupeLabel: 'Événements', ordre: 7 },
  { code: 'evenements.feature',     nom: 'Mettre événement en avant',      groupe: 'evenements', groupeLabel: 'Événements', ordre: 8 },
  { code: 'evenements.subscribe',   nom: "S'inscrire à un événement",      groupe: 'evenements', groupeLabel: 'Événements', ordre: 9 },
  { code: 'evenements.participate', nom: "Participer à un événement",      groupe: 'evenements', groupeLabel: 'Événements', ordre: 10 },
  { code: 'evenements.report',      nom: "Voir bilan événement",           groupe: 'evenements', groupeLabel: 'Événements', ordre: 11 },

  // --- ACTUALITÉS ---
  { code: 'actualites.read',      nom: 'Lire actualités',       groupe: 'actualites', groupeLabel: 'Actualités', ordre: 1 },
  { code: 'actualites.create',    nom: 'Créer actualité',       groupe: 'actualites', groupeLabel: 'Actualités', ordre: 2 },
  { code: 'actualites.edit',      nom: 'Modifier actualité',    groupe: 'actualites', groupeLabel: 'Actualités', ordre: 3 },
  { code: 'actualites.delete',    nom: 'Supprimer actualité',   groupe: 'actualites', groupeLabel: 'Actualités', ordre: 4 },
  { code: 'actualites.publish',   nom: 'Publier actualité',     groupe: 'actualites', groupeLabel: 'Actualités', ordre: 5 },
  { code: 'actualites.validate',  nom: 'Valider actualité',     groupe: 'actualites', groupeLabel: 'Actualités', ordre: 6 },

  // --- ÉTABLISSEMENTS ---
  { code: 'etablissements.read',            nom: 'Voir établissements',                    groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 1 },
  { code: 'etablissements.create',          nom: 'Créer établissement',                    groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 2 },
  { code: 'etablissements.edit',            nom: 'Modifier établissement',                 groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 3 },
  { code: 'etablissements.delete',          nom: 'Supprimer établissement',                groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 4 },
  { code: 'etablissements.validate',        nom: 'Valider établissement',                  groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 5 },
  { code: 'etablissements.publish',         nom: 'Publier établissement',                  groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 6 },
  { code: 'etablissements.subscribe',       nom: "S'abonner établissement",                groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 7 },
  { code: 'etablissements.request.create',  nom: "Demander la création d'établissement",   groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 8 },
  { code: 'etablissements.request.edit',    nom: "Demander la modification d'établissement",groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 9 },

  // --- ÉVALUATIONS ---
  { code: 'evaluations.read',     nom: 'Lire évaluations',      groupe: 'evaluations', groupeLabel: 'Évaluations', ordre: 1 },
  { code: 'evaluations.create',   nom: 'Évaluer',               groupe: 'evaluations', groupeLabel: 'Évaluations', ordre: 2 },
  { code: 'evaluations.edit',     nom: 'Modifier évaluation',   groupe: 'evaluations', groupeLabel: 'Évaluations', ordre: 3 },
  { code: 'evaluations.delete',   nom: 'Supprimer évaluation',  groupe: 'evaluations', groupeLabel: 'Évaluations', ordre: 4 },
  { code: 'evaluations.validate', nom: 'Modérer évaluation',    groupe: 'evaluations', groupeLabel: 'Évaluations', ordre: 5 },
  { code: 'evaluations.report',   nom: 'Signaler évaluation',   groupe: 'evaluations', groupeLabel: 'Évaluations', ordre: 6 },

  // --- CAMPAGNES ---
  { code: 'campagnes.read',        nom: 'Voir campagnes',          groupe: 'campagnes', groupeLabel: 'Campagnes', ordre: 1 },
  { code: 'campagnes.create',      nom: 'Créer campagne',          groupe: 'campagnes', groupeLabel: 'Campagnes', ordre: 2 },
  { code: 'campagnes.edit',        nom: 'Modifier campagne',       groupe: 'campagnes', groupeLabel: 'Campagnes', ordre: 3 },
  { code: 'campagnes.delete',      nom: 'Supprimer campagne',      groupe: 'campagnes', groupeLabel: 'Campagnes', ordre: 4 },
  { code: 'campagnes.activate',    nom: 'Gérer statut campagne',   groupe: 'campagnes', groupeLabel: 'Campagnes', ordre: 5 },
  { code: 'campagnes.participate', nom: 'Participer campagne',     groupe: 'campagnes', groupeLabel: 'Campagnes', ordre: 6 },

  // --- PROGRAMMES ---
  { code: 'programmes.read',     nom: 'Voir programmes',            groupe: 'programmes', groupeLabel: 'Programmes Activités', ordre: 1 },
  { code: 'programmes.create',   nom: 'Créer programme',            groupe: 'programmes', groupeLabel: 'Programmes Activités', ordre: 2 },
  { code: 'programmes.edit',     nom: 'Modifier programme',         groupe: 'programmes', groupeLabel: 'Programmes Activités', ordre: 3 },
  { code: 'programmes.delete',   nom: 'Supprimer programme',        groupe: 'programmes', groupeLabel: 'Programmes Activités', ordre: 4 },
  { code: 'programmes.validate', nom: 'Valider programme',          groupe: 'programmes', groupeLabel: 'Programmes Activités', ordre: 5 },
  { code: 'programmes.report',   nom: 'Remplir rapport activité',   groupe: 'programmes', groupeLabel: 'Programmes Activités', ordre: 6 },

  // --- SUGGESTIONS ---
  { code: 'suggestions.create',   nom: 'Créer suggestion',     groupe: 'suggestions', groupeLabel: 'Suggestions', ordre: 1 },
  { code: 'suggestions.read.own', nom: 'Voir mes suggestions',  groupe: 'suggestions', groupeLabel: 'Suggestions', ordre: 2 },

  // --- STATS & RAPPORTS ---
  { code: 'stats.view.global',        nom: 'Voir stats globales',             groupe: 'stats',   groupeLabel: 'Statistiques & Rapports', ordre: 1 },
  { code: 'stats.view.secteur',       nom: 'Voir stats secteur',              groupe: 'stats',   groupeLabel: 'Statistiques & Rapports', ordre: 2 },
  { code: 'stats.view.commune',       nom: 'Voir stats commune',              groupe: 'stats',   groupeLabel: 'Statistiques & Rapports', ordre: 3 },
  { code: 'stats.view.etablissement', nom: 'Voir stats établissement',        groupe: 'stats',   groupeLabel: 'Statistiques & Rapports', ordre: 4 },
  { code: 'reports.export',           nom: 'Exporter rapports',               groupe: 'stats',   groupeLabel: 'Statistiques & Rapports', ordre: 5 },
  { code: 'bilans.read',              nom: 'Consulter bilans récapitulatifs',  groupe: 'stats',   groupeLabel: 'Statistiques & Rapports', ordre: 6 },

  // --- CARTOGRAPHIE ---
  { code: 'map.view',      nom: 'Voir carte',          groupe: 'map', groupeLabel: 'Cartographie', ordre: 1 },
  { code: 'map.view.full', nom: 'Voir carte avancée',  groupe: 'map', groupeLabel: 'Cartographie', ordre: 2 },

  // --- SYSTÈME & ADMIN ---
  { code: 'system.settings.read', nom: 'Voir paramètres système',            groupe: 'system', groupeLabel: 'Système & Administration', ordre: 1 },
  { code: 'system.settings.edit', nom: 'Modifier paramètres système',        groupe: 'system', groupeLabel: 'Système & Administration', ordre: 2 },
  { code: 'system.logs.view',     nom: 'Voir logs système',                  groupe: 'system', groupeLabel: 'Système & Administration', ordre: 3 },
  { code: 'system.backup',        nom: 'Gérer backups',                      groupe: 'system', groupeLabel: 'Système & Administration', ordre: 4 },
  { code: 'system.restore',       nom: 'Restaurer système',                  groupe: 'system', groupeLabel: 'Système & Administration', ordre: 5 },
  { code: 'system.import',        nom: 'Importer des données Excel/CSV',     groupe: 'system', groupeLabel: 'Système & Administration', ordre: 6 },
  { code: 'system.license.read',  nom: 'Consulter informations de licence',  groupe: 'system', groupeLabel: 'Système & Administration', ordre: 7 },
  { code: 'permissions.manage',   nom: 'Gérer permissions utilisateurs',     groupe: 'system', groupeLabel: 'Système & Administration', ordre: 8,  description: 'Accorder ou révoquer des permissions aux utilisateurs ADMIN' },
  { code: 'communes.manage',      nom: 'Gérer communes',                     groupe: 'system', groupeLabel: 'Système & Administration', ordre: 9 },
];

async function seedPermissions() {
  console.log('🔐 Synchronisation des permissions...\n');
  
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const perm of PERMISSIONS_CATALOG) {
    try {
      const existing = await prisma.permission.findUnique({
        where: { code: perm.code }
      });

      if (existing) {
        // Mettre à jour si les métadonnées ont changé
        const needsUpdate = 
          existing.nom !== perm.nom ||
          existing.groupe !== perm.groupe ||
          existing.groupeLabel !== perm.groupeLabel ||
          existing.ordre !== perm.ordre ||
          (perm.description && existing.description !== perm.description);

        if (needsUpdate) {
          await prisma.permission.update({
            where: { code: perm.code },
            data: {
              nom: perm.nom,
              groupe: perm.groupe,
              groupeLabel: perm.groupeLabel,
              ordre: perm.ordre,
              ...(perm.description && { description: perm.description }),
            }
          });
          updated++;
          console.log(`  ✏️  Mise à jour: ${perm.code}`);
        } else {
          skipped++;
        }
      } else {
        await prisma.permission.create({
          data: {
            code: perm.code,
            nom: perm.nom,
            description: perm.description || null,
            groupe: perm.groupe,
            groupeLabel: perm.groupeLabel,
            ordre: perm.ordre,
            isActive: true,
          }
        });
        created++;
        console.log(`  ✅ Créée: ${perm.code}`);
      }
    } catch (error) {
      console.error(`  ❌ Erreur pour ${perm.code}:`, error);
    }
  }

  console.log(`\n📊 Résultat:`);
  console.log(`   ✅ Créées: ${created}`);
  console.log(`   ✏️  Mises à jour: ${updated}`);
  console.log(`   ⏭️  Inchangées: ${skipped}`);
  console.log(`   📦 Total catalogue: ${PERMISSIONS_CATALOG.length}`);
}

seedPermissions()
  .then(() => {
    console.log('\n✅ Synchronisation des permissions terminée.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur fatale:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
