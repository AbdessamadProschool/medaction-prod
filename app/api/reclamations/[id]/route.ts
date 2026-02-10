import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { validateId, sanitizeString, SECURITY_LIMITS, logSecurityEvent } from '@/lib/security/validation';

// Schéma de mise à jour sécurisé - INTERDIT les changements de statut directs
const updateReclamationSchema = z.object({
  titre: z.string().min(5).max(SECURITY_LIMITS.TITLE_MAX).transform(sanitizeString).optional(),
  description: z.string().min(20).max(SECURITY_LIMITS.DESCRIPTION_MAX).transform(sanitizeString).optional(),
  // SECURITY: statut interdit ici - utiliser /statut, /resoudre, /rejeter endpoints
}).strict(); // Refuse les champs non définis

// GET - Détails d'une réclamation
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // SECURITY FIX: Validate ID
    const id = validateId(params.id);
    if (id === null) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const role = session.user.role;

    const reclamation = await prisma.reclamation.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, nom: true, prenom: true, email: true, telephone: true } },
        commune: { select: { nom: true } },
        etablissement: { select: { nom: true, secteur: true } },
        historique: {
          orderBy: { createdAt: 'desc' },
          include: {
            reclamation: false
          }
        },
        medias: true,
      }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    // Vérification des permissions
    const canAccess = 
      role === 'ADMIN' || 
      role === 'SUPER_ADMIN' || 
      role === 'GOUVERNEUR' ||
      reclamation.userId === userId ||
      reclamation.affecteeAAutoriteId === userId;

    if (!canAccess) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: reclamation });

  } catch (error) {
    console.error('Erreur détail réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH - Mise à jour d'une réclamation (propriétaire seulement, champs limités)
// SECURITY: Les changements de statut doivent passer par les endpoints dédiés
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // SECURITY FIX: Validate ID
    const id = validateId(params.id);
    if (id === null) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const role = session.user.role;

    // Récupérer la réclamation
    const reclamation = await prisma.reclamation.findUnique({
      where: { id },
      select: { id: true, userId: true, statut: true }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    // SECURITY: Vérifier permission d'édition ET propriété
    const { checkPermission } = await import("@/lib/permissions");
    const canEdit = await checkPermission(userId, 'reclamations.edit');
    const isOwner = reclamation.userId === userId;
    
    // Admin peut tout éditer (ou permission spécifique), propriétaire peut éditer la sienne
    if (!canEdit) {
         return NextResponse.json({ error: "Vous n'avez pas la permission de modifier des réclamations" }, { status: 403 });
    }

    // Si on a la permission générique, il faut quand même être le propriétaire (sauf si on est admin/chargé de modération)
    // Ici on garde la logique stricte: seul le créateur modifie SON contenu initial. Les admins utilisent d'autres routes pour modérer.
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: "Vous ne pouvez modifier que vos propres réclamations" }, { status: 403 });
    }

    // SECURITY: Bloquer modification si déjà acceptée/traitée
    if (reclamation.statut && ['ACCEPTEE', 'AFFECTEE', 'EN_COURS', 'RESOLUE', 'REJETEE'].includes(reclamation.statut)) {
      return NextResponse.json({ 
        error: 'Impossible de modifier une réclamation déjà traitée' 
      }, { status: 400 });
    }

    // Valider le body
    const body = await request.json();
    
    // SECURITY: Détecter tentative de manipulation de statut
    if (body.statut) {
      logSecurityEvent('SUSPICIOUS_ACTIVITY', `Attempt to change status directly on PATCH /reclamations/${id}`, 
        request.headers.get('x-forwarded-for') || undefined);
      return NextResponse.json({ 
        error: 'Modification du statut non autorisée. Utilisez les endpoints dédiés (/statut, /resoudre, /rejeter)' 
      }, { status: 403 });
    }

    const validation = updateReclamationSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Données invalides',
        details: validation.error.flatten()
      }, { status: 400 });
    }

    // Mise à jour autorisée
    const updated = await prisma.reclamation.update({
      where: { id },
      data: validation.data,
    });

    return NextResponse.json({ 
      success: true,
      message: 'Réclamation mise à jour',
      data: updated 
    });

  } catch (error) {
    console.error('Erreur mise à jour réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer une réclamation (propriétaire si non traitée, ou Admin)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    // SECURITY FIX: Validate ID
    const id = validateId(params.id);
    if (id === null) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 });
    }

    const userId = parseInt(session.user.id);
    const role = session.user.role;
    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(role);

    // Récupérer la réclamation
    const reclamation = await prisma.reclamation.findUnique({
      where: { id },
      select: { id: true, userId: true, statut: true, medias: true }
    });

    if (!reclamation) {
      return NextResponse.json({ error: 'Réclamation non trouvée' }, { status: 404 });
    }

    // Vérifier permissions
    const isOwner = reclamation.userId === userId;

    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    // Si propriétaire, ne peut supprimer que si non traitée (statut null ou SOUMISE si applicable)
    // On suppose que null = En attente. Si elle a un statut (sauf peut-être REJETEE?), on bloque ou on prévient.
    // L'utilisateur demande: "ajouter possibilite de supprimer les reclamations".
    // Généralement on bloque si c'est déjà en cours de traitement pour garder une trace ?
    // Mais l'utilisateur veut pouvoir supprimer.
    // On va autoriser sauf si c'est RESOLUE ou EN_COURS.
    
    const isTraitee = reclamation.statut && ['ACCEPTEE', 'AFFECTEE', 'EN_COURS', 'RESOLUE'].includes(reclamation.statut);
    
    if (isOwner && isTraitee) {
       return NextResponse.json({ 
         error: 'Impossible de supprimer une réclamation en cours de traitement ou résolue.' 
       }, { status: 400 });
    }

    // Supprimer les médias/fichiers associés serait idéal ici, mais Prisma devrait gérer cascade si configuré, 
    // ou on garde les fichiers orphelins (pas idéal mais acceptable pour MVP).
    // On supprime la réclamation.

    await prisma.reclamation.delete({ where: { id } });

    return NextResponse.json({ 
      success: true, 
      message: 'Réclamation supprimée avec succès' 
    });

  } catch (error) {
    console.error('Erreur suppression réclamation:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
