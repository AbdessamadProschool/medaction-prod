'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface PageLoaderProps {
  message?: string;
  variant?: 'default' | 'minimal' | 'card' | 'fullscreen';
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

export default function PageLoader({ 
  message = 'Chargement en cours...', 
  variant = 'default' 
}: PageLoaderProps) {
  const [currentPhrase, setCurrentPhrase] = useState(0);
  const phrases = [
    'Préparation de votre espace...',
    'Chargement des données...',
    'Connexion aux services...',
    'Presque prêt...',
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhrase((prev) => (prev + 1) % phrases.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [phrases.length]);

  // Minimal variant - inline loader
  if (variant === 'minimal') {
    return (
      <div className="flex items-center justify-center py-12">
        <motion.div className="flex items-center gap-3">
          <div className="relative w-12 h-12">
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-t-[hsl(45,93%,47%)] border-r-[hsl(213,80%,28%)] border-b-transparent border-l-transparent"
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            />
            <div className="absolute inset-2 bg-gradient-to-br from-[hsl(213,80%,28%)] to-[hsl(213,80%,40%)] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-sm">M</span>
            </div>
          </div>
          <span className="text-gray-600 text-sm font-medium">{message}</span>
        </motion.div>
      </div>
    );
  }

  // Card variant
  if (variant === 'card') {
    return (
      <motion.div
        className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            className="absolute inset-0 bg-[hsl(213,80%,28%)]/10 rounded-full"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              border: '3px solid transparent',
              borderTopColor: 'hsl(45,93%,47%)',
              borderRightColor: 'hsl(213,80%,28%)',
            }}
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          />
          <div className="absolute inset-3 bg-gradient-to-br from-[hsl(45,93%,47%)] to-[hsl(45,93%,55%)] rounded-full flex items-center justify-center shadow-lg">
            <img 
              src="/images/logo-portal-mediouna.png" 
              alt="Logo"
              className="w-10 h-10 object-contain rounded-full"
            />
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{message}</h3>
        <div className="flex items-center justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-[hsl(45,93%,47%)]"
              animate={{
                y: [-3, 3, -3],
                opacity: [0.4, 1, 0.4],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  // Default & Fullscreen variant - same unified style
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-[hsl(213,80%,20%)] via-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] flex flex-col items-center justify-center overflow-hidden">
      
      {/* Subtle background particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-[hsl(45,93%,47%)]"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
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
            <span className="text-white">PORTAIL </span>
            <span className="text-[hsl(45,93%,47%)]">MEDIOUNA</span>
          </h1>
          <p className="text-white/50 text-sm">Province de Médiouna</p>
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
