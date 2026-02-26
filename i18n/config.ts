export type Locale = 'fr' | 'ar';

export const locales: Locale[] = ['fr', 'ar'];
export const defaultLocale: Locale = 'ar';

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  ar: 'العربية',
};

export const localeFlags: Record<Locale, string> = {
  fr: '🇫🇷',
  ar: '🇲🇦',
};

export const rtlLocales: Locale[] = ['ar'];

export const isRTL = (locale: Locale): boolean => {
  return rtlLocales.includes(locale);
};

export const getDirection = (locale: Locale): 'ltr' | 'rtl' => {
  return isRTL(locale) ? 'rtl' : 'ltr';
};
