import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!['SUPER_ADMIN', 'ADMIN'].includes(session?.user?.role || '')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { action } = await req.json();

    if (action === 'publish_all') {
      // Set all establishments to valid=true and publie=true
      const result = await prisma.etablissement.updateMany({
        where: {}, // All
        data: {
          isValide: true,
          isPublie: true
        }
      });
      return NextResponse.json({ success: true, count: result.count, message: `${result.count} établissements publiés.` });
    } 
    
    if (action === 'delete_all') {
      // Safety check: only SUPER_ADMIN can delete all
      if (session?.user?.role !== 'SUPER_ADMIN') {
         return NextResponse.json({ error: 'Seul le Super Admin peut tout supprimer.' }, { status: 403 });
      }

      // Detach Reclamations first (since no Cascade)
      await prisma.reclamation.updateMany({
        where: { etablissementId: { not: null } },
        data: { etablissementId: null }
      });

      // Now delete establishments (Cascades will handle events, etc.)
      const result = await prisma.etablissement.deleteMany({});
      return NextResponse.json({ success: true, count: result.count, message: `${result.count} établissements supprimés.` });
    }

    return NextResponse.json({ error: 'Action inconnue' }, { status: 400 });

  } catch (error) {
    console.error('Bulk action error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
