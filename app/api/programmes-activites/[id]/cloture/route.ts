import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { auditLog } from '@/lib/logger';
import { logActivity } from '@/lib/activity-logger';

const clotureSchema = z.object({
  presenceEffective: z.number().int().min(0),
  noteQualite: z.number().min(1).max(5).optional(),
  commentaireDeroulement: z.string().min(10),
  difficultes: z.string().optional(),
  pointsPositifs: z.string().optional(),
  recommandations: z.string().optional(),
  photosRapport: z.array(z.string()).optional(),
  rapportComplete: z.literal(true),
  statut: z.literal('RAPPORT_COMPLETE')
});

export async function POST(
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) {
  const params = await _p;
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = params;
    const activityId = safeParseInt(id, 0);
    const userId = parseInt(session.user.id);

    // 1. Check if activity exists and user has rights
    const activite = await prisma.programmeActivite.findUnique({
      where: { id: activityId },
      include: { etablissement: true }
    });

    if (!activite) {
      return NextResponse.json({ error: 'Activité non trouvée' }, { status: 404 });
    }

    // Check permissions (Coordinator of this establishment or Admin)
    const isCoordinator = session.user.role === 'COORDINATEUR_ACTIVITES';
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

    if (isCoordinator) {
      // Allow if created by user OR if user manages the establishment
      // Note: In real app, check etablissementsGeres list from database user profile
      const user = await prisma.user.findUnique({ 
         where: { id: userId },
         select: { etablissementsGeres: true } 
      });
      
      const managesEtab = activite.etablissementId ? user?.etablissementsGeres.includes(activite.etablissementId) : false;
      
      if (!managesEtab && activite.createdBy !== userId) {
        return NextResponse.json({ error: 'Vous ne gérez pas cette activité' }, { status: 403 });
      }
    } else if (!isAdmin) {
       return NextResponse.json({ error: 'Permission refusée' }, { status: 403 });
    }

    // 2. Validate Body
    const body = await request.json();
    const validation = clotureSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({
        error: 'Données invalides',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    const data = validation.data;

    // 3. Update Activity
    const updated = await prisma.programmeActivite.update({
      where: { id: activityId },
      data: {
        presenceEffective: data.presenceEffective,
        tauxPresence: activite.participantsAttendus 
           ? (data.presenceEffective / activite.participantsAttendus) * 100 
           : 0,
        noteQualite: data.noteQualite,
        commentaireDeroulement: data.commentaireDeroulement,
        difficultes: data.difficultes,
        pointsPositifs: data.pointsPositifs,
        recommandations: data.recommandations,
        photosRapport: data.photosRapport || [],
        rapportComplete: true,
        statut: 'RAPPORT_COMPLETE',
        dateRapport: new Date(),
        alerteRapportEnvoyee: false // Reset alert
      }
    });

    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || null;
    const userAgent = request.headers.get('user-agent') || null;

    await auditLog({
      action: 'CLOTURE_ACTIVITE',
      resource: 'ProgrammeActivite',
      resourceId: activityId,
      userId: userId,
      details: { titre: updated.titre, presenceEffective: data.presenceEffective },
      previousValue: activite,
      newValue: updated,
      ipAddress,
      userAgent,
      status: 'SUCCESS'
    });

    await logActivity({
      userId: userId,
      action: 'CLOTURE_ACTIVITE',
      entity: 'ProgrammeActivite',
      entityId: activityId,
      details: { titre: updated.titre },
      ipAddress,
      userAgent
    });

    return NextResponse.json({
      success: true,
      data: updated,
      message: 'Rapport de clôture enregistré avec succès'
    });

  } catch (error) {
    console.error('Erreur clôture activité:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}