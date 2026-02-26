import {defineRouting} from 'next-intl/routing';

export const routing = defineRouting({
  // Liste de toutes les locales supportées
  locales: ['fr', 'ar'],

  // Locale par défaut
  defaultLocale: 'ar',
  
  // Préfixe de locale toujours présent dans l'URL
  localePrefix: 'always',

  // Activer la détection de locale via cookie pour la persistance
  localeDetection: true
});

// Types exportés pour usage dans l'application
export type Locale = (typeof routing.locales)[number];
export const locales = routing.locales;
export const defaultLocale = routing.defaultLocale;

// Configuration RTL
export const rtlLocales: Locale[] = ['ar'];

export const isRTL = (locale: Locale): boolean => {
  return rtlLocales.includes(locale);
};

export const getDirection = (locale: Locale): 'ltr' | 'rtl' => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  ar: '🇲🇦',
};
