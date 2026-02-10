'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function ConditionsUtilisationPage() {
  const t = useTranslations('terms_page');

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
              {t('object.title')}
            </h2>
            <p>
              {t('object.description')}
            </p>
            <p className="mt-4">
              {t('object.description2')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('usage.title')}
            </h2>
            <p className="mb-4">
              {t('usage.description')}
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>{t('usage.item_discredit')}</li>
              <li>{t('usage.item_stop')}</li>
              <li>{t('usage.item_use')}</li>
              <li>{t('usage.item_transmit')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('content.title')}
            </h2>
            <p>
              {t('content.description')}
            </p>
            <p className="mt-4">
              {t('content.description2')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('links.title')}
            </h2>
            <p>
              {t('links.description')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('ip.title')}
            </h2>
            <p>
              {t('ip.description')}
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

          <div className="pt-8 border-t border-white/20 text-sm text-gray-400">
            <p>{t('last_update')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
