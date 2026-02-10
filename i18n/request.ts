import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // En v3.26, on reçoit requestLocale qui est une Promise (ou parfois la string directement selon le contexte)
  let locale: string | undefined;

  try {
    // Si c'est une promesse, on l'attend
    locale = await requestLocale;
  } catch (error) {
    console.error('Error retrieving requestLocale:', error);
  }

  // Validation
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../locales/${locale}/common.json`)).default,
    timeZone: 'Africa/Casablanca'
  };
});
