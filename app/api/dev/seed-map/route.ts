import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST - Créer des établissements de test pour la carte (DEV ONLY)
export async function POST() {
  try {
    // Vérifier qu'il y a des communes
    const communes = await prisma.commune.findMany({ take: 5 });
    if (communes.length === 0) {
      return NextResponse.json({ error: "Aucune commune trouvée" }, { status: 400 });
    }

    const etablissementsData = [
      {
        code: 'EDU-MED-001',
        nom: 'Lycée Médiouna Central',
        secteur: 'EDUCATION' as const,
        latitude: 33.4500,
        longitude: -7.5200,
        communeId: communes[0].id,
        isPublie: true,
        isValide: true,
        noteMoyenne: 4.2,
        nombreEvaluations: 15,
      },
      {
        code: 'SAN-MED-001',
        nom: 'Centre de Santé Médiouna',
        secteur: 'SANTE' as const,
        latitude: 33.4550,
        longitude: -7.5150,
        communeId: communes[0].id,
        isPublie: true,
        isValide: true,
        noteMoyenne: 3.8,
        nombreEvaluations: 22,
      },
      {
        code: 'SPO-MED-001',
        nom: 'Complexe Sportif Municipal',
        secteur: 'SPORT' as const,
        latitude: 33.4480,
        longitude: -7.5100,
        communeId: communes[0].id,
        isPublie: true,
        isValide: true,
        noteMoyenne: 4.5,
        nombreEvaluations: 8,
      },
      {
        code: 'SOC-MED-001',
        nom: 'Dar Chabab Médiouna',
        secteur: 'SOCIAL' as const,
        latitude: 33.4600,
        longitude: -7.5050,
        communeId: communes[0].id,
        isPublie: true,
        isValide: true,
        noteMoyenne: 4.0,
        nombreEvaluations: 12,
      },
      {
        code: 'CUL-MED-001',
        nom: 'Maison de la Culture',
        secteur: 'CULTUREL' as const,
        latitude: 33.4520,
        longitude: -7.5250,
        communeId: communes[0].id,
        isPublie: true,
        isValide: true,
        noteMoyenne: 3.5,
        nombreEvaluations: 6,
      },
      {
        code: 'EDU-MED-002',
        nom: 'École Primaire Al Fath',
        secteur: 'EDUCATION' as const,
        latitude: 33.4450,
        longitude: -7.5180,
        communeId: communes[0].id,
        isPublie: true,
        isValide: true,
        noteMoyenne: 4.7,
        nombreEvaluations: 30,
      },
    ];

    const results = [];

    for (const data of etablissementsData) {
      const existing = await prisma.etablissement.findUnique({
        where: { code: data.code }
      });

      if (!existing) {
        const created = await prisma.etablissement.create({
          data: {
            ...data,
            donneesSpecifiques: {},
            services: [],
            programmes: [],
          }
        });
        results.push({ action: 'created', nom: data.nom });
      } else {
        await prisma.etablissement.update({
          where: { code: data.code },
          data: {
            latitude: data.latitude,
            longitude: data.longitude,
            isPublie: true,
            isValide: true,
          }
        });
        results.push({ action: 'updated', nom: data.nom });
      }
    }

    const count = await prisma.etablissement.count({
      where: {
        NOT: [
          { latitude: 0 },
          { longitude: 0 },
        ]
      }
    });

    return NextResponse.json({
      message: "Établissements de test créés",
      results,
      totalWithCoords: count
    });

  } catch (error) {
    console.error("Erreur seed:", error);
    return NextResponse.json({ error: "Erreur serveur", details: String(error) }, { status: 500 });
  }
}
