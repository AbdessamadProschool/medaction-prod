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

// Reclamation-specific configuration
const MAX_UPLOADS_PER_RECLAMATION = 5;
const UPLOAD_COOLDOWN_MS = 1000; // 1 second between uploads

// Concurrent upload protection (per reclamation)
const uploadLocks = new Map<string, number>();

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
    const files = formData.getAll('files') as File[];
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

    if (reclamation.userId !== parseInt(userId)) {
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

    // Check status - prevent uploads if already treated (matches PATCH logic)
    if (reclamation.statut && ['ACCEPTEE', 'AFFECTEE', 'EN_COURS', 'RESOLUE', 'REJETEE'].includes(reclamation.statut)) {
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
    // 7. CREATE SECURE UPLOAD DIRECTORY
    // ═══════════════════════════════════════════════════════════════════
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'reclamations', String(reclamationIdNum));
    await mkdir(uploadDir, { recursive: true });

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
          strictMode: true,
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
        // 8.2 GENERATE SECURE FILENAME
        // ─────────────────────────────────────────────────────────────────
        const secureFilename = generateSecureFilename(file.name);
        const filePath = path.join(uploadDir, secureFilename);

        // ─────────────────────────────────────────────────────────────────
        // 8.3 SAVE FILE
        // ─────────────────────────────────────────────────────────────────
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // ─────────────────────────────────────────────────────────────────
        // 8.4 CREATE DATABASE RECORD
        // ─────────────────────────────────────────────────────────────────
        const urlPublique = `/uploads/reclamations/${reclamationIdNum}/${secureFilename}`;
        
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
        console.error(`Error processing file ${file.name}:`, fileError);
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
    console.error('Erreur upload:', error);
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload', code: 'SERVER_ERROR' }, 
      { status: 500 }
    );
  }
}

// Cleanup old locks periodically
setInterval(() => {
  const now = Date.now();
  Array.from(uploadLocks.entries()).forEach(([key, timestamp]) => {
    if (now - timestamp > 60000) {
      uploadLocks.delete(key);
    }
  });
}, 60000);
