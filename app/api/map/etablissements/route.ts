import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/map/etablissements - Établissements pour la carte
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const secteur = searchParams.get('secteur');
    const communeId = searchParams.get('communeId');
    const annexeId = searchParams.get('annexeId');
    
    const search = searchParams.get('search');
    const hasEvents = searchParams.get('hasEvents') === 'true';
    const hasNews = searchParams.get('hasNews') === 'true';
    const bounds = searchParams.get('bounds'); // "minLat,minLng,maxLat,maxLng"

    const where: any = {
      // Note: En développement, on affiche tous les établissements
      // En production, activer : isPublie: true,
    };

    if (secteur) where.secteur = secteur;
    if (communeId) where.communeId = parseInt(communeId);
    if (annexeId) where.annexeId = parseInt(annexeId);

    // Recherche textuelle
    if (search) {
      where.OR = [
        { nom: { contains: search, mode: 'insensitive' } },
        { nomArabe: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Filtre par événements
    if (hasEvents) {
      where.evenements = {
        some: {
          statut: 'PUBLIEE'
        }
      };
    }

    // Filtre par actualités
    if (hasNews) {
      where.actualites = {
        some: {
          statut: { in: ['PUBLIEE', 'VALIDEE'] }
        }
      };
    }

    // Filtrer par bounds si fourni
    if (bounds) {
      const [minLat, minLng, maxLat, maxLng] = bounds.split(',').map(Number);
      if (!isNaN(minLat) && !isNaN(minLng) && !isNaN(maxLat) && !isNaN(maxLng)) {
        where.latitude = { gte: minLat, lte: maxLat };
        where.longitude = { gte: minLng, lte: maxLng };
      }
    }

    const allEtablissements = await prisma.etablissement.findMany({
      where,
      take: 1000, 
      select: {
          id: true, code: true, nom: true, secteur: true, latitude: true, longitude: true,
          // Select minimally for debug + necessary fields (kept full selection in real code but abbreviated here for replace)
          // Actually I must keep the original selection block below.
          nomArabe: true, nature: true, typeEtablissement: true, noteMoyenne: true, nombreEvaluations: true, photoPrincipale: true, statutFonctionnel: true,
          telephone: true, email: true, siteWeb: true, adresseComplete: true, etatInfrastructure: true, capaciteAccueil: true, nombreSalles: true,
          anneeOuverture: true, anneeCreation: true, effectifTotal: true, nombrePersonnel: true, budgetAnnuel: true, sourcesFinancement: true,
          tutelle: true, responsableNom: true, accessibilite: true, surfaceTotale: true, disponibiliteEau: true, disponibiliteElectricite: true, connexionInternet: true,
          elevesTotal: true, elevesFilles: true, nouveauxInscrits: true, commune: { select: { id: true, nom: true } }, annexe: { select: { id: true, nom: true, communeId: true } },
          _count: { select: { evaluations: true, abonnements: true, reclamations: true, evenements: { where: { statut: 'PUBLIEE' } }, actualites: { where: { statut: { in: ['PUBLIEE', 'VALIDEE'] } } }, programmesActivites: { where: { statut: { not: 'BROUILLON' } } } } },
          evenements: { where: { statut: { in: ['PUBLIEE', 'EN_ACTION', 'CLOTUREE'] as any } }, orderBy: { dateDebut: 'desc' }, take: 20, select: { id: true, titre: true, dateDebut: true, dateFin: true, statut: true, typeCategorique: true } },
          programmesActivites: { where: { statut: { not: 'BROUILLON' as any } }, orderBy: { date: 'desc' }, take: 20, select: { id: true, titre: true, date: true, heureDebut: true, heureFin: true, statut: true } }
      },
    });

    // Filtrer les établissements avec des coordonnées valides
    const etablissements = allEtablissements.filter(
      etab => etab.latitude !== null && etab.longitude !== null && 
              etab.latitude !== 0 && etab.longitude !== 0
    );

    // Formatter en GeoJSON pour Leaflet/Mapbox
    const features = etablissements.map((etab: any) => ({
      type: 'Feature',
      id: etab.id,
      properties: {
        id: etab.id,
        code: etab.code,
        nom: etab.nom,
        nomArabe: etab.nomArabe,
        secteur: etab.secteur,
        nature: etab.nature,
        noteMoyenne: etab.noteMoyenne,
        nombreEvaluations: etab.nombreEvaluations,
        photoPrincipale: etab.photoPrincipale,
        statutFonctionnel: etab.statutFonctionnel,
        communeId: etab.commune?.id,
        communeNom: etab.commune?.nom,
        annexeId: etab.annexe?.id,
        annexeCommuneId: etab.annexe?.communeId,
        annexeNom: etab.annexe?.nom,
        // Added details
        telephone: etab.telephone,
        email: etab.email,
        siteWeb: etab.siteWeb,
        adresseComplete: etab.adresseComplete,
        etatInfrastructure: etab.etatInfrastructure,
        capaciteAccueil: etab.capaciteAccueil,
        nombreSalles: etab.nombreSalles,

        anneeOuverture: etab.anneeOuverture,
        anneeCreation: etab.anneeCreation,
        effectifTotal: etab.effectifTotal,
        nombrePersonnel: etab.nombrePersonnel,
        budgetAnnuel: etab.budgetAnnuel,
        sourcesFinancement: etab.sourcesFinancement,
        // Detailed Mappings
        tutelle: etab.tutelle,
        responsableNom: etab.responsableNom,
        accessibilite: etab.accessibilite,
        surfaceTotale: etab.surfaceTotale,
        disponibiliteEau: etab.disponibiliteEau,
        disponibiliteElectricite: etab.disponibiliteElectricite,
        connexionInternet: etab.connexionInternet,
        elevesTotal: etab.elevesTotal,
        elevesFilles: etab.elevesFilles,
        nouveauxInscrits: etab.nouveauxInscrits,
        typeEtablissement: etab.typeEtablissement,
        evaluationsCount: etab._count.evaluations,
        abonnementsCount: etab._count.abonnements,
        reclamationsCount: etab._count.reclamations,
        evenementsCount: etab._count.evenements,
        actualitesCount: etab._count.actualites,
        activitesCount: etab._count.programmesActivites,
        // Arrays for filtering
        eventsList: etab.evenements,
        activitiesList: etab.programmesActivites
      },
      geometry: {
        type: 'Point',
        coordinates: [etab.longitude, etab.latitude],
      },
    }));

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    // Stats par secteur pour les filtres
    const secteurStats = etablissements.reduce((acc, e) => {
      acc[e.secteur] = (acc[e.secteur] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      geojson,
      total: etablissements.length,
      secteurStats,
    });

  } catch (error) {
    console.error("Erreur GET /api/map/etablissements:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
