import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    await db.$connect();

    const evenements = await db.evenement.findMany({
      where: {
        statut: { in: ["PUBLIEE", "EN_ACTION", "CLOTUREE"] },
      },
      select: {
        id: true,
        titre: true,
        description: true,
        dateDebut: true,
        dateFin: true,
        lieu: true,
        commune: { select: { nom: true } },
        etablissement: { select: { nom: true } },
        statut: true,
      },
      orderBy: { dateDebut: "desc" },
    });

    return NextResponse.json({ status: "success", data: evenements });
  } catch (error) {
    return NextResponse.json(
      { status: "error", message: "Database query failed", error: String(error) },
      { status: 500 }
    );
  } finally {
    await db.$disconnect();
  }
}
