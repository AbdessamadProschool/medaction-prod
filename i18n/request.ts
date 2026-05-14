import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';

export default getRequestConfig(async ({requestLocale}) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Liste des fichiers à charger et fusionner
  const files = [
    'common.json',
    'admin_reclamations.json',
    'admin_roles.json',
    'admin_settings.json',
    'admin_users.json'
  ];

  let messages = {};
  for (const file of files) {
    try {
      const msg = (await import(`../locales/${locale}/${file}`)).default;
      messages = { ...messages, ...msg };
    } catch (e) {
      // Ignorer si le fichier n'existe pas encore pour cette langue
      console.warn(`Translation file ${file} not found for locale ${locale}`);
    }
  }

  return {
    locale,
    messages,
    timeZone: 'Africa/Casablanca',
    now: new Date(),
  };
});
