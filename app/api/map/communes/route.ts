import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET /api/map/communes - Récupérer les communes avec leurs GeoJSON
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeStats = searchParams.get('includeStats') === 'true';

    const communes = await prisma.commune.findMany({
      select: {
        id: true,
        code: true,
        nom: true,
        nomArabe: true,
        region: true,
        province: true,
        population: true,
        superficieKm2: true,
        geojsonBoundary: true,
        ...(includeStats && {
          _count: {
            select: {
              etablissements: true,
              reclamations: true,
              evenements: true,
            }
          }
        }),
      },
      orderBy: { nom: 'asc' },
    });

    // Formatter en GeoJSON FeatureCollection
    const features = communes
      .filter(c => c.geojsonBoundary) // Seulement celles avec polygone
      .map(commune => ({
        type: 'Feature',
        id: commune.id,
        properties: {
          id: commune.id,
          code: commune.code,
          nom: commune.nom,
          nomArabe: commune.nomArabe,
          region: commune.region,
          province: commune.province,
          population: commune.population,
          superficieKm2: commune.superficieKm2,
          ...(includeStats && commune._count && {
            etablissementsCount: commune._count.etablissements,
            reclamationsCount: commune._count.reclamations,
            evenementsCount: commune._count.evenements,
          }),
        },
        geometry: commune.geojsonBoundary,
      }));

    const geojson = {
      type: 'FeatureCollection',
      features,
    };

    // Aussi retourner la liste simple pour les selects
    const communesList = communes.map(c => ({
      id: c.id,
      code: c.code,
      nom: c.nom,
      nomArabe: c.nomArabe,
      hasPolygon: !!c.geojsonBoundary,
    }));

    return NextResponse.json({
      geojson,
      communes: communesList,
      total: communes.length,
      withPolygons: features.length,
    });

  } catch (error) {
    console.error("Erreur GET /api/map/communes:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
