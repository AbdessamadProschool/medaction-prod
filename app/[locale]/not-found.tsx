'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Home, ArrowLeft, Building2, Calendar, Newspaper, AlertTriangle } from 'lucide-react';

export default function NotFound() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.05),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full bg-slate-800/50 border border-slate-700/50 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl backdrop-blur-md"
      >
        {/* Animated Badge */}
        <motion.div 
          animate={{ rotate: [0, -5, 5, -5, 0] }}
          transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
          className="mx-auto w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500 mb-8 shadow-inner"
        >
          <AlertTriangle size={36} className="stroke-[1.5]" />
        </motion.div>

        {/* 404 Title */}
        <h1 className="text-8xl font-black text-slate-900 dark:text-white font-black tracking-tight leading-none mb-4">
          404
        </h1>
        
        <h2 className="text-2xl font-bold text-white mb-3">
          {t('errors.not_found')}
        </h2>
        
        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
          {t('errors.not_found_desc') || "La page que vous recherchez n'existe pas ou a été déplacée."}
        </p>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <Link 
            href="/etablissements"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 transition-all text-left"
          >
            <Building2 size={16} className="text-emerald-500" />
            Établissements
          </Link>
          <Link 
            href="/evenements"
            className="flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 transition-all text-left"
          >
            <Calendar size={16} className="text-amber-500" />
            Événements
          </Link>
        </div>

        {/* Back Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link 
            href="/"
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold rounded-2xl hover:from-emerald-700 hover:to-emerald-600 transition-all shadow-lg shadow-emerald-950/20 active:scale-[0.98]"
          >
            <Home size={16} />
            {t('actions.back_home') || "Retour à l'accueil"}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.98]"
          >
            <ArrowLeft size={16} />
            Retour
          </button>
        </div>
      </motion.div>
    </div>
  );
}
