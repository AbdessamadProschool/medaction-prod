/**
 * ╔══════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║                 MEDACTION - FILE UPLOAD SECURITY LIBRARY                                         ║
 * ║                  Professional File Upload Validation & Sanitization                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Standards: OWASP File Upload Guide | CWE-434 | CWE-22 | CWE-79 | NIST SP 800-53                ║
 * ╚══════════════════════════════════════════════════════════════════════════════════════════════════╝
 * 
 * This library provides comprehensive file upload security including:
 * - Magic bytes validation (not just MIME type headers)
 * - Dangerous extension blocking
 * - Path traversal prevention
 * - Filename sanitization
 * - Size limits
 * - Rate limiting
 * - Content scanning for embedded code
 */

// ═══════════════════════════════════════════════════════════════════════════
// CONFIGURATION - OWASP Recommended Settings
// ═══════════════════════════════════════════════════════════════════════════

export const UPLOAD_CONFIG = {
  // Size limits (OWASP: Always set max file size)
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024, // 5MB per file
  MIN_FILE_SIZE_BYTES: 100, // 100 bytes minimum (prevents empty files)
  MAX_FILES_PER_REQUEST: 5, // 5 files max per upload
  MAX_FILENAME_LENGTH: 255,
  
  // Allowed file types with magic bytes (OWASP: Validate by magic bytes, not MIME)
  ALLOWED_TYPES: {
    // Images
    'image/jpeg': {
      extensions: ['jpg', 'jpeg'],
      magicBytes: [
        [0xFF, 0xD8, 0xFF, 0xE0], // JFIF
        [0xFF, 0xD8, 0xFF, 0xE1], // EXIF
        [0xFF, 0xD8, 0xFF, 0xE8], // SPIFF
        [0xFF, 0xD8, 0xFF, 0xDB], // RAW
      ],
    },
    'image/png': {
      extensions: ['png'],
      magicBytes: [[0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]],
    },
    'image/gif': {
      extensions: ['gif'],
      magicBytes: [
        [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
        [0x47, 0x49, 0x46, 0x38, 0x39, 0x61], // GIF89a
      ],
    },
    'image/webp': {
      extensions: ['webp'],
      magicBytes: [[0x52, 0x49, 0x46, 0x46]], // RIFF (WebP starts with RIFF)
    },
    // Documents
    'application/pdf': {
      extensions: ['pdf'],
      magicBytes: [[0x25, 0x50, 0x44, 0x46]], // %PDF
    },
  } as Record<string, { extensions: string[]; magicBytes: number[][] }>,
  
  // COMPLETELY BLOCKED extensions (OWASP: Block dangerous extensions)
  BLOCKED_EXTENSIONS: [
    // Executable
    'php', 'php3', 'php4', 'php5', 'php7', 'phtml', 'phar',
    'exe', 'msi', 'bat', 'cmd', 'com', 'scr', 'pif',
    'vbs', 'vbe', 'js', 'jse', 'ws', 'wsf', 'wsc', 'wsh',
    'ps1', 'psm1', 'psd1',
    'sh', 'bash', 'zsh', 'csh', 'ksh',
    'pl', 'pm', 'py', 'pyc', 'pyo', 'pyw',
    'rb', 'rbw',
    'jar', 'class', 'war', 'ear',
    'jsp', 'jspx', 'jsw', 'jsv', 'jspf',
    'asp', 'aspx', 'cer', 'cdx', 'asa',
    'cfm', 'cfml', 'cfc',
    // Config files
    'htaccess', 'htpasswd', 'ini', 'config', 'conf',
    'env', 'yml', 'yaml', 'json', 'xml', 'xsl', 'xslt',
    // Archives (can contain dangerous files)
    'zip', 'rar', '7z', 'tar', 'gz', 'bz2',
    // Special
    'svg', 'svgz', // Can contain JavaScript
    'html', 'htm', 'xhtml', 'shtml', 'mhtml',
    'hta', 'url', 'lnk',
    'dll', 'so', 'dylib',
    // ImageMagick vulnerable formats
    'mvg', 'msl', 'xpm', 'xbm',
  ],
  
  // Dangerous patterns in filenames (CWE-22: Path Traversal)
  DANGEROUS_FILENAME_PATTERNS: [
    /\.\./,                      // Directory traversal
    /\.\\/,                      // Windows traversal
    /[\/\\]/,                    // Path separators
    /^\.+$/,                     // Only dots
    /[\x00-\x1F\x7F]/,          // Control characters
    /[<>:"|?*]/,                // Windows illegal chars
    /^(con|prn|aux|nul|com\d|lpt\d)$/i, // Windows reserved names
    /[\u202E\u200F\u200E]/,     // RTL override and other Unicode tricks
    /%[0-9a-fA-F]{2}/,          // URL encoded characters
  ],
  
  // Dangerous content patterns (embedded code detection)
  DANGEROUS_CONTENT_PATTERNS: [
    /<\?php/i,                   // PHP opening tag
    /<\?=/,                      // PHP short echo
    /<%/,                        // ASP/JSP tags
    /<script/i,                  // JavaScript
    /javascript:/i,              // JavaScript protocol
    /vbscript:/i,               // VBScript protocol
    /on\w+\s*=/i,               // Event handlers (onclick, onload, etc.)
    /eval\s*\(/i,               // eval() calls
    /system\s*\(/i,             // system() calls (PHP/shell)
    /exec\s*\(/i,               // exec() calls
    /passthru\s*\(/i,           // passthru() (PHP)
    /shell_exec\s*\(/i,         // shell_exec() (PHP)
    /\$_GET/,                    // PHP superglobals
    /\$_POST/,
    /\$_REQUEST/,
    /\$_FILES/,
    /<\s*iframe/i,              // iframes
    /<\s*object/i,              // object tags
    /<\s*embed/i,               // embed tags
    /<!ENTITY/i,                // XML entity (XXE)
    /<!DOCTYPE.*SYSTEM/i,       // External DTD
    /url\s*\(/i,                // CSS url() - ImageMagick exploit
    /push\s+graphic-context/i,  // ImageTragick
  ],
  
  // Rate limiting
  RATE_LIMIT: {
    MAX_UPLOADS_PER_MINUTE: 10,
    MAX_UPLOADS_PER_HOUR: 100,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION RESULT TYPE
// ═══════════════════════════════════════════════════════════════════════════

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  errorCode?: string;
  sanitizedFilename?: string;
  detectedType?: string;
  securityWarnings?: string[];
}

// ═══════════════════════════════════════════════════════════════════════════
// RATE LIMITING (In-memory for single instance, use Redis for production)
// ═══════════════════════════════════════════════════════════════════════════

const uploadRateLimits = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(userId: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `upload:${userId}`;
  const limit = uploadRateLimits.get(key);
  
  if (!limit || now > limit.resetTime) {
    uploadRateLimits.set(key, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return { allowed: true };
  }
  
  if (limit.count >= UPLOAD_CONFIG.RATE_LIMIT.MAX_UPLOADS_PER_MINUTE) {
    return { 
      allowed: false, 
      retryAfter: Math.ceil((limit.resetTime - now) / 1000) 
    };
  }
  
  limit.count++;
  return { allowed: true };
}

// Cleanup old rate limits periodically
setInterval(() => {
  const now = Date.now();
  Array.from(uploadRateLimits.entries()).forEach(([key, value]) => {
    if (now > value.resetTime + 60000) {
      uploadRateLimits.delete(key);
    }
  });
}, 60000);

// ═══════════════════════════════════════════════════════════════════════════
// MAGIC BYTES VALIDATION (OWASP: CWE-434 Prevention)
// ═══════════════════════════════════════════════════════════════════════════

export function validateMagicBytes(buffer: Buffer, declaredMimeType: string): { isValid: boolean; detectedType?: string } {
  const typeConfig = UPLOAD_CONFIG.ALLOWED_TYPES[declaredMimeType];
  
  if (!typeConfig) {
    return { isValid: false };
  }
  
  for (const magicSequence of typeConfig.magicBytes) {
    let matches = true;
    for (let i = 0; i < magicSequence.length; i++) {
      if (buffer[i] !== magicSequence[i]) {
        matches = false;
        break;
      }
    }
    if (matches) {
      return { isValid: true, detectedType: declaredMimeType };
    }
  }
  
  return { isValid: false };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXTENSION VALIDATION (OWASP: Block Dangerous Extensions)
// ═══════════════════════════════════════════════════════════════════════════

export function validateExtension(filename: string): { isValid: boolean; extension?: string; error?: string } {
  // Extract all extensions (handle double extensions like .php.jpg)
  const parts = filename.toLowerCase().split('.');
  
  if (parts.length === 1) {
    return { isValid: false, error: 'No extension found' };
  }
  
  // Check ALL extensions, not just the last one (prevents .php.jpg bypass)
  for (let i = 1; i < parts.length; i++) {
    const ext = parts[i];
    if (UPLOAD_CONFIG.BLOCKED_EXTENSIONS.includes(ext)) {
      return { 
        isValid: false, 
        extension: ext,
        error: `Blocked extension: .${ext}` 
      };
    }
  }
  
  // Get the final extension
  const finalExtension = parts[parts.length - 1];
  
  // Verify it's in allowed list
  const allowedExtensions = Object.values(UPLOAD_CONFIG.ALLOWED_TYPES)
    .flatMap(t => t.extensions);
  
  if (!allowedExtensions.includes(finalExtension)) {
    return { 
      isValid: false, 
      extension: finalExtension,
      error: `Extension not allowed: .${finalExtension}` 
    };
  }
  
  return { isValid: true, extension: finalExtension };
}

// ═══════════════════════════════════════════════════════════════════════════
// FILENAME SANITIZATION (CWE-22: Path Traversal Prevention)
// ═══════════════════════════════════════════════════════════════════════════

export function sanitizeFilename(filename: string): { sanitized: string; warnings: string[] } {
  const warnings: string[] = [];
  let sanitized = filename;
  
  // Check for dangerous patterns
  for (const pattern of UPLOAD_CONFIG.DANGEROUS_FILENAME_PATTERNS) {
    if (pattern.test(sanitized)) {
      warnings.push(`Dangerous pattern detected: ${pattern.source}`);
    }
  }
  
  // Remove path separators (CWE-22)
  sanitized = sanitized.replace(/[\/\\]/g, '');
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove Windows illegal characters
  sanitized = sanitized.replace(/[<>:"|?*]/g, '');
  
  // Remove Unicode tricks (RTL override, etc.)
  sanitized = sanitized.replace(/[\u202E\u200F\u200E\u2066-\u2069]/g, '');
  
  // Decode URL encoding attacks
  try {
    while (sanitized.includes('%')) {
      const decoded = decodeURIComponent(sanitized);
      if (decoded === sanitized) break;
      sanitized = decoded;
      warnings.push('URL-encoded characters detected and decoded');
    }
  } catch {
    // Keep as is if decoding fails
  }
  
  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Truncate to max length
  if (sanitized.length > UPLOAD_CONFIG.MAX_FILENAME_LENGTH) {
    const ext = sanitized.split('.').pop() || '';
    const name = sanitized.slice(0, UPLOAD_CONFIG.MAX_FILENAME_LENGTH - ext.length - 1);
    sanitized = `${name}.${ext}`;
    warnings.push('Filename truncated due to length');
  }
  
  return { sanitized, warnings };
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTENT SCANNING (Embedded Code Detection)
// ═══════════════════════════════════════════════════════════════════════════

export function scanContentForThreats(buffer: Buffer): { isSafe: boolean; threats: string[] } {
  const threats: string[] = [];
  
  // Convert buffer to string for pattern matching
  // Only check first 10KB to avoid performance issues with large files
  const contentToScan = buffer.slice(0, 10240).toString('utf8');
  
  for (const pattern of UPLOAD_CONFIG.DANGEROUS_CONTENT_PATTERNS) {
    if (pattern.test(contentToScan)) {
      threats.push(`Dangerous content pattern: ${pattern.source}`);
    }
  }
  
  // Check for null bytes injection (polyglot files)
  if (buffer.includes(0x00)) {
    // Only flag if null byte appears after actual content (common in polyglots)
    const nullIndex = buffer.indexOf(0x00);
    if (nullIndex > 50 && nullIndex < buffer.length - 50) {
      // Check if there's text content after the null byte
      const afterNull = buffer.slice(nullIndex + 1, nullIndex + 50).toString('utf8');
      if (/[a-zA-Z]{3,}/.test(afterNull)) {
        threats.push('Possible polyglot file: null byte with text content');
      }
    }
  }
  
  return { 
    isSafe: threats.length === 0, 
    threats 
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// COMPREHENSIVE FILE VALIDATION (OWASP Complete Validation)
// ═══════════════════════════════════════════════════════════════════════════

export async function validateUploadedFile(
  file: File,
  options: {
    checkContent?: boolean;
    strictMode?: boolean;
  } = {}
): Promise<FileValidationResult> {
  const { checkContent = true, strictMode = false } = options;
  const warnings: string[] = [];

  // 1. Check file size (OWASP: Always validate size)
  if (file.size < UPLOAD_CONFIG.MIN_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: 'File is too small (minimum 100 bytes)',
      errorCode: 'FILE_TOO_SMALL',
    };
  }
  
  if (file.size > UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      error: `File exceeds maximum size (${UPLOAD_CONFIG.MAX_FILE_SIZE_BYTES / 1024 / 1024}MB)`,
      errorCode: 'FILE_TOO_LARGE',
    };
  }

  // 2. Validate extension
  const extValidation = validateExtension(file.name);
  if (!extValidation.isValid) {
    return {
      isValid: false,
      error: extValidation.error,
      errorCode: 'INVALID_EXTENSION',
    };
  }

  // 3. Sanitize filename
  const { sanitized, warnings: filenameWarnings } = sanitizeFilename(file.name);
  warnings.push(...filenameWarnings);
  
  if (sanitized.length === 0 || sanitized === '.' + extValidation.extension) {
    return {
      isValid: false,
      error: 'Invalid filename after sanitization',
      errorCode: 'INVALID_FILENAME',
    };
  }

  // 4. Read file content for deeper validation
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // 5. Validate magic bytes (OWASP: CWE-434)
  const magicValidation = validateMagicBytes(buffer, file.type);
  if (!magicValidation.isValid) {
    return {
      isValid: false,
      error: `File content does not match declared type (${file.type})`,
      errorCode: 'MAGIC_BYTES_MISMATCH',
    };
  }

  // 6. Scan content for embedded threats
  if (checkContent) {
    const contentScan = scanContentForThreats(buffer);
    if (!contentScan.isSafe) {
      if (strictMode) {
        return {
          isValid: false,
          error: 'Potentially malicious content detected',
          errorCode: 'MALICIOUS_CONTENT',
        };
      } else {
        warnings.push(...contentScan.threats);
      }
    }
  }

  return {
    isValid: true,
    sanitizedFilename: sanitized,
    detectedType: magicValidation.detectedType,
    securityWarnings: warnings.length > 0 ? warnings : undefined,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GENERATE SECURE FILENAME (OWASP: Never trust user-provided filenames)
// ═══════════════════════════════════════════════════════════════════════════

export function generateSecureFilename(originalName: string): string {
  // Extract extension from validated original
  const extValidation = validateExtension(originalName);
  const ext = extValidation.extension || 'bin';
  
  // Generate random UUID-based filename
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  const crypto = require('crypto');
  const hash = crypto.randomBytes(8).toString('hex');
  
  return `${timestamp}-${random}-${hash}.${ext}`;
}

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING HELPER (Security Audit Trail)
// ═══════════════════════════════════════════════════════════════════════════

export function logSecurityEvent(
  type: 'UPLOAD_BLOCKED' | 'UPLOAD_WARNING' | 'UPLOAD_SUCCESS',
  details: {
    userId: string;
    filename: string;
    reason?: string;
    warnings?: string[];
    ip?: string;
  }
): void {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    type,
    ...details,
  };
  
  // In production, send to proper logging service (ELK, CloudWatch, etc.)
  if (type === 'UPLOAD_BLOCKED') {
    console.warn('[SECURITY] Upload blocked:', JSON.stringify(logEntry));
  } else if (type === 'UPLOAD_WARNING') {
    console.warn('[SECURITY] Upload warning:', JSON.stringify(logEntry));
  } else {
    console.log('[SECURITY] Upload success:', JSON.stringify(logEntry));
  }
}
