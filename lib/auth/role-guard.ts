import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import type { Session } from 'next-auth';
import type { UserRole } from '@prisma/client';
import { authOptions } from '@/lib/auth/config';

export async function requireRoles(
  allowedRoles: UserRole[]
): Promise<{ session: Session } | { error: NextResponse }> {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return { error: NextResponse.json({ error: 'Non authentifié' }, { status: 401 }) };
  }

  if (!allowedRoles.includes(session.user.role as UserRole)) {
    return { error: NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 }) };
  }

  return { session };
}
