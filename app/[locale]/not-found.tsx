import Link from 'next/link';

import { useTranslations } from 'next-intl';

export default function NotFound() {
  const t = useTranslations();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <div className="text-9xl font-bold text-emerald-100 mb-4">404</div>
      <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
        {t('errors.not_found')}
      </h1>
      <p className="text-xl text-gray-600 mb-8 max-w-md">
        {t('errors.not_found_desc')}
      </p>
      <Link 
        href="/"
        className="px-8 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200"
      >
        {t('actions.back_home')}
      </Link>
    </div>
  );
}
