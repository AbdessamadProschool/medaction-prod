import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

function slugify(text: string) {
  return text.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/\s+/g, '-')           
    .replace(/[^\w\-]+/g, '')       
    .replace(/\-\-+/g, '-')         
    .replace(/^-+/, '')             
    .replace(/-+$/, '');            
}

// GET - Liste des campagnes
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'DELEGATION') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const statut = searchParams.get('statut') || '';

    const where: Record<string, unknown> = {
      createdBy: userId,
    };

    if (search) {
      where.OR = [
        { titre: { contains: search, mode: 'insensitive' } },
        { nom: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (statut === 'ACTIVE') {
      where.isActive = true;
    } else if (statut === 'INACTIVE') {
      where.isActive = false;
    }

    const [campagnes, total] = await Promise.all([
      prisma.campagne.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.campagne.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: campagnes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Erreur campagnes:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Créer une campagne
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id || session.user.role !== 'DELEGATION') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const userId = parseInt(session.user.id);
    const body = await request.json();

    // Génération du slug
    let baseSlug = slugify(body.nom);
    let slug = baseSlug;
    let counter = 1;
    
    // Check uniqueness (simple implementation)
    while (await prisma.campagne.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    const campagne = await prisma.campagne.create({
      data: {
        nom: body.nom,
        slug: slug,
        titre: body.titre,
        description: body.description,
        contenu: body.contenu,
        type: body.type,
        objectifParticipations: body.objectifParticipations,
        dateDebut: body.dateDebut ? new Date(body.dateDebut) : undefined,
        dateFin: body.dateFin ? new Date(body.dateFin) : undefined,
        couleurTheme: body.couleurTheme,
        imagePrincipale: body.imagePrincipale,
        statut: 'EN_ATTENTE', // Force validation
        isActive: false,      // Inactive par défaut
        createdBy: userId,
      },
    });

    if (body.imagePrincipale) {
      await prisma.media.create({
        data: {
          nomFichier: 'Bannière campagne',
          cheminFichier: body.imagePrincipale,
          urlPublique: body.imagePrincipale,
          type: 'IMAGE',
          mimeType: 'image/jpeg',
          campagneId: campagne.id,
          uploadePar: userId
        }
      });
    }

    // === NOTIFICATION AUX ADMINS ===
    try {
      const admins = await prisma.user.findMany({
        where: { role: { in: ['ADMIN', 'SUPER_ADMIN'] } },
        select: { id: true }
      });
      
      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            userId: admin.id,
            type: 'CAMPAGNE_CREATION',
            titre: 'Nouvelle campagne créée',
            message: `La campagne "${body.titre}" a été créée par la délégation et est en attente de validation.`,
            lien: `/admin/campagnes`,
            isLue: false,
            createdAt: new Date()
          }))
        });
      }
    } catch (notifError) {
      console.error('Erreur notification:', notifError);
    }

    return NextResponse.json({
      success: true,
      data: campagne,
    });

  } catch (error) {
    console.error('Erreur création campagne:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
