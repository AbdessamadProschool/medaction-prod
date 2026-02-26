import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * GET /api/auth/reset-password/validate
 * Valide un token de réinitialisation
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ valid: false });
    }

    // Chercher l'utilisateur avec ce token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    return NextResponse.json({ valid: !!user });
  } catch (error) {
    console.error('[VALIDATE TOKEN] Erreur:', error);
    return NextResponse.json({ valid: false });
  }
}
