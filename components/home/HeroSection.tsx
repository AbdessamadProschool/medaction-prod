'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations, useLocale } from 'next-intl';

export default function HeroSection() {
  const t = useTranslations();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  // Slides with translations
  const slides = [
    {
      id: 0,
      title: t('hero.slide1_title'),
      subtitle: t('hero.slide1_subtitle'),
      description: t('hero.slide1_description'),
      image: '/images/siege-province.jpg',
      gradient: 'from-gov-blue-dark/90 via-gov-blue/70 to-transparent',
    },
    {
      id: 1,
      title: t('hero.slide2_title'),
      subtitle: t('hero.slide2_subtitle'),
      description: t('hero.slide2_description'),
      image: '/images/hero-province-mediouna.jpg',
      gradient: 'from-gov-blue-dark/90 via-gov-blue/70 to-transparent',
    },
    {
      id: 2,
      title: t('hero.slide3_title'),
      subtitle: t('hero.slide3_subtitle'),
      description: t('hero.slide3_description'),
      image: '/images/services-publics-mediouna.jpg',
      gradient: 'from-gov-blue-dark/95 via-gov-blue/70 to-transparent',
    },
    {
      id: 3,
      title: t('hero.slide4_title'),
      subtitle: t('hero.slide4_subtitle'),
      description: t('hero.slide4_description'),
      image: '/images/vie-locale-mediouna.jpg',
      gradient: 'from-gov-gold-dark/90 via-gov-gold/60 to-transparent',
    },
  ];

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, [slides.length]);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Auto-play carousel
  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(nextSlide, 6000);
    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  const isAr = useLocale() === 'ar';

  return (
    <section className="relative h-screen w-full overflow-hidden" dir="ltr">
      {/* Background Slides */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0"
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slides[currentSlide].image})` }}
          />
          <div className={`absolute inset-0 bg-gradient-to-r ${slides[currentSlide].gradient}`} />
          <div className="absolute inset-0 bg-black/20" />
        </motion.div>
      </AnimatePresence>

      {/* Bande tricolore en haut */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-gov-red via-gov-gold to-gov-green z-20" />

      {/* Motif géométrique marocain Premium */}
      <div 
        className="absolute inset-0 opacity-10 pointer-events-none mix-blend-overlay bg-center bg-no-repeat bg-cover" 
        style={{
          backgroundImage: `url("/images/pattern-maroc.png")`,
        }} 
      />

      {/* Content */}
      <div className="relative z-10 h-full flex items-center" dir={isAr ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              {/* Badge gouvernemental */}
              <motion.div
                initial={{ opacity: 0, x: isAr ? 20 : -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-3 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-gov-gold/50 mb-8"
              >
                <Image 
                  src="/images/logo-province.png" 
                  alt="Logo Province Mediouna" 
                  width={32}
                  height={32}
                  className="rounded-full bg-white p-0.5"
                />
                <span className={`text-white font-semibold tracking-wide ${isAr ? 'text-base font-bold' : 'text-sm'}`}>
                  {t('hero.badge')}
                </span>
                <span className="w-2 h-2 bg-gov-gold rounded-full animate-pulse shadow-[0_0_10px_#fbbf24]" />
              </motion.div>

              {/* Subtitle */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className={`text-gov-gold-light font-medium mb-4 tracking-wide ${
                  isAr ? 'text-xl md:text-2xl font-bold leading-relaxed' : 'text-lg md:text-xl'
                }`}
              >
                {slides[currentSlide].subtitle}
              </motion.p>

              {/* Title */}
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className={`font-bold text-white mb-6 leading-tight drop-shadow-lg ${
                  isAr 
                    ? 'text-5xl md:text-7xl lg:text-8xl leading-snug font-cairo' 
                    : 'text-4xl md:text-6xl lg:text-7xl'
                }`}
              >
                {slides[currentSlide].title}
              </motion.h1>

              {/* Description */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className={`text-white/90 mb-10 max-w-2xl drop-shadow-md ${
                  isAr ? 'text-xl md:text-2xl leading-loose font-medium' : 'text-lg md:text-xl leading-relaxed'
                }`}
              >
                {slides[currentSlide].description}
              </motion.p>

              {/* CTA Buttons - Gouvernemental */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-5"
              >
                <Link
                  href="/reclamations/nouvelle"
                  className="group relative overflow-hidden inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-gov-gold-dark to-gov-gold text-white font-bold rounded-xl shadow-lg shadow-gov-gold/20 hover:shadow-gov-gold/40 hover:-translate-y-1 transition-all duration-300"
                >
                  <span className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  <span className={`relative ${isAr ? 'text-lg' : ''}`}>{t('actions.soumettre_reclamation')}</span>
                  <svg className="w-5 h-5 relative group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
                <Link
                  href="/etablissements"
                  className="group inline-flex items-center gap-3 px-8 py-4 bg-white/10 backdrop-blur-md text-white font-semibold rounded-xl border border-white/30 hover:bg-white/20 hover:border-gov-gold/50 hover:-translate-y-1 transition-all duration-300"
                >
                  <span className={isAr ? 'text-lg' : ''}>{t('actions.explorer')}</span>
                  <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-gov-gold group-hover:text-white transition-colors">
                     <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </div>
                </Link>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation Arrows - styled gouvernemental */}
      <button
        onClick={prevSlide}
        className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 hidden md:flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-gov-gold hover:border-gov-gold hover:scale-110 transition-all duration-300 group"
        aria-label="Slide précédent"
      >
        <svg className="w-6 h-6 group-hover:-translate-x-1 transition-transform rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-14 h-14 hidden md:flex items-center justify-center bg-white/10 backdrop-blur-md rounded-full border border-white/20 text-white hover:bg-gov-gold hover:border-gov-gold hover:scale-110 transition-all duration-300 group"
        aria-label="Slide suivant"
      >
        <svg className="w-6 h-6 group-hover:translate-x-1 transition-transform rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Slide Indicators - styled gouvernemental */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-500 rounded-full ${
              index === currentSlide
                ? 'w-16 h-2 bg-gov-gold shadow-[0_0_15px_#fbbf24]'
                : 'w-2 h-2 bg-white/40 hover:bg-white/80 hover:scale-150'
            }`}
            aria-label={`Aller au slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Scroll Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 right-8 z-20 hidden md:flex flex-col items-center gap-3"
      >
        <span className="text-white/60 text-xs font-bold uppercase tracking-widest rotate-90 origin-center translate-x-3 translate-y-3">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-5 h-9 border-2 border-white/20 rounded-full flex items-start justify-center p-1 backdrop-blur-sm"
        >
          <div className="w-1 h-2 bg-gov-gold rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  );
}
