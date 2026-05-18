import {getRequestConfig} from 'next-intl/server';
import {hasLocale} from 'next-intl';
import {routing} from './routing';

function isObject(item: any): boolean {
  return (item && typeof item === 'object' && !Array.isArray(item));
}

function deepMerge(target: any, source: any): any {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

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
      messages = deepMerge(messages, msg);
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

