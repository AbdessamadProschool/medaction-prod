import { safeResolvePath, sanitizeFilename } from '@/lib/utils/safe-path';
import { join } from 'path';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { ActivityLogger } from '@/lib/activity-logger';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ForbiddenError, NotFoundError, ValidationError } from '@/lib/exceptions';

const BACKUP_DIR = process.env.BACKUP_DIR || join(process.cwd(), 'backups');

export const GET = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) => {
  // ✅ Auth obligatoire — seuls ADMIN/SUPER_ADMIN peuvent accéder aux backups
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role || '')) {
    throw new ForbiddenError('Non autorisé');
  }

  const { filename } = await params;

  // ✅ Sanitisation + confinement
  const safeFilename = sanitizeFilename(filename);
  if (!safeFilename || safeFilename !== filename) {
    throw new ValidationError('Nom de fichier invalide');
  }

  let filePath: string;
  try {
    filePath = safeResolvePath(BACKUP_DIR, safeFilename);
  } catch {
    throw new ForbiddenError('Accès refusé');
  }

  // ✅ Vérifier existence
  const { existsSync, statSync } = await import('fs');
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    throw new NotFoundError('Fichier non trouvé');
  }

  // Whitelist des extensions autorisées pour les backups
  const ext = filePath.split('.').pop()?.toLowerCase();
  const ALLOWED_EXTENSIONS = ['dump', 'gz', 'zip', 'sql', 'json'];
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    throw new ValidationError('Type de fichier non autorisé');
  }

  const fileBuffer = await import('fs').then(fs => fs.readFileSync(filePath));
  
  // Audit log
  await ActivityLogger.custom({
    action: 'DOWNLOAD_BACKUP',
    entity: 'System',
    entityId: null,
    userId: parseInt(session.user.id),
    details: { filename: safeFilename }
  });

  return new Response(fileBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-store, private',
    },
  });
});

export const DELETE = withErrorHandler(async (
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) => {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user?.role || '')) {
    throw new ForbiddenError('Non autorisé');
  }

  const { filename } = await params;
  const safeFilename = sanitizeFilename(filename);

  let filePath: string;
  try {
    filePath = safeResolvePath(BACKUP_DIR, safeFilename);
  } catch {
    throw new ForbiddenError('Accès refusé');
  }

  const { existsSync, unlinkSync } = await import('fs');
  if (!existsSync(filePath)) {
    throw new NotFoundError('Fichier non trouvé');
  }

  unlinkSync(filePath);
  
  // Audit log
  await ActivityLogger.custom({
    action: 'DELETE_BACKUP',
    entity: 'System',
    entityId: null,
    userId: parseInt(session.user.id),
    details: { filename: safeFilename }
  });

  return successResponse({ success: true });
});