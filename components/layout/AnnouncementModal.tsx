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
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-[hsl(45,93%,47%)]/30"
          >
            {/* Ruban décoratif */}
            <div className="h-3 bg-gradient-to-r from-gov-red via-gov-gold to-gov-green shadow-sm" />
            
            {/* Pattern de fond riche */}
            <div 
                className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-multiply" 
                style={{
                  backgroundImage: `url("/images/pattern-maroc.png")`,
                  backgroundSize: '120px'
                }} 
            />

            {/* Bouton fermeture */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-20 bg-white/50 hover:bg-red-50"
            >
              <X size={24} />
            </button>

            <div className="p-8 pt-10 text-center relative z-10">
              
              {/* Logo avec halo */}
              <motion.div 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="relative inline-block mb-6"
              >
                 <div className="absolute inset-0 bg-gov-gold/20 blur-xl rounded-full" />
                 <div className="relative w-24 h-24 bg-white rounded-2xl shadow-xl flex items-center justify-center p-4 border border-gray-50 mx-auto transform hover:scale-105 transition-transform duration-300">
                    <Image
                      src="/images/logo-portal-mediouna.png"
                      alt="Portail Mediouna"
                      width={80}
                      height={80}
                      className="object-contain"
                    />
                 </div>
              </motion.div>

              {/* Titre */}
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className={`text-2xl font-bold text-gray-900 mb-4 leading-tight ${
                    isArabic(config.title) ? 'font-cairo' : 'font-outfit'
                }`}
                dir="auto"
              >
                {config.title}
              </motion.h2>

              {/* Séparateur élégant */}
              <div className="w-16 h-1 bg-gov-gold/40 mx-auto rounded-full mb-6" />

              {/* Message */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className={`prose prose-sm mx-auto text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap ${
                    isArabic(config.message) ? 'font-cairo text-lg' : ''
                }`}
                dir="auto"
              >
                {config.message}
              </motion.div>

              {/* Actions */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <button
                  onClick={handleClose}
                  className="px-10 py-3.5 bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] text-white font-semibold rounded-xl shadow-lg shadow-blue-900/20 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 min-w-[160px]"
                >
                  <span className={isArabic(config.message) ? 'font-cairo' : ''}>
                    {t('close_btn')}
                  </span>
                </button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
