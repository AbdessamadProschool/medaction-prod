import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { talentSchema } from '@/lib/validations/talent';
import { z } from 'zod';

// GET /api/talents
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const domaine = searchParams.get('domaine') || '';
    const isPublie = searchParams.get('isPublie'); // 'true', 'false', or undefined

    const skip = (page - 1) * limit;

    const where: any = {};

    // Filtre par recherche (nom, prénom, nomArtistique, bio)
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { nomArtistique: { contains: search, mode: 'insensitive' } },
        { bio: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtre par domaine
    if (domaine) {
      where.domaine = domaine;
    }

    // Filtre par statut de publication
    // Si l'utilisateur n'est pas admin, on force isPublie = true sauf si c'est pour l'admin panel
    // Ici on suppose que l'admin panel passera un paramètre spécifique ou on vérifie la session
    // Pour simplifier, si isPublie est passé, on l'utilise, sinon par défaut on renvoie tout ou seulement publié selon le contexte ?
    // Généralement l'API publique ne renvoie que les publiés. L'API admin veut tout.
    // On va vérifier la session pour savoir si on peut voir les non-publiés.
    
    const session = await getServerSession(authOptions);
    const isAdmin = session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN';

    if (isPublie !== null && isPublie !== undefined) {
        if (isPublie === 'true') where.isPublie = true;
        if (isPublie === 'false') {
            // Seul admin peut voir les non publiés explicitement demandés
            if (!isAdmin) {
                 return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
            }
            where.isPublie = false;
        }
    } else if (!isAdmin) {
        // Par défaut pour public : seulement publiés
        where.isPublie = true;
    }

    const [talents, total] = await Promise.all([
      prisma.talent.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.talent.count({ where }),
    ]);

    return NextResponse.json({
      data: talents,
      pagination: {
        total,
        pages: Math.ceil(total / limit),
        page,
        limit,
      },
    });
  } catch (error) {
    console.error('Erreur lors de la récupération des talents:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des talents' },
      { status: 500 }
    );
  }
}

// POST /api/talents (Admin only)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const json = await request.json();
    const body = talentSchema.parse(json);

    const talent = await prisma.talent.create({
      data: {
        ...body,
        reseauxSociaux: (body.reseauxSociaux || {}) as any,
      },
    });

    return NextResponse.json(talent, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: (error as any).errors || (error as any).issues }, { status: 400 });
    }
    console.error('Erreur lors de la création du talent:', error);
    return NextResponse.json(
      { error: 'Erreur serveur lors de la création du talent' },
      { status: 500 }
    );
  }
}
