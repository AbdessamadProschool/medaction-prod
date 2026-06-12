import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { sanitizeString, validateId } from '@/lib/security/validation';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { UnauthorizedError, ValidationError, NotFoundError } from '@/lib/exceptions';

const updateNotificationSchema = z.object({
  id: z.number().optional(),
  action: z.enum(['mark_all_read']).optional(),
}).refine(data => data.id || data.action, {
  message: "Soit 'id' soit 'action' doit être fourni"
});

export const GET = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const userId = parseInt(session.user.id);

    const notifications = await prisma.notification.findMany({
      where: {
        userId: userId,
        isLue: false
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: 20 // Limit to recent 20
    });

    const count = await prisma.notification.count({
      where: {
        userId: userId,
        isLue: false
      }
    });

  return successResponse({ 
    notifications,
    count
  });
});

export const PUT = withErrorHandler(async (request: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new UnauthorizedError('Non autorisé');
  }

  const userId = parseInt(session.user.id);
  const body = await request.json();
  const validation = updateNotificationSchema.safeParse(body);
  
  if (!validation.success) {
    throw new ValidationError('Données invalides', validation.error.flatten());
  }

    const data = validation.data;

    if (data.action === 'mark_all_read') {
      await prisma.notification.updateMany({
        where: {
          userId: userId,
          isLue: false
        },
        data: {
          isLue: true
        }
      });
      return successResponse({ success: true });
    }
    
    if (data.id) {
       const id = validateId(data.id);
       if (!id) throw new ValidationError('ID invalide');

       // SECURITY FIX: IDOR Protection - Check ownership
       const updated = await prisma.notification.updateMany({
         where: { 
           id: id,
           userId: userId 
         },
         data: { isLue: true }
       });

       if (updated.count === 0) {
         throw new NotFoundError('Notification non trouvée ou non autorisée');
       }

       return successResponse({ success: true });
    }

    throw new ValidationError('Action invalide');
});
