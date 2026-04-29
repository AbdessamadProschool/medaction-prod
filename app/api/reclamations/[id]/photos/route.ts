import { safeParseInt } from '@/lib/utils/parse';
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import archiver from 'archiver';
import { createReadStream, existsSync } from 'fs';
import path from 'path';
import { Readable } from 'stream';
import { safeResolvePath } from '@/lib/utils/safe-path';

// GET /api/reclamations/[id]/photos - Télécharger les photos en ZIP
export async function GET(
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) {
  const params = await _p;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const id = safeParseInt(params.id, 0);
    const userId = parseInt(session.user.id);
    const role = session.user.role;

    // Récupérer la réclamation avec ses médias
    const reclamation = await prisma.reclamation.findUnique({
      where: { id },
      include: {
        user: { select: { nom: true, prenom: true } },
        commune: { select: { nom: true } },
        medias: {
          where: {
            type: 'IMAGE'
          }
        }
      }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    // Vérification des permissions (Admin, Gouverneur, ou autorité affectée)
    const canAccess = 
      role === 'ADMIN' || 
      role === 'SUPER_ADMIN' || 
      role === 'GOUVERNEUR' ||
      reclamation.userId === userId ||
      reclamation.affecteeAAutoriteId === userId;

    if (!canAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Vérifier s'il y a des photos
    if (!reclamation.medias || reclamation.medias.length === 0) {
      return NextResponse.json({ error: 'Aucune photo disponible' }, { status: 404 });
    }

    // Créer le nom du fichier ZIP
    const dateStr = new Date().toISOString().split('T')[0];
    const zipFilename = `reclamation_${id}_photos_${dateStr}.zip`;

    // Créer le stream d'archive
    const archive = archiver('zip', {
      zlib: { level: 6 } // Compression niveau 6
    });

    // Convertir le stream archive en ReadableStream pour la réponse
    const chunks: Uint8Array[] = [];
    
    archive.on('data', (chunk) => {
      chunks.push(chunk);
    });

    const archivePromise = new Promise<Buffer>((resolve, reject) => {
      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });
      archive.on('error', reject);
    });

    // Ajouter les fichiers à l'archive
    for (const media of reclamation.medias) {
      // Résolution sécurisée du chemin (compatible Docker/STORAGE_PATH)
      const STORAGE_PATH = process.env.STORAGE_PATH;
      const UPLOAD_BASE = STORAGE_PATH 
        ? (STORAGE_PATH.startsWith('/') || /^[a-zA-Z]:[\\\/]/.test(STORAGE_PATH)) 
          ? STORAGE_PATH 
          : path.join(process.cwd(), STORAGE_PATH)
        : path.join(process.cwd(), 'uploads');

      // Si le chemin en base est déjà absolu ou contient 'uploads', on nettoie
      let cleanSubPath = media.cheminFichier;
      if (cleanSubPath.includes('uploads')) {
        cleanSubPath = cleanSubPath.split('uploads')[1];
      } else if (cleanSubPath.includes('reclamations')) {
         // Fallback si 'uploads' n'est pas dans le chemin mais 'reclamations' oui
         cleanSubPath = cleanSubPath.substring(cleanSubPath.indexOf('reclamations') - 1);
      }
      
      let filePath: string;
      try {
        filePath = safeResolvePath(UPLOAD_BASE, cleanSubPath);
      } catch {
        continue; // Passer au suivant si chemin invalide
      }
      
      if (existsSync(filePath)) {
        // Ajouter le fichier avec un nom lisible
        // const ext = path.extname(media.nomFichier);
        const cleanName = media.nomFichier.replace(/[^a-zA-Z0-9._-]/g, '_');
        archive.file(filePath, { name: cleanName });
      } else {
        // Si le fichier n'existe pas localement, essayer de l'ajouter via URL
        if (media.urlPublique) {
          try {
            const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
            const fullUrl = media.urlPublique.startsWith('http') 
              ? media.urlPublique 
              : new URL(media.urlPublique, baseUrl).toString();

            const response = await fetch(fullUrl);
            if (response.ok) {
              const buffer = await response.arrayBuffer();
              const ext = path.extname(media.nomFichier) || '.jpg';
              archive.append(Buffer.from(buffer), { name: `photo_${media.id}${ext}` });
            } else {
              console.warn(`Fetch échoué pour ${fullUrl}: ${response.status}`);
            }
          } catch (e) {
            console.warn(`Impossible de récupérer le média ${media.id}:`, e);
          }
        }
      }
    }

    // Finaliser l'archive
    archive.finalize();

    // Attendre que l'archive soit complète
    const zipBuffer = await archivePromise;

    // Retourner le fichier ZIP
    return new NextResponse(new Uint8Array(zipBuffer), {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFilename}"`,
        'Content-Length': zipBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Erreur téléchargement photos réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// HEAD - Obtenir les métadonnées (nombre de photos, taille estimée)
export async function HEAD(
  request: NextRequest,
  { params: _p }: { params: Promise<{ id: string }> }
) {
  const params = await _p;
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return new NextResponse(null, { status: 401 });
    }

    const id = safeParseInt(params.id, 0);
    const userId = parseInt(session.user.id);
    const role = session.user.role;

    const reclamation = await prisma.reclamation.findUnique({
      where: { id },
      select: {
        userId: true,
        affecteeAAutoriteId: true,
      }
    });

    if (!reclamation) {
      return new NextResponse(null, { status: 404 });
    }

    // SECURITY FIX: Même logique d'autorisation que le GET
    const canAccess = 
      role === 'ADMIN' || 
      role === 'SUPER_ADMIN' || 
      role === 'GOUVERNEUR' ||
      reclamation.userId === userId ||
      reclamation.affecteeAAutoriteId === userId;

    if (!canAccess) {
      return new NextResponse(null, { status: 403 });
    }

    // Compter les photos avec autorisation confirmée
    const photos = await prisma.media.findMany({
      where: { reclamationId: id, type: 'IMAGE' },
      select: { id: true, tailleMo: true }
    });

    const photoCount = photos.length;
    const totalSizeMb = photos.reduce((sum, m) => sum + (m.tailleMo || 0), 0);

    return new NextResponse(null, {
      status: 200,
      headers: {
        'X-Photo-Count': photoCount.toString(),
        'X-Total-Size-MB': totalSizeMb.toFixed(2),
      },
    });

  } catch (error) {
    console.error('Erreur HEAD photos:', error);
    return new NextResponse(null, { status: 500 });
  }
}