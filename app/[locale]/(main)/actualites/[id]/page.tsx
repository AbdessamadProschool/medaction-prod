'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { Link } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { useTranslations, useLocale } from 'next-intl';
import { 
  ArrowLeft, Calendar, Clock, Eye, Share2, Heart, CheckCircle, 
  ChevronLeft, ChevronRight, X, User, MapPin, Tag, Building2 
} from 'lucide-react';
import { toast } from 'sonner';
import { SafeHTML } from '@/components/ui/SafeHTML';

interface Actualite {
  id: number;
  titre: string;
  titreAr?: string;
  description: string | null;
  descriptionAr?: string;
  contenu: string;
  contenuAr?: string;
  categorie: string | null;
  tags: string[];
  nombreVues: number;
  datePublication: string | null;
  createdAt: string;
  etablissement: {
    id: number;
    nom: string;
    nomArabe?: string;
    secteur: string;
    commune: { nom: string; nomArabe?: string };
  };
  medias: { urlPublique: string; type: string }[];
  createdByUser: { nom: string; prenom: string } | null;
}

const SECTEUR_CONFIG: Record<string, { gradient: string; label: string }> = {
  EDUCATION: { gradient: 'from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]', label: 'Éducation' },
  SANTE: { gradient: 'from-red-600 to-pink-700', label: 'Santé' },
  SPORT: { gradient: 'from-gov-green to-gov-green-dark', label: 'Sport' },
  SOCIAL: { gradient: 'from-[hsl(var(--gov-green))] to-[hsl(var(--gov-green-dark))]', label: 'Social' },
  CULTUREL: { gradient: 'from-orange-600 to-amber-700', label: 'Culturel' },
  AUTRE: { gradient: 'from-gray-600 to-slate-700', label: 'Autre' },
};

const getCategoryKey = (cat: string | null) => {
  if (!cat) return 'AUTRE';
  return cat.toUpperCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]/g, "_");
};

