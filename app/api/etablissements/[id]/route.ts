import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { etablissementUpdateSchema } from "@/lib/validations/etablissement";

interface RouteParams {
    params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const etablissementId = parseInt(id);

        if (isNaN(etablissementId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const etablissement = await db.etablissement.findUnique({
            where: { id: etablissementId },
            include: {
                commune: { select: { id: true, nom: true } },
                annexe: { select: { id: true, nom: true } },
            },
        });

        if (!etablissement) {
            return NextResponse.json({ error: "Etablissement not found" }, { status: 404 });
        }

        return NextResponse.json(etablissement);
    } catch (error) {
        console.error("Error fetching etablissement:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const etablissementId = parseInt(id);

        if (isNaN(etablissementId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        const body = await req.json();
        const result = etablissementUpdateSchema.safeParse(body);

        if (!result.success) {
            return NextResponse.json(
                { error: "Validation Error", details: result.error.flatten() },
                { status: 400 }
            );
        }

        // Check if exists
        const existing = await db.etablissement.findUnique({
            where: { id: etablissementId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Etablissement not found" }, { status: 404 });
        }

        const updatedEtablissement = await db.etablissement.update({
            where: { id: etablissementId },
            data: result.data,
        });

        return NextResponse.json(updatedEtablissement);
    } catch (error) {
        console.error("Error updating etablissement:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
    try {
        const { id } = await params;
        const etablissementId = parseInt(id);

        if (isNaN(etablissementId)) {
            return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
        }

        // Check if exists
        const existing = await db.etablissement.findUnique({
            where: { id: etablissementId },
        });

        if (!existing) {
            return NextResponse.json({ error: "Etablissement not found" }, { status: 404 });
        }

        await db.etablissement.delete({
            where: { id: etablissementId },
        });

        return NextResponse.json({ message: "Etablissement deleted successfully" });
    } catch (error) {
        console.error("Error deleting etablissement:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
