import { NextRequest, NextResponse } from 'next/server';
import { recordLoginAttemptByIP, getClientIP } from '@/lib/auth/security';
import { z } from 'zod';

const schema = z.object({
  success: z.boolean(),
});

/**
 * POST /api/auth/login-record
 * 
 * SECURITY: Records the result of a login attempt for IP-based rate limiting.
 * Called after NextAuth authentication to update the counter.
 */
export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const body = await request.json();
    
    const result = schema.safeParse(body);
    if (!result.success) {
      return NextResponse.json({ success: false }, { status: 400 });
    }
    
    const { success } = result.data;
    
    // Record the attempt (success = reset counter, failure = increment)
    recordLoginAttemptByIP(clientIP, success);
    
    if (!success) {
      console.log(`[SECURITY] Failed login attempt recorded for IP: ${clientIP.substring(0, 8)}***`);
    }
    
    return NextResponse.json({ success: true, recorded: true });
    
  } catch (error) {
    console.error('Error in login-record:', error);
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
