import { locales } from './i18n/routing';
import ar from './locales/ar/common.json';

type Messages = typeof ar;

declare global {
  // Use type safe message keys with next-intl
  interface IntlMessages extends Messages {}
}
