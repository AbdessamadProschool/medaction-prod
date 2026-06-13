'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';
import { Wrench, RefreshCw, Mail, Clock } from 'lucide-react';
import { Link, useRouter } from '@/i18n/navigation';

export default function MaintenancePage() {
  const t = useTranslations('maintenance');
  const router = useRouter();
  const locale = useLocale();
  const [timeLeft, setTimeLeft] = useState('');
  const isAr = locale === 'ar';

  useEffect(() => {
    // Timer countdown fictif
    const interval = setInterval(() => {
      const now = new Date();
      const endTime = new Date();
      endTime.setHours(endTime.getHours() + 2); // Estimation 2h
      
      const diff = endTime.getTime() - now.getTime();
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      setTimeLeft(isAr ? `${hours} س ${minutes} د` : `${hours}h ${minutes}min`);
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isAr]);

  return (
    <div 
      dir={isAr ? 'rtl' : 'ltr'} 
      className={`min-h-screen bg-gradient-to-br from-[#07192b] via-[#0b3154] to-[#081e33] flex items-center justify-center p-4 relative overflow-hidden ${isAr ? 'font-cairo' : 'font-sans'}`}
    >
      {/* Moroccan Zellige Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage: "url('/images/zellige-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      />

      {/* Decorative Blur Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gov-gold/10 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gov-blue-light/25 rounded-full blur-3xl pointer-events-none animate-pulse delay-1000" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-xl w-full bg-[#071d31]/80 backdrop-blur-xl rounded-3xl p-8 md:p-12 border border-gov-gold/20 shadow-2xl shadow-black/40 text-center"
      >
        {/* Top Moroccan Decorative Arch Border (SVG styled) */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gov-gold text-[#0b3154] px-6 py-1 rounded-full text-xs font-semibold uppercase tracking-wider border border-gov-gold-light shadow-lg">
          {isAr ? 'عمالة مديونة' : 'Province de Médiouna'}
        </div>

        {/* Brand Header */}
        <div className="mb-6 flex justify-center items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gov-gold to-amber-500 flex items-center justify-center shadow-lg shadow-gov-gold/20 border border-gov-gold/30">
            <span className="text-[#0b3154] font-bold text-lg">M</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            {isAr ? (
              <>
                <span className="text-gov-gold">بوابة مديونة</span> الرقمية
              </>
            ) : (
              <>
                PORTAIL <span className="text-gov-gold">MEDIOUNA</span>
              </>
            )}
          </span>
        </div>

        {/* Animated Icon Container */}
        <div className="relative inline-flex items-center justify-center w-28 h-28 mb-8">
          {/* Ring pulse */}
          <span className="absolute inline-flex h-full w-full rounded-full bg-gov-gold/10 animate-ping opacity-75" />
          
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
            className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-gov-gold via-amber-500 to-amber-600 shadow-xl shadow-gov-gold/20 border border-gov-gold/30"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
            >
              <Wrench className="w-12 h-12 text-[#0b3154]" />
            </motion.div>
          </motion.div>
        </div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-3xl md:text-4xl font-extrabold text-white mb-4 leading-tight"
        >
          {t('title')}
        </motion.h1>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-base md:text-lg text-slate-300 mb-8 leading-relaxed max-w-md mx-auto"
        >
          {t('description')}
        </motion.p>

        {/* Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-[#051422]/60 backdrop-blur-md rounded-2xl p-6 mb-8 border border-white/5 shadow-inner"
        >
          <div className="flex items-center justify-center gap-3 text-gov-gold mb-3">
            <Clock className="w-5 h-5 animate-pulse" />
            <span className="font-semibold text-sm tracking-wide uppercase">
              {t('estimated_duration')}
            </span>
          </div>
          <div className="text-3xl font-extrabold text-white tracking-widest tabular-nums">
            {timeLeft || '...'}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-semibold transition-all duration-200"
          >
            <RefreshCw className="w-5 h-5" />
            {t('retry')}
          </button>
          
          <a
            href="mailto:contact@provincemediouna.ma"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-gov-gold via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 shadow-md shadow-gov-gold/10 text-[#0b3154] font-bold rounded-xl transition-all duration-200"
          >
            <Mail className="w-5 h-5" />
            {t('contact_us')}
          </a>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="mt-12 text-slate-500 text-sm border-t border-white/5 pt-6"
        >
          {t('footer')}
        </motion.p>

        {/* Admin access link (subtle) */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-4"
        >
          <Link
            href="/login"
            className="text-slate-600 hover:text-gov-gold text-xs underline transition-colors duration-200"
          >
            {t('admin_access')}
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
