/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                 MEDACTION - SECURE FILE UPLOAD API                                               ║
 * ║                  OWASP Compliant File Upload Endpoint                                            ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Security: CWE-434 (Unrestricted Upload) | CWE-22 (Path Traversal) | CWE-79 (XSS)              ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import {
  validateUploadedFile,
  generateSecureFilename,
  checkRateLimit,
  logSecurityEvent,
  UPLOAD_CONFIG,
} from "@/lib/security/upload-security";

// Configuration
const UPLOAD_DIR = join(process.cwd(), 'public', 'uploads');

// POST /api/upload - Secure file upload endpoint
export async function POST(request: NextRequest) {
  try {
    // ═══════════════════════════════════════════════════════════════════
    // 1. AUTHENTICATION CHECK (OWASP: Require authentication)
    // ═══════════════════════════════════════════════════════════════════
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Non authentifié", code: "UNAUTHENTICATED" }, 
        { status: 401 }
      );
    }

    const userId = session.user.id;
    const userIp = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';

    // ═══════════════════════════════════════════════════════════════════
    // 2. RATE LIMITING (OWASP: Prevent DoS)
    // ═══════════════════════════════════════════════════════════════════
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      logSecurityEvent('UPLOAD_BLOCKED', {
        userId,
        filename: 'N/A',
        reason: 'Rate limit exceeded',
        ip: userIp,
      });
      
      return NextResponse.json(
        { 
          error: "Trop de requêtes. Veuillez réessayer plus tard.",
          code: "RATE_LIMITED",
          retryAfter: rateLimit.retryAfter
        }, 
        { 
          status: 429,
          headers: {
            'Retry-After': String(rateLimit.retryAfter),
          }
        }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // 3. PARSE REQUEST
    // ═══════════════════════════════════════════════════════════════════
    const formData = await request.formData();
    
    // Support both 'file' (singular) and 'files' (plural)
    let files: File[] = formData.getAll('files') as File[];
    const singleFile = formData.get('file') as File | null;
    if (singleFile && files.length === 0) {
      files = [singleFile];
    }
    
    const uploadType = formData.get('type') as string || 'general';

    // Validate upload type (prevent path traversal via type)
    const sanitizedType = uploadType.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
    if (sanitizedType !== uploadType) {
      logSecurityEvent('UPLOAD_BLOCKED', {
        userId,
        filename: 'N/A',
        reason: `Invalid upload type: ${uploadType}`,
        ip: userIp,
      });
      
      return NextResponse.json(
        { error: "Type de téléchargement invalide", code: "INVALID_TYPE" }, 
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // 4. VALIDATE FILE COUNT
    // ═══════════════════════════════════════════════════════════════════
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: "Aucun fichier fourni", code: "NO_FILE" }, 
        { status: 400 }
      );
    }

    if (files.length > UPLOAD_CONFIG.MAX_FILES_PER_REQUEST) {
      return NextResponse.json(
        { 
          error: `Maximum ${UPLOAD_CONFIG.MAX_FILES_PER_REQUEST} fichiers par requête`,
          code: "TOO_MANY_FILES"
        }, 
        { status: 400 }
      );
    }

    // ═══════════════════════════════════════════════════════════════════
    // 5. CREATE UPLOAD DIRECTORY (Secure)
    // ═══════════════════════════════════════════════════════════════════
    const uploadPath = join(UPLOAD_DIR, sanitizedType);
    await mkdir(uploadPath, { recursive: true });

    // ═══════════════════════════════════════════════════════════════════
    // 6. PROCESS EACH FILE WITH FULL SECURITY VALIDATION
    // ═══════════════════════════════════════════════════════════════════
    const uploadedFiles: { 
      filename: string; 
      url: string; 
      originalName: string; 
      size: number;
      type: string;
    }[] = [];
    const errors: { filename: string; error: string; code: string }[] = [];

    for (const file of files) {
      try {
        // ─────────────────────────────────────────────────────────────────
        // 6.1 COMPREHENSIVE SECURITY VALIDATION
        // ─────────────────────────────────────────────────────────────────
        const validation = await validateUploadedFile(file, {
          checkContent: true,
          strictMode: true, // Block files with any suspicious content
        });

        // Log pour debugging
        console.log(`[UPLOAD] Validation du fichier "${file.name}":`, {
          isValid: validation.isValid,
          error: validation.error,
          errorCode: validation.errorCode,
          sanitizedFilename: validation.sanitizedFilename,
          warnings: validation.securityWarnings,
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
            code: validation.errorCode || 'VALIDATION_FAILED',
          });
          continue;
        }

        // Log warnings if any
        if (validation.securityWarnings && validation.securityWarnings.length > 0) {
          logSecurityEvent('UPLOAD_WARNING', {
            userId,
            filename: file.name,
            warnings: validation.securityWarnings,
            ip: userIp,
          });
        }

        // ─────────────────────────────────────────────────────────────────
        // 6.2 GENERATE SECURE FILENAME (OWASP: Never use user-provided names)
        // ─────────────────────────────────────────────────────────────────
        const secureFilename = generateSecureFilename(file.name);
        const filepath = join(uploadPath, secureFilename);

        // ─────────────────────────────────────────────────────────────────
        // 6.3 SAVE FILE
        // ─────────────────────────────────────────────────────────────────
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        // ─────────────────────────────────────────────────────────────────
        // 6.4 LOG SUCCESS
        // ─────────────────────────────────────────────────────────────────
        logSecurityEvent('UPLOAD_SUCCESS', {
          userId,
          filename: secureFilename,
          ip: userIp,
        });

        uploadedFiles.push({
          filename: secureFilename,
          url: `/uploads/${sanitizedType}/${secureFilename}`,
          originalName: validation.sanitizedFilename || file.name,
          size: file.size,
          type: validation.detectedType || file.type,
        });

      } catch (fileError) {
        console.error(`Error processing file ${file.name}:`, fileError);
        errors.push({
          filename: file.name,
          error: 'Erreur lors du traitement du fichier',
          code: 'PROCESSING_ERROR',
        });
      }
    }

    // ═══════════════════════════════════════════════════════════════════
    // 7. RETURN RESPONSE WITH SECURITY HEADERS
    // ═══════════════════════════════════════════════════════════════════
    const response = NextResponse.json({
      success: uploadedFiles.length > 0,
      uploaded: uploadedFiles,
      // For single file uploads, provide url directly
      url: uploadedFiles.length === 1 ? uploadedFiles[0].url : undefined,
      errors: errors.length > 0 ? errors : undefined,
      message: `${uploadedFiles.length} fichier(s) uploadé(s)`,
    });

    // Add security headers (OWASP recommended)
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('Content-Security-Policy', "default-src 'self'");
    
    return response;

  } catch (error) {
    console.error("Erreur POST /api/upload:", error);
    return NextResponse.json(
      { error: "Erreur serveur", code: "SERVER_ERROR" }, 
      { status: 500 }
    );
  }
}
