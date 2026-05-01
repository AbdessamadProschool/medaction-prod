/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          MEDACTION - SECURE FILE SERVING API                                ║
 * ║          Serves uploaded files from external storage (Docker-ready)         ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Security: Auth + ACL + Path traversal protection + MIME validation        ║
 * ║  Docker: Reads from STORAGE_PATH env (volume mount)                        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, normalize, extname } from 'path';
import { existsSync } from 'fs';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// MIME type mapping (OWASP: Always set correct Content-Type)
const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.pdf': 'application/pdf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// Allowed extensions for serving (security whitelist)
const ALLOWED_EXTENSIONS = new Set(Object.keys(MIME_TYPES));

// ═══════════════════════════════════════════════════════════════
// ACCESS CONTROL RULES PER UPLOAD TYPE (Zero-Trust)
// ═══════════════════════════════════════════════════════════════
type Role = string;

interface AccessRule {
  /** If true, accessible without authentication */
  public: boolean;
  /** Roles that can access private resources (beyond ownership) */
  adminRoles?: Role[];
  /** If true, check if the user owns the resource (e.g. reclamation owner) */
  needsOwnerCheck?: boolean;
}

const ACCESS_RULES: Record<string, AccessRule> = {
  // Public assets — no auth required
  'avatars':        { public: true },
  'etablissements': { public: true },
  'etablissement':  { public: true }, // Singular added
  'actualites':     { public: true },
  'actualite':      { public: true }, // Singular added
  'articles':       { public: true },
  'article':        { public: true }, // Singular added
  'evenements':     { public: true },
  'evenement':      { public: true }, // Singular added
  'campagnes':      { public: true },
  'campagne':       { public: true }, // Singular added
  'talents':        { public: true },
  'talent':         { public: true }, // Singular added
  // Private assets — auth + authorization required
  'reclamations':         { public: false, needsOwnerCheck: true, adminRoles: ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'AUTORITE_LOCALE'] },
  'reclamation':          { public: false, needsOwnerCheck: true, adminRoles: ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'AUTORITE_LOCALE'] }, // Singular added
  'bilan':                { public: false, adminRoles: ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'DELEGATION'] },
  'programmes-activites': { public: false, adminRoles: ['ADMIN', 'SUPER_ADMIN', 'GOUVERNEUR', 'DELEGATION', 'COORDINATEUR_ACTIVITES'] },
  'documents':            { public: false, adminRoles: ['ADMIN', 'SUPER_ADMIN'] },
};

