/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                 MEDACTION - SECURE RECLAMATION FILE UPLOAD API                                   ║
 * ║                  OWASP Compliant File Upload for Reclamations                                    ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Security: CWE-434 | CWE-22 | CWE-79 | CWE-284 (Access Control)                                ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { 
  SECURITY_LIMITS, 
  sanitizeString, 
  validateId // MAJ-01: Ajout import
} from '@/lib/security/validation';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import {
  validateUploadedFile,
  generateSecureFilename,
  checkRateLimit,
  logSecurityEvent,
  UPLOAD_CONFIG,
} from '@/lib/security/upload-security';
import { SystemLogger } from '@/lib/system-logger';
import { safeResolvePath, sanitizeFilename } from '@/lib/utils/safe-path';

// Reclamation-specific configuration
const MAX_UPLOADS_PER_RECLAMATION = 5;
const UPLOAD_COOLDOWN_MS = 1000; // 1 second between uploads

// Concurrent upload protection (per reclamation)
const uploadLocks = new Map<string, number>();
let lastLockCleanup = Date.now(); // SUG-03: Pour cleanup lazy

function cleanupLocksIfNeeded() {
  const now = Date.now();
  if (now - lastLockCleanup < 60000) return;
  lastLockCleanup = now;
  for (const [key, timestamp] of uploadLocks.entries()) {
    if (now - timestamp > 60000) {
      uploadLocks.delete(key);
    }
  }
}

