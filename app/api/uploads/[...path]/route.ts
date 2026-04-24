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
    
    // Debug log for Proxmox/Production (Only in dev or if specific log enabled)
    // console.log(`[FILE-SERVE] Trying: ${filePath} (Storage: ${storagePath})`);

    // Security: Ensure resolved path is still within storage directory
    const normalizedStoragePath = normalize(storagePath);
    if (!filePath.startsWith(normalizedStoragePath)) {
      console.warn(`[FILE-SERVE] ⚠️ Path escape attempt: ${filePath} (Storage: ${normalizedStoragePath})`);
      return new NextResponse('Forbidden', { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════
    // 4. CHECK FILE EXISTS
    // ═══════════════════════════════════════════════════════════════
    let finalPath = filePath;
    let exists = existsSync(filePath);

    if (!exists) {
      // Fallback 1: Try with reversed slashes (Windows/Linux compatibility)
      const altPath = filePath.includes('/') ? filePath.replace(/\//g, '\\') : filePath.replace(/\\/g, '/');
      if (altPath !== filePath && existsSync(altPath)) {
        finalPath = altPath;
        exists = true;
      }
    }

    if (!exists) {
      // Fallback 2: try public/uploads directly relative to CWD
      const publicPath = join(process.cwd(), 'public', 'uploads', requestedPath);
      if (publicPath !== filePath && existsSync(publicPath)) {
        finalPath = publicPath;
        exists = true;
      }
    }

    if (!exists) {
      console.warn(`[FILE-SERVE] ❌ File not found after fallbacks: ${filePath}`);
      // Log more context for Proxmox troubleshooting
      console.log(`[DEBUG] CWD: ${process.cwd()}, STORAGE_PATH: ${process.env.STORAGE_PATH || 'Not set'}`);
      
      return new NextResponse(JSON.stringify({ 
        error: 'File Not Found', 
        path: requestedPath,
        resolved: filePath 
      }), { 
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
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