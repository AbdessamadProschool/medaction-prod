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
  // Simplification: le composant InteractiveMap gère maintenant son propre état de montage
  useEffect(() => {
    // Si nécessaire, on peut ajouter une logique ici
  }, []);

  return (
    <main className="fixed inset-0 top-[112px] bottom-0 z-0 bg-slate-100">
      <div className="w-full h-full relative">
        <InteractiveMap 
          key={`map-instance-${mapKey}`}
          height="h-full" 
          mode="PUBLIC" 
        />
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

