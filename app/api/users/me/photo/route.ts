import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { safeResolvePath } from '@/lib/utils/safe-path';

/**
 * POST /api/users/me/photo
 * Upload et mise à jour de la photo de profil
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('photo') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'Aucun fichier fourni' },
        { status: 400 }
      );
    }

    // Validation du type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'Type de fichier non autorisé. Utilisez JPG, PNG, WebP ou GIF.' },
        { status: 400 }
      );
    }

    // Validation de la taille (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'Le fichier est trop volumineux. Maximum 5MB.' },
        { status: 400 }
      );
    }

    // Générer un nom de fichier unique
    const extension = (file.name.split('.').pop() || 'jpg')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, ''); // Sécuriser l'extension

    // Extensions image autorisées uniquement
    const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif'];
    if (!ALLOWED_IMAGE_EXTENSIONS.includes(extension)) {
      return NextResponse.json({ error: 'Format image non autorisé' }, { status: 400 });
    }

    const fileName = `user_${session.user.id}_${Date.now()}.${extension}`;
    
    // Configuration du dossier de stockage (compatible Docker/STORAGE_PATH)
    const STORAGE_PATH = process.env.STORAGE_PATH;
    const UPLOAD_BASE = STORAGE_PATH 
      ? (STORAGE_PATH.startsWith('/') || /^[a-zA-Z]:[\\\/]/.test(STORAGE_PATH)) 
        ? STORAGE_PATH 
        : path.join(process.cwd(), STORAGE_PATH)
      : path.join(process.cwd(), 'uploads');

    const uploadDir = path.join(UPLOAD_BASE, 'avatars');
    await mkdir(uploadDir, { recursive: true });

    // Sauvegarder le fichier
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    let filePath: string;
    try {
      filePath = safeResolvePath(uploadDir, fileName);
    } catch {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    await writeFile(filePath, buffer);

    // URL publique de la photo
    const photoUrl = `/uploads/avatars/${fileName}`;

    // Mettre à jour l'utilisateur
    const updatedUser = await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { photo: photoUrl },
      select: {
        id: true,
        email: true,
        photo: true,
      },
    });

    console.log(`[POST /api/users/me/photo] Photo mise à jour pour: ${updatedUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Photo de profil mise à jour',
      data: {
        photo: updatedUser.photo,
      },
    });
  } catch (error) {
    console.error('[POST /api/users/me/photo] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur lors de l\'upload' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/me/photo
 * Supprime la photo de profil
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, message: 'Non authentifié' },
        { status: 401 }
      );
    }

    await prisma.user.update({
      where: { id: parseInt(session.user.id) },
      data: { photo: null },
    });

    return NextResponse.json({
      success: true,
      message: 'Photo de profil supprimée',
    });
  } catch (error) {
    console.error('[DELETE /api/users/me/photo] Erreur:', error);
    return NextResponse.json(
      { success: false, message: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
