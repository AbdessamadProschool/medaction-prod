'use client';

import DemandeForm from '@/app/components/etablissements/workflow/DemandeForm';
import { ChevronLeft } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

export default function NouvelleDemandeCreationPage() {
  const t = useTranslations('establishments_workflow');

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in">
      <Link 
        href="/delegation/etablissements" 
        className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-colors font-bold text-sm"
      >
        <ChevronLeft size={16} />
        Retour à la liste
      </Link>

      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-gray-900 dark:text-white">{t('request_creation')}</h1>
        <p className="text-gray-500">Proposer un nouvel établissement au patrimoine provincial</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-gray-700 p-8">
        <DemandeForm type="CREATION" />
      </div>
    </div>
  );
}
