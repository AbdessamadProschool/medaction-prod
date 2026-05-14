import { NextRequest } from 'next/server';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { withPermission } from '@/lib/auth/api-guard';
import { cleanupAuditLogs } from '@/lib/logger';
import { z } from 'zod';

const cleanupSchema = z.object({
  retentionMonths: z.number().min(1).max(120).default(12),
});

/**
 * POST /api/admin/system/cleanup-logs
 * Déclenche le nettoyage des logs d'audit (Super Admin ou Cron)
 */
export async function POST(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  const cronHeader = req.headers.get('x-cron-secret');
  
  const isCron = (cronSecret && (authHeader === `Bearer ${cronSecret}` || cronHeader === cronSecret));

  // Si ce n'est pas un cron, on vérifie la session et les permissions
  if (!isCron) {
    return withPermission('system.settings.edit', withErrorHandler(async (req: NextRequest) => {
      return await executeCleanup(req);
    }))(req, {});
  }

  // Si c'est un cron, on exécute directement
  return withErrorHandler(async (req: NextRequest) => {
    return await executeCleanup(req);
  })(req, {});
}

async function executeCleanup(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const { retentionMonths } = cleanupSchema.parse(body);

  const result = await cleanupAuditLogs(retentionMonths);

  if (!result.success) {
    throw new Error('Échec du nettoyage des logs');
  }

  return successResponse(result, `${result.deletedCount} logs supprimés avec succès`);
}
