import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/map/annexes - Récupérer les annexes avec leurs GeoJSON
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const communeId = searchParams.get('communeId');
    const includeStats = searchParams.get('includeStats') === 'true';

    const where: any = {};
    if (communeId) {
      where.communeId = parseInt(communeId);
    }

    const annexes = await prisma.annexe.findMany({
      where,
      select: {
        id: true,
        code: true,
        nom: true,
        nomArabe: true,
        communeId: true,
        latitude: true,
        longitude: true,
        population: true,
        superficieKm2: true,
        geojsonBoundary: true,
        commune: {
          select: {
            nom: true,
            code: true,
          }
        },
        ...(includeStats && {
          _count: {
            select: {
              etablissements: true,
            }
          }
        }),
      },
      orderBy: { nom: 'asc' },
    });

    // Formatter en GeoJSON FeatureCollection
    const features = annexes
      .filter(a => a.geojsonBoundary)
      .map(annexe => ({
        type: 'Feature',
        id: annexe.id,
        properties: {
          id: annexe.id,
          code: annexe.code,
          nom: annexe.nom,
          nomArabe: annexe.nomArabe,
          communeId: annexe.communeId,
          communeNom: annexe.commune.nom,
          latitude: annexe.latitude,
          longitude: annexe.longitude,
          population: annexe.population,
          superficieKm2: annexe.superficieKm2,
          ...(includeStats && annexe._count && {
            etablissementsCount: annexe._count.etablissements,
          }),
        },
        geometry: annexe.geojsonBoundary,
      }));

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    // Également les points centraux pour markers
    const points = annexes
      .filter(a => a.latitude && a.longitude)
      .map(annexe => ({
        type: 'Feature',
        id: annexe.id,
        properties: {
          id: annexe.id,
          nom: annexe.nom,
          communeNom: annexe.commune.nom,
          ...(includeStats && annexe._count && {
            etablissementsCount: annexe._count.etablissements,
          }),
        },
        geometry: {
          type: 'Point',
          coordinates: [annexe.longitude, annexe.latitude],
        },
      }));

    const pointsGeojson = {
      type: 'FeatureCollection',
      features: points,
    };

    // Liste simple
    const annexesList = annexes.map(a => ({
      id: a.id,
      code: a.code,
      nom: a.nom,
      communeId: a.communeId,
      communeNom: a.commune.nom,
      hasPolygon: !!a.geojsonBoundary,
      hasCoords: !!(a.latitude && a.longitude),
    }));

    return NextResponse.json({
      polygons: geojson,
      points: pointsGeojson,
      annexes: annexesList,
      total: annexes.length,
      withPolygons: features.length,
      withPoints: points.length,
    });

  } catch (error) {
    console.error("Erreur GET /api/map/annexes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
