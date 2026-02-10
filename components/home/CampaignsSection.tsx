'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Target, Loader2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations, useLocale } from 'next-intl';

interface Campagne {
  id: number;
  titre: string;
  description?: string;
  dateDebut?: string;
  dateFin?: string;
  objectifParticipations?: number;
  nombreParticipations?: number;
  imageCouverture?: string;
  imagePrincipale?: string;
  type?: string;
  statut?: string;
}

const colorVariants = [
  { bg: 'bg-gov-green/10', progress: 'bg-gradient-to-r from-gov-green to-gov-green-light', text: 'text-gov-green', hoverText: 'group-hover:text-gov-green' },
  { bg: 'bg-gov-blue/10', progress: 'bg-gradient-to-r from-gov-blue to-gov-blue-light', text: 'text-gov-blue', hoverText: 'group-hover:text-gov-blue' },
  { bg: 'bg-gov-red/10', progress: 'bg-gradient-to-r from-gov-red to-gov-red-light', text: 'text-gov-red', hoverText: 'group-hover:text-gov-red' },
  { bg: 'bg-gov-gold/10', progress: 'bg-gradient-to-r from-gov-gold to-gov-gold-light', text: 'text-gov-gold-dark', hoverText: 'group-hover:text-gov-gold-dark' },
];

function getDaysRemaining(dateFin?: string): number {
  if (!dateFin) return 0;
  const today = new Date();
  const end = new Date(dateFin);
  const diff = end.getTime() - today.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function CampaignsSection() {
  const t = useTranslations();
  const locale = useLocale();
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCampagnes = async () => {
      try {
        // statut=ACTIVE est le statut correct pour les campagnes en cours
        const response = await fetch('/api/campagnes?limit=4');
        if (response.ok) {
          const json = await response.json();
          // L'API retourne { data: [...], pagination: {...} }
          setCampagnes(Array.isArray(json.data) ? json.data : []);
        }
      } catch (error) {
        console.error('Erreur chargement campagnes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampagnes();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gov-gold mx-auto" />
          <p className="mt-4 text-gray-500">{t('common.chargement')}</p>
        </div>
      </section>
    );
  }

  if (campagnes.length === 0) {
    return (
      <section className="py-20 bg-gradient-to-b from-white to-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('campaigns.no_campaigns')}</h2>
          <p className="text-gray-500">{t('campaigns.subtitle')}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gov-gold/10 text-gov-gold-dark rounded-full text-sm font-medium mb-4">
            <Target className="w-4 h-4" /> {t('campaigns.title')}
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {t('campaigns.subtitle')}
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            {t('hero.slide2_description')}
          </p>
        </motion.div>

        {/* Campaigns Grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {campagnes.map((campagne, index) => {
            const progress = campagne.objectifParticipations ? ((campagne.nombreParticipations || 0) / campagne.objectifParticipations) * 100 : 0;
            const colors = colorVariants[index % colorVariants.length];
            const daysRemaining = getDaysRemaining(campagne.dateFin);
            
            // Image Logic
            const imageUrl = campagne.imageCouverture || campagne.imagePrincipale;

            return (
              <motion.div
                key={campagne.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/campagnes/${campagne.id}`} className="block group">
                  <div className="bg-white rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300">
                    <div className="flex flex-col md:flex-row">
                      {/* Image */}
                      <div className="relative md:w-2/5 h-48 md:h-auto overflow-hidden bg-gray-100">
                        {imageUrl ? (
                          <OptimizedImage
                            src={imageUrl}
                            alt={campagne.titre}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full min-h-[200px] flex items-center justify-center bg-gradient-to-br from-gov-gold/20 to-gov-green/20">
                            <Target className="w-16 h-16 text-gov-gold/50" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/50 to-transparent" />
                        
                        {/* Days remaining badge */}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg">
                          <span className="text-xs font-bold text-gray-900">
                            {daysRemaining > 0 ? `${t('campaigns.deadline')} ${daysRemaining}` : t('campaigns.status_finished')}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 p-6">
                        <h3 className={`font-bold text-gray-900 mb-2 transition-colors ${colors.hoverText} ${locale === 'ar' ? 'text-2xl font-cairo' : 'text-xl'}`}>
                          {campagne.titre}
                        </h3>
                        <p className={`text-gray-600 mb-4 line-clamp-2 ${locale === 'ar' ? 'text-lg' : ''}`}>
                          {campagne.description}
                        </p>

                        {/* Progress */}
                        {campagne.objectifParticipations && (
                          <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm font-medium text-gray-700">{t('campaigns.progress')}</span>
                              <span className={`text-sm font-bold ${colors.text}`}>
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                            <div className={`h-3 rounded-full ${colors.bg} overflow-hidden`} dir="ltr">
                              <motion.div
                                initial={{ width: 0 }}
                                whileInView={{ width: `${progress}%` }}
                                viewport={{ once: true }}
                                transition={{ duration: 1, delay: 0.3 }}
                                className={`h-full rounded-full ${colors.progress}`}
                                role="progressbar"
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                              />
                            </div>
                            <div className="flex justify-between mt-2 text-sm text-gray-500">
                              <span>{(campagne.nombreParticipations || 0).toLocaleString()} {t('campaigns.participants')}</span>
                              <span>{t('campaigns.goal')}: {campagne.objectifParticipations?.toLocaleString()}</span>
                            </div>
                          </div>
                        )}

                        {/* CTA */}
                        <button className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold ${colors.bg} ${colors.text} group-hover:scale-105 transition-transform`}>
                          {t('actions.participer')}
                          <svg className="w-4 h-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* View All Link */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <Link
            href="/campagnes"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-gov-gold to-gov-gold-dark text-white font-semibold rounded-xl shadow-lg shadow-gov-gold/25 hover:shadow-gov-gold/40 hover:scale-105 transition-all"
          >
            {t('campaigns.see_all')}
            <svg className="w-5 h-5 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
