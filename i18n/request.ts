import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ locale }) => {
  // En v3.19.0, l'argument est {locale}.
  // On valide la locale.
  let validLocale = locale;

  // Vérification basique
  if (!validLocale || !routing.locales.includes(validLocale as any)) {
    validLocale = routing.defaultLocale;
  }

  return {
    messages: (await import(`../locales/${validLocale}/common.json`)).default,
    timeZone: 'Africa/Casablanca'
  };
});
