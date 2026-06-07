'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface AnnouncementConfig {
  isActive: boolean;
  title: string;
  message: string;
  showOncePerSession: boolean;
}

export default function AnnouncementModal() {
  const t = useTranslations('announcement_modal');
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<AnnouncementConfig | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const checkAndShow = async () => {
      try {
        const hasSeen = sessionStorage.getItem('announcement_seen');
        const res = await fetch('/api/settings/announcement');
        const data = await res.json();
        setConfig(data);

        if (data.isActive) {
          if (data.showOncePerSession && hasSeen) {
            return;
          }
          // Délai d'apparition élégant
          setTimeout(() => setIsOpen(true), 1500);
        }
      } catch (error) {
        console.error('Failed to load announcement', error);
      }
    };

    checkAndShow();
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    if (config?.showOncePerSession) {
      sessionStorage.setItem('announcement_seen', 'true');
    }
  };

  if (!mounted) return null;

  // Détection basique pour changer la police si Arabe présent
  const isArabic = (text: string = '') => /[\u0600-\u06FF]/.test(text);

  return (
    <AnimatePresence>
      {isOpen && config && (
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
               <div className="absolute top-16 left-4 w-16 h-16 border-2 border-current rounded-xl rotate-12" />
               <div className="absolute top-24 right-4 w-20 h-20 border-2 border-current rounded-full -rotate-12" />
               <div className="absolute bottom-40 left-6 w-14 h-14 border-2 border-current rounded-lg rotate-45" />
               <div className="absolute bottom-20 right-8 w-16 h-16 border-2 border-current rounded-full" />
            </div>
            
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 end-4 p-2 bg-[#0a3b68]/10 hover:bg-[#0a3b68]/20 rounded-full text-[#0a3b68] transition-colors z-20"
              aria-label={t('close_btn')}
            >
              <X size={20} strokeWidth={2.5} />
            </button>

            <div className="relative pt-10 px-6 sm:px-10 pb-8 flex flex-col items-center text-center">
              {/* Logo */}
              <div className="mb-6 relative z-10 mix-blend-multiply">
                 <Image src="/images/logo-portal-mediouna.png" alt="Logo" width={120} height={120} className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md" quality={100} />
              </div>

              {/* Title Pill */}
              <div className="bg-[#dfb22e] rounded-2xl px-6 py-3 mb-6 shadow-inner border border-white/20 relative z-10 w-full max-w-[90%]">
                <h2 
                  className={`text-xl sm:text-2xl font-black text-[#0a3b68] leading-tight ${
                    isArabic(config.title) ? 'font-cairo' : 'font-outfit'
                  }`}
                  dir="auto"
                >
                  {config.title}
                </h2>
              </div>

              {/* Content */}
              <div className="relative z-10 mb-8 space-y-4 max-h-[40vh] overflow-y-auto custom-scrollbar">
                <p 
                  className={`text-[#0a3b68] font-bold text-sm sm:text-base leading-relaxed whitespace-pre-wrap text-balance drop-shadow-sm ${
                    isArabic(config.message) ? 'font-cairo' : 'font-sans'
                  }`}
                  dir="auto"
                >
                  {config.message}
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
                <span className={isArabic(config.message) ? 'font-cairo' : ''}>{t('close_btn')}</span>
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
