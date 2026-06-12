import { NextRequest, NextResponse } from 'next/server';
import { recordLoginAttemptByIP, getClientIP } from '@/lib/auth/security';
import { z } from 'zod';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ForbiddenError, ValidationError } from '@/lib/exceptions';

const schema = z.object({
  success: z.boolean(),
});

/**
 * POST /api/auth/login-record
 * 
 * SECURITY: Records the result of a login attempt for IP-based rate limiting.
 * Called after NextAuth authentication to update the counter.
 */
export const POST = withErrorHandler(async (request: NextRequest) => {
  const internalSecret = request.headers.get('x-internal-secret');
  if (!process.env.INTERNAL_API_SECRET || internalSecret !== process.env.INTERNAL_API_SECRET) {
    throw new ForbiddenError('Accès interdit');
  }

  const clientIP = getClientIP(request);
  const body = await request.json();
  
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ValidationError('Données invalides', result.error.flatten());
  }
    
  const { success } = result.data;
  
  // Record the attempt (success = reset counter, failure = increment)
  recordLoginAttemptByIP(clientIP, success);
  
  if (!success) {
    console.log(`[SECURITY] Failed login attempt recorded for IP: ${clientIP.substring(0, 8)}***`);
  }
  
  return successResponse({ recorded: true });
});
