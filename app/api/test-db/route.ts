// import { NextResponse } from "next/server";
// import db from "@/lib/db";

// export async function GET() {
//    try {
//       await db.$connect();
//       return NextResponse.json({ status: "success", message: "Database connection established" });
//    } catch (error) {
//       return NextResponse.json({ status: "error", message: "Database connection failed", error: String(error) }, { status: 500 });
//    } finally {
//       await db.$disconnect();
//    }
// }
// app/api/test-db/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db' // Import the singleton we created in Step 1

// 🟢 GET Request: Read all users
export async function GET() {
   try {
      const users = await prisma.user.findMany()
      return NextResponse.json({
         status: 'Online',
         message: 'Connection successful',
         userCount: users.length,
         users
      })
   } catch (error) {
      return NextResponse.json({ error: 'Failed to connect to DB', details: error }, { status: 500 })
   }
}

// 🟠 POST Request: Create a test user
export async function POST(request: Request) {
   try {
      const body = await request.json()

      // Simple validation
      if (!body.email || !body.nom) {
         return NextResponse.json({ error: 'Email and Nom are required' }, { status: 400 })
      }

      const newUser = await prisma.user.create({
         data: {
            email: body.email,
            motDePasse: "hashed_password_placeholder", // In real app, hash this!
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