'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { 
  locales, 
  localeNames, 
  localeFlags, 
  type Locale 
} from '@/i18n/routing';

export function LanguageSwitcher() {
  const t = useTranslations('common');
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const handleLocaleChange = (newLocale: Locale) => {
    if (newLocale === locale) return;

    startTransition(() => {
      // Stocker la langue dans un cookie pour la persistance
      document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=${365 * 24 * 60 * 60}; SameSite=Lax`;
      
      // Remplacer la locale dans le pathname
      // pathname ex: /fr/dashboard -> parts: ['', 'fr', 'dashboard']
      const segments = pathname.split('/');
      
      // Si le premier segment est une locale, on le remplace
      if (locales.includes(segments[1] as Locale)) {
        segments[1] = newLocale;
      } else {
        // Sinon (ex: /), on ajoute la locale (ne devrait pas arriver avec le middleware)
        segments.splice(1, 0, newLocale);
      }
      
      const newPathname = segments.join('/');
      router.replace(newPathname || `/${newLocale}`);
      
      // Forcer le rechargement pour appliquer la nouvelle langue partout
      router.refresh();
    });
  };

  return (
    <div className="relative group z-50">
      <button
        type="button"
        className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-white/10 transition-colors border border-transparent"
        disabled={isPending}
        aria-label="Switch language"
      >
        <span className="text-xl text-amber-500">{localeFlags[locale]}</span>
        <span className="text-amber-500 font-bold hidden md:inline tracking-wide uppercase">{localeNames[locale]}</span>
        <svg
          className="w-4 h-4 transition-transform group-hover:rotate-180 text-amber-500"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={3}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Dropdown */}
      <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-950 rounded-lg shadow-xl border border-gray-200 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 min-w-[160px] overflow-hidden transform origin-top-right">
        {locales.map((loc) => (
          <button
            key={loc}
            onClick={() => handleLocaleChange(loc)}
            disabled={isPending || loc === locale}
            className={`
              w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors
              ${loc === locale ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 dark:text-amber-500 font-bold' : 'text-gray-700 dark:text-gray-300'}
              ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            <span className="text-xl">{localeFlags[loc]}</span>
            <span>{localeNames[loc]}</span>
            {loc === locale && (
              <svg
                className="w-5 h-5 ml-auto text-amber-600 dark:text-amber-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