export async function POST(request: Request) {
  try {
    // ═══════════════════════════════════════════════════════════════════
    // 1. AUTHENTICATION CHECK (OWASP: Require authentication)
    // ═══════════════════════════════════════════════════════════════════
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Non authentifié', code: 'UNAUTHENTICATED' }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const validUserId = validateId(userId); // MAJ-01: Validation IDOR robuste
    if (!validUserId) {
      return NextResponse.json(
        { error: 'Session invalide', code: 'INVALID_SESSION' }, 
        { status: 401 }
      );
    }

    cleanupLocksIfNeeded(); // SUG-03: Cleanup lazy compatible serverless

    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

    // ═══════════════════════════════════════════════════════════════════
    // 2. RATE LIMITING (Global)
    // ═══════════════════════════════════════════════════════════════════
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      logSecurityEvent('UPLOAD_BLOCKED', {
        userId,
        filename: 'N/A',
        reason: 'Rate limit exceeded',
        ip: userIp,
      });
      
      return NextResponse.json({ 
        error: 'Trop de requêtes. Veuillez réessayer plus tard.',
        code: 'RATE_LIMITED',
        retryAfter: rateLimit.retryAfter
      }, { 
        status: 429,
        headers: { 'Retry-After': String(rateLimit.retryAfter) }
      });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. PARSE AND VALIDATE REQUEST
    // ═══════════════════════════════════════════════════════════════════
    const formData = await request.formData();
    let files = formData.getAll('files') as File[];
    if (files.length === 0) {
      files = formData.getAll('photos') as File[];
    }
    const reclamationId = formData.get('reclamationId') as string;

    // Validate reclamationId
    if (!reclamationId) {
      return NextResponse.json(
        { error: 'ID de réclamation requis', code: 'MISSING_ID' }, 
        { status: 400 }
      );
    }

    // SECURITY: Validate reclamationId format (CWE-20: Input Validation)
    const reclamationIdNum = parseInt(reclamationId, 10);
    if (isNaN(reclamationIdNum) || reclamationIdNum <= 0 || reclamationIdNum > 2147483647) {
      logSecurityEvent('UPLOAD_BLOCKED', {
        userId,
        filename: 'N/A',
        reason: `Invalid reclamation ID: ${reclamationId}`,
        ip: userIp,
      });
      
      return NextResponse.json(
        { error: 'ID de réclamation invalide', code: 'INVALID_ID' }, 
        { status: 400 }
      );
    }

    if (files.length === 0) {
      return NextResponse.json(
        { error: 'Aucun fichier fourni', code: 'NO_FILE' }, 
        { status: 400 }
      );
    }

    if (files.length > MAX_UPLOADS_PER_RECLAMATION) {
      return NextResponse.json({ 
        error: `Maximum ${MAX_UPLOADS_PER_RECLAMATION} fichiers autorisés par requête`,
        code: 'TOO_MANY_FILES'
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. CONCURRENT UPLOAD PROTECTION (Per Reclamation)
    // ═══════════════════════════════════════════════════════════════════
    const lastUpload = uploadLocks.get(reclamationId);
    const now = Date.now();
    
    if (lastUpload && (now - lastUpload) < UPLOAD_COOLDOWN_MS) {
      logSecurityEvent('UPLOAD_BLOCKED', {
        userId,
        filename: 'N/A',
        reason: 'Concurrent upload attempt',
        ip: userIp,
      });
      
      return NextResponse.json({ 
        error: 'Veuillez attendre avant de renvoyer des fichiers',
        code: 'COOLDOWN',
        retryAfter: Math.ceil((UPLOAD_COOLDOWN_MS - (now - lastUpload)) / 1000)
      }, { status: 429 });
    }
    uploadLocks.set(reclamationId, now);

    // ═══════════════════════════════════════════════════════════════════
    // 5. AUTHORIZATION CHECK (CWE-284: Access Control)
    // ═══════════════════════════════════════════════════════════════════
    const reclamation = await prisma.reclamation.findUnique({
      where: { id: reclamationIdNum },
      select: { 
        userId: true,
        statut: true,
        _count: { select: { medias: true } }
      }
    });

    if (!reclamation) {
      return NextResponse.json(
        { error: 'Réclamation non trouvée', code: 'NOT_FOUND' }, 
        { status: 404 }
      );
    }

    if (reclamation.userId !== validUserId) {
      logSecurityEvent('UPLOAD_BLOCKED', {
        userId,
        filename: 'N/A',
        reason: `Unauthorized access: user ${userId} trying to upload to reclamation ${reclamationIdNum}`,
        ip: userIp,
      });
      
      return NextResponse.json(
        { error: 'Non autorisé', code: 'UNAUTHORIZED' }, 
        { status: 403 }
      );
    }

    // MAJ-02: Bloquer si une décision (ACCEPTEE/REJETEE) a déjà été prise (Prisma Enum)
    if (reclamation.statut !== null) {
      return NextResponse.json({ 
        error: 'Impossible d\'ajouter des fichiers à une réclamation déjà traitée',
        code: 'CLOSED_RECLAMATION'
      }, { status: 403 });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 6. QUOTA CHECK
    // ═══════════════════════════════════════════════════════════════════
    const existingCount = reclamation._count?.medias || 0;
    if (existingCount + files.length > MAX_UPLOADS_PER_RECLAMATION) {
      return NextResponse.json({ 
        error: `Quota dépassé. Maximum ${MAX_UPLOADS_PER_RECLAMATION} fichiers par réclamation. Actuellement: ${existingCount}`,
        code: 'QUOTA_EXCEEDED',
        currentCount: existingCount,
        maxAllowed: MAX_UPLOADS_PER_RECLAMATION
      }, { status: 400 });
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. CREATE SECURE UPLOAD DIRECTORY (BLOC 3.2 FIX - Docker Ready)
    // ═══════════════════════════════════════════════════════════════════
    const STORAGE_PATH = process.env.STORAGE_PATH;
    const UPLOAD_BASE = STORAGE_PATH 
      ? (STORAGE_PATH.startsWith('/') || /^[a-zA-Z]:[\\\/]/.test(STORAGE_PATH)) 
        ? STORAGE_PATH 
        : path.join(process.cwd(), STORAGE_PATH)
      : path.join(process.cwd(), 'uploads');

    let uploadDir: string;
    try {
      uploadDir = safeResolvePath(UPLOAD_BASE, 'reclamations', String(reclamationIdNum));
    } catch {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Security check: ensure the resolved path is inside the UPLOAD_BASE
    if (!uploadDir.startsWith(path.normalize(UPLOAD_BASE))) {
       logSecurityEvent('PATH_TRAVERSAL_ATTEMPT', {
          userId,
          attemptedPath: uploadDir,
          ip: userIp
       });
       return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (mkdirError) {
      SystemLogger.error('upload-reclamation', 'Impossible de créer le répertoire upload', {
        uploadDir,
        UPLOAD_BASE,
        STORAGE_PATH: STORAGE_PATH || 'non défini',
        error: mkdirError instanceof Error ? mkdirError.message : String(mkdirError),
      });
      return NextResponse.json(
        { error: 'Erreur de configuration du stockage', code: 'STORAGE_ERROR' }, 
        { status: 500 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // 8. PROCESS EACH FILE WITH FULL SECURITY VALIDATION
    // ═══════════════════════════════════════════════════════════════════
    const savedFiles = [];
    const errors: { filename: string; error: string }[] = [];

    for (const file of files) {
      try {
        // ─────────────────────────────────────────────────────────────────
        // 8.1 COMPREHENSIVE SECURITY VALIDATION
        // ─────────────────────────────────────────────────────────────────
        const validation = await validateUploadedFile(file, {
          checkContent: true,
          strictMode: false, // FIX: strictMode cause des faux positifs sur images légitimes (données binaires)
        });

        if (!validation.isValid) {
          logSecurityEvent('UPLOAD_BLOCKED', {
            userId,
            filename: file.name,
            reason: validation.error || 'Validation failed',
            ip: userIp,
          });

          errors.push({
            filename: file.name,
            error: validation.error || 'Fichier non valide',
          });
          continue;
        }

        // Only allow images for reclamations
        if (!validation.detectedType?.startsWith('image/')) {
          logSecurityEvent('UPLOAD_BLOCKED', {
            userId,
            filename: file.name,
            reason: 'Non-image file for reclamation',
            ip: userIp,
          });

          errors.push({
            filename: file.name,
            error: 'Seules les images sont autorisées pour les réclamations',
          });
          continue;
        }

        // ─────────────────────────────────────────────────────────────────
        // 8.2 GENERATE SECURE FILENAME (BLOC 3.2 FIX)
        // ─────────────────────────────────────────────────────────────────
        const secureFilename = generateSecureFilename(file.name);
        const safeSecureFilename = sanitizeFilename(secureFilename);
        
        let filePath: string;
        try {
          filePath = safeResolvePath(uploadDir, safeSecureFilename);
        } catch {
          return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
        }

        // ─────────────────────────────────────────────────────────────────
        // 8.3 SAVE FILE
        // ─────────────────────────────────────────────────────────────────
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // ─────────────────────────────────────────────────────────────────
        // 8.4 CREATE DATABASE RECORD
        // ─────────────────────────────────────────────────────────────────
        const urlPublique = `/api/uploads/reclamations/${reclamationIdNum}/${secureFilename}`;
        
        const media = await prisma.media.create({
          data: {
            nomFichier: validation.sanitizedFilename || file.name,
            cheminFichier: filePath,
            urlPublique: urlPublique,
            type: 'IMAGE',
            mimeType: validation.detectedType || file.type,
            tailleMo: file.size / (1024 * 1024),
            reclamationId: reclamationIdNum,
          }
        });

        logSecurityEvent('UPLOAD_SUCCESS', {
          userId,
          filename: secureFilename,
          ip: userIp,
        });

        savedFiles.push(media);

      } catch (fileError) {
        SystemLogger.error('upload-reclamation', `Error processing file ${file.name}`, {
          error: fileError instanceof Error ? fileError.message : String(fileError),
          reclamationId: reclamationIdNum
        });
        errors.push({
          filename: file.name,
          error: 'Erreur lors du traitement du fichier',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 9. RETURN RESPONSE WITH SECURITY HEADERS
    // ═══════════════════════════════════════════════════════════════════
    const response = NextResponse.json({ 
      success: savedFiles.length > 0,
      message: `${savedFiles.length} fichier(s) uploadé(s) avec succès`,
      data: savedFiles,
      errors: errors.length > 0 ? errors : undefined,
      currentCount: existingCount + savedFiles.length,
      maxAllowed: MAX_UPLOADS_PER_RECLAMATION
    });

    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    
    return response;

  } catch (error) {
    SystemLogger.error('upload-reclamation', 'Erreur critique upload réclamation', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload', code: 'SERVER_ERROR', detail: error instanceof Error ? error.message : 'Unknown' }, 
      { status: 500 }
    );
  }
}
