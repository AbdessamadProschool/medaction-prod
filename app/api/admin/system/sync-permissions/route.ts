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
  // Protection supplémentaire : seul SUPER_ADMIN peut forcer la synchro système
  if (session.user.role !== 'SUPER_ADMIN') {
    return new Response(JSON.stringify({ error: 'Réservé au Super Admin' }), { status: 403 });
  }

  const permissions = [
    // --- Groupe: Gestion Utilisateurs ---
    {
      code: 'users.reset-password',
      nom: 'Réinitialiser mot de passe',
      groupe: 'users',
      groupeLabel: 'Utilisateurs',
      ordre: 10,
    },
    {
      code: 'users.manage-2fa',
      nom: 'Gérer 2FA',
      groupe: 'users',
      groupeLabel: 'Utilisateurs',
      ordre: 11,
    },
    {
      code: 'users.delete.all',
      nom: 'Suppression totale',
      groupe: 'users',
      groupeLabel: 'Utilisateurs',
      ordre: 12,
    },
    {
      code: 'system.logs.view',
      nom: 'Voir les logs',
      groupe: 'system',
      groupeLabel: 'Système',
      ordre: 20,
    },
    {
      code: 'system.settings.edit',
      nom: 'Modifier les paramètres',
      groupe: 'system',
      groupeLabel: 'Système',
      ordre: 21,
    }
  ];

  let created = 0;
  let updated = 0;

  for (const p of permissions) {
    const existing = await prisma.permission.findUnique({
      where: { code: p.code }
    });

    if (existing) {
      await prisma.permission.update({
        where: { code: p.code },
        data: {
          nom: p.nom,
          groupeLabel: p.groupeLabel,
          ordre: p.ordre,
          isActive: true
        }
      });
      updated++;
    } else {
      await prisma.permission.create({
        data: {
          ...p,
          isActive: true,
          description: `Permission pour ${p.code}`
        }
      });
      created++;
    }
  }

  return successResponse({ created, updated }, 'Permissions synchronisées avec succès');
}));
