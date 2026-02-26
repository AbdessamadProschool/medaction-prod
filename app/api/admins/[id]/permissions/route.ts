import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { syncPermissions, getUserPermissions, getAllPermissions } from '@/lib/permissions';

// Schéma de validation pour update permissions
const updatePermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

// PATCH - Mettre à jour les permissions d'un admin
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // Seul SUPER_ADMIN peut modifier les permissions
    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Seul un Super Admin peut modifier les permissions' 
      }, { status: 403 });
    }

    const adminId = parseInt(params.id);
    if (isNaN(adminId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    // Vérifier que l'admin existe
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { id: true, role: true, nom: true, prenom: true, email: true }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Administrateur non trouvé' }, { status: 404 });
    }

    // Ne pas permettre la modification des permissions d'un SUPER_ADMIN
    if (admin.role === 'SUPER_ADMIN') {
      return NextResponse.json({ 
        error: 'Impossible de modifier les permissions d\'un Super Admin' 
      }, { status: 403 });
    }

    // Vérifier que c'est un ADMIN
    if (admin.role !== 'ADMIN') {
      return NextResponse.json({ 
        error: 'Cet utilisateur n\'est pas un administrateur' 
      }, { status: 400 });
    }

    // Valider les données
    const body = await request.json();
    const validation = updatePermissionsSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Données invalides', 
        details: validation.error.flatten() 
      }, { status: 400 });
    }

    const { permissions: requestedPermissions } = validation.data;

    // Vérifier que les permissions existent en base
    const validPermissions = await prisma.permission.findMany({
      where: { code: { in: requestedPermissions }, isActive: true },
      select: { code: true }
    });
    
    const validCodes = validPermissions.map(p => p.code);
    const invalidPermissions = requestedPermissions.filter(p => !validCodes.includes(p));
    
    if (invalidPermissions.length > 0) {
      return NextResponse.json({ 
        error: 'Permissions invalides', 
        details: invalidPermissions 
      }, { status: 400 });
    }

    // Synchroniser les permissions
    await syncPermissions(adminId, validCodes, parseInt(session.user.id));

    // Log de l'activité
    await prisma.activityLog.create({
      data: {
        userId: parseInt(session.user.id),
        action: 'UPDATE_PERMISSIONS',
        entity: 'User',
        entityId: adminId,
        details: {
          targetUser: `${admin.prenom} ${admin.nom}`,
          previousPermissions: await getUserPermissions(adminId),
          newPermissions: validCodes,
        }
      }
    });

    // Créer une notification à l'admin concerné
    await prisma.notification.create({
      data: {
        userId: adminId,
        type: 'PERMISSIONS_MODIFIEES',
        titre: 'Permissions mises à jour',
        message: `Vos permissions ont été modifiées par ${session.user.prenom || ''} ${session.user.nom || ''}. Vous avez maintenant ${validCodes.length} permissions.`,
        lien: '/admin/profil',
      }
    });

    return NextResponse.json({ 
      message: 'Permissions mises à jour avec succès',
      data: {
        adminId,
        admin: `${admin.prenom} ${admin.nom}`,
        permissions: validCodes,
        count: validCodes.length,
      }
    });

  } catch (error) {
    console.error('Erreur PATCH permissions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// GET - Récupérer les permissions d'un admin
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Accès non autorisé' }, { status: 403 });
    }

    const adminId = parseInt(params.id);
    if (isNaN(adminId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId },
      select: { 
        id: true, 
        email: true,
        nom: true, 
        prenom: true, 
        role: true,
        isActive: true,
        userPermissions: {
          where: { isActive: true },
          include: {
            permission: true
          }
        }
      }
    });

    if (!admin) {
      return NextResponse.json({ error: 'Administrateur non trouvé' }, { status: 404 });
    }

    // Récupérer toutes les permissions disponibles
    const { grouped: allPermissions } = await getAllPermissions();

    return NextResponse.json({
      data: {
        id: admin.id,
        email: admin.email,
        nom: admin.nom,
        prenom: admin.prenom,
        role: admin.role,
        isActive: admin.isActive,
        permissions: admin.userPermissions.map(up => up.permission.code),
        permissionsDetails: admin.userPermissions.map(up => ({
          code: up.permission.code,
          nom: up.permission.nom,
          groupe: up.permission.groupe,
          groupeLabel: up.permission.groupeLabel,
          grantedAt: up.grantedAt,
          expiresAt: up.expiresAt,
        })),
        allPermissions, // Pour afficher dans l'interface
      }
    });

  } catch (error) {
    console.error('Erreur GET permissions:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
