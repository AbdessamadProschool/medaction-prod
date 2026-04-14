import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { sanitizeString, validateId } from '@/lib/security/validation';

const updateNotificationSchema = z.object({
  id: z.number().optional(),
  action: z.enum(['mark_all_read']).optional(),
}).refine(data => data.id || data.action, {
  message: "Soit 'id' soit 'action' doit être fourni"
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
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

    return NextResponse.json({ 
      notifications,
      count
    });

  } catch (error) {
    console.error('Erreur notifications:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();
    const validation = updateNotificationSchema.safeParse(body);
    
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validation.error.flatten() 
      }, { status: 400 });
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
      return NextResponse.json({ success: true });
    }
    
    if (data.id) {
       const id = validateId(data.id);
       if (!id) return NextResponse.json({ error: 'ID invalide' }, { status: 400 });

       // SECURITY FIX: IDOR Protection - Check ownership
       const updated = await prisma.notification.updateMany({
         where: { 
           id: id,
           userId: userId 
         },
         data: { isLue: true }
       });

       if (updated.count === 0) {
         return NextResponse.json({ 
           error: 'Notification non trouvée ou non autorisée' 
         }, { status: 404 });
       }

       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
