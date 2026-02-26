import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

// PATCH - Ajouter un bilan à un événement clôturé
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const id = parseInt(params.id);
    const userId = parseInt(session.user.id);
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role);

    // Vérifier que l'événement existe et est clôturé
    const evenement = await prisma.evenement.findUnique({
      where: { id },
      select: { 
        id: true, 
        statut: true, 
        titre: true, 
        createdBy: true 
      }
    });

    if (!evenement) {
      return NextResponse.json({ error: 'Événement non trouvé' }, { status: 404 });
    }

    // Vérifier les permissions
    const isCreator = evenement.createdBy === userId;
    if (!isAdmin && !isCreator) {
      return NextResponse.json({ 
        error: 'Vous n\'avez pas les droits pour modifier cet événement' 
      }, { status: 403 });
    }

    if (evenement.statut !== 'CLOTUREE') {
      return NextResponse.json({ 
        error: 'Le bilan ne peut être ajouté qu\'à un événement clôturé' 
      }, { status: 400 });
    }

    const formData = await request.formData();
    const bilanDescription = formData.get('bilanDescription') as string;
    const bilanNbParticipants = formData.get('bilanNbParticipants') as string;
    const files = formData.getAll('files') as File[];

    if (!bilanDescription || bilanDescription.length < 20) {
      return NextResponse.json({ 
        error: 'La description du bilan doit contenir au moins 20 caractères' 
      }, { status: 400 });
    }

    // Créer le dossier uploads pour les bilans
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'evenements', id.toString(), 'bilan');
    await mkdir(uploadDir, { recursive: true });

    const savedMedias = [];

    // Upload des fichiers (photos/vidéos)
    for (const file of files) {
      // Vérifier le type
      const isImage = file.type.startsWith('image/');
      const isVideo = file.type.startsWith('video/');
      
      if (!isImage && !isVideo) {
        continue;
      }

      // Limiter la taille (images: 10MB, vidéos: 100MB)
      const maxSize = isVideo ? 100 * 1024 * 1024 : 10 * 1024 * 1024;
      if (file.size > maxSize) {
        continue;
      }

      // Générer un nom unique
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(7);
      const extension = file.name.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
      const fileName = `${timestamp}-${randomStr}.${extension}`;
      const filePath = path.join(uploadDir, fileName);

      // Sauvegarder le fichier
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      await writeFile(filePath, buffer);

      // URL publique
      const urlPublique = `/uploads/evenements/${id}/bilan/${fileName}`;

      // Créer l'entrée Media
      const media = await prisma.media.create({
        data: {
          nomFichier: file.name,
          cheminFichier: filePath,
          urlPublique: urlPublique,
          type: isVideo ? 'VIDEO' : 'IMAGE',
          mimeType: file.type,
          tailleMo: file.size / (1024 * 1024),
          evenementId: id,
        }
      });

      savedMedias.push(media);
    }

    // Mettre à jour l'événement avec le bilan
    const updatedEvenement = await prisma.evenement.update({
      where: { id },
      data: {
        bilanDescription,
        bilanNbParticipants: bilanNbParticipants ? parseInt(bilanNbParticipants) : null,
        bilanDatePublication: new Date(),
      },
      include: {
        medias: true,
      }
    });

    return NextResponse.json({ 
      message: 'Bilan publié avec succès',
      data: updatedEvenement,
      mediasUploades: savedMedias.length
    });

  } catch (error) {
    console.error('Erreur bilan événement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
