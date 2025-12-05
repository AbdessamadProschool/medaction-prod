'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function AccesRefusePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="max-w-md w-full text-center"
      >
        {/* Icon */}
        <div className="mb-8">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-orange-100 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-red-100">
            <svg
              className="w-12 h-12 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Accès refusé
          </h1>
          <p className="text-gray-500 mb-8 leading-relaxed">
            Vous n&apos;avez pas les permissions nécessaires pour accéder à cette page.
            Veuillez contacter un administrateur si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
          </p>

          <div className="space-y-3">
            <Link
              href="/"
              className="block w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
            >
              Retour à l&apos;accueil
            </Link>
            <button
              onClick={() => window.history.back()}
              className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Page précédente
            </button>
          </div>
        </div>

        {/* Help */}
        <p className="mt-6 text-sm text-gray-400">
          Besoin d&apos;aide ?{' '}
          <Link href="/contact" className="text-emerald-600 hover:text-emerald-700 font-medium">
            Contactez-nous
          </Link>
        </p>
      </motion.div>
    </div>
  );
}
