import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const traiterSchema = z.object({
  solutionApportee: z.string().min(10, 'La solution doit contenir au moins 10 caractères'),
});

// PATCH - Traiter/Résoudre une réclamation (AUTORITE_LOCALE)
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const role = session.user.role;

    // Seuls les autorités locales et admins peuvent traiter
    if (!['AUTORITE_LOCALE', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
      return NextResponse.json({ 
        error: 'Vous n\'êtes pas autorisé à traiter cette réclamation' 
      }, { status: 403 });
    }

    const id = parseInt(params.id);
    const body = await request.json();
    const validation = traiterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const { solutionApportee } = validation.data;

    // Vérifier que la réclamation existe
    const reclamation = await prisma.reclamation.findUnique({
      where: { id },
      include: { user: { select: { id: true } } }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    // Vérifier que la réclamation est bien affectée à cette autorité (si rôle AUTORITE_LOCALE)
    if (role === 'AUTORITE_LOCALE' && reclamation.affecteeAAutoriteId !== userId) {
      return NextResponse.json({ 
        error: 'Cette réclamation ne vous est pas affectée' 
      }, { status: 403 });
    }

    // Vérifier que la réclamation est affectée et acceptée
    if (reclamation.statut !== 'ACCEPTEE') {
      return NextResponse.json({ 
        error: 'Seule une réclamation acceptée peut être traitée' 
      }, { status: 400 });
    }

    if (reclamation.affectationReclamation !== 'AFFECTEE') {
      return NextResponse.json({ 
        error: 'Cette réclamation n\'est pas encore affectée' 
      }, { status: 400 });
    }

    if (reclamation.dateResolution) {
      return NextResponse.json({ 
        error: 'Cette réclamation a déjà été résolue' 
      }, { status: 400 });
    }

    // Mettre à jour la réclamation
    const updated = await prisma.reclamation.update({
      where: { id },
      data: {
        solutionApportee,
        dateResolution: new Date(),
      }
    });

    // Créer l'entrée d'historique
    await prisma.historiqueReclamation.create({
      data: {
        reclamationId: id,
        action: 'RESOLUTION',
        details: {
          solutionApportee,
          resoluPar: `${session.user.nom} ${session.user.prenom}`,
          dateResolution: new Date().toISOString(),
        },
        effectuePar: userId,
      }
    });

    // Notifier le citoyen
    await prisma.notification.create({
      data: {
        userId: reclamation.userId,
        type: 'RECLAMATION_RESOLUE',
        titre: 'Réclamation résolue',
        message: `Votre réclamation "${reclamation.titre}" a été traitée. Consultez la solution apportée.`,
        lien: `/mes-reclamations/${id}`,
      }
    });

    // Notifier les admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] }, isActive: true },
      select: { id: true }
    });

    await prisma.notification.createMany({
      data: admins.map(admin => ({
        userId: admin.id,
        type: 'RECLAMATION_RESOLUE',
        titre: 'Réclamation résolue',
        message: `La réclamation "${reclamation.titre}" a été résolue.`,
        lien: `/admin/reclamations/${id}`,
      }))
    });

    return NextResponse.json({ 
      message: 'Réclamation résolue avec succès',
      data: updated 
    });

  } catch (error) {
    console.error('Erreur traitement réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
