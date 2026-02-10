import { redirect } from 'next/navigation';
import { routing } from '@/i18n/routing';

/**
 * Page racine - Redirige automatiquement vers la locale par défaut
 * Cette page n'est normalement jamais affichée car le middleware
 * devrait rediriger avant, mais elle sert de fallback de sécurité.
 */
export default function RootPage() {
  // Redirection côté serveur vers la locale par défaut
  redirect(`/${routing.defaultLocale}`);
}
