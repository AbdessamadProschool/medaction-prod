import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id ? parseInt(session.user.id) : null;
    
    // Obtenir l'IP (approximatif pour Next.js App Router sans headers() complexité)
    // En production on utiliserait les headers x-forwarded-for
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(/, /)[0] : "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "Unknown";

    const body = await req.json();
    const { path, reason } = body;

    // Enregistrer le log
    await prisma.activityLog.create({
      data: {
        action: 'ACCESS_DENIED',
        entity: 'Route',
        entityId: null,
        userId: userId,
        ipAddress: ip,
        userAgent: userAgent,
        details: { path, reason, success: false, timestamp: new Date().toISOString() }
      }
    });

    return NextResponse.json({ logged: true });
  } catch (error) {
    console.error('Erreur logging access denied:', error);
    return NextResponse.json({ logged: false }, { status: 500 });
  }
}
