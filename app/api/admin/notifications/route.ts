import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

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

    if (body.action === 'mark_all_read') {
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
    
    if (body.id) {
       await prisma.notification.update({
         where: { id: body.id },
         data: { isLue: true }
       });
       return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Action invalide' }, { status: 400 });

  } catch (error) {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
