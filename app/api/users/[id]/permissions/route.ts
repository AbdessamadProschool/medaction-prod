import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { getEffectiveUserPermissions } from '@/lib/permissions';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const targetUserId = parseInt(params.id);
    const requesterId = parseInt(session.user.id);

    // Un utilisateur peut voir ses propres permissions
    // Un admin peut voir les permissions des autres (selon logique métier, ici ok pour simplifier)
    if (targetUserId !== requesterId && session.user.role !== 'SUPER_ADMIN' && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Accès interdit' }, { status: 403 });
    }

    const permissions = await getEffectiveUserPermissions(targetUserId);

    // Cache header pour optimiser le hook frontend
    const response = NextResponse.json({ permissions });
    response.headers.set('Cache-Control', 'private, max-age=60'); // Cache 1 minute

    return response;

  } catch (error) {
    console.error('Erreur GET user permissions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
