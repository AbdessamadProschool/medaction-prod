'use client';

import { useEffect } from 'react';

import { useTranslations } from 'next-intl';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations('errors');
  const tAccess = useTranslations('access_denied');

  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-6 rounded-full bg-red-100 p-4">
        <svg
          className="h-10 w-10 text-red-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-900">
        {t('server_error')}
      </h2>
      <p className="mb-4 max-w-md text-gray-600">
        {t('server_error_desc')}
      </p>
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-8 p-4 bg-red-50 text-red-700 rounded-lg text-left text-xs font-mono max-w-lg overflow-auto">
          <p className="font-bold">{error.name}: {error.message}</p>
          {error.digest && <p className="mt-1">Digest: {error.digest}</p>}
        </div>
      )}
      <div className="flex gap-4">
        <button
          onClick={() => reset()}
          className="rounded-lg bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
          {t('retry')}
        </button>
        <button
            onClick={() => window.location.href = '/'}
            className="rounded-lg bg-white px-6 py-2.5 text-sm font-medium text-gray-700 border border-gray-300 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
        >
            {tAccess('back_home')}
        </button>
      </div>
    </div>
  );
}
