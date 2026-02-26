/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║          MEDACTION - SECURE FILE SERVING API                                ║
 * ║          Serves uploaded files from external storage (Docker-ready)         ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  Security: Path traversal protection, MIME validation, caching             ║
 * ║  Docker: Reads from STORAGE_PATH env (volume mount)                        ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import { join, normalize, extname } from 'path';
import { existsSync } from 'fs';

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

// Storage configuration
function getStoragePath(): string {
  const storagePath = process.env.STORAGE_PATH;
  if (storagePath) {
    // Absolute path (Linux or Windows)
    if (storagePath.startsWith('/') || /^[a-zA-Z]:\\/.test(storagePath)) {
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
    // 3. RESOLVE FILE PATH
    // ═══════════════════════════════════════════════════════════════
    const storagePath = getStoragePath();
    const filePath = normalize(join(storagePath, requestedPath));
    
    // Security: Ensure resolved path is still within storage directory
    if (!filePath.startsWith(normalize(storagePath))) {
      console.warn(`[FILE-SERVE] ⚠️ Path escape attempt: ${filePath}`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. CHECK FILE EXISTS
    // ═══════════════════════════════════════════════════════════════
    if (!existsSync(filePath)) {
      // Fallback: try public/uploads for backward compatibility
      const publicPath = join(process.cwd(), 'public', 'uploads', requestedPath);
      if (existsSync(publicPath)) {
        const fileBuffer = await readFile(publicPath);
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        
        return new NextResponse(fileBuffer, {
          status: 200,
          headers: {
            'Content-Type': mimeType,
            'Content-Length': String(fileBuffer.length),
            'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
            'X-Content-Type-Options': 'nosniff',
          },
        });
      }
      
      return new NextResponse('Not Found', { status: 404 });
    }

    // ═══════════════════════════════════════════════════════════════
    // 5. READ AND SERVE FILE
    // ═══════════════════════════════════════════════════════════════
    const fileBuffer = await readFile(filePath);
    const fileStat = await stat(filePath);
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
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Content-Length': String(fileBuffer.length),
        'Last-Modified': lastModified,
        // Cache for 24h, allow stale for 12h while revalidating
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=43200',
        // Security headers
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        // Prevent scripts in uploaded files from executing
        'Content-Security-Policy': "default-src 'none'; img-src 'self'; style-src 'none'; script-src 'none';",
        // Files should be displayed inline (images) not downloaded
        'Content-Disposition': mimeType.startsWith('image/') ? 'inline' : 'attachment',
      },
    });

  } catch (error) {
    console.error('[FILE-SERVE] Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
