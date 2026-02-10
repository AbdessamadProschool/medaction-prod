'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Newspaper, Loader2 } from 'lucide-react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations, useLocale } from 'next-intl';

interface Actualite {
  id: number;
  titre: string;
  description?: string;
  contenu?: string;
  medias?: { urlPublique: string }[];
  categorie?: string;
  datePublication?: string;
  createdAt?: string;
}

const categoryColors: Record<string, string> = {
  'Santé': 'bg-gov-red/10 text-gov-red border border-gov-red/20',
  'Infrastructure': 'bg-gray-100 text-gray-700 border border-gray-200',
  'Éducation': 'bg-gov-blue/10 text-gov-blue border border-gov-blue/20',
  'Économie': 'bg-gov-gold/10 text-gov-gold-dark border border-gov-gold/20',
  'Environnement': 'bg-gov-green/10 text-gov-green border border-gov-green/20',
  'Social': 'bg-purple-100 text-purple-700 border border-purple-200',
  'Culture': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  'Transport': 'bg-orange-100 text-orange-700 border border-orange-200',
  'Sport': 'bg-green-100 text-green-700 border border-green-200',
};

function formatDate(dateStr?: string, locale: string = 'fr'): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function estimateReadTime(contenu?: string): string {
  if (!contenu) return '2';
  const words = contenu.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes.toString();
}

// Mapping des catégories reçues de l'API vers les clés de traduction
const categoryKeys: Record<string, string> = {
  'Santé': 'SANTE',
  'Infrastructure': 'TRAVAUX',
  'Éducation': 'EDUCATION',
  'Économie': 'ECONOMIE',
  'Environnement': 'ECOLOGIE',
  'Social': 'SOLIDARITE',
  'Culture': 'CULTURE',
  'Transport': 'TRANSPORT',
  'Sport': 'SPORT',
  'Partenariat': 'PARTENARIAT',
  'Success Story': 'SUCCESS_STORY',
  'Annonce': 'ANNONCE',
};

// Couleurs par défaut pour les clés en majuscules (codes API)
const categoryColorsMap: Record<string, string> = {
  'SANTE': 'bg-gov-red/10 text-gov-red border border-gov-red/20',
  'TRAVAUX': 'bg-gray-100 text-gray-700 border border-gray-200',
  'EDUCATION': 'bg-gov-blue/10 text-gov-blue border border-gov-blue/20',
  'ECONOMIE': 'bg-gov-gold/10 text-gov-gold-dark border border-gov-gold/20',
  'ECOLOGIE': 'bg-gov-green/10 text-gov-green border border-gov-green/20',
  'SOLIDARITE': 'bg-purple-100 text-purple-700 border border-purple-200',
  'CULTURE': 'bg-indigo-100 text-indigo-700 border border-indigo-200',
  'TRANSPORT': 'bg-orange-100 text-orange-700 border border-orange-200',
  'SPORT': 'bg-green-100 text-green-700 border border-green-200',
  'PARTENARIAT': 'bg-blue-100 text-blue-700 border border-blue-200',
  'SUCCESS_STORY': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  'ANNONCE': 'bg-gray-100 text-gray-800 border border-gray-200',
};

