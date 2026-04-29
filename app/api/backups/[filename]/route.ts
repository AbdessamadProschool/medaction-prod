import { safeResolvePath, sanitizeFilename } from '@/lib/utils/safe-path';
import { join } from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

const BACKUP_DIR = process.env.BACKUP_DIR || join(process.cwd(), 'backups');

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  // ✅ Auth obligatoire — seuls ADMIN/SUPER_ADMIN peuvent accéder aux backups
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return new Response('Non autorisé', { status: 403 });
  }

  const { filename } = await params;

  // ✅ Sanitisation + confinement
  const safeFilename = sanitizeFilename(filename);
  if (!safeFilename || safeFilename !== filename) {
    return new Response('Nom de fichier invalide', { status: 400 });
  }

  let filePath: string;
  try {
    filePath = safeResolvePath(BACKUP_DIR, safeFilename);
  } catch {
    return new Response('Accès refusé', { status: 403 });
  }

  // ✅ Vérifier existence
  const { existsSync, statSync } = await import('fs');
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    return new Response('Fichier non trouvé', { status: 404 });
  }

  // Whitelist des extensions autorisées pour les backups
  const ext = filePath.split('.').pop()?.toLowerCase();
  const ALLOWED_EXTENSIONS = ['dump', 'gz', 'zip', 'sql', 'json'];
  if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
    return new Response('Type de fichier non autorisé', { status: 400 });
  }

  const fileBuffer = await import('fs').then(fs => fs.readFileSync(filePath));
  return new Response(fileBuffer, {
    headers: {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${safeFilename}"`,
      'Cache-Control': 'no-store, private',
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return new Response('Non autorisé', { status: 403 });
  }

  const { filename } = await params;
  const safeFilename = sanitizeFilename(filename);

  let filePath: string;
  try {
    filePath = safeResolvePath(BACKUP_DIR, safeFilename);
  } catch {
    return new Response('Accès refusé', { status: 403 });
  }

  const { existsSync, unlinkSync } = await import('fs');
  if (!existsSync(filePath)) {
    return new Response('Fichier non trouvé', { status: 404 });
  }

  unlinkSync(filePath);
  return Response.json({ success: true });
}