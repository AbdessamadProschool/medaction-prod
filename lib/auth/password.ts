import bcrypt from 'bcryptjs';

/**
 * Nombre de rounds pour le hachage bcrypt
 * 12 est un bon équilibre entre sécurité et performance
 */
const SALT_ROUNDS = 12;

/**
 * Hache un mot de passe en utilisant bcrypt
 * @param password - Mot de passe en clair
 * @returns Promise<string> - Mot de passe haché
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(SALT_ROUNDS);
  return bcrypt.hash(password, salt);
}

/**
 * Vérifie si un mot de passe correspond à un hash
 * @param password - Mot de passe en clair
 * @param hashedPassword - Mot de passe haché
 * @returns Promise<boolean> - true si le mot de passe correspond
 */
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}
