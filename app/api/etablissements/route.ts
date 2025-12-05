import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { etablissementFilterSchema } from "@/lib/validations/etablissement";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const queryParams = Object.fromEntries(searchParams.entries());

        // Validate filters
        const result = etablissementFilterSchema.safeParse(queryParams);

        if (!result.success) {
            return NextResponse.json(
                { error: "Invalid filters", details: result.error.flatten() },
                { status: 400 }
            );
        }

        const { page, limit, search, secteur, communeId, isPublie, isValide } = result.data;
        const skip = (page - 1) * limit;

        // Build where clause
        const where: Prisma.EtablissementWhereInput = {};

        if (search) {
            where.OR = [
                { nom: { contains: search, mode: "insensitive" } },
                { code: { contains: search, mode: "insensitive" } },
            ];
        }

        if (secteur) where.secteur = secteur;
        if (communeId) where.communeId = communeId;
        if (isPublie !== undefined) where.isPublie = isPublie;
        if (isValide !== undefined) where.isValide = isValide;

        // Execute query
        const [etablissements, total] = await Promise.all([
            db.etablissement.findMany({
                where,
                skip,
                take: 4,
                orderBy: { id: "asc" },
                include: {
                    commune: { select: { id: true, nom: true } },
                    annexe: { select: { id: true, nom: true } },
                },
            }),
            db.etablissement.count({ where }),
        ]);

        return NextResponse.json({
            data: etablissements,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error("Error fetching etablissements:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
