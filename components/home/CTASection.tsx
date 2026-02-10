'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2,
  Shield,
  Clock,
  FileText
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

export default function CTASection() {
  const t = useTranslations();
  const locale = useLocale();
  const isAr = locale === 'ar';

  return (
    <section className="py-20 relative overflow-hidden bg-gradient-to-br from-[hsl(213,80%,25%)] via-[hsl(213,80%,28%)] to-[hsl(213,80%,22%)]">
      {/* Simple Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Gold accent line at top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-[hsl(45,93%,47%)]" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className={`font-semibold text-white mb-6 leading-tight ${isAr ? 'text-4xl md:text-5xl font-cairo' : 'text-3xl md:text-4xl'}`}>
              {t('cta.citizen_space')}
            </h2>
            <p className={`text-white/80 mb-8 leading-relaxed ${isAr ? 'text-xl' : 'text-lg'}`}>
              {t('cta.citizen_desc')}
            </p>

            {/* Simple Feature List */}
            <div className="space-y-4 mb-10">
              <div className={`flex items-center gap-3 text-white/90 ${isAr ? 'text-lg' : ''}`}>
                <CheckCircle2 className="w-5 h-5 text-[hsl(45,93%,47%)]" />
                <span>{t('cta.feature1')}</span>
              </div>
              <div className={`flex items-center gap-3 text-white/90 ${isAr ? 'text-lg' : ''}`}>
                <CheckCircle2 className="w-5 h-5 text-[hsl(45,93%,47%)]" />
                <span>{t('cta.feature2')}</span>
              </div>
              <div className={`flex items-center gap-3 text-white/90 ${isAr ? 'text-lg' : ''}`}>
                <CheckCircle2 className="w-5 h-5 text-[hsl(45,93%,47%)]" />
                <span>{t('cta.feature3')}</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/register"
                className={`inline-flex items-center justify-center gap-2 px-8 py-4 bg-[hsl(45,93%,47%)] text-gray-900 font-semibold rounded-lg hover:bg-[hsl(45,93%,52%)] transition-colors ${isAr ? 'text-lg font-bold' : ''}`}
              >
                {t('cta.btn_create_account')}
                <ArrowRight className="w-5 h-5 rtl:rotate-180" />
              </Link>
              <Link
                href="/login"
                className={`inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/20 transition-colors ${isAr ? 'text-lg font-bold' : ''}`}
              >
                {t('cta.btn_login')}
              </Link>
            </div>
          </motion.div>

          {/* Right Content - Simple Stats Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="bg-white rounded-2xl p-8 shadow-xl">
              {/* Header */}
              <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-100">
                <div className="w-14 h-14 rounded-xl bg-[hsl(213,80%,35%)] flex items-center justify-center">
                  <Shield className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h3 className={`font-bold text-gray-900 ${isAr ? 'text-xl font-cairo' : 'text-xl'}`}>{t('hero.badge')}</h3>
                  <p className="text-sm text-gray-500">{t('app.province')}</p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-[hsl(213,80%,35%)]">25K+</p>
                  <p className="text-xs text-gray-500 mt-1">{t('cta.stats_citizens')}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-[hsl(213,80%,35%)]">95%</p>
                  <p className="text-xs text-gray-500 mt-1">{t('cta.stats_resolution')}</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-xl">
                  <p className="text-2xl font-bold text-[hsl(213,80%,35%)]">48h</p>
                  <p className="text-xs text-gray-500 mt-1">{t('cta.stats_time')}</p>
                </div>
              </div>

              {/* Simple Quote */}
              <div className="bg-gray-50 rounded-xl p-5">
                <p className={`text-gray-600 leading-relaxed mb-4 ${isAr ? 'text-base font-medium' : 'text-sm'}`}>
                  {t('cta.quote')}
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[hsl(45,93%,47%)] flex items-center justify-center text-gray-900 font-bold text-sm">
                    MK
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 text-sm">Mohammed K.</p>
                    <p className="text-xs text-gray-500">Tit Mellil</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
