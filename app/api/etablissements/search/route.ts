import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q");

        if (!query || query.length < 2) {
            return NextResponse.json(
                { error: "Search query must be at least 2 characters long" },
                { status: 400 }
            );
        }

        const etablissements = await db.etablissement.findMany({
            where: {
                OR: [
                    { nom: { contains: query, mode: "insensitive" } },
                    { code: { contains: query, mode: "insensitive" } },
                ],
            },
            select: {
                id: true,
                nom: true,
                code: true,
                secteur: true,
                commune: { select: { nom: true } },
            },
            take: 20, // Limit results for search dropdowns
        });

        return NextResponse.json(etablissements);
    } catch (error) {
        console.error("Error searching etablissements:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
