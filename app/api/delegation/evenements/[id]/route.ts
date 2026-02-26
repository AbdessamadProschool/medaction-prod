import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// Next.js 15: params is now a Promise
interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// GET - Récupérer un événement
export async function GET(request: NextRequest, segmentData: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { id: idStr } = await segmentData.params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const evenement = await prisma.evenement.findUnique({
      where: { id },
      include: {
        etablissement: { select: { id: true, nom: true } },
        commune: { select: { id: true, nom: true } },
        medias: {
          orderBy: { createdAt: 'asc' },
        },
      }
    });

    if (!evenement) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: evenement });
  } catch (error) {
    console.error('GET /api/delegation/evenements/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un événement
export async function DELETE(request: NextRequest, segmentData: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const { id: idStr } = await segmentData.params;
    const id = parseInt(idStr);

    if (isNaN(id)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Vérifier propriété
    const evenement = await prisma.evenement.findUnique({
      where: { id },
    });

    if (!evenement) {
      return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
    }

    if (evenement.createdBy !== userId && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Action non autorisée sur cet événement' }, { status: 403 });
    }

    // Supprimer d'abord les médias associés (pas de cascade automatique)
    await prisma.media.deleteMany({
      where: { evenementId: id },
    });

    await prisma.evenement.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/delegation/evenements/[id] error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT - Modifier un événement (ou Clôturer)
export async function PUT(request: NextRequest, segmentData: RouteParams) {
    try {
      const session = await getServerSession(authOptions);
      if (!session?.user) {
        return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
      }
  
      const userId = parseInt(session.user.id);
      const { id: idStr } = await segmentData.params;
      const id = parseInt(idStr);
      const body = await request.json();

      if (isNaN(id)) {
        return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
      }
  
      // Vérifier propriété
      const evenement = await prisma.evenement.findUnique({
        where: { id },
      });
  
      if (!evenement) {
        return NextResponse.json({ error: 'Introuvable' }, { status: 404 });
      }
  
      if (evenement.createdBy !== userId && session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Action non autorisée' }, { status: 403 });
      }
  
      // Préparation des données update
      const updateData: any = {};
  
      // Cas de Clôture
      if (body.action === 'CLOTURE') {
          updateData.statut = 'CLOTUREE';
          updateData.bilanDescription = body.bilanDescription;
          updateData.bilanNbParticipants = parseInt(body.bilanNbParticipants);
          updateData.bilanDatePublication = new Date();

          // === GESTION DES IMAGES DU BILAN ===
          if (Array.isArray(body.images) && body.images.length > 0) {
              await prisma.media.createMany({
                  data: body.images.map((url: string) => ({
                      nomFichier: 'Image Bilan',
                      cheminFichier: url,
                      urlPublique: url,
                      type: 'IMAGE',
                      mimeType: 'image/jpeg',
                      evenementId: id,
                      uploadePar: userId
                  }))
              });
          }

          // === GESTION DU COMPTE RENDU ===
          if (body.compteRenduUrl) {
              await prisma.media.create({
                  data: {
                      nomFichier: 'Compte Rendu Bilan',
                      cheminFichier: body.compteRenduUrl,
                      urlPublique: body.compteRenduUrl,
                      type: 'DOCUMENT',
                      mimeType: 'application/pdf', 
                      evenementId: id,
                      uploadePar: userId
                  }
              });
          }
      } else {
          // Cas modification normale - tous les champs
          if (body.titre) updateData.titre = body.titre.trim();
          if (body.description) updateData.description = body.description.trim();
          if (body.typeCategorique) updateData.typeCategorique = body.typeCategorique;
          if (body.dateDebut) updateData.dateDebut = new Date(body.dateDebut);
          if (body.dateFin) updateData.dateFin = new Date(body.dateFin);
          if (body.heureDebut !== undefined) updateData.heureDebut = body.heureDebut || null;
          if (body.heureFin !== undefined) updateData.heureFin = body.heureFin || null;
          if (body.lieu !== undefined) updateData.lieu = body.lieu?.trim() || null;
          if (body.adresse !== undefined) updateData.adresse = body.adresse?.trim() || null;
          if (body.quartierDouar !== undefined) updateData.quartierDouar = body.quartierDouar?.trim() || null;
          if (body.capaciteMax !== undefined) updateData.capaciteMax = body.capaciteMax ? parseInt(body.capaciteMax) : null;
          if (body.organisateur !== undefined) updateData.organisateur = body.organisateur?.trim() || null;
          if (body.contactOrganisateur !== undefined) updateData.contactOrganisateur = body.contactOrganisateur?.trim() || null;
          if (body.emailContact !== undefined) updateData.emailContact = body.emailContact?.trim() || null;
          if (body.inscriptionsOuvertes !== undefined) updateData.inscriptionsOuvertes = body.inscriptionsOuvertes;
          if (body.lienInscription !== undefined) updateData.lienInscription = body.lienInscription?.trim() || null;
          if (body.tags !== undefined) updateData.tags = Array.isArray(body.tags) ? body.tags : [];

          // === GESTION DE L'IMAGE PRINCIPALE ===
          if (body.imagePrincipale !== undefined) {
            // Supprimer l'ancienne image principale si elle existe
            await prisma.media.deleteMany({
              where: {
                evenementId: id,
                nomFichier: 'Image Principale',
              }
            });

            // Créer la nouvelle image si fournie
            if (body.imagePrincipale) {
              await prisma.media.create({
                data: {
                  nomFichier: 'Image Principale',
                  cheminFichier: body.imagePrincipale,
                  urlPublique: body.imagePrincipale,
                  type: 'IMAGE',
                  mimeType: 'image/jpeg',
                  evenementId: id,
                  uploadePar: userId
                }
              });
            }
          }
      }
  
      const updatedEvenement = await prisma.evenement.update({
        where: { id },
        data: updateData,
        include: {
          medias: {
            where: { type: 'IMAGE', nomFichier: 'Image Principale' },
            take: 1,
            select: { urlPublique: true }
          }
        }
      });
  
      return NextResponse.json({ success: true, data: updatedEvenement });
    } catch (error) {
      console.error('PUT /api/delegation/evenements/[id] error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
  }
