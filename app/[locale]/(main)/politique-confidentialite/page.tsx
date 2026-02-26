'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function ConfidentialitePage() {
  const t = useTranslations('privacy_page');

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 py-16">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-4 max-w-4xl"
      >
        <h1 className="text-4xl font-bold text-white mb-8">
          {t('title')}
        </h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-gray-200 space-y-8">
          <p className="text-lg text-gray-300">
            {t('intro')}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('data_collection.title')}
            </h2>
            <p>
              {t('data_collection.description')}
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t('data_collection.item_identification')}</li>
              <li>{t('data_collection.item_location')}</li>
              <li>{t('data_collection.item_claim')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('data_usage.title')}
            </h2>
            <p>
              {t('data_usage.description')}
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t('data_usage.item_management')}</li>
              <li>{t('data_usage.item_improvement')}</li>
              <li>{t('data_usage.item_statistics')}</li>
              <li>{t('data_usage.item_other')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('disclaimer.title')}
            </h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
              <p className="font-semibold text-red-300 mb-4">
                {t('disclaimer.description')}
              </p>
              <ul className="list-disc pl-6 space-y-3 text-gray-300">
                <li>{t('disclaimer.item_no_responsibility')}</li>
                <li>{t('disclaimer.item_rights')}</li>
                <li>{t('disclaimer.item_risk')}</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('province_rights.title')}
            </h2>
            <p>
              {t('province_rights.description')}
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t('province_rights.item_retain')}</li>
              <li>{t('province_rights.item_delete')}</li>
              <li>{t('province_rights.item_refuse')}</li>
              <li>{t('province_rights.item_action')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('cookies.title')}
            </h2>
            <p>
              {t('cookies.description')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('modification.title')}
            </h2>
            <p>
              {t('modification.description')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('acceptance.title')}
            </h2>
            <p>
              {t('acceptance.description')}
            </p>
          </section>

          <div className="pt-8 border-t border-white/20 text-sm text-gray-400">
            <p>{t('last_update')}</p>
            <p className="mt-2">{t.raw('title').includes('Politique') ? 'Province de Médiouna' : 'عمالة مديونة'}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
