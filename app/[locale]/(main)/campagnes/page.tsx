'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Megaphone, Search, Users, Target, ChevronLeft, ChevronRight,
  Loader2, X, Calendar, CheckCircle, ArrowRight, Sparkles, Heart, Filter
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { PermissionGuard } from '@/hooks/use-permission';
import CampaignCard from '@/components/campagnes/CampaignCard';

interface Campagne {
  id: number;
  titre: string;
  nom: string;
  slug: string;
  description?: string;
  contenu?: string;
  type?: string;
  imagePrincipale?: string;
  imageCouverture?: string;
  couleurTheme?: string;
  objectifParticipations?: number;
  nombreParticipations: number;
  dateDebut?: string;
  dateFin?: string;
  isFeatured?: boolean;
  createdAt: string;
  rapportClotureUrl?: string;
  bilanDescription?: string;
}

interface TypeCampagne {
  nom: string;
  count: number;
}

function CampagnesContent() {
  const t = useTranslations('campaigns');
  const { data: session } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  // State
  const [campagnes, setCampagnes] = useState<Campagne[]>([]);
  const [featuredCampagnes, setFeaturedCampagnes] = useState<Campagne[]>([]);
  const [types, setTypes] = useState<TypeCampagne[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const search = searchParams.get('search') || '';
  const selectedType = searchParams.get('type') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const [totalPages, setTotalPages] = useState(1);

  // UI State
  const [selectedCampagne, setSelectedCampagne] = useState<Campagne | null>(null);
  const [participating, setParticipating] = useState(false);
  const [participationSuccess, setParticipationSuccess] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  // Views Increment Logic
  useEffect(() => {
    if (selectedCampagne) {
      const viewedKey = `viewed_campaign_${selectedCampagne.id}`;
      const hasViewed = sessionStorage.getItem(viewedKey);

      if (!hasViewed) {
        fetch(`/api/campagnes/${selectedCampagne.id}/vues`, { method: 'POST' });
        sessionStorage.setItem(viewedKey, 'true');
      }
    }
  }, [selectedCampagne]);

  // Fetch Data
  useEffect(() => {
    const fetchCampagnes = async () => {
      setLoading(true);
      try {
        // Fetch featured only on first page and no filters
        if (page === 1 && !search && !selectedType) {
           const featuredRes = await fetch('/api/campagnes?featured=true&limit=5');
           if (featuredRes.ok) {
             const featuredJson = await featuredRes.json();
             setFeaturedCampagnes(featuredJson.data || []);
           }
        }

        const params = new URLSearchParams();
        params.set('page', page.toString());
        params.set('limit', '12');
        if (search) params.set('search', search);
        if (selectedType) params.set('type', selectedType);

        const res = await fetch(`/api/campagnes?${params.toString()}`);
        if (res.ok) {
          const json = await res.json();
          setCampagnes(json.data || []);
          setTypes(json.types || []);
          setTotalPages(json.pagination?.totalPages || 1);
        }
      } catch (error) {
        console.error('Erreur:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampagnes();
  }, [page, search, selectedType]);

  // URL Helpers
  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set('page', '1');
    router.push(`?${params.toString()}`);
  };

  const setPageParam = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', p.toString());
    router.push(`?${params.toString()}`);
  };

  // Carousel Logic
  useEffect(() => {
    if (featuredCampagnes.length <= 1) return;
    const interval = setInterval(() => {
      setCarouselIndex((prev) => (prev + 1) % featuredCampagnes.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [featuredCampagnes.length]);

  // Participation Logic
  const handleParticipate = async () => {
    if (!session?.user) {
      toast.info(t('login_to_participate'));
      return;
    }
    if (!selectedCampagne) return;

    setParticipating(true);
    try {
      const res = await fetch(`/api/campagnes/${selectedCampagne.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Participation' }),
      });

      if (res.ok) {
        setParticipationSuccess(true);
        setCampagnes(prev => prev.map(c => 
          c.id === selectedCampagne.id 
            ? { ...c, nombreParticipations: c.nombreParticipations + 1 }
            : c
        ));
        toast.success(t('success_title'));
      } else {
        const error = await res.json();
        toast.error(error.error || t('errors.participation_error'));
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error(t('errors.connection_error'));
    } finally {
      setParticipating(false);
    }
  };

  const getProgress = (campagne: Campagne) => {
    if (!campagne.objectifParticipations) return 0;
    return Math.min(100, (campagne.nombreParticipations / campagne.objectifParticipations) * 100);
  };

  // Helper for images
  const getNormalizedImageUrl = (url?: string) => {
    if (!url) return undefined;
    if (!url.startsWith('http') && !url.startsWith('/')) {
      return `/${url}`;
    }
    return url;
  };

  return (
    <div className="min-h-screen bg-gray-50 pt-[72px]">
      
      {/* ==================== HERO SECTION ==================== */}
      {featuredCampagnes.length > 0 && !search && !selectedType ? (
         <div className="relative h-[500px] md:h-[600px] overflow-hidden bg-gray-900 group">
            <AnimatePresence mode="wait">
               {featuredCampagnes.map((campagne, index) => {
                  const bgImage = getNormalizedImageUrl(campagne.imageCouverture || campagne.imagePrincipale);
                  
                  if (index !== carouselIndex) return null;
                  
                  return (
                     <motion.div
                        key={campagne.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.7 }}
                        className="absolute inset-0"
                     >
                        {/* Background */}
                        <div 
                           className="absolute inset-0 transition-transform duration-[10s] ease-linear scale-110 group-hover:scale-100"
                           style={{ 
                              backgroundImage: bgImage ? `url(${bgImage})` : undefined,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                           }}
                        >
                           <div className="absolute inset-0 bg-gray-900/60" />
                           <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                        </div>

                        {/* Content */}
                        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 flex items-center pt-20">
                           <div className="max-w-3xl">
                              <motion.div 
                                 initial={{ y: 20, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 transition={{ delay: 0.2 }}
                                 className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-sm text-sm font-medium mb-6"
                              >
                                 <Sparkles className="w-4 h-4" />
                                 {t('featured')}
                              </motion.div>

                              <motion.h1 
                                 initial={{ y: 20, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 transition={{ delay: 0.3 }}
                                 className="text-4xl md:text-6xl font-semibold text-white mb-6 leading-tight"
                              >
                                 {campagne.titre}
                              </motion.h1>

                              <motion.p 
                                 initial={{ y: 20, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 transition={{ delay: 0.4 }}
                                 className="text-lg text-gray-300 mb-8 line-clamp-3 max-w-2xl leading-relaxed"
                              >
                                 {campagne.description}
                              </motion.p>

                              <motion.div 
                                 initial={{ y: 20, opacity: 0 }}
                                 animate={{ y: 0, opacity: 1 }}
                                 transition={{ delay: 0.5 }}
                                 className="flex flex-col sm:flex-row gap-4"
                              >
                                 <button
                                    onClick={() => setSelectedCampagne(campagne)}
                                    className="px-8 py-4 bg-[hsl(145,63%,32%)] text-white font-bold rounded-xl hover:bg-[hsl(145,63%,38%)] transition-all shadow-lg hover:shadow-[hsl(145,63%,32%)]/30 flex items-center justify-center gap-2"
                                 >
                                    {t('participate')}
                                    <ArrowRight className="w-5 h-5" />
                                 </button>
                                 
                                 <Link 
                                    href="#toutes-les-campagnes"
                                    className="px-8 py-4 bg-white/10 backdrop-blur-md text-white font-bold rounded-xl hover:bg-white/20 transition-all border border-white/10 flex items-center justify-center"
                                 >
                                    {t('see_all')}
                                 </Link>
                              </motion.div>
                           </div>
                        </div>
                     </motion.div>
                  );
               })}
            </AnimatePresence>
            
            {/* Arrows */}
            {featuredCampagnes.length > 1 && (
               <div className="absolute bottom-10 right-10 flex gap-2 z-20">
                  <button onClick={() => setCarouselIndex((i) => (i - 1 + featuredCampagnes.length) % featuredCampagnes.length)} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                     <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={() => setCarouselIndex((i) => (i + 1) % featuredCampagnes.length)} className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all">
                     <ChevronRight className="w-6 h-6" />
                  </button>
               </div>
            )}
         </div>
      ) : (
         // Simple Header for Search/Filter view
         <div className="relative bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] py-16">
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 text-center">
               <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/80 border border-white/10 backdrop-blur-sm text-sm font-medium mb-4">
                  <Megaphone className="w-4 h-4 text-[hsl(45,93%,47%)]" />
                  {t('initiatives_badge')}
               </span>
               <h1 className="text-3xl md:text-5xl font-black text-white mb-4">{t('hero_title')}</h1>
               <p className="text-blue-100 max-w-2xl mx-auto text-lg">
                  {t('hero_subtitle')}
               </p>
            </div>
         </div>
      )}

      {/* ==================== CONTENT ==================== */}
      <div id="toutes-les-campagnes" className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        
         {/* Filters Bar */}
         <div className="flex flex-col md:flex-row gap-4 mb-10 items-start md:items-center justify-between">
            <div className="flex-1 w-full md:w-auto relative group">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[hsl(213,80%,28%)] transition-colors" size={20} />
               <input
                  type="text"
                  value={search}
                  onChange={(e) => updateFilter('search', e.target.value)}
                  placeholder={t('search_placeholder')}
                  className="w-full md:max-w-md pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-[hsl(213,80%,28%)]/20 focus:border-[hsl(213,80%,28%)] transition-all shadow-sm"
               />
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
               <button
                  onClick={() => updateFilter('type', '')}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                     !selectedType
                        ? 'bg-[hsl(145,63%,32%)] text-white shadow-md shadow-emerald-900/10'
                        : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                  }`}
               >
                  <Filter className="w-4 h-4" />
                  {t('all_types')}
               </button>
               {types.map((type) => (
                  <button
                     key={type.nom}
                     onClick={() => updateFilter('type', type.nom)}
                     className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
                        selectedType === type.nom
                           ? 'bg-[hsl(145,63%,32%)] text-white shadow-md shadow-emerald-900/10'
                           : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                     }`}
                  >
                     {t(`types.${type.nom}`)}
                     {type.count > 0 && <span className="ml-1 px-1.5 py-0.5 bg-white/20 rounded-md text-xs">{type.count}</span>}
                  </button>
               ))}
            </div>
         </div>

         {/* Results */}
         {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-gray-100 shadow-sm" />
               ))}
            </div>
         ) : campagnes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
               <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Megaphone className="w-8 h-8 text-gray-300" />
               </div>
               <h3 className="text-xl font-bold text-gray-900 mb-2">{t('no_campaigns_found')}</h3>
               <p className="text-gray-500 mb-6">{t('check_filters')}</p>
               <button 
                  onClick={() => router.push('/campagnes')}
                  className="text-[hsl(213,80%,28%)] font-bold hover:underline"
               >
                  {t('reset_filters')}
               </button>
            </div>
         ) : (
            <>
               <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <AnimatePresence mode="popLayout">
                     {campagnes.map((campagne, index) => (
                        <CampaignCard 
                           key={campagne.id} 
                           campagne={campagne} 
                           onClick={setSelectedCampagne}
                           index={index}
                        />
                     ))}
                  </AnimatePresence>
               </div>

               {/* Pagination */}
               {totalPages > 1 && (
                  <div className="flex justify-center mt-12 gap-2">
                     <button
                        onClick={() => setPageParam(page - 1)}
                        disabled={page <= 1}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                     >
                        <ChevronLeft className="w-5 h-5" />
                     </button>
                     <span className="flex items-center px-4 font-medium text-gray-600">
                        {t('page_info', { page, totalPages })}
                     </span>
                     <button
                        onClick={() => setPageParam(page + 1)}
                        disabled={page >= totalPages}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                     >
                        <ChevronRight className="w-5 h-5" />
                     </button>
                  </div>
               )}
            </>
         )}

      </div>

      {/* ==================== MODAL ==================== */}
      <AnimatePresence>
        {selectedCampagne && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => { setSelectedCampagne(null); setParticipationSuccess(false); }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Modal Header */}
              <div className="relative h-56 flex-shrink-0">
                  {(selectedCampagne.imageCouverture || selectedCampagne.imagePrincipale) ? (
                     <img 
                        src={selectedCampagne.imageCouverture || selectedCampagne.imagePrincipale} 
                        alt={selectedCampagne.titre}
                        className="w-full h-full object-cover"
                     />
                  ) : (
                     <div className="w-full h-full bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center">
                        <Megaphone className="w-20 h-20 text-white/20" />
                     </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  
                  <button
                     onClick={() => { setSelectedCampagne(null); setParticipationSuccess(false); }}
                     className="absolute top-4 right-4 p-2 bg-black/20 backdrop-blur-md rounded-full text-white hover:bg-black/40 transition-all border border-white/20 z-20"
                  >
                     <X size={20} />
                  </button>

                  <div className="absolute bottom-6 left-6 right-6 text-white z-10">
                     {selectedCampagne.type && (
                        <span className="inline-block px-3 py-1 bg-emerald-600/90 backdrop-blur-md rounded-lg text-xs font-bold mb-3 border border-emerald-400/30 shadow-sm text-white">
                           {t(`types.${selectedCampagne.type}`)}
                        </span>
                     )}
                     <h2 className="text-2xl md:text-3xl font-black leading-tight drop-shadow-lg !text-white">{selectedCampagne.titre}</h2>
                  </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1">
                {participationSuccess ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center text-center py-10"
                  >
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                      <CheckCircle className="w-12 h-12 text-emerald-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {t('success_title')}
                    </h3>
                    <p className="text-gray-500 mb-8 max-w-sm">
                      {t('success_message')}
                    </p>
                    <button
                      onClick={() => { setSelectedCampagne(null); setParticipationSuccess(false); }}
                      className="px-8 py-3 bg-gray-100 text-gray-900 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                    >
                      {t('close')}
                    </button>
                  </motion.div>
                ) : (
                  <>
                     <div className="flex flex-wrap gap-4 mb-8 text-sm text-gray-500">
                        {(selectedCampagne.dateDebut || selectedCampagne.dateFin) && (
                           <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                              <Calendar className="w-4 h-4 text-gray-400" />
                              <span>
                                 {selectedCampagne.dateDebut && new Date(selectedCampagne.dateDebut).toLocaleDateString('fr-FR')}
                                 {selectedCampagne.dateFin && ` - ${new Date(selectedCampagne.dateFin).toLocaleDateString('fr-FR')}`}
                              </span>
                           </div>
                        )}
                        <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                           <Users className="w-4 h-4 text-gray-400" />
                           <span>{selectedCampagne.nombreParticipations} {t('participants')}</span>
                        </div>
                     </div>

                    <div className="prose prose-emerald max-w-none mb-8 text-gray-600">
                        {selectedCampagne.description && <p className="lead">{selectedCampagne.description}</p>}
                        {selectedCampagne.contenu && (
                           <div dangerouslySetInnerHTML={{ __html: selectedCampagne.contenu }} />
                        )}
                    </div>

                    {/* Progress Bar inside Modal */}
                    {selectedCampagne.objectifParticipations && (
                      <div className="bg-emerald-50/50 rounded-2xl p-5 mb-8 border border-emerald-100">
                        <div className="flex items-center justify-between mb-3">
                           <span className="font-bold text-emerald-900 text-sm">{t('objective_progress')}</span>
                           <span className="text-emerald-700 font-bold text-sm">
                              {Math.round(getProgress(selectedCampagne))}%
                           </span>
                        </div>
                        <div className="h-4 bg-emerald-100 rounded-full overflow-hidden">
                           <div 
                              className="h-full rounded-full transition-all duration-1000 bg-emerald-500"
                              style={{ width: `${getProgress(selectedCampagne)}%`}}
                           />
                        </div>
                        <p className="text-center text-xs text-emerald-600/80 mt-2 font-medium">
                           {selectedCampagne.nombreParticipations} sur {selectedCampagne.objectifParticipations} {t('participants_required')}
                        </p>
                      </div>
                    )}

                     {/* Action Button */}
                     <PermissionGuard 
                        permission="campagnes.participate"
                        fallback={
                           <Link
                              href={`/login?callbackUrl=${encodeURIComponent(pathname || '')}`}
                              className="w-full py-4 flex items-center justify-center gap-2 bg-gray-900 text-white font-bold rounded-2xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200"
                           >
                              <Heart className="w-5 h-5" />
                              {t('login_to_participate')}
                           </Link>
                        }
                     >
                        <button
                           onClick={handleParticipate}
                           disabled={participating}
                           className="w-full py-4 flex items-center justify-center gap-2 bg-[hsl(145,63%,32%)] text-white font-bold rounded-2xl hover:bg-[hsl(145,63%,38%)] transition-all shadow-xl shadow-emerald-200 disabled:opacity-70 disabled:cursor-not-allowed group"
                        >
                           {participating ? (
                           <>
                              <Loader2 className="w-5 h-5 animate-spin" />
                              {t('participating')}
                           </>
                           ) : (
                           <>
                              <Heart className="w-5 h-5 group-hover:scale-110 transition-transform" />
                              {t('confirm_participation')}
                           </>
                           )}
                        </button>
                     </PermissionGuard>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function CampagnesPage() {
   return (
      <Suspense fallback={
         <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin"></div>
         </div>
      }>
         <CampagnesContent />
      </Suspense>
   );
}
