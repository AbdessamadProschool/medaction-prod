'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';

interface LoadingScreenProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'fullscreen';
}

// Animated icons for different sectors
const AnimatedIcons = () => {
  const icons = [
    { icon: '⚙️', delay: 0 },
    { icon: '🏛️', delay: 0.3 },
    { icon: '🤝', delay: 0.6 },
  ];

  return (
    <div className="flex items-center gap-4 mb-8">
      {icons.map((item, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20, scale: 0 }}
          animate={{ 
            opacity: [0, 1, 1, 0],
            y: [20, 0, 0, -20],
            scale: [0.5, 1, 1, 0.5],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            delay: item.delay,
            ease: 'easeInOut',
          }}
          className="text-3xl"
        >
          {item.icon}
        </motion.div>
      ))}
    </div>
  );
};

export default function LoadingScreen({ 
  message, 
  size = 'fullscreen',
}: LoadingScreenProps) {
  const t = useTranslations('loading_screen');
  const defaultMessage = t('default_message');
  const displayMessage = message || defaultMessage;
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const phrases = [
    t('phrases.0'),
    t('phrases.1'),
    t('phrases.2'),
    t('phrases.3')
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phrases.length]);

  if (size !== 'fullscreen') {
    // Compact version for inline use
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.img 
          src="/images/logo-portal-mediouna.png" 
          alt="Portail Mediouna"
          className="w-20 h-20 object-contain rounded-full mb-4"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <p className="text-gray-600 text-sm">{displayMessage}</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[hsl(213,80%,20%)] via-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Subtle background particles - Fixed positions to avoid hydration mismatch */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[
          { left: 10, top: 20, duration: 3.5, delay: 0.5 },
          { left: 25, top: 45, duration: 4.0, delay: 1.0 },
          { left: 40, top: 15, duration: 3.2, delay: 0.2 },
          { left: 55, top: 70, duration: 4.5, delay: 1.5 },
          { left: 70, top: 35, duration: 3.8, delay: 0.8 },
          { left: 85, top: 55, duration: 4.2, delay: 1.2 },
          { left: 15, top: 80, duration: 3.3, delay: 0.3 },
          { left: 30, top: 60, duration: 4.1, delay: 1.1 },
          { left: 50, top: 25, duration: 3.6, delay: 0.6 },
          { left: 65, top: 85, duration: 4.3, delay: 1.3 },
          { left: 80, top: 10, duration: 3.4, delay: 0.4 },
          { left: 95, top: 40, duration: 4.4, delay: 1.4 },
          { left: 5, top: 50, duration: 3.7, delay: 0.7 },
          { left: 45, top: 90, duration: 4.0, delay: 1.0 },
          { left: 75, top: 65, duration: 3.9, delay: 0.9 },
        ].map((p, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[hsl(45,93%,47%)]"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: p.duration,
              repeat: Infinity,
              delay: p.delay,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center">
        
        {/* Central logo - BIGGER */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: 'spring', 
            stiffness: 200, 
            damping: 15,
            delay: 0.2,
          }}
          className="mb-6"
        >
          {/* Logo container - BIGGER SIZE - No glow */}
          <motion.div
            className="relative w-36 h-36 rounded-full bg-gradient-to-br from-[hsl(45,93%,47%)] to-[hsl(45,93%,55%)] flex items-center justify-center shadow-xl"
          >
            <img 
              src="/images/logo-portal-mediouna.png" 
              alt="Portail Mediouna"
              className="w-24 h-24 object-contain rounded-full"
            />
          </motion.div>
        </motion.div>

        {/* Animated sector icons */}
        <AnimatedIcons />

        {/* Brand text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-bold tracking-wider mb-2">
            <span className="text-white">{t('portal_name').split(' ')[0]} </span>
            <span className="text-[hsl(45,93%,47%)]">{t('portal_name').split(' ').slice(1).join(' ')}</span>
          </h1>
          <p className="text-white/50 text-sm">{t('province_name')}</p>
        </motion.div>

        {/* Simple progress bar */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="w-64 mb-6"
        >
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[hsl(45,93%,47%)] to-[hsl(213,80%,50%)]"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
          </div>
        </motion.div>

        {/* Dynamic message */}
        <AnimatePresence mode="wait">
          <motion.p
            key={currentPhrase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="text-white/70 text-center"
          >
            {phrases[currentPhrase]}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Bottom wave decoration - subtle */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden opacity-10">
        <div
          className="absolute bottom-0 left-0 right-0 h-24"
          style={{
            background: 'linear-gradient(180deg, transparent 0%, hsl(45,93%,47%) 100%)',
            clipPath: 'polygon(0 100%, 100% 100%, 100% 60%, 75% 40%, 50% 60%, 25% 40%, 0 60%)',
          }}
        />
      </div>
    </div>
  );
}

// Compact loader for inline use
export function InlineLoader({ message }: { message?: string }) {
  const t = useTranslations('loading_screen');
  const displayMessage = message || t('default_message');
  return (
    <div className="flex items-center justify-center gap-3 p-4">
      <motion.div
        className="flex gap-1"
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-[hsl(45,93%,47%)]"
            animate={{
              y: [-4, 4, -4],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.15,
              ease: 'easeInOut',
            }}
          />
        ))}
      </motion.div>
      <span className="text-gray-600 text-sm">{displayMessage}</span>
    </div>
  );
}

// Skeleton with brand colors
export function BrandSkeleton({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg ${className}`}
      animate={{
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      style={{
        backgroundSize: '200% 100%',
      }}
    />
  );
}
