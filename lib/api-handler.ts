import { NextResponse, NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { AppError } from './exceptions';
import { Prisma } from '@prisma/client';
import { formatZodErrors, formatPrismaError, createErrorResponse } from './error-formatter';
import { SystemLogger } from './system-logger';

type ApiContext = {
  params: any;
};

type ApiHandler = (
  req: NextRequest,
  context: ApiContext
) => Promise<NextResponse>;

/**
 * Wrapper professionnel pour sécuriser les routes API.
 * Gère automatiquement le Try/Catch, le Logging et le Format de réponse standard.
 * 
 * Fonctionnalités:
 * - Messages d'erreur détaillés et lisibles en français
 * - Gestion des erreurs Zod avec détails par champ
 * - Gestion des erreurs Prisma avec messages explicites
 * - Logging sécurisé (stack trace en dev seulement)
 */
export function withErrorHandler(handler: ApiHandler): (req: NextRequest, context: ApiContext) => Promise<NextResponse> {
  return async (req: NextRequest, context: ApiContext) => {
    try {
      // Exécuter la logique métier
      return await handler(req, context);
    } catch (error: any) {
      // 1. Logging Sécurisé (Interne seulement)
      console.error('[API_ERROR]', {
        path: req.url,
        method: req.method,
        error: error.message,
        code: error.code,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      });

      // Log to SystemLogger for dynamic monitoring
      const urlPath = new URL(req.url).pathname;
      SystemLogger.error('api', `${req.method} ${urlPath} - ${error.message}`, {
        path: urlPath,
        method: req.method,
        errorCode: error.code,
      });

      // 2. Gestion des types d'erreurs connus

      // Erreur Métier (AppError) - avec context amélioré
      if (error instanceof AppError) {
        // Si c'est une ValidationError avec un context Zod, le formater
        if (error.code === 'VALIDATION_ERROR' && error.context?.fieldErrors) {
          const details = Object.entries(error.context.fieldErrors).flatMap(
            ([field, messages]) => 
              (messages as string[]).map(msg => ({ field, message: msg }))
          );
          
          return NextResponse.json(
            createErrorResponse(error.code, error.message, {
              details,
              fieldErrors: error.context.fieldErrors,
            }),
            { status: error.statusCode }
          );
        }
        
        return NextResponse.json(
          createErrorResponse(error.code, error.message, {
            field: error.context?.field,
          }),
          { status: error.statusCode }
        );
      }

      // Erreur de Validation (Zod) - avec messages détaillés
      if (error instanceof ZodError) {
        const formatted = formatZodErrors(error);
        
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', formatted.message, {
            details: formatted.details,
            fieldErrors: formatted.fieldErrors,
          }),
          { status: 400 }
        );
      }

      // Erreur Base de Données (Prisma) - avec messages explicites
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const formatted = formatPrismaError(error);
        
        const statusCode = 
          formatted.code === 'CONFLICT' ? 409 :
          formatted.code === 'NOT_FOUND' ? 404 :
          formatted.code === 'INVALID_REFERENCE' ? 400 :
          500;
        
        return NextResponse.json(
          createErrorResponse(formatted.code, formatted.message, {
            field: formatted.field,
          }),
          { status: statusCode }
        );
      }

      // Erreur Prisma - Validation côté DB
      if (error instanceof Prisma.PrismaClientValidationError) {
        // Extraire un message plus lisible
        const message = error.message.includes('Argument')
          ? 'Un ou plusieurs champs ont un format invalide. Vérifiez les données envoyées.'
          : 'Erreur de validation des données.';
        
        return NextResponse.json(
          createErrorResponse('VALIDATION_ERROR', message, {
            details: process.env.NODE_ENV === 'development' 
              ? [{ field: 'general', message: error.message.split('\n').pop() || error.message }]
              : undefined,
          }),
          { status: 400 }
        );
      }

      // Erreur JSON invalide
      if (error instanceof SyntaxError && error.message.includes('JSON')) {
        return NextResponse.json(
          createErrorResponse('INVALID_JSON', 'Le format de la requête est invalide. Vérifiez le JSON envoyé.'),
          { status: 400 }
        );
      }

      // 3. Fallback: Erreur Serveur Générique (OWASP: Ne jamais fuiter l'erreur technique)
      return NextResponse.json(
        createErrorResponse(
          'INTERNAL_SERVER_ERROR',
          'Une erreur interne est survenue. Veuillez réessayer plus tard.',
          process.env.NODE_ENV === 'development' 
            ? { details: [{ field: 'server', message: error.message }] }
            : undefined
        ),
        { status: 500 }
      );
    }
  };
}

/**
 * Helper pour créer une réponse de succès standardisée
 */
export function successResponse<T>(data: T, message?: string, status: number = 200): NextResponse {
  return NextResponse.json({
    success: true,
    message,
    data,
  }, { status });
}

/**
 * Helper pour créer une réponse d'erreur manuellement
 */
export function errorResponse(
  message: string,
  code: string = 'ERROR',
  status: number = 400,
  details?: Array<{ field: string; message: string }>
): NextResponse {
  return NextResponse.json(
    createErrorResponse(code, message, { details }),
    { status }
  );
}
