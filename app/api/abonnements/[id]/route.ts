import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Obtenir un abonnement spécifique
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const abonnementId = parseInt(id);
    const userId = parseInt(session.user.id);

    const abonnement = await prisma.abonnementEtablissement.findFirst({
      where: {
        id: abonnementId,
        userId: userId,
      },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
            adresseComplete: true,
            secteur: true,
            photoPrincipale: true,
            commune: { select: { nom: true } },
          }
        }
      }
    });

    if (!abonnement) {
      return NextResponse.json({ error: 'Abonnement non trouvé' }, { status: 404 });
    }

    return NextResponse.json(abonnement);
  } catch (error) {
    console.error('Erreur récupération abonnement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour un abonnement (notifications)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const abonnementId = parseInt(id);
    const userId = parseInt(session.user.id);
    const body = await request.json();
    const { notificationsActives } = body;

    // Vérifier que l'abonnement appartient à l'utilisateur
    const existing = await prisma.abonnementEtablissement.findFirst({
      where: {
        id: abonnementId,
        userId: userId,
      }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Abonnement non trouvé' }, { status: 404 });
    }

    const abonnement = await prisma.abonnementEtablissement.update({
      where: { id: abonnementId },
      data: {
        notificationsActives: notificationsActives ?? existing.notificationsActives,
      },
      include: {
        etablissement: {
          select: {
            id: true,
            nom: true,
          }
        }
      }
    });

    return NextResponse.json({
      message: 'Abonnement mis à jour',
      abonnement
    });
  } catch (error) {
    console.error('Erreur mise à jour abonnement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un abonnement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id } = await params;
    const abonnementId = parseInt(id);
    const userId = parseInt(session.user.id);

    // Vérifier que l'abonnement appartient à l'utilisateur
    const abonnement = await prisma.abonnementEtablissement.findFirst({
      where: {
        id: abonnementId,
        userId: userId,
      },
      include: {
        etablissement: {
          select: { nom: true }
        }
      }
    });

    if (!abonnement) {
      return NextResponse.json({ error: 'Abonnement non trouvé' }, { status: 404 });
    }

    await prisma.abonnementEtablissement.delete({
      where: { id: abonnementId }
    });

    return NextResponse.json({
      message: `Vous êtes désabonné de ${abonnement.etablissement.nom}`,
    });
  } catch (error) {
    console.error('Erreur suppression abonnement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
