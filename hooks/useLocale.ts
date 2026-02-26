'use client';

import { useLocale as useNextIntlLocale } from 'next-intl';
import type { Locale } from '@/i18n/routing';

export function useLocale(): Locale {
  return useNextIntlLocale() as Locale;
}
