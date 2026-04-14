import { ValidationError } from '@/lib/exceptions';

export function safeParseInt(value: string | null | undefined, fallback: number): number {
  if (value === null || value === undefined) return fallback;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? fallback : parsed;
}

/**
 * Strict integer parser for IDs.
 * Throws a ValidationError if the ID is not a positive integer.
 */
export function getSafeId(id: string | null | undefined, fieldName: string = 'id'): number {
  if (!id) {
    throw new ValidationError(`L'identifiant ${fieldName} est requis`);
  }
  
  const num = Number(id);
  if (!Number.isInteger(num) || num <= 0) {
    throw new ValidationError(`L'identifiant ${fieldName} n'est pas valide`);
  }
  
  return num;
}
