
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler } from "@/lib/api-handler";
import { Prisma } from "@prisma/client";

// GET - Liste des annexes (filtrage optionnel par communeId)
export const GET = withErrorHandler(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const communeId = searchParams.get('communeId');

  const where: Prisma.AnnexeWhereInput = {};
  
  if (communeId) {
    const cid = parseInt(communeId);
    if (!isNaN(cid)) {
      where.communeId = cid;
    }
  }

  const annexes = await prisma.annexe.findMany({
    where,
    select: {
      id: true,
      nom: true,
      code: true,
      communeId: true
    },
    orderBy: { nom: 'asc' }
  });

  return NextResponse.json(
    { data: annexes },
    {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=300', // Cache 5 min
      }
    }
  );
});