// Storage configuration
function getStoragePath(): string {
  const storagePath = process.env.STORAGE_PATH;
  if (storagePath) {
    // Absolute path (Linux or Windows)
    if (storagePath.startsWith('/') || /^[a-zA-Z]:[\\\/]/.test(storagePath)) {
      return storagePath;
    }
    // Relative path
    return join(process.cwd(), storagePath);
  }
  // Default: public/uploads (for backward compatibility)
  return join(process.cwd(), 'public', 'uploads');
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const resolvedParams = await params;
    const pathSegments = resolvedParams.path;

    // ═══════════════════════════════════════════════════════════════
    // 1. PATH TRAVERSAL PROTECTION (OWASP: CWE-22)
    // ═══════════════════════════════════════════════════════════════
    if (!pathSegments || pathSegments.length === 0) {
      return new NextResponse('Not Found', { status: 404 });
    }

    // Join and normalize the path
    const requestedPath = pathSegments.join('/');
    
    // Block directory traversal attempts
    if (requestedPath.includes('..') || requestedPath.includes('\\..') || requestedPath.includes('%2e%2e')) {
      console.warn(`[FILE-SERVE] ⚠️ Path traversal attempt: ${requestedPath}`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Block hidden files and directories
    if (pathSegments.some(seg => seg.startsWith('.'))) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════
    // 2. EXTENSION VALIDATION (Security whitelist)
    // ═══════════════════════════════════════════════════════════════
    const ext = extname(requestedPath).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      console.warn(`[FILE-SERVE] ⚠️ Blocked extension: ${ext}`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════
    // 3. ACCESS CONTROL (Auth + Authorization) — SECURITY FIX
    // ═══════════════════════════════════════════════════════════════
    const prefix = pathSegments[0] || '';
    const rule = ACCESS_RULES[prefix] ?? { public: false }; // Default: PRIVATE

    if (!rule.public) {
      const session = await getServerSession(authOptions);
      
      if (!session?.user) {
        return NextResponse.json(
          { error: 'Non authentifié', code: 'AUTHENTICATION_REQUIRED' },
          { status: 401 }
        );
      }

      const userRole = session.user.role;
      const userId = parseInt(session.user.id);
      const isAdmin = rule.adminRoles?.includes(userRole) ?? false;

      // Ownership check for reclamations
      if (rule.needsOwnerCheck && !isAdmin && prefix === 'reclamations') {
        const reclamationId = parseInt(pathSegments[1] || '0');
        if (reclamationId > 0) {
          try {
            const rec = await prisma.reclamation.findUnique({
              where: { id: reclamationId },
              select: { userId: true, communeId: true },
            });

            if (!rec) {
              return new NextResponse('Not Found', { status: 404 });
            }

            const isOwner = rec.userId === userId;

            // AUTORITE_LOCALE: can access reclamations of their commune
            let isLocalAuth = false;
            if (userRole === 'AUTORITE_LOCALE') {
              const autorite = await prisma.user.findUnique({
                where: { id: userId },
                select: { communeResponsableId: true },
              });
              isLocalAuth = autorite?.communeResponsableId === rec.communeId;
            }

            if (!isOwner && !isLocalAuth) {
              return NextResponse.json(
                { error: 'Accès refusé', code: 'ACCESS_DENIED' },
                { status: 403 }
              );
            }
          } catch {
            return new NextResponse('Forbidden', { status: 403 });
          }
        }
      } else if (!isAdmin) {
        return NextResponse.json(
          { error: 'Accès refusé', code: 'ACCESS_DENIED' },
          { status: 403 }
        );
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. RESOLVE FILE PATH
    // ═══════════════════════════════════════════════════════════════
    const storagePath = getStoragePath();
    const filePath = normalize(join(storagePath, requestedPath));

    // Security: Ensure resolved path is still within storage directory
    const normalizedStoragePath = normalize(storagePath);
    if (!filePath.startsWith(normalizedStoragePath)) {
      console.warn(`[FILE-SERVE] ⚠️ Path escape attempt: ${filePath} (Storage: ${normalizedStoragePath})`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. CHECK FILE EXISTS (with fallbacks)
    // ═══════════════════════════════════════════════════════════════
    let finalPath = filePath;
    let exists = existsSync(filePath);

    // Fallback 1: Plural/Singular folder names
    if (!exists) {
      const parts = requestedPath.split(/[\\\/]/);
      if (parts.length > 1) {
        const folder = parts[0];
        const rest = parts.slice(1).join('/');
        const alternativeFolder = folder.endsWith('s') ? folder.slice(0, -1) : folder + 's';
        const alternativePath = normalize(join(storagePath, alternativeFolder, rest));
        
        if (existsSync(alternativePath)) {
          finalPath = alternativePath;
          exists = true;
        }
      }
    }


    // Fallback 2: Try public/uploads directly relative to CWD
    if (!exists) {
      const publicPath = normalize(join(process.cwd(), 'public', 'uploads', requestedPath));
      if (publicPath !== filePath && existsSync(publicPath)) {
        finalPath = publicPath;
        exists = true;
      } else {
        const parts = requestedPath.split(/[\\\/]/);
        if (parts.length > 1) {
          const folder = parts[0];
          const rest = parts.slice(1).join('/');
          const alternativeFolder = folder.endsWith('s') ? folder.slice(0, -1) : folder + 's';
          const altPublicPath = normalize(join(process.cwd(), 'public', 'uploads', alternativeFolder, rest));
          if (existsSync(altPublicPath)) {
            finalPath = altPublicPath;
            exists = true;
          }
        }
      }
    }

    if (!exists) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const fileBuffer = await readFile(finalPath);
    const fileStat = await stat(finalPath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    const lastModified = fileStat.mtime.toUTCString();

    // Check If-Modified-Since for 304 responses
    const ifModifiedSince = request.headers.get('if-modified-since');
    if (ifModifiedSince && new Date(ifModifiedSince) >= fileStat.mtime) {
      return new NextResponse(null, { status: 304 });
    }

    // ═══════════════════════════════════════════════════════════════
    // 6. RETURN WITH SECURITY HEADERS
    // ═══════════════════════════════════════════════════════════════
    const isPublicResource = ACCESS_RULES[prefix]?.public ?? false;

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileBuffer.length),
        'Last-Modified': lastModified,
        'Cache-Control': isPublicResource
          ? 'public, max-age=86400, stale-while-revalidate=43200'
          : 'private, no-store',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none';",
        'Content-Disposition': mimeType.startsWith('image/') ? 'inline' : 'attachment',
      },
    });

  } catch (error) {
    console.error('[FILE-SERVE] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}