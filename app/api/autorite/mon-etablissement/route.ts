import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { prisma } from '@/lib/db';

// GET - Récupérer l'établissement lié à l'utilisateur autorité locale
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    if (session.user.role !== 'AUTORITE_LOCALE') {
      return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
    }

    const userId = parseInt(session.user.id);

    // Chercher l'établissement lié à cette autorité locale
    // On suppose que l'autorité locale peut être liée via une affectation de réclamation
    // ou via un champ spécifique dans User (à adapter selon le schéma)
    
    // Récupérer la commune responsable
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        communeResponsable: {
          include: {
            _count: {
              select: { etablissements: true, reclamations: true }
            }
          }
        }
      }
    });

    if (!user?.communeResponsable) {
      return NextResponse.json({ data: null });
    }

    const commune = user.communeResponsable;

    // Mapper les données pour le frontend
    const data = {
      id: commune.id,
      nom: commune.nom,
      nomArabe: commune.nomArabe,
      secteur: 'ADMINISTRATION', // Pour l'icône
      type: 'Commune',
      province: commune.province,
      population: commune.population,
      superficie: commune.superficieKm2,
      description: `Commune de ${commune.nom}`,
      // Pas d'adresse/email/tel spécifiques à la commune dans le schéma actuel, on laisse vide ou on met des placeholders
      adresseComplete: `${commune.nom}, Province de ${commune.province}`,
      telephone: null,
      email: null,
      stats: {
        etablissements: commune._count.etablissements,
        reclamations: commune._count.reclamations,
      },
      services: ['Gestion Administrative', 'Urbanisme', 'Etat Civil', 'Voirie'] // Services génériques
    };

    return NextResponse.json({ success: true, data });

  } catch (error) {
    console.error('Erreur récupération établissement:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
