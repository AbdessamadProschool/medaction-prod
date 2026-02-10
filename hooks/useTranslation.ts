'use client';

import { useTranslations as useNextIntlTranslations } from 'next-intl';

export function useTranslation(namespace: string = 'common') {
  return useNextIntlTranslations(namespace);
}
