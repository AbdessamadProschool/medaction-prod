import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
   try {
      await db.$connect();
      return NextResponse.json({ status: "success", message: "Database connection established" });
   } catch (error) {
      return NextResponse.json({ status: "error", message: "Database connection failed", error: String(error) }, { status: 500 });
   } finally {
      await db.$disconnect();
   }
}
