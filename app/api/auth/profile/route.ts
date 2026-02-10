import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Récupérer le profil de l'utilisateur connecté
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        telephone: true,
        nom: true,
        prenom: true,
        photo: true,
        role: true,
        isActive: true,
        isEmailVerifie: true,
        isTelephoneVerifie: true,
        derniereConnexion: true,
        dateInscription: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'Utilisateur non trouvé' }, { status: 404 });
    }

    return NextResponse.json({ data: user });

  } catch (error) {
    console.error('Erreur GET profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mettre à jour le profil
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Champs modifiables
    const allowedFields = ['nom', 'prenom', 'telephone'];
    const updateData: any = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field] || null;
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
    }

    // Vérifier si le téléphone est déjà utilisé
    if (updateData.telephone) {
      const existingPhone = await prisma.user.findFirst({
        where: {
          telephone: updateData.telephone,
          id: { not: userId }
        }
      });

      if (existingPhone) {
        return NextResponse.json({ error: 'Ce numéro de téléphone est déjà utilisé' }, { status: 409 });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        telephone: true,
        nom: true,
        prenom: true,
        photo: true,
        role: true,
      }
    });

    // Log l'activité
    await prisma.activityLog.create({
      data: {
        userId,
        action: 'UPDATE_PROFILE',
        entity: 'User',
        entityId: userId,
        details: { updatedFields: Object.keys(updateData) }
      }
    });

    return NextResponse.json({ 
      message: 'Profil mis à jour',
      data: updatedUser 
    });

  } catch (error) {
    console.error('Erreur PATCH profile:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
