import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { hashPassword } from "@/lib/auth/password";

// Types pour les rôles autorisés
const ADMIN_ROLES = ['ADMIN', 'SUPER_ADMIN'];
const SUPER_ADMIN_ONLY = ['SUPER_ADMIN'];

// Vérifier les permissions admin
async function checkAdminPermission(requiredRoles: string[] = ADMIN_ROLES) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { authorized: false, error: "Non authentifié", status: 401 };
  }
  
  if (!requiredRoles.includes(session.user.role)) {
    return { authorized: false, error: "Accès non autorisé", status: 403 };
  }
  
  return { authorized: true, user: session.user };
}

// GET /api/users - Liste des utilisateurs (ADMIN, SUPER_ADMIN)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier la permission
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(parseInt(session.user.id), 'users.read');

    if (!hasPermission) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }
    
    // Pour compatibilité avec le reste du code existant qui utilise authCheck
    const authCheck = { user: session.user };

    const { searchParams } = new URL(request.url);
    
    // Paramètres de filtrage
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';
    const isActive = searchParams.get('isActive');
    const secteur = searchParams.get('secteur') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Construction des filtres
    const where: any = {};

    // Recherche par nom, prénom ou email
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { prenom: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { telephone: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filtrer par rôle
    if (role) {
      where.role = role;
    }

    // Filtrer par statut actif
    if (isActive !== null && isActive !== undefined && isActive !== '') {
      where.isActive = isActive === 'true';
    }

    // Filtrer par secteur (pour DELEGATION)
    if (secteur) {
      where.secteurResponsable = secteur;
    }

    // Exclure les SUPER_ADMIN si l'utilisateur n'est pas SUPER_ADMIN
    if (authCheck.user?.role !== 'SUPER_ADMIN') {
      where.role = { not: 'SUPER_ADMIN' };
    }

    // Compter le total
    const total = await prisma.user.count({ where });

    // Récupérer les utilisateurs avec pagination
    const users = await prisma.user.findMany({
      where,
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
        secteurResponsable: true,
        communeResponsableId: true,
        etablissementsGeres: true,
        derniereConnexion: true,
        dateInscription: true,
        createdAt: true,
        updatedAt: true,
        communeResponsable: {
          select: {
            id: true,
            nom: true,
          }
        },
        _count: {
          select: {
            evaluations: true,
            reclamationsCreees: true,
            evenementsCrees: true,
            actualiteCreees: true,
          }
        }
      },
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Statistiques par rôle
    const stats = await prisma.user.groupBy({
      by: ['role'],
      _count: { id: true },
    });

    const roleStats = stats.reduce((acc, item) => {
      acc[item.role] = item._count.id;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        total: await prisma.user.count(),
        active: await prisma.user.count({ where: { isActive: true } }),
        inactive: await prisma.user.count({ where: { isActive: false } }),
        byRole: roleStats,
      }
    });

  } catch (error) {
    console.error("Erreur GET /api/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/users - Créer un utilisateur (ADMIN, SUPER_ADMIN)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    // Vérifier la permission
    const { checkPermission } = await import("@/lib/permissions");
    const hasPermission = await checkPermission(parseInt(session.user.id), 'users.create');

    if (!hasPermission) {
      return NextResponse.json({ error: "Accès non autorisé" }, { status: 403 });
    }

    const authCheck = { user: session.user };

    const body = await request.json();
    const {
      email,
      telephone,
      motDePasse,
      nom,
      prenom,
      photo,
      role,
      isActive = true,
      secteurResponsable,
      communeResponsableId,
      etablissementsGeres,
    } = body;

    // Validation des champs requis
    if (!email || !nom || !prenom) {
      return NextResponse.json(
        { error: "Email, nom et prénom sont requis" },
        { status: 400 }
      );
    }

    // Validation du mot de passe
    if (!motDePasse || motDePasse.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    // Vérifier que l'email n'existe pas déjà
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // Vérifier que le téléphone n'existe pas déjà (si fourni)
    if (telephone) {
      const existingPhone = await prisma.user.findUnique({ where: { telephone } });
      if (existingPhone) {
        return NextResponse.json(
          { error: "Ce numéro de téléphone est déjà utilisé" },
          { status: 409 }
        );
      }
    }

    // Restriction : seul SUPER_ADMIN peut créer des ADMIN ou SUPER_ADMIN
    if (['ADMIN', 'SUPER_ADMIN'].includes(role) && authCheck.user?.role !== 'SUPER_ADMIN') {
      return NextResponse.json(
        { error: "Seul un Super Admin peut créer des administrateurs" },
        { status: 403 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(motDePasse);

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email,
        telephone: telephone || null,
        motDePasse: hashedPassword,
        nom,
        prenom,
        photo: photo || null,
        role: role || 'CITOYEN',
        isActive,
        isEmailVerifie: true, // Créé par admin = vérifié
        secteurResponsable: secteurResponsable || null,
        communeResponsableId: communeResponsableId || null,
        etablissementsGeres: etablissementsGeres || [],
      },
      select: {
        id: true,
        email: true,
        telephone: true,
        nom: true,
        prenom: true,
        photo: true,
        role: true,
        isActive: true,
        secteurResponsable: true,
        communeResponsableId: true,
        etablissementsGeres: true,
        createdAt: true,
      }
    });

    return NextResponse.json({
      success: true,
      message: "Utilisateur créé avec succès",
      user: newUser,
    }, { status: 201 });

  } catch (error) {
    console.error("Erreur POST /api/users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
