'use client';

import { useLocale } from './useLocale';
import { getDirection } from '@/i18n/routing';

export function useDirection() {
  const locale = useLocale();
  const direction = getDirection(locale);
  const isRTL = direction === 'rtl';

  return {
    direction,
    isRTL,
    isLTR: !isRTL,
  };
}
