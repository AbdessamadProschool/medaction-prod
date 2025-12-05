'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

export default function CompteDesactivePage() {
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
          <div className="w-24 h-24 bg-gradient-to-br from-amber-100 to-yellow-100 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-amber-100">
            <svg
              className="w-12 h-12 text-amber-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
              />
            </svg>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-8 border border-gray-100">
          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            Compte désactivé
          </h1>
          <p className="text-gray-500 mb-6 leading-relaxed">
            Votre compte a été temporairement désactivé. 
            Cela peut être dû à une violation des conditions d&apos;utilisation ou à une demande de votre part.
          </p>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-amber-800">Pour réactiver votre compte</p>
                <p className="text-sm text-amber-700 mt-1">
                  Veuillez contacter l&apos;administration de MedAction avec une pièce d&apos;identité valide.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Link
              href="/contact"
              className="block w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:from-emerald-700 hover:to-teal-700 transition-all duration-200"
            >
              Contacter l&apos;administration
            </Link>
            <Link
              href="/"
              className="block w-full py-3 px-4 bg-gray-100 text-gray-700 font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Retour à l&apos;accueil
            </Link>
          </div>
        </div>

        {/* Footer */}
        <p className="mt-6 text-sm text-gray-400">
          Province de Médiouna - Service Citoyen
        </p>
      </motion.div>
    </div>
  );
}
