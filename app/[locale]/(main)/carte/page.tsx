'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useState, useEffect, useRef, useCallback } from 'react';

// Dynamically import map to avoid window is not defined error
const InteractiveMap = dynamic(() => import('@/components/maps/InteractiveMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
    </div>
  ),
});

export default function CartePage() {
  const t = useTranslations('map_page');
  const [mapKey, setMapKey] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    // Attendre que le DOM soit prêt avant de monter la carte
    if (!mountedRef.current) {
      mountedRef.current = true;
      // Petit délai pour s'assurer que le conteneur est prêt
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  // Fonction pour réessayer en cas d'erreur
  const handleRetry = useCallback(() => {
    setIsReady(false);
    setMapKey(prev => prev + 1);
    setTimeout(() => setIsReady(true), 100);
  }, []);

  return (
    <main className="relative w-full h-[calc(100vh-120px)] overflow-hidden bg-slate-100">
      <div className="w-full h-full relative z-0">
        {isReady && (
          <InteractiveMap 
            key={`map-instance-${mapKey}`}
            height="h-full" 
            mode="PUBLIC" 
          />
        )}
      </div>

       {/* Overlay discret pour titre mobile ou info */}
       <motion.div 
         initial={{ opacity: 0, y: -20 }}
         animate={{ opacity: 1, y: 0 }}
         className="absolute top-20 left-1/2 -translate-x-1/2 z-10 pointer-events-none md:hidden"
       >
         <span className="bg-white/90 backdrop-blur-md px-4 py-1.5 rounded-full text-xs font-bold text-gray-600 shadow-sm border border-white/20">
           {t('title')}
         </span>
       </motion.div>
    </main>
  );
}