export default function NewsSection() {
  const t = useTranslations();
  const locale = useLocale();
  const [actualites, setActualites] = useState<Actualite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActualites = async () => {
      try {
        const response = await fetch('/api/actualites?limit=6&isPublie=true');
        if (response.ok) {
          const json = await response.json();
          // L'API retourne { data: [...], pagination: {...} }
          setActualites(Array.isArray(json.data) ? json.data : []);
        }
      } catch (error) {
        console.error('Erreur chargement actualités:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActualites();
  }, []);

  if (loading) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-gov-blue mx-auto" />
          <p className="mt-4 text-gray-500">{t('common.chargement')}</p>
        </div>
      </section>
    );
  }

  if (actualites.length === 0) {
    return (
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Newspaper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('news.no_news')}</h2>
          <p className="text-gray-500">{t('news.subtitle')}</p>
        </div>
      </section>
    );
  }

  const featuredNews = actualites[0];
  const otherNews = actualites.slice(1, 4);
  const moreNews = actualites.slice(4);

  const translateCategory = (cat?: string) => {
    if (!cat) return '';
    // 1. Essayer la clé directe (ex: SUCCESS_STORY)
    let key = cat;
    // 2. Si c'est un nom français connu, utiliser le mapping
    if (categoryKeys[cat]) {
      key = categoryKeys[cat];
    }
    // 3. Fallback: mettre en majuscules
    if (!categoryKeys[cat] && !categoryColorsMap[cat]) {
       key = cat.toUpperCase().replace(/\s+/g, '_');
    }
    
    // Tenter de traduire, sinon retourner la chaîne originale ou la clé formattée
    try {
      const translated = t(`campaigns.types.${key}`);
      return translated === `campaigns.types.${key}` ? cat : translated;
    } catch {
      return cat;
    }
  };

  const getCategoryColor = (cat?: string) => {
      if (!cat) return 'bg-gray-100 text-gray-700';
      // Essayer mapping direct
      if (categoryColors[cat]) return categoryColors[cat];
      // Essayer via la clé
      const key = categoryKeys[cat] || cat.toUpperCase().replace(/\s+/g, '_');
      return categoryColorsMap[key] || 'bg-gray-100 text-gray-700 border border-gray-200';
  };

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-12"
        >
          <div>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gov-blue/10 text-gov-blue rounded-full text-sm font-medium mb-4 border border-gov-blue/20">
              <Newspaper className="w-4 h-4" /> {t('footer.actualites')}
            </span>
            <h2 className="text-3xl md:text-4xl font-semibold text-gray-900 mb-2">
              {t('news.title')}
            </h2>
            <p className="text-lg text-gray-600">
              {t('news.subtitle')}
            </p>
          </div>
          <Link
            href="/actualites"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 hover:border-gov-blue/50 hover:text-gov-blue transition-all group shadow-sm"
          >
            {t('news.see_all')}
            <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 mb-8">
          {/* Featured Article */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:row-span-2 h-full"
          >
            <Link href={`/actualites/${featuredNews.id}`} className="block group h-full">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-full hover:shadow-md transition-all duration-300">
                <div className="relative h-full min-h-[400px] overflow-hidden bg-gray-100">
                  {featuredNews.medias?.[0]?.urlPublique ? (
                    <OptimizedImage
                      src={featuredNews.medias[0].urlPublique}
                      alt={featuredNews.titre}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gov-blue/20 to-gov-green/20">
                      <Newspaper className="w-20 h-20 text-gov-blue/50" />
                    </div>
                  )}
                  {/* Stronger gradient overlay covering more height */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-90" />
                  
                    {featuredNews.categorie && (
                    <div className="absolute top-4 left-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-lg ${getCategoryColor(featuredNews.categorie)}`}>
                        {translateCategory(featuredNews.categorie)}
                      </span>
                    </div>
                  )}

                  <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-black/80 to-transparent">
                    <h3 className={`font-bold mb-3 text-white group-hover:text-gov-green-light transition-colors drop-shadow-xl ${locale === 'ar' ? 'text-3xl lg:text-4xl leading-snug font-cairo' : 'text-2xl lg:text-3xl leading-tight'}`} style={{ textShadow: '0 2px 10px rgba(0,0,0,0.9)' }}>
                      {featuredNews.titre}
                    </h3>
                    <p className={`text-gray-100 mb-4 line-clamp-2 drop-shadow-lg font-medium ${locale === 'ar' ? 'text-lg leading-relaxed' : ''}`} style={{ textShadow: '0 1px 5px rgba(0,0,0,0.8)' }}>
                      {featuredNews.description || featuredNews.contenu?.substring(0, 150)}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-200 font-medium" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
                      <span>{formatDate(featuredNews.datePublication || featuredNews.createdAt, locale)}</span>
                      <span>•</span>
                      <span>{estimateReadTime(featuredNews.contenu)} {t('news.min_read')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Other Articles */}
          <div className="space-y-6">
            {otherNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/actualites/${news.id}`} className="block group">
                  <div className="bg-white rounded-xl shadow-md shadow-gray-200/50 border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300">
                    <div className="flex">
                      <div className="flex-shrink-0 w-32 h-32 md:w-40 md:h-40 overflow-hidden bg-gray-100 relative">
                        {news.medias?.[0]?.urlPublique ? (
                          <OptimizedImage
                            src={news.medias[0].urlPublique}
                            alt={news.titre}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gov-blue/10 to-gov-green/10">
                            <Newspaper className="w-8 h-8 text-gov-blue/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 p-4 md:p-5">
                        {news.categorie && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-2 ${getCategoryColor(news.categorie)}`}>
                            {translateCategory(news.categorie)}
                          </span>
                        )}
                        <h3 className={`font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gov-blue transition-colors ${locale === 'ar' ? 'text-lg leading-relaxed' : ''}`}>
                          {news.titre}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-gray-500">
                          <span>{formatDate(news.datePublication || news.createdAt, locale)}</span>
                          <span>•</span>
                          <span>{estimateReadTime(news.contenu)} {t('news.min_read')}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        {/* More News Grid */}
        {moreNews.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {moreNews.map((news, index) => (
              <motion.div
                key={news.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <Link href={`/actualites/${news.id}`} className="block group">
                  <div className="bg-white rounded-xl shadow-md shadow-gray-200/50 border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    {news.categorie && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold mb-3 ${getCategoryColor(news.categorie)}`}>
                        {translateCategory(news.categorie)}
                      </span>
                    )}
                    <h3 className="font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-gov-blue transition-colors">
                      {news.titre}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {news.description || news.contenu?.substring(0, 100)}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{formatDate(news.datePublication || news.createdAt, locale)}</span>
                      <span>•</span>
                      <span>{estimateReadTime(news.contenu)} {t('news.min_read')}</span>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
