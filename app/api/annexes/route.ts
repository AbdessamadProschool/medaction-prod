
import { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { withErrorHandler, successResponse } from "@/lib/api-handler";
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
      take: 100,
    where,
    select: {
      id: true,
      nom: true,
      nomArabe: true,
      code: true,
      communeId: true
    },
    orderBy: { nom: 'asc' }
  });

  const response = successResponse(annexes, undefined, 200);
  response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
  return response;
});
