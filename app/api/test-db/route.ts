import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const evenements = await prisma.evenement.findMany({
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
  }
}

export async function POST(request: Request) {
   try {
      const body = await request.json()

      if (!body.email || !body.nom) {
         return NextResponse.json({ error: 'Email and Nom are required' }, { status: 400 })
      }

      const newUser = await prisma.user.create({
         data: {
            email: body.email,
            motDePasse: "hashed_password_placeholder",
            nom: body.nom,
            prenom: body.prenom || "Test",
            role: "CITOYEN"
         }
      })

      return NextResponse.json({ success: true, user: newUser }, { status: 201 })
   } catch (error) {
      return NextResponse.json({ error: 'Failed to create user', details: error }, { status: 500 })
   }
}
