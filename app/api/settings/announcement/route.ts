import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { performanceCache, CACHE_TTL, cacheKey } from '@/lib/cache/performance-cache';

// Configuration par défaut professionnelle
const DEFAULT_CONFIG = {
  isActive: true,
  title: "Version Bêta - إطلاق تجريبي",
  message: "Bienvenue sur le Portail MEDIOUNA. Cette plateforme est en phase de lancement. Vos retours nous sont précieux pour améliorer le service.\n\nمرحبًا بكم في بوابة مديونة. هذه المنصة في مرحلة الإطلاق التجريبي. ملاحظاتكم قيمة لتحسين الخدمة.",
  showOncePerSession: true
};

const SETTING_KEY = 'ANNOUNCEMENT_MODAL';

// Revalidation toutes les 5 minutes — l'annonce change rarement
export const revalidate = 300;

export async function GET() {
  try {
    const data = await performanceCache.getOrFetch(
      cacheKey.announcement(),
      async () => {
        const setting = await prisma.systemSetting.findUnique({
          where: { key: SETTING_KEY }
        });
        return setting ? (setting.value || DEFAULT_CONFIG) : DEFAULT_CONFIG;
      },
      CACHE_TTL.ANNOUNCEMENT
    );

    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300, stale-while-revalidate=600',
      }
    });
  } catch (error) {
    console.error('Error fetching announcement settings:', error);
    return NextResponse.json(DEFAULT_CONFIG, {
      headers: {
        'Cache-Control': 'public, max-age=60, s-maxage=60',
      }
    });
  }
}


export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    // Sécurité: Seul Admin ou SuperAdmin peut modifier
    const userRole = (session?.user as any)?.role;
    const isAuthorized = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';

    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const userId = parseInt((session?.user as any)?.id);

    const setting = await prisma.systemSetting.upsert({
      where: { key: SETTING_KEY },
      update: {
        value: data,
        updatedById: userId || null,
        updatedAt: new Date()
      },
      create: {
        key: SETTING_KEY,
        value: data,
        category: 'general',
        description: 'Popup d\'annonce global (Maintenance/Info)',
        updatedById: userId || null
      }
    });

    // Invalider le cache in-memory pour que le prochain GET recharge les données fraîches
    performanceCache.invalidate('announcement:config');

    return NextResponse.json(setting.value);
  } catch (error) {
    console.error('Error updating announcement settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
