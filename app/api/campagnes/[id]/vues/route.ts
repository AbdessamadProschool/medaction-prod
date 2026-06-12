import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';
import { ValidationError, NotFoundError } from '@/lib/exceptions';

export const POST = withErrorHandler(async (
  request: Request,
  { params: _p }: { params: Promise<{ id: string }> }
) => {
  const params = await _p;
  const id = parseInt(params.id, 10);
  if (isNaN(id)) {
      throw new ValidationError('ID invalide');
  }
    
  // Check if campaign exists
  const existing = await prisma.campagne.findUnique({ where: { id } });
  if (!existing) {
      throw new NotFoundError('Campagne introuvable');
  }

  await prisma.campagne.update({
    where: { id },
    data: { nombreVues: { increment: 1 } }
  });

  return successResponse(null);
});