'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { X, ArrowLeft, Building2, Calendar, Megaphone, Users, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('welcome_popup');

  useEffect(() => {
    setMounted(true);
    // Afficher à chaque consultation du site (suppression du localStorage)
    const timer = setTimeout(() => setIsOpen(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!mounted) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-[#ebd281] rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border-4 border-white/20"
          >
            {/* Background Decorative Icons */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20 text-[#0a3b68]">
               <Calendar className="absolute top-16 left-4 w-16 h-16" strokeWidth={1} />
               <Building2 className="absolute top-24 right-4 w-20 h-20" strokeWidth={1} />
               <Megaphone className="absolute bottom-40 left-6 w-14 h-14" strokeWidth={1} />
               <Users className="absolute bottom-20 right-8 w-16 h-16" strokeWidth={1} />
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 end-4 p-2 bg-[#0a3b68]/10 hover:bg-[#0a3b68]/20 rounded-full text-[#0a3b68] transition-colors z-20"
              aria-label="Fermer"
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="relative pt-10 px-6 sm:px-10 pb-8 flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-6 relative z-10 mix-blend-multiply">
                 <Image src="/images/logo-portal-mediouna.png" alt="Logo" width={140} height={140} className="w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-md" quality={100} />
              </div>

              {/* Title Pill */}
              <div className="bg-[#dfb22e] rounded-2xl px-6 py-3 mb-8 shadow-inner border border-white/20 relative z-10 w-full max-w-[90%]">
                <h2 className="text-xl sm:text-2xl font-black text-[#0a3b68] leading-tight">
                  {t('title')}
                </h2>
              </div>

              {/* Content */}
              <div className="relative z-10 mb-8 space-y-4">
                <p className="text-[#0a3b68] font-bold text-sm sm:text-base leading-relaxed whitespace-pre-line text-balance drop-shadow-sm">
                  {t('content')}
                </p>
              </div>

              {/* Start Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="w-full max-w-[80%] py-4 bg-[#0a3b68] hover:bg-[#072a4c] text-white rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all flex items-center justify-center gap-3 relative z-10 overflow-hidden group"
              >
                <div className="absolute inset-0 bg-white/10 w-0 group-hover:w-full transition-all duration-300 ease-out" />
                <span>{t('start_button')}</span>
                <div className="bg-white/20 p-1.5 rounded-full">
                  <ArrowLeft size={18} strokeWidth={3} className="rtl:rotate-180" />
                </div>
              </motion.button>
            </div>
            
            {/* Bottom Graphic Decoration */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 pointer-events-none opacity-30 flex justify-center items-end">
               <div className="w-16 h-24 bg-[#0a3b68] rounded-t-full absolute bottom-[-40px]" />
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
