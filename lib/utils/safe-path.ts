import path from 'path';

/**
 * Vérifie que le chemin résolu reste bien dans le répertoire de base.
 * Lance une erreur si path traversal détecté.
 */
export function safeResolvePath(base: string, ...parts: string[]): string {
  // Nettoyer chaque segment
  const cleanParts = parts.map(p =>
    String(p)
      .replace(/\.\./g, '')           // Supprimer ..
      .replace(/[<>:"|?*\x00]/g, '')  // Supprimer caractères dangereux
      .trim()
  );

  const resolved = path.resolve(base, ...cleanParts);

  // CONFINEMENT : le chemin résolu doit commencer par la base
  if (!resolved.startsWith(base + path.sep) && resolved !== base) {
    throw new Error(`Path traversal détecté : ${resolved} hors de ${base}`);
  }

  return resolved;
}

/**
 * Valide un nom de fichier — uniquement alphanumérique + tirets + points
 */
export function sanitizeFilename(filename: string): string {
  return path.basename(filename)
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .substring(0, 255);
}
