import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Récupérer une actualité par ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const actualiteId = parseInt(params.id);
    if (isNaN(actualiteId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const actualite = await prisma.actualite.findUnique({
      where: { id: actualiteId },
      include: {
        createdByUser: { select: { id: true, nom: true, prenom: true } },
        etablissement: { select: { id: true, nom: true } },
        medias: { take: 1, select: { urlPublique: true } },
      }
    });

    if (!actualite) {
      return NextResponse.json({ error: 'Actualité non trouvée' }, { status: 404 });
    }

    // Ajouter imagePrincipale depuis medias
    const data = {
      ...actualite,
      imagePrincipale: actualite.medias?.[0]?.urlPublique || null
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Erreur GET actualite:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Modifier une actualité
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const actualiteId = parseInt(params.id);
    const userId = parseInt(session.user.id);
    if (isNaN(actualiteId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const body = await request.json();
    const { titre, description, contenu, categorie, etablissementId, imagePrincipale } = body;

    // Mise à jour de l'actualité (sans imagePrincipale qui n'existe pas dans le modèle)
    const actualite = await prisma.actualite.update({
      where: { id: actualiteId },
      data: {
        titre,
        description,
        contenu,
        categorie,
        etablissementId,
        updatedAt: new Date(),
      }
    });

    // Gérer l'image via la table Media
    if (imagePrincipale !== undefined) {
      // Supprimer l'ancienne image principale si elle existe
      await prisma.media.deleteMany({
        where: {
          actualiteId: actualiteId,
          nomFichier: 'Image Principale',
        }
      });

      // Créer la nouvelle image si fournie
      if (imagePrincipale) {
        await prisma.media.create({
          data: {
            nomFichier: 'Image Principale',
            cheminFichier: imagePrincipale,
            urlPublique: imagePrincipale,
            type: 'IMAGE',
            mimeType: 'image/jpeg',
            actualiteId: actualiteId,
            uploadePar: userId
          }
        });
      }
    }

    return NextResponse.json({ success: true, data: actualite });
  } catch (error) {
    console.error('Erreur PATCH actualite:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une actualité
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    if (!['DELEGATION', 'ADMIN', 'SUPER_ADMIN'].includes(session.user.role || '')) {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const actualiteId = parseInt(params.id);
    if (isNaN(actualiteId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    await prisma.actualite.delete({
      where: { id: actualiteId }
    });

    return NextResponse.json({ success: true, message: 'Actualité supprimée' });
  } catch (error) {
    console.error('Erreur DELETE actualite:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