export default function ActualiteDetailPage() {
  const params = useParams();
  const t = useTranslations('news_page');
  const locale = useLocale();
  const [actualite, setActualite] = useState<Actualite | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [liked, setLiked] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let controller: AbortController | null = null;
    
    if (params.id) {
      controller = new AbortController();
      fetch(`/api/actualites/${params.id}`, { signal: controller.signal })
        .then(res => res.json())
        .then(json => {
          setActualite(json.data);
          setLoading(false);
        })
        .catch(err => {
          if (err.name === 'AbortError') return;
          setLoading(false);
        });
    }

    return () => {
      if (controller) controller.abort();
    };
  }, [params.id]);

  const handleShare = async () => {
    if (navigator.share && actualite) {
      try {
        await navigator.share({
          title: actualite.titre,
          text: actualite.description || '',
          url: window.location.href,
        });
      } catch (err) { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success(t('detail.copied'));
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getReadingTime = (content: string) => {
    const text = content.replace(/<[^>]*>/g, '');
    const words = text.trim().split(/\s+/).length;
    return Math.ceil(words / 200);
  };

  const getRelativeDateText = (dateStr: string) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr);
    const now = new Date();
    
    // reset times to compare just days
    const d = new Date(dateObj); d.setHours(0,0,0,0);
    const n = new Date(now); n.setHours(0,0,0,0);
    
    const diffDays = Math.round((n.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return locale === 'ar' ? 'اليوم' : "Aujourd'hui";
    } else if (diffDays === 1) {
      return locale === 'ar' ? 'أمس' : "Hier";
    } else if (diffDays > 1 && diffDays <= 7) {
      return locale === 'ar' ? `منذ ${diffDays} أيام` : `Il y a ${diffDays} jours`;
    }
    
    return dateObj.toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-gov-blue border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!actualite) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center pt-24">
         <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('detail.not_found')}</h1>
         <Link href="/actualites" className="text-gov-blue underline hover:text-gov-gold">
           {t('detail.back_to_list')}
         </Link>
      </div>
    );
  }

  const config = SECTEUR_CONFIG[actualite.etablissement.secteur] || SECTEUR_CONFIG.AUTRE;
  const images = actualite.medias?.filter(m => m.type === 'IMAGE') || [];
  const publishDate = actualite.datePublication || actualite.createdAt;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== IMMERSIVE HERO ==================== */}
      <div className="relative h-[500px]">
        {images.length > 0 ? (
          <div className="absolute inset-0">
             <OptimizedImage
                src={images[0].urlPublique}
                alt={locale === 'ar' && actualite.titreAr ? actualite.titreAr : actualite.titre}
                fill
                className="object-cover"
                priority
             />
             <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20 backdrop-blur-[2px]" />
          </div>
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-br ${config.gradient}`}>
             <div className="absolute inset-0 bg-[hsl(var(--gov-blue-dark)/0.2)] pattern-grid-lg opacity-20" />
          </div>
        )}

        {/* Back button */}
        <div className={`absolute top-28 ${locale === 'ar' ? 'right-6' : 'left-6'} z-10`}>
           <Link 
             href="/actualites"
             className="inline-flex items-center gap-2 px-4 py-2 bg-[hsl(var(--gov-blue-dark)/0.36)] text-white rounded-full hover:bg-[hsl(var(--gov-blue-dark)/0.46)] transition-colors border border-white/10 text-sm font-medium"
           >
             <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
             {t('detail.back')}
           </Link>
        </div>

        <div className="absolute inset-0 pt-24 pb-8 flex flex-col justify-end">
          <div className="max-w-4xl mx-auto w-full px-4 sm:px-6 relative z-10">

            <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="text-white"
            >
               <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className={`px-3 py-1 bg-gov-gold text-gov-blue-dark text-xs font-bold rounded-full uppercase tracking-wider shadow-lg`}>
                    {t('categories.' + getCategoryKey(actualite.categorie))}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium rounded-full">
                    <Calendar className="w-3.5 h-3.5" />
                    {getRelativeDateText(publishDate)}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-medium rounded-full">
                    <Clock className="w-3.5 h-3.5" />
                    {t('detail.reading_time', { min: getReadingTime(actualite.contenu) })}
                  </span>
               </div>

               <h1 dir="auto" className={`text-3xl md:text-5xl font-black mb-6 drop-shadow-lg !text-white text-shadow-md ${locale === 'ar' ? 'font-cairo leading-normal md:leading-relaxed' : 'leading-tight'}`}>
                 {locale === 'ar' && actualite.titreAr ? actualite.titreAr : actualite.titre}
               </h1>

               <div className="flex items-center gap-4 text-sm text-blue-100/90 font-medium">
                  {actualite.createdByUser ? (
                     <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold ring-2 ring-white/20">
                           {actualite.createdByUser.prenom[0]}{actualite.createdByUser.nom[0]}
                        </div>
                        <span>{t('detail.written_by', { name: `${actualite.createdByUser.prenom} ${actualite.createdByUser.nom}` })}</span>
                     </div>
                  ) : (
                    <div className="flex items-center gap-2">
                       <Building2 className="w-4 h-4" />
                       <span>{locale === 'ar' ? (actualite.etablissement?.nomArabe || actualite.etablissement?.nom) : actualite.etablissement?.nom || 'N/A'}</span>
                    </div>
                  )}
                  <span className="w-1 h-1 bg-white/40 rounded-full" />
                  <div className="flex items-center gap-2">
                     <Eye className="w-4 h-4" />
                     {t('detail.views', { count: actualite.nombreVues })}
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ==================== CONTENT ==================== */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 -mt-10 relative z-20">
        <motion.div 
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.1 }}
           className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 overflow-hidden border border-gray-100"
        >
           {/* Actions Bar */}
           <div className="flex items-center justify-end gap-2 p-4 border-b border-gray-100 bg-gray-50/50">
              <button 
                onClick={() => setLiked(!liked)}
                className={`p-2 rounded-full transition-colors ${liked ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}
              >
                 <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              <div className="w-px h-6 bg-gray-200 mx-2" />
              <button 
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
              {copied ? <CheckCircle className="w-4 h-4 text-gov-green" /> : <Share2 className="w-4 h-4" />}
                 {copied ? t('detail.shared') : t('detail.share')}
              </button>
           </div>

           <div className="p-8 md:p-12">
              {/* Lead Text / Description */}
              {actualite.description && (
                <div dir="auto" className={`text-xl md:text-2xl font-medium text-gray-900 mb-8 max-w-3xl text-justify ${locale === 'ar' ? 'leading-loose' : 'leading-relaxed'}`}>
                   {locale === 'ar' && actualite.descriptionAr ? actualite.descriptionAr : actualite.description}
                </div>
              )}

              {/* Main HTML Content */}
              <div dir="auto" className="w-full text-justify">
                <SafeHTML 
                   className={`prose prose-lg prose-slate max-w-none 
                   prose-img:rounded-2xl prose-img:shadow-lg prose-headings:font-bold prose-headings:text-gov-blue
                   prose-a:text-gov-gold prose-a:no-underline hover:prose-a:underline
                   prose-blockquote:border prose-blockquote:border-[hsl(var(--gov-gold)/0.35)] prose-blockquote:bg-gov-gold/5 prose-blockquote:py-4 prose-blockquote:px-6 prose-blockquote:not-italic prose-blockquote:rounded-lg ${locale === 'ar' ? 'prose-p:leading-[2.2] prose-ul:leading-[2.2] prose-ol:leading-[2.2] prose-headings:leading-normal' : ''}`}
                   html={locale === 'ar' && actualite.contenuAr ? actualite.contenuAr : actualite.contenu}
                />
              </div>

              {/* Tags */}
              {actualite.tags && actualite.tags.length > 0 && (
                 <div className="mt-12 flex flex-wrap gap-2 pt-8 border-t border-gray-100">
                    {actualite.tags.map((tag, i) => (
                       <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-sm font-medium hover:bg-gray-200 transition-colors cursor-pointer">
                          <Tag className="w-3.5 h-3.5" />
                          #{tag}
                       </span>
                    ))}
                 </div>
              )}
           </div>

           {/* Source Footer */}
           <div className="bg-gray-50/80 p-6 md:p-8 border-t border-gray-100">
              <div className="flex items-center gap-4">
                 <div className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br ${config.gradient} text-white shadow-md`}>
                    <Building2 className="w-6 h-6" />
                 </div>
                 <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5">{t('detail.official_source')}</p>
                    <Link href={`/etablissements/${actualite.etablissement?.id || ''}`} className="font-bold text-gray-900 text-lg hover:text-gov-blue">
                       {locale === 'ar' ? (actualite.etablissement?.nomArabe || actualite.etablissement?.nom) : actualite.etablissement?.nom || 'N/A'}
                    </Link>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                       <MapPin className="w-3.5 h-3.5" />
                       {locale === 'ar' ? (actualite.etablissement?.commune?.nomArabe || actualite.etablissement?.commune?.nom) : actualite.etablissement?.commune?.nom || 'N/A'} • {actualite.etablissement?.secteur || 'N/A'}
                    </p>
                 </div>
              </div>
           </div>
        </motion.div>

        {/* Gallery */}
        {images.length > 1 && (
           <div className="mt-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                 <span className="w-2 h-8 bg-gov-blue rounded-full" />
                 {t('detail.gallery')}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                 {images.map((img, i) => (
                    <button
                      key={i}
                      onClick={() => { setActiveImage(i); setShowGallery(true); }}
                      className="relative aspect-video rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all transform hover:scale-[1.02] group"
                    >
                       <OptimizedImage
                          src={img.urlPublique}
                          alt={`${actualite.titre} - ${t('detail.gallery')} ${i + 1}`}
                          fill
                          className="object-cover"
                       />
                       <div className="absolute inset-0 bg-[hsl(var(--gov-blue-dark)/0)] group-hover:bg-[hsl(var(--gov-blue-dark)/0.2)] transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <Eye className="w-8 h-8 text-white drop-shadow-md" />
                       </div>
                    </button>
                 ))}
              </div>
           </div>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {showGallery && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[hsl(var(--gov-blue-dark)/0.96)] flex items-center justify-center p-4"
            onClick={() => setShowGallery(false)}
          >
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2">
               <X className="w-8 h-8" />
            </button>
            
            <motion.div 
               key={activeImage}
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative w-full max-w-5xl aspect-video rounded-lg overflow-hidden" 
               onClick={e => e.stopPropagation()}
            >
               <OptimizedImage
                  src={images[activeImage].urlPublique}
                  alt={`${actualite.titre} - ${t('detail.gallery')} ${activeImage + 1}`}
                  fill
                  className="object-contain"
               />
            </motion.div>
            
            {images.length > 1 && (
               <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
                  <button onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p - 1 + images.length) % images.length) }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-sm border border-white/10">
                     <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="flex items-center text-white/50 font-mono text-sm">
                    {activeImage + 1} / {images.length}
                  </span>
                  <button onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p + 1) % images.length) }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-sm border border-white/10">
                     <ChevronRight className="w-6 h-6" />
                  </button>
               </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
