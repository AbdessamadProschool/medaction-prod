'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { 
  ArrowRight, 
  Calendar, 
  MapPin, 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit2,
  FileText,
  Image as ImageIcon,
  Phone,
  Mail,
  Share2,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Download,
  ExternalLink,
  MapIcon,
  Globe,
  Tag,
  Info,
  CalendarDays,
  Timer,
  Megaphone
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import { getDirection } from '@/i18n/routing';
import { format } from 'date-fns';
import { fr, arMA } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function EvenementDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = useLocale();
  const direction = getDirection(locale as any);
  const t = useTranslations('delegation.dashboard.event_details');
  const dateLocale = locale === 'ar' ? arMA : fr;
  const id = params.id;

  const [evenement, setEvenement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Extract cover image from the medias relation
  const coverImage = evenement?.medias
    ? (evenement.medias.find((m: any) => m.nomFichier === 'Image Principale' && m.type === 'IMAGE')?.urlPublique 
       || evenement.medias.find((m: any) => m.type === 'IMAGE')?.urlPublique 
       || null)
    : null;

  // Language based content selection
  const displayTitle = (locale === 'ar' && evenement?.titreAr) ? evenement.titreAr : evenement?.titre;
  const displayDescription = (locale === 'ar' && evenement?.descriptionAr) ? evenement.descriptionAr : evenement?.description;
  const isDescriptionArabic = (locale === 'ar' && evenement?.descriptionAr);

  const organisateurNom = evenement?.organisateur || evenement?.etablissement?.nom || null;
  const organisateurTel = evenement?.contactOrganisateur || null;
  const organisateurEmail = evenement?.emailContact || null;

  // Extract bilan medias
  const bilanImages = evenement?.medias?.filter((m: any) => m.nomFichier === 'Image Bilan') || [];
  const compteRendu = evenement?.medias?.find((m: any) => m.nomFichier === 'Compte Rendu Bilan');

  useEffect(() => {
    if (!id) return;
    
    fetch(`/api/delegation/evenements/${id}`)
      .then(res => res.json())
      .then(data => {
        if (data.data) {
          setEvenement(data.data);
        } else {
          setError('Événement introuvable');
        }
      })
      .catch(err => {
        console.error(err);
        setError('Erreur lors du chargement');
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-400 font-bold font-cairo animate-pulse">{t('loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !evenement) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="w-20 h-20 bg-red-50 rounded-2xl flex items-center justify-center shadow-inner">
            <XCircle className="w-10 h-10 text-red-500" />
        </div>
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-900 font-cairo tracking-tight">{error || t('not_found')}</h2>
          <p className="text-gray-500 font-medium font-cairo max-w-sm mx-auto text-sm">
            {locale === 'ar' ? 'عذراً ، لم نتمكن من العثور على الفعالية التي تبحث عنها.' : 'Désolé, nous n\'avons pas pu trouver l\'événement que vous recherchez.'}
          </p>
        </div>
        <Link 
          href="/delegation/evenements" 
          className="px-6 py-3 bg-gray-900 text-white rounded-xl font-black font-cairo hover:bg-black transition-all shadow-lg active:scale-95 no-underline text-sm"
        >
          {t('back_to_list')}
        </Link>
      </div>
    );
  }

  const getTypeGradient = (type?: string) => {
    switch(type) {
      case 'CULTUREL': return 'from-indigo-600 to-violet-700';
      case 'SPORTIF': return 'from-emerald-600 to-teal-700';
      case 'SOCIAL': return 'from-orange-500 to-rose-600';
      case 'EDUCATIF': return 'from-blue-600 to-indigo-700';
      case 'SANTE': return 'from-rose-500 to-red-600';
      default: return 'from-slate-700 to-slate-900';
    }
  };

  const getStatusConfig = (status: string) => {
    switch(status) {
      case 'PUBLIEE': return { label: t('status_published'), color: 'emerald', icon: <CheckCircle className="w-4 h-4" /> };
      case 'CLOTUREE': return { label: t('status_closed'), color: 'gray', icon: <XCircle className="w-4 h-4" /> };
      case 'EN_ACTION': return { label: locale === 'ar' ? 'قيد التنفيذ' : 'En cours', color: 'blue', icon: <TrendingUp className="w-4 h-4" /> };
      case 'ANNULEE': return { label: locale === 'ar' ? 'ملغى' : 'Annulé', color: 'red', icon: <XCircle className="w-4 h-4" /> };
      default: return { label: t('status_draft'), color: 'amber', icon: <Clock className="w-4 h-4" /> };
    }
  };

  const status = getStatusConfig(evenement.statut);

  return (
    <div className={`space-y-6 font-cairo pb-8 ${direction === 'rtl' ? 'text-right' : 'text-left'}`} dir={direction}>
      
      {/* Immersive Premium Hero Section - Compacted */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${getTypeGradient(evenement.type)} text-white shadow-xl px-6 py-8 md:px-8 md:py-12`}
      >
        {/* Background Patterns */}
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
           <CalendarDays className="w-48 h-48 transform rotate-12" />
        </div>
        <div className="absolute bottom-0 left-0 w-full h-full bg-[radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.05),transparent)] pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
           {/* Navigation & Actions */}
            <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 w-full`}>
             <Link 
               href="/delegation/evenements" 
               className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-all bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl backdrop-blur-md border border-white/10 shadow-lg font-black text-[10px] uppercase tracking-widest group no-underline"
             >
               <ArrowRight size={14} className={`${direction === 'rtl' ? 'rotate-180' : ''} group-hover:translate-x-1 rtl:group-hover:-translate-x-1 transition-transform`} />
               {t('back_to_list')}
             </Link>
             
             <div className="flex items-center gap-2">
                {evenement.statut === 'PUBLIEE' && new Date(evenement.dateDebut) < new Date() && (
                    <Link 
                      href={`/delegation/evenements/${id}/cloture`} 
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl transition-all font-black text-xs shadow-xl shadow-emerald-500/20 no-underline transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                    >
                      <CheckCircle size={16} />
                      {t('close')}
                    </Link>
                )}
                
                {evenement.statut !== 'CLOTUREE' && (
                  <Link 
                    href={`/delegation/evenements/${id}/modifier?from=detail`} 
                    className="px-4 py-2 bg-white text-indigo-900 hover:bg-indigo-50 rounded-xl transition-all font-black text-xs shadow-xl no-underline transform hover:-translate-y-1 active:scale-95 flex items-center gap-2"
                  >
                    <Edit2 size={16} className="text-indigo-400" />
                    {t('edit')}
                  </Link>
                )}

                <button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({ title: displayTitle, text: displayDescription, url: window.location.href });
                    } else {
                        navigator.clipboard.writeText(window.location.href);
                        toast.success(locale === 'ar' ? 'تم نسخ الرابط!' : 'Lien copié !');
                    }
                  }}
                  className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all shadow-lg border border-white/20 backdrop-blur-md transform hover:-translate-y-1 active:scale-95"
                >
                    <Share2 size={18} />
                </button>
             </div>
           </div>

           <div className={`flex flex-col md:flex-row md:items-start justify-between gap-6`}>
              <div className="space-y-4 flex-1">
                <div className={`flex flex-wrap gap-2`}>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-sm">
                    {evenement.typeCategorique || evenement.type}
                  </span>
                  <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border backdrop-blur-md shadow-sm
                    ${status.color === 'emerald' ? 'bg-emerald-500/30 border-emerald-400/40' : 
                      status.color === 'red' ? 'bg-red-500/30 border-red-400/40' : 
                      'bg-white/10 border-white/10'}`}>
                    {status.icon}
                    {status.label}
                  </span>
                </div>
                
                <h1 className={`text-2xl md:text-3xl lg:text-4xl font-black leading-tight drop-shadow-xl text-white font-cairo w-full text-start`}>
                  {displayTitle}
                </h1>
              </div>

              {/* Stats/Highlight Icon decorative - Compacter */}
              <div className="hidden lg:block">
                <div className="w-20 h-20 bg-white/10 rounded-2xl rotate-6 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-inner">
                   <Megaphone className="w-10 h-10 text-white/40 -rotate-6" />
                </div>
              </div>
           </div>
        </div>
      </motion.div>

      {/* Highlights Bar - Compacted */}
      <div className="max-w-7xl mx-auto px-1 sm:px-2 relative z-20 -mt-6">
         <div className="bg-white rounded-2xl shadow-lg border border-gray-50 p-1.5 grid grid-cols-1 md:grid-cols-4 gap-1.5">
            
            <div className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/20 border border-blue-50/50 hover:bg-blue-50 transition-colors group">
               <div className="w-10 h-10 bg-white text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-blue-50 group-hover:scale-105 transition-transform">
                 <CalendarDays size={18} />
               </div>
               <div>
                 <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 leading-none">{t('date')}</p>
                 <p className="font-black text-gray-900 text-[13px] leading-tight flex flex-col">
                    <span>{format(new Date(evenement.dateDebut), 'd MMMM yyyy', { locale: dateLocale })}</span>
                    <span className="text-gray-400 text-[10px] font-bold font-mono mt-0.5" dir="ltr">{format(new Date(evenement.dateDebut), 'HH:mm')}</span>
                 </p>
               </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/20 border border-orange-50/50 hover:bg-orange-50 transition-colors group">
               <div className="w-10 h-10 bg-white text-orange-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-orange-50 group-hover:scale-105 transition-transform">
                 <MapPin size={18} />
               </div>
               <div className="min-w-0">
                 <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 leading-none">{t('location')}</p>
                 <p className="font-black text-gray-900 text-[13px] leading-tight truncate">{evenement.lieu || t('location_unspecified')}</p>
               </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50/20 border border-indigo-50/50 hover:bg-indigo-50 transition-colors group">
               <div className="w-10 h-10 bg-white text-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-indigo-50 group-hover:scale-105 transition-transform">
                 <Globe size={18} />
               </div>
               <div className="min-w-0">
                 <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 leading-none">{t('organizer')}</p>
                 <p className="font-black text-gray-900 text-[13px] leading-tight truncate">{organisateurNom || t('organizer_unknown')}</p>
               </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/20 border border-emerald-50/50 hover:bg-emerald-50 transition-colors group">
               <div className="w-10 h-10 bg-white text-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-50 group-hover:scale-105 transition-transform">
                 <Users size={18} />
               </div>
               <div>
                 <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1 leading-none">{t('capacity')}</p>
                 <div className="flex items-baseline gap-1">
                    <span className="font-black text-gray-900 text-lg">{evenement.capaciteMax || '—'}</span>
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-tighter">{t('seats')}</span>
                 </div>
               </div>
            </div>

         </div>
      </div>

      <div className="space-y-6 px-4">
        
        {/* Visual Section - Optimized Height */}
        {coverImage && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative h-[300px] md:h-[420px] w-full rounded-3xl overflow-hidden shadow-lg border border-gray-100 bg-slate-50 group"
          >
             <OptimizedImage 
               src={coverImage} 
               alt={displayTitle || "Hero"} 
               fill 
               className="object-cover group-hover:scale-105 transition-transform duration-[4s]" 
             />
             <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
          </motion.div>
        )}

        {/* Description Card - More Compact */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100"
        >
          <h2 className="text-xl font-black text-gray-900 mb-6 flex items-center gap-3 border-b border-gray-50 pb-4">
             <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 shadow-sm">
                <FileText className="w-5 h-5" />
             </div>
             {t('description')}
          </h2>
          <div className={`prose prose-sm max-w-none text-gray-700 leading-relaxed font-cairo text-base font-medium whitespace-pre-line ${isDescriptionArabic ? 'prose-rtl text-right' : 'text-left'}`} dir={isDescriptionArabic ? 'rtl' : 'ltr'}>
            {displayDescription}
          </div>

          {evenement.tags && evenement.tags.length > 0 && (
             <div className="mt-8 flex flex-wrap gap-2">
               {evenement.tags.map((tag: string, i: number) => (
                 <span key={i} className="px-4 py-1.5 bg-gray-50 text-gray-500 rounded-lg text-[10px] font-black transition-all border border-gray-100">
                   <Tag size={10} className="inline-block rtl:ml-2 ltr:mr-2 opacity-50" />
                   {tag}
                 </span>
               ))}
             </div>
          )}
        </motion.div>

        {/* Bottom Section - Reports/Gallery */}
        <div className="grid md:grid-cols-2 gap-6">
           {evenement.statut === 'CLOTUREE' && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.3 }}
               className="bg-emerald-50/50 rounded-3xl p-6 shadow-sm border border-emerald-100 relative overflow-hidden group"
             >
                <div className="absolute top-0 right-0 p-6 opacity-5">
                   <Award className="w-24 h-24" />
                </div>
                
                <h3 className="text-lg font-black text-emerald-900 mb-4 flex items-center gap-3 border-b border-emerald-200/50 pb-3">
                  <Award size={20} className="text-emerald-500" />
                  {t('report_title')}
                </h3>
                
                <div className="space-y-4 text-start">
                   <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-emerald-100 shadow-sm">
                      <div className="flex items-center gap-2">
                         <Users size={16} className="text-emerald-500" />
                         <span className="text-[9px] font-black uppercase text-gray-400">{t('participants_count')}</span>
                      </div>
                      <span className="text-xl font-black text-emerald-900">{(evenement.bilanNbParticipants || 0).toLocaleString(locale)}</span>
                   </div>

                   <p className="text-emerald-900/70 text-sm font-medium leading-relaxed bg-white/40 p-4 rounded-xl border border-emerald-100/30">
                     {evenement.bilanDescription || '-'}
                   </p>

                   {compteRendu && (
                     <a 
                       href={compteRendu.urlPublique} 
                       target="_blank" 
                       rel="noopener noreferrer"
                       className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl font-black text-xs shadow-xl shadow-emerald-600/20 hover:bg-emerald-700 transition-all transform hover:-translate-y-1 no-underline"
                     >
                        <Download size={16} />
                        {t('download_report')}
                     </a>
                   )}
                </div>
             </motion.div>
           )}

           {bilanImages.length > 0 && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               transition={{ delay: 0.4 }}
               className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100"
             >
                <h3 className="text-lg font-black text-gray-900 mb-4 flex items-center gap-3 border-b border-gray-50 pb-3">
                  <ImageIcon size={20} className="text-gray-400" />
                  {t('visualize_gallery')}
                </h3>
                <div className="grid grid-cols-3 gap-3">
                   {bilanImages.map((img: any, idx: number) => (
                      <a 
                        key={idx} 
                        href={img.urlPublique} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group"
                      >
                         <OptimizedImage src={img.urlPublique} alt="Gallery" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                         <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <ExternalLink size={16} className="text-white" />
                         </div>
                      </a>
                   ))}
                </div>
             </motion.div>
           )}
        </div>
      </div>
    </div>
  );
}
