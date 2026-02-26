import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// Préférences par défaut
const DEFAULT_PREFERENCES = {
  notifications: {
    email: {
      evenements: true,
      actualites: true,
      reclamations: true,
      campagnes: true,
      newsletter: false,
    },
    push: {
      evenements: true,
      actualites: false,
      reclamations: true,
      campagnes: true,
    },
    sms: {
      reclamations: false,
      urgences: true,
    },
  },
  theme: 'system', // 'light' | 'dark' | 'system'
  langue: 'fr',
};

// GET - Récupérer les préférences
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    // Fusionner avec les préférences par défaut
    const preferences = {
      ...DEFAULT_PREFERENCES,
      ...(user?.preferences as object || {}),
    };

    return NextResponse.json({
      success: true,
      data: preferences,
    });

  } catch (error) {
    console.error('Erreur préférences:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour les préférences
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Récupérer les préférences actuelles
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true },
    });

    const currentPreferences = {
      ...DEFAULT_PREFERENCES,
      ...(user?.preferences as object || {}),
    };

    // Fusionner avec les nouvelles préférences
    const newPreferences = deepMerge(currentPreferences, body);

    // Mettre à jour
    await prisma.user.update({
      where: { id: userId },
      data: { preferences: newPreferences as object },
    });

    return NextResponse.json({
      success: true,
      message: 'Préférences mises à jour',
      data: newPreferences,
    });

  } catch (error) {
    console.error('Erreur mise à jour préférences:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// Fonction utilitaire pour fusionner en profondeur
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result = { ...target };
  
  for (const key of Object.keys(source)) {
    if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(
        (target[key] as Record<string, unknown>) || {},
        source[key] as Record<string, unknown>
      );
    } else {
      result[key] = source[key];
    }
  }
  
  return result;
}
