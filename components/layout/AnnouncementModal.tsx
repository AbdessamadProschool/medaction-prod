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
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-all duration-300"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="relative w-full max-w-lg bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20 ring-1 ring-black/5"
          >
            {/* Ruban décoratif supérieur */}
            <div className="h-1.5 w-full bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />

            {/* Pattern de fond subtil */}
            <div 
              className="absolute inset-0 opacity-[0.03] pointer-events-none"
              style={{
                backgroundImage: `url("/images/pattern-maroc.png")`, // Assurez-vous que cette image existe
                backgroundSize: '100px'
              }}
            />

            {/* Bouton fermeture */}
            <button 
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-20"
              aria-label={t('close_btn')}
            >
              <X size={20} />
            </button>

            <div className="p-8 pt-10 text-center relative z-10 flex flex-col items-center">
              
              {/* Logo avec ombre portée douce */}
              <div className="mb-6 relative">
                 <div className="absolute inset-0 bg-[hsl(45,93%,47%)]/20 blur-xl rounded-full" />
                 <div className="relative w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center p-3 ring-1 ring-gray-100">
                    <Image
                      src="/images/logo-portal-mediouna.png"
                      alt="Portail Mediouna"
                      width={64}
                      height={64}
                      className="object-contain"
                    />
                 </div>
              </div>

              {/* Titre */}
              <h2 
                className={`text-2xl font-bold text-[hsl(213,80%,20%)] mb-4 leading-snug ${
                    isArabic(config.title) ? 'font-cairo' : 'font-outfit'
                }`}
                dir="auto"
              >
                {config.title}
              </h2>

              {/* Message */}
              <div 
                className={`prose prose-sm max-w-none text-gray-600 mb-8 leading-relaxed whitespace-pre-wrap ${
                    isArabic(config.message) ? 'font-cairo text-base' : 'font-sans'
                }`}
                dir="auto"
              >
                {config.message}
              </div>

              {/* Actions */}
              <button
                onClick={handleClose}
                className="w-full sm:w-auto px-8 py-3 bg-[hsl(213,80%,28%)] text-white font-medium rounded-xl shadow-lg shadow-[hsl(213,80%,28%)]/20 hover:bg-[hsl(213,80%,20%)] hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-md transition-all duration-200"
              >
                <span className={isArabic(config.message) ? 'font-cairo' : ''}>
                  {t('close_btn')}
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
