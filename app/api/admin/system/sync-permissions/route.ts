import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';

/**
 * POST /api/admin/system/sync-permissions
 * 
 * Synchronise les permissions définies dans le code avec la base de données.
 * Réservé au SUPER_ADMIN.
 */
export const POST = withPermission('system.settings.edit', withErrorHandler(async (request: NextRequest, { session }) => {
  if (session.user.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Réservé au Super Admin' }), { status: 403 });
  }

  const permissions = [
    // --- Groupe: Gestion Utilisateurs ---
    { code: 'users.read', nom: 'Voir les utilisateurs', groupe: 'users', groupeLabel: 'Utilisateurs', ordre: 1 },
    { code: 'users.create', nom: 'Créer un utilisateur', groupe: 'users', groupeLabel: 'Utilisateurs', ordre: 2 },
    { code: 'users.edit', nom: 'Modifier un utilisateur', groupe: 'users', groupeLabel: 'Utilisateurs', ordre: 3 },
    { code: 'users.delete', nom: 'Supprimer (Soft)', groupe: 'users', groupeLabel: 'Utilisateurs', ordre: 4 },
    { code: 'users.hard-delete', nom: 'Supprimer définitivement', groupe: 'users', groupeLabel: 'Utilisateurs', ordre: 5 },
    { code: 'users.reset-password', nom: 'Réinitialiser MDP tiers', groupe: 'users', groupeLabel: 'Utilisateurs', ordre: 10 },
    { code: 'users.manage-2fa', nom: 'Gérer 2FA tiers', groupe: 'users', groupeLabel: 'Utilisateurs', ordre: 11 },
    { code: 'users.security', nom: 'Voir infos sécurité', groupe: 'users', groupeLabel: 'Utilisateurs', ordre: 12 },

    // --- Groupe: Établissements ---
    { code: 'etablissements.read', nom: 'Voir établissements', groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 30 },
    { code: 'etablissements.create', nom: 'Créer établissements', groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 31 },
    { code: 'etablissements.edit', nom: 'Modifier établissements', groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 32 },
    { code: 'etablissements.delete', nom: 'Supprimer établissements', groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 33 },
    { code: 'etablissements.validate', nom: 'Valider demandes', groupe: 'etablissements', groupeLabel: 'Établissements', ordre: 34 },

    // --- Groupe: Événements ---
    { code: 'evenements.read.all', nom: 'Voir tous les événements', groupe: 'evenements', groupeLabel: 'Événements', ordre: 40 },
    { code: 'evenements.create', nom: 'Créer événements', groupe: 'evenements', groupeLabel: 'Événements', ordre: 41 },
    { code: 'evenements.edit', nom: 'Modifier événements', groupe: 'evenements', groupeLabel: 'Événements', ordre: 42 },
    { code: 'evenements.delete', nom: 'Supprimer événements', groupe: 'evenements', groupeLabel: 'Événements', ordre: 43 },
    { code: 'evenements.validate', nom: 'Valider événements', groupe: 'evenements', groupeLabel: 'Événements', ordre: 44 },

    // --- Groupe: Actualités ---
    { code: 'actualites.create', nom: 'Créer actualités', groupe: 'actualites', groupeLabel: 'Actualités', ordre: 50 },
    { code: 'actualites.edit', nom: 'Modifier actualités', groupe: 'actualites', groupeLabel: 'Actualités', ordre: 51 },
    { code: 'actualites.delete', nom: 'Supprimer actualités', groupe: 'actualites', groupeLabel: 'Actualités', ordre: 52 },
    { code: 'actualites.validate', nom: 'Valider actualités', groupe: 'actualites', groupeLabel: 'Actualités', ordre: 53 },

    // --- Groupe: Réclamations ---
    { code: 'reclamations.read.all', nom: 'Voir toutes les réclamations', groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 60 },
    { code: 'reclamations.validate', nom: 'Valider/Traiter réclamations', groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 61 },
    { code: 'reclamations.assign', nom: 'Assigner réclamations', groupe: 'reclamations', groupeLabel: 'Réclamations', ordre: 62 },

    // --- Groupe: Programmes & Activités ---
    { code: 'programmes.read', nom: 'Voir programmes', groupe: 'programmes', groupeLabel: 'Programmes', ordre: 70 },
    { code: 'programmes.create', nom: 'Créer programmes', groupe: 'programmes', groupeLabel: 'Programmes', ordre: 71 },
    { code: 'programmes.validate', nom: 'Valider programmes', groupe: 'programmes', groupeLabel: 'Programmes', ordre: 72 },

    // --- Groupe: Évaluations & Suggestions ---
    { code: 'evaluations.validate', nom: 'Modérer évaluations', groupe: 'evaluations', groupeLabel: 'Évaluations', ordre: 80 },
    { code: 'suggestions.read.all', nom: 'Voir toutes les suggestions', groupe: 'suggestions', groupeLabel: 'Suggestions', ordre: 85 },
    { code: 'suggestions.validate', nom: 'Valider suggestions', groupe: 'suggestions', groupeLabel: 'Suggestions', ordre: 86 },

    // --- Groupe: Campagnes ---
    { code: 'campagnes.create', nom: 'Créer campagnes', groupe: 'campagnes', groupeLabel: 'Campagnes', ordre: 90 },
    { code: 'campagnes.activate', nom: 'Activer/Désactiver', groupe: 'campagnes', groupeLabel: 'Campagnes', ordre: 91 },

    // --- Groupe: Système & Admin ---
    { code: 'stats.view.global', nom: 'Dashboard Stats Global', groupe: 'stats', groupeLabel: 'Reporting', ordre: 100 },
    { code: 'bilans.read', nom: 'Consulter bilans activités', groupe: 'bilans', groupeLabel: 'Reporting', ordre: 101 },
    { code: 'system.logs.view', nom: 'Journal d\'activité (Logs)', groupe: 'system', groupeLabel: 'Administration', ordre: 110 },
    { code: 'system.settings.read', nom: 'Lire paramètres', groupe: 'system', groupeLabel: 'Administration', ordre: 111 },
    { code: 'system.settings.edit', nom: 'Modifier paramètres', groupe: 'system', groupeLabel: 'Administration', ordre: 112 },
    { code: 'system.import', nom: 'Importation de données', groupe: 'system', groupeLabel: 'Administration', ordre: 113 },
    { code: 'system.license.read', nom: 'Voir licence système', groupe: 'system', groupeLabel: 'Administration', ordre: 114 },
    { code: 'permissions.manage', nom: 'Gérer les rôles/permissions', groupe: 'system', groupeLabel: 'Administration', ordre: 115 },
  ];

  let created = 0;
  let updated = 0;

  for (const p of permissions) {
    const existing = await prisma.permission.findUnique({ where: { code: p.code } });
    if (existing) {
      await prisma.permission.update({
        where: { code: p.code },
        data: { nom: p.nom, groupe: p.groupe, groupeLabel: p.groupeLabel, ordre: p.ordre, isActive: true }
      });
      updated++;
    } else {
      await prisma.permission.create({
        data: { ...p, isActive: true, description: `Permission pour ${p.code}` }
      });
      created++;
    }
  }

  return successResponse({ created, updated }, 'Permissions synchronisées avec succès');
}));
