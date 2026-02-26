'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

export default function AccessibilitePage() {
  const t = useTranslations('accessibility_page');

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
              {t('compliance.title')}
            </h2>
            <p>
              {t('compliance.description')}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('features.title')}
            </h2>
            <ul className="list-disc pl-6 space-y-3 mt-4">
              <li>
                <strong>{t('features.contrast.title')} :</strong> {t('features.contrast.description')}
              </li>
              <li>
                <strong>{t('features.keyboard.title')} :</strong> {t('features.keyboard.description')}
              </li>
              <li>
                <strong>{t('features.images.title')} :</strong> {t('features.images.description')}
              </li>
              <li>
                <strong>{t('features.structure.title')} :</strong> {t('features.structure.description')}
              </li>
              <li>
                <strong>{t('features.zoom.title')} :</strong> {t('features.zoom.description')}
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('improvements.title')}
            </h2>
            <p>
              {t('improvements.intro')}
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4">
              <li>{t('improvements.high_contrast')}</li>
              <li>{t('improvements.screen_readers')}</li>
              <li>{t('improvements.transcription')}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-[hsl(45,93%,47%)] mb-4">
              {t('contact.title')}
            </h2>
            <p className="mb-4">
              {t('contact.description')}
            </p>
            <div className="bg-slate-900/50 rounded-lg p-4 border border-white/10">
              <ul className="space-y-2">
                <li>{t('contact.email')} : <a href="mailto:accessibilite@province-mediouna.ma" className="text-[hsl(45,93%,47%)] hover:underline">accessibilite@province-mediouna.ma</a></li>
                <li>{t('contact.phone')} : +212 5XX-XXXXXX</li>
              </ul>
            </div>
          </section>

          <div className="pt-8 border-t border-white/20 text-sm text-gray-400">
            <p>{t('declaration_date')}</p>
            <p className="mt-2">{t('province')}</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
