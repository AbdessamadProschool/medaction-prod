'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { RefreshCw, Home, ServerCrash, ShieldAlert } from 'lucide-react';

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
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center px-4 text-center relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(239,68,68,0.05),transparent_60%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] pointer-events-none" />
      
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 max-w-lg w-full bg-slate-800/40 border border-slate-700/40 p-8 sm:p-12 rounded-[2.5rem] shadow-2xl backdrop-blur-md"
      >
        {/* Animated Icon Container */}
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
          className="mx-auto w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 mb-8 shadow-lg shadow-red-950/20"
        >
          <ServerCrash size={36} className="stroke-[1.5]" />
        </motion.div>

        {/* Status Code / Warning */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-500/10 text-red-400 border border-red-500/20 uppercase tracking-widest mb-4">
          <ShieldAlert size={12} />
          Erreur Serveur
        </span>

        {/* Server Error Title */}
        <h2 className="text-2xl font-bold text-white mb-3">
          {t('server_error') || "Une erreur est survenue"}
        </h2>
        
        {/* Description */}
        <p className="text-slate-400 mb-8 leading-relaxed text-sm">
          {t('server_error_desc') || "Nos services rencontrent actuellement des difficultés. Veuillez réessayer dans quelques instants."}
        </p>

        {/* Dev Diagnostics */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mb-8 p-4 bg-red-950/30 border border-red-900/30 text-red-400 rounded-2xl text-left text-xs font-mono max-w-full overflow-auto max-h-40">
            <p className="font-bold">{error.name}: {error.message}</p>
            {error.digest && <p className="mt-1">Digest: {error.digest}</p>}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-red-600 to-red-500 text-white font-bold rounded-2xl hover:from-red-700 hover:to-red-600 transition-all shadow-lg shadow-red-950/20 active:scale-[0.98]"
          >
            <RefreshCw size={16} />
            {t('retry') || "Réessayer"}
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-2xl transition-all active:scale-[0.98]"
          >
            <Home size={16} />
            {tAccess('back_home') || "Retour à l'accueil"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
