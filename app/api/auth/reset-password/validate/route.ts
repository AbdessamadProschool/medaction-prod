import { prisma } from '@/lib/db';
import { withErrorHandler, successResponse } from '@/lib/api-handler';

/**
 * GET /api/auth/reset-password/validate
 * Valide un token de réinitialisation
 */
export const GET = withErrorHandler(async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return successResponse({ valid: false });
  }

    // Chercher l'utilisateur avec ce token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

  return successResponse({ valid: !!user });
});
