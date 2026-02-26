'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { X, Sparkles } from 'lucide-react';
import Image from 'next/image';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('welcome_popup');

  useEffect(() => {
    setMounted(true);
    // Check localStorage only on client side
    const hasSeen = localStorage.getItem('hasSeenWelcomePopup');
    if (!hasSeen) {
      // Small delay for entrance animation
      const timer = setTimeout(() => setIsOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = (dontShowAgain = false) => {
    setIsOpen(false);
    if (dontShowAgain) {
      localStorage.setItem('hasSeenWelcomePopup', 'true');
    } else {
      // Even if they just close it, we counts it as seen for this session?
      // Usually "Welcome" popups are annoying if they come back every refresh.
      // So we set it to true anyway.
      localStorage.setItem('hasSeenWelcomePopup', 'true');
    }
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => handleClose(true)}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-white/20"
          >
            {/* Decoration Background */}
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-blue-600 to-purple-600" />
            
            {/* Close Button */}
            <button
              onClick={() => handleClose(true)}
              className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full text-white transition-colors z-10"
            >
              <X size={20} />
            </button>

            <div className="relative pt-12 px-8 pb-8 flex flex-col items-center text-center">
              {/* Icon/Logo */}
              <div className="w-20 h-20 bg-white rounded-2xl shadow-xl flex items-center justify-center mb-6 transform rotate-3">
                 <Image src="/images/logo-portal-mediouna.png" alt="Logo" width={50} height={50} className="w-12 h-12 object-contain" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                {t('title')}
              </h2>

              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                {t('content')}
              </p>

              <button
                onClick={() => handleClose(true)}
                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 transform hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Sparkles size={20} />
                {t('start_button')}
              </button>

              <div className="mt-4">
                 <button 
                    onClick={() => handleClose(true)}
                    className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                 >
                    {t('dont_show_again')}
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
