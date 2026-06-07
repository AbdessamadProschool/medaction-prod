'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { X, ChevronRight, ChevronLeft, Calendar, Building2, Megaphone, Users, LayoutDashboard, Flag, MapPin, CheckCircle2 } from 'lucide-react';
import Image from 'next/image';

const STEPS_DATA = [
  {
    id: 'home',
    image: '/images/guide/home.png',
    icon: LayoutDashboard,
  },
  {
    id: 'reclamation',
    image: '/images/guide/reclamation.png',
    icon: Flag,
  },
  {
    id: 'news',
    image: '/images/guide/news.png',
    icon: Megaphone,
  },
  {
    id: 'map',
    image: '/images/guide/map.png',
    icon: MapPin,
  },
  {
    id: 'participation',
    image: '/images/guide/participation.png',
    icon: Users,
  }
];

export default function UserGuideModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mounted, setMounted] = useState(false);
  const t = useTranslations('guide');

  useEffect(() => {
    setMounted(true);
    // Optional: trigger guide based on some state or event listener
    const handleOpenGuide = () => {
      setCurrentStep(0);
      setIsOpen(true);
    };
    
    window.addEventListener('open-user-guide', handleOpenGuide);
    return () => window.removeEventListener('open-user-guide', handleOpenGuide);
  }, []);

  const handleClose = () => setIsOpen(false);
  
  const handleNext = () => {
    if (currentStep < STEPS_DATA.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  if (!mounted) return null;

  const currentStepData = STEPS_DATA[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <>
      {/* Floating Action Button Trigger */}
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 2, duration: 0.5 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 end-6 z-[90] w-14 h-14 bg-gradient-to-br from-[#ebd281] to-[#d4b962] rounded-full shadow-2xl flex items-center justify-center text-[#0a3b68] hover:scale-110 transition-transform ring-4 ring-white/50 group"
        aria-label="Guide Utilisateur"
      >
        <div className="absolute inset-0 rounded-full animate-ping bg-[#ebd281] opacity-20"></div>
        <span className="text-2xl font-black italic">?</span>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={handleClose}
            />

            {/* Modal */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="relative bg-[#ebd281] rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden border-4 border-white/20 flex flex-col md:flex-row min-h-[500px]"
            >
              {/* Decorative Icons Background */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-10 text-[#0a3b68]">
                 <Calendar className="absolute top-10 left-10 w-24 h-24" strokeWidth={1} />
                 <Building2 className="absolute bottom-10 right-10 w-32 h-32" strokeWidth={1} />
              </div>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 end-4 p-2 bg-[#0a3b68]/10 hover:bg-[#0a3b68]/20 rounded-full text-[#0a3b68] transition-colors z-20"
                aria-label="Fermer"
              >
                <X size={20} strokeWidth={2.5} />
              </button>

              {/* Left Side: Mockup Image */}
              <div className="w-full md:w-1/2 bg-[#0a3b68] relative flex items-center justify-center p-8 overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0a3b68] to-[#05213b] opacity-90 z-0"></div>
                
                {/* Image transition container */}
                <div className="relative w-full aspect-[4/3] rounded-2xl shadow-2xl overflow-hidden ring-4 ring-white/10 z-10">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, x: 20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: -20, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="absolute inset-0"
                    >
                      <Image 
                        src={currentStepData.image} 
                        alt="Screenshot" 
                        fill 
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 50vw"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Right Side: Content */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col relative z-10">
                {/* Progress Indicators */}
                <div className="flex gap-2 mb-8">
                  {STEPS_DATA.map((_, idx) => (
                    <div 
                      key={idx} 
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === currentStep ? 'w-8 bg-[#0a3b68]' : 'w-4 bg-[#0a3b68]/20'
                      }`}
                    />
                  ))}
                </div>

                <div className="flex-1">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentStep}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-[#0a3b68]/10 rounded-xl mb-6 text-[#0a3b68]">
                        <StepIcon size={24} strokeWidth={2} />
                      </div>
                      
                      <h2 className="text-2xl font-black text-[#0a3b68] uppercase tracking-tight mb-4">
                        {t(`steps.${currentStepData.id}.title`)}
                      </h2>
                      
                      <p className="text-[#0a3b68]/80 font-bold leading-relaxed text-lg text-balance">
                        {t(`steps.${currentStepData.id}.description`)}
                      </p>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between mt-8 pt-6 border-t border-[#0a3b68]/10">
                  <button
                    onClick={handleClose}
                    className="text-[#0a3b68]/60 hover:text-[#0a3b68] font-bold text-sm uppercase tracking-wider transition-colors"
                  >
                    {t('skip')}
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handlePrev}
                      disabled={currentStep === 0}
                      className={`p-3 rounded-xl transition-all ${
                        currentStep === 0 
                          ? 'opacity-30 cursor-not-allowed' 
                          : 'hover:bg-[#0a3b68]/10 text-[#0a3b68]'
                      }`}
                    >
                      <ChevronLeft size={24} className="rtl:rotate-180" />
                    </button>
                    
                    <button
                      onClick={handleNext}
                      className="px-8 py-3 bg-[#0a3b68] hover:bg-[#072a4c] text-white rounded-xl font-bold uppercase tracking-wide shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
                    >
                      {currentStep === STEPS_DATA.length - 1 ? t('finish') : t('next')}
                      {currentStep < STEPS_DATA.length - 1 && (
                        <ChevronRight size={20} className="rtl:rotate-180" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
