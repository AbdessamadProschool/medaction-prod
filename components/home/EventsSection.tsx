'use client';

import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Calendar, Loader2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations, useLocale } from 'next-intl';

interface Evenement {
  id: number;
  titre: string;
  dateDebut: string;
  dateFin?: string;
  lieu?: string;
  adresse?: string;
  typeCategorique?: string;
  medias?: { urlPublique: string }[];
}

const categoryColors: Record<string, string> = {
  'Santé': 'bg-gov-red/10 text-gov-red border border-gov-red/20',
  'Culture': 'bg-gov-blue/10 text-gov-blue border border-gov-blue/20',
  'Sport': 'bg-gov-green/10 text-gov-green border border-gov-green/20',
  'Emploi': 'bg-gov-gold/10 text-gov-gold-dark border border-gov-gold/20',
  'Économie': 'bg-gov-gold/10 text-gov-gold-dark border border-gov-gold/20',
  'Environnement': 'bg-gov-green/10 text-gov-green border border-gov-green/20',
  'Éducation': 'bg-gov-blue/10 text-gov-blue border border-gov-blue/20',
  'Développement': 'bg-gray-100 text-gray-700 border border-gray-200',
};

function getDaysUntil(dateStr: string): number {
  const today = new Date();
  const eventDate = new Date(dateStr);
  const diffTime = eventDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Category translation mapping
const categoryTranslations: Record<string, { ar: string; fr: string }> = {
  'EDUCATIF': { ar: 'تعليمي', fr: 'Éducatif' },
  'CULTUREL': { ar: 'ثقافي', fr: 'Culturel' },
  'SPORTIF': { ar: 'رياضي', fr: 'Sportif' },
  'SOCIAL': { ar: 'اجتماعي', fr: 'Social' },
  'SANTE': { ar: 'صحة', fr: 'Santé' },
  'ENVIRONNEMENT': { ar: 'بيئة', fr: 'Environnement' },
  'ECONOMIE': { ar: 'اقتصاد', fr: 'Économie' },
};

export default function EventsSection() {
  const t = useTranslations();
  const locale = useLocale();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [evenements, setEvenements] = useState<Evenement[]>([]);
  const [loading, setLoading] = useState(true);

  // Date formatting functions that use locale
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: 'numeric',
      month: 'short',
    });
  };

  const formatHeure = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // Translate category
  const translateCategory = (category: string | undefined): string => {
    if (!category) return locale === 'ar' ? 'فعالية' : 'Événement';
    const trans = categoryTranslations[category];
    return trans ? trans[locale as 'ar' | 'fr'] : category;
  };

  // Countdown text
  const getCountdownText = (daysUntil: number): string => {
    if (daysUntil > 0) return locale === 'ar' ? `بعد ${daysUntil} يوم` : `J-${daysUntil}`;
    if (daysUntil === 0) return locale === 'ar' ? 'اليوم' : "Aujourd'hui";
    return locale === 'ar' ? 'انتهى' : 'Passé';
  };

  // Récupérer les événements depuis l'API
  useEffect(() => {
    const fetchEvenements = async () => {
      try {
        // Récupérer tous les événements publiés (triés par date)
        const response = await fetch('/api/evenements?limit=10');
        if (response.ok) {
          const json = await response.json();
          // L'API retourne { data: [...], pagination: {...} }
          setEvenements(Array.isArray(json.data) ? json.data : []);
        }
      } catch (error) {
        console.error('Erreur chargement événements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvenements();
  }, []);

  // Auto-scroll infini
  useEffect(() => {
    const container = scrollRef.current;
    if (!container || isPaused || evenements.length === 0) return;

    let animationId: number;
    let scrollPos = container.scrollLeft;

    const scroll = () => {
      // Avec dir="ltr" forcé sur le conteneur, on défile toujours vers la droite (+=)
      scrollPos += 0.5;
      if (scrollPos >= container.scrollWidth / 2) {
        scrollPos = 0;
      }
      container.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(scroll);
    };

    animationId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animationId);
  }, [isPaused, evenements]);

  // Dupliquer les événements pour l'effet infini
  const duplicatedEvents = [...evenements, ...evenements];

  if (loading) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gov-blue mx-auto" />
          <p className="mt-4 text-gray-500">{t('common.chargement')}</p>
        </div>
      </section>
    );
  }

  if (evenements.length === 0) {
    return (
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('events.no_events')}</h2>
          <p className="text-gray-500">{t('events.subtitle')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gov-blue/10 text-gov-blue rounded-full text-sm font-medium mb-4 border border-gov-blue/20">
              <Calendar className="w-4 h-4" /> {t('nav.evenements')}
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
              {t('events.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('events.subtitle')}
            </p>
          </div>
          <Link
            href="/evenements"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gray-50 text-gray-700 font-semibold rounded-xl hover:bg-gray-100 hover:text-gov-blue transition-all group border border-gray-200"
          >
            {t('events.see_all')}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>

      {/* Carousel Container */}
      <div
        ref={scrollRef}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="flex gap-6 overflow-x-scroll cursor-grab active:cursor-grabbing scrollbar-hide"
        style={{ 
          paddingLeft: 'max(1rem, calc((100vw - 1280px) / 2 + 1rem))',
          paddingRight: '1rem',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          direction: 'ltr' // Force LTR for consistent scrolling behavior
        }}
        dir="ltr"
      >
        {duplicatedEvents.map((event, index) => {
          const daysUntil = getDaysUntil(event.dateDebut);
          const categoryColor = categoryColors[event.typeCategorique || ''] || 'bg-gray-100 text-gray-700 border border-gray-200';
          // Vérifier l'URL de l'image
          let imageUrl = event.medias?.[0]?.urlPublique;
          if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('/')) {
            imageUrl = `/${imageUrl}`;
          }
          const hasImage = !!imageUrl;
          
          return (
            <motion.div
              key={`${event.id}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="flex-shrink-0 w-80 md:w-96"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              <Link href={`/evenements/${event.id}`} className="block group">
                <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gov-blue/10 hover:-translate-y-2 transition-all duration-300">
                  {/* Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100">
                    {hasImage && imageUrl ? (
                      <OptimizedImage
                        src={imageUrl}
                        alt={event.titre}
                        fill
                        type="evenement"
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className={`absolute inset-0 flex flex-col items-center justify-center ${
                        event.typeCategorique === 'CULTUREL' ? 'bg-gradient-to-br from-purple-500 to-pink-600' :
                        event.typeCategorique === 'SPORTIF' ? 'bg-gradient-to-br from-emerald-500 to-teal-600' :
                        event.typeCategorique === 'EDUCATIF' ? 'bg-gradient-to-br from-blue-500 to-indigo-600' :
                        event.typeCategorique === 'SOCIAL' ? 'bg-gradient-to-br from-orange-500 to-amber-600' :
                        event.typeCategorique === 'SANTE' ? 'bg-gradient-to-br from-red-500 to-rose-600' :
                        'bg-gradient-to-br from-gray-500 to-slate-600'
                      }`}>
                        <Calendar className="w-12 h-12 text-white/80 mb-2" />
                        <span className={`text-white/90 font-semibold text-sm ${locale === 'ar' ? '' : 'uppercase tracking-wide'}`}>
                          {translateCategory(event.typeCategorique)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Badge catégorie */}
                    {event.typeCategorique && (
                      <span className={`absolute top-4 ${locale === 'ar' ? 'right-4' : 'left-4'} px-3 py-1 rounded-full text-xs font-semibold ${categoryColor}`}>
                        {translateCategory(event.typeCategorique)}
                      </span>
                    )}
                    
                    {/* Countdown */}
                    <div className={`absolute bottom-4 ${locale === 'ar' ? 'left-4' : 'right-4'} bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg`}>
                      <span className="text-sm font-bold text-gray-900">
                        {getCountdownText(daysUntil)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className={`font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-emerald-600 transition-colors ${locale === 'ar' ? 'text-xl font-cairo leading-relaxed' : 'text-lg'}`}>
                      {event.titre}
                    </h3>
                    
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(event.dateDebut)} à {formatHeure(event.dateDebut)}</span>
                      </div>
                      {event.lieu && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="line-clamp-1">{event.lieu}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
