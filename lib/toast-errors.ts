'use client';

import { toast } from 'sonner';

interface ApiErrorDetail {
  field: string;
  message: string;
}

interface ApiErrorResponse {
  success?: boolean;
  error?: {
    code?: string;
    message?: string;
    details?: ApiErrorDetail[];
    fieldErrors?: Record<string, string[]>;
    field?: string;
  };
  message?: string;
}

/**
 * Affiche les erreurs d'une réponse API de manière professionnelle
 * Compatible avec le système de formatage d'erreurs global
 * 
 * @param response - La réponse JSON de l'API
 * @param fallbackMessage - Message par défaut si aucun détail n'est disponible
 */
export function showApiErrors(
  response: ApiErrorResponse,
  fallbackMessage: string = 'Une erreur est survenue'
) {
  const errorInfo = response.error || response;
  
  // Cas 1: Erreurs avec détails de champs
  if (errorInfo.details && Array.isArray(errorInfo.details)) {
    errorInfo.details.forEach((detail: ApiErrorDetail) => {
      toast.error(detail.message, {
        description: detail.field !== 'general' ? `Champ: ${detail.field}` : undefined,
        duration: 5000,
      });
    });
    return;
  }
  
  // Cas 2: Format fieldErrors (Zod style)
  if (errorInfo.fieldErrors && typeof errorInfo.fieldErrors === 'object') {
    Object.entries(errorInfo.fieldErrors).forEach(([field, messages]) => {
      (messages as string[]).forEach((msg) => {
        toast.error(msg, {
          description: field !== 'general' ? `Champ: ${field}` : undefined,
          duration: 5000,
        });
      });
    });
    return;
  }
  
  // Cas 3: Message simple avec champ
  if (errorInfo.field && errorInfo.message) {
    toast.error(errorInfo.message, {
      description: `Champ: ${errorInfo.field}`,
      duration: 5000,
    });
    return;
  }
  
  // Cas 4: Message simple uniquement
  const message = errorInfo.message || response.message || fallbackMessage;
  toast.error(message);
}

/**
 * Gère une réponse API et affiche les erreurs si échec
 * 
 * @param response - L'objet Response de fetch
 * @param fallbackMessage - Message par défaut en cas d'erreur
 * @returns L'objet JSON de la réponse
 */
export async function handleApiResponse<T = unknown>(
  response: Response,
  fallbackMessage: string = 'Une erreur est survenue'
): Promise<{ success: boolean; data?: T; error?: ApiErrorResponse }> {
  try {
    const data = await response.json();
    
    if (response.ok && data.success !== false) {
      return { success: true, data: data.data || data };
    }
    
    showApiErrors(data, fallbackMessage);
    return { success: false, error: data };
  } catch (err) {
    toast.error('Erreur de communication avec le serveur');
    return { success: false };
  }
}

/**
 * Affiche un succès avec message
 */
export function showSuccess(message: string, description?: string) {
  toast.success(message, { description });
}

/**
 * Affiche une information
 */
export function showInfo(message: string, description?: string) {
  toast.info(message, { description });
}

/**
 * Affiche un avertissement
 */
export function showWarning(message: string, description?: string) {
  toast.warning(message, { description });
}
