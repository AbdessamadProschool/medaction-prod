import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError } from '@/lib/exceptions';
import { ActivityLogger } from '@/lib/activity-logger';

export const POST = withErrorHandler(async (req: Request) => {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ? parseInt(session.user.id) : null;
  
  if (!userId) {
    throw new UnauthorizedError('Unauthorized');
  }
    
    const body = await req.json();
    const { path, reason } = body;

  // Enregistrer le log
  await ActivityLogger.custom({
    action: 'ACCESS_DENIED',
    entity: 'Route',
    entityId: 0,
    userId: userId,
    details: { path, reason, success: false, timestamp: new Date().toISOString() }
  });

  return successResponse({ logged: true });
});
