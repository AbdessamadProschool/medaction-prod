'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { OptimizedImage } from '@/components/ui/OptimizedImage';
import {
  ArrowLeft, Calendar, Clock, MapPin, Building2, Eye, Share2,
  ExternalLink, Heart, ChevronLeft, ChevronRight, X, Sparkles, Globe,
  Phone, Mail, Download, User, Tag, CheckCircle, Ticket, PlayCircle
} from 'lucide-react';
import { PermissionGuard } from '@/hooks/use-permission';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

// Map dynamique (SSR disabled)
const LocationMap = dynamic(() => import('@/components/maps/LocationMap'), {
  ssr: false,
  loading: () => <div className="w-full h-48 bg-gray-100 rounded-xl animate-pulse" />,
});

interface Evenement {
  id: number;
  titre: string;
  description: string;
  typeCategorique: string;
  categorie?: string;
  secteur: string;
  statut: string;
  dateDebut: string;
  dateFin?: string;
  heureDebut?: string;
  heureFin?: string;
  lieu?: string;
  adresse?: string;
  quartierDouar?: string;
  latitude?: number;
  longitude?: number;
  organisateur?: string;
  contactOrganisateur?: string;
  emailContact?: string;
  capaciteMax?: number;
  inscriptionsOuvertes: boolean;
  lienInscription?: string;
  nombreInscrits: number;
  nombreVues: number;
  bilanDescription?: string;
  bilanNbParticipants?: number;
  compteRenduUrl?: string;
  tags: string[];
  etablissement: { nom: string; secteur: string };
  commune: { nom: string };
  createdByUser: { nom: string; prenom: string };
  medias: { id: number; urlPublique: string; type: string }[];
}

const getSecteurConfig = (t: any) => ({
  EDUCATION: { gradient: 'from-blue-600 to-indigo-700', icon: '🎓', label: t('education'), bgLight: 'bg-blue-50' },
  SANTE: { gradient: 'from-red-600 to-pink-700', icon: '🏥', label: t('sante'), bgLight: 'bg-red-50' },
  SPORT: { gradient: 'from-emerald-600 to-teal-700', icon: '⚽', label: t('sport'), bgLight: 'bg-emerald-50' },
  SOCIAL: { gradient: 'from-purple-600 to-violet-700', icon: '🤝', label: t('social'), bgLight: 'bg-purple-50' },
  CULTUREL: { gradient: 'from-amber-600 to-orange-700', icon: '🎭', label: t('culture'), bgLight: 'bg-amber-50' },
  AUTRE: { gradient: 'from-gray-600 to-slate-700', icon: '📋', label: t('autre'), bgLight: 'bg-gray-50' },
});

function getEventStatus(event: Evenement, t: any) {
  const now = new Date();
  const start = new Date(event.dateDebut);
  const end = event.dateFin ? new Date(event.dateFin) : null;

  if (event.statut === 'CLOTUREE') {
    return { status: 'ended', label: t('status.ended'), color: 'bg-gray-600', textColor: 'text-gray-600', icon: CheckCircle, pulse: false };
  }
  if (event.statut === 'EN_ACTION' || (now >= start && (!end || now <= end))) {
    return { status: 'live', label: t('status.live'), color: 'bg-red-500', textColor: 'text-red-500', icon: PlayCircle, pulse: true };
  }
  if (now < start) {
    const daysUntil = Math.ceil((start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return { 
      status: 'upcoming', 
      label: daysUntil === 1 ? t('status.tomorrow') : daysUntil <= 7 ? t('status.in_days', { days: daysUntil }) : t('status.upcoming'), 
      color: 'bg-[hsl(45,93%,47%)]',
      textColor: 'text-[hsl(45,93%,47%)]',
      icon: Calendar,
      pulse: false,
    };
  }
  return { status: 'ended', label: t('status.passed'), color: 'bg-gray-500', textColor: 'text-gray-500', icon: CheckCircle, pulse: false };
}

export default function EvenementDetailPage() {
  const { data: session } = useSession();
  const params = useParams();
  const pathname = usePathname();
  const [event, setEvent] = useState<Evenement | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [showGallery, setShowGallery] = useState(false);
  const [liked, setLiked] = useState(false);
  const t = useTranslations('event_page');
  const locale = useLocale();
  const tSectors = useTranslations('sectors');
  
  // useTranslations('sectors') is now passed to getSecteurConfig

  
  useEffect(() => {
    if (params.id) {
      // Charger les données (sans incrémenter la vue ici)
      fetch(`/api/evenements/${params.id}`)
        .then(res => res.json())
        .then(json => {
          setEvent(json.data);
          setLoading(false);
        })
        .catch(() => setLoading(false));

      // Incrémenter la vue UNE SEULE FOIS par session
      const viewedKey = `viewed_event_${params.id}`;
      const hasViewed = sessionStorage.getItem(viewedKey);

      if (!hasViewed) {
        fetch(`/api/evenements/${params.id}/vues`, { method: 'POST' })
          .then(() => {
            sessionStorage.setItem(viewedKey, 'true');
          })
          .catch(console.error);
      }
    }
  }, [params.id]);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: event?.titre, url });
      } catch (err) { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t('toasts.link_copied'));
      } catch (err) {
        // Fallback pour contextes non sécurisés (HTTP)
        const textArea = document.createElement("textarea");
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
           document.execCommand('copy');
           toast.success(t('toasts.link_copied'));
        } catch (err2) {
           toast.error(t('toasts.copy_failed'));
        }
        document.body.removeChild(textArea);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
        >
            <div className="text-8xl mb-6">😕</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{t('not_found.title')}</h1>
            <p className="text-gray-500 mb-6">{t('not_found.description')}</p>
            <Link 
            href="/evenements" 
            className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(213,80%,28%)] text-white rounded-xl hover:bg-[hsl(213,80%,35%)] transition-all shadow-lg"
            >
            <ArrowLeft className="w-5 h-5" />
            {t('not_found.back_button')}
            </Link>
        </motion.div>
      </div>
    );
  }

  const secteurConfig = getSecteurConfig(tSectors);
  const config = secteurConfig[event.secteur as keyof typeof secteurConfig] || secteurConfig.AUTRE;
  const eventStatus = getEventStatus(event, t);
  const images = event.medias?.filter(m => m.type === 'IMAGE') || [];
  const isEnded = eventStatus.status === 'ended';
  const isLive = eventStatus.status === 'live';

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== IMMERSIVE HERO ==================== */}
      <div className="relative min-h-[600px] lg:h-[70vh] flex flex-col justify-end overflow-hidden">
        {images.length > 0 ? (
          <div className="absolute inset-0 z-0">
             <OptimizedImage
                src={images[0].urlPublique}
                alt={event.titre}
                fill
                type="evenement"
                className="object-cover"
                priority
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213,80%,15%)] via-[hsl(213,80%,15%)]/60 to-[hsl(213,80%,15%)]/30 backdrop-blur-[2px]" />
          </div>
        ) : (
          <div className={`absolute inset-0 z-0 bg-gradient-to-br ${config.gradient}`}>
             <div className="absolute inset-0 bg-black/20 pattern-grid-lg opacity-20" />
          </div>
        )}

        {/* Navigation & Actions - z-[60] pour être au-dessus du header (z-50) */}
        <div className="absolute top-0 left-0 right-0 pt-24 px-4 md:px-8 z-[60]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link 
              href="/evenements"
              className="group flex items-center gap-2 px-5 py-2.5 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all border border-white/10">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span className="font-medium hidden sm:inline">{t('buttons.back')}</span>
            </Link>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                className={`p-3 rounded-full backdrop-blur-md transition-all border cursor-pointer ${
                  liked 
                    ? 'bg-red-500/80 border-red-500 text-white' 
                    : 'bg-black/30 border-white/10 text-white hover:bg-black/40'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-5 py-2.5 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all border border-white/10 cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
                <span className="font-medium hidden sm:inline">{t('buttons.share')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full p-6 md:p-12 mt-20 md:mt-0">
          <div className="max-w-7xl mx-auto">
            {/* Tags & Status */}
            <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="flex flex-wrap items-center gap-3 mb-6"
            >
               <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-white font-bold text-sm shadow-lg backdrop-blur-md ${eventStatus.color} ${eventStatus.pulse ? 'animate-pulse' : ''}`}>
                  <eventStatus.icon className="w-4 h-4" />
                  {eventStatus.label}
               </span>
               
               <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 text-white font-bold text-sm backdrop-blur-md border border-white/20`}>
                  {config.icon} {config.label}
               </span>

               <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/30 backdrop-blur-md text-white rounded-full text-sm font-medium border border-white/10">
                  <Eye className="w-4 h-4" />
                  {event.nombreVues} {t('labels.views')}
               </span>
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8 max-w-5xl leading-tight text-shadow-sm"
            >
              {event.titre}
            </motion.h1>

            {/* Key Info Grid */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 text-white/90"
            >
               {/* Date */}
               <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                     <Calendar className="w-6 h-6 text-[hsl(45,93%,47%)]" />
                  </div>
                  <div>
                     <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-0.5">{t('labels.date_time')}</p>
                     <p className="font-bold text-lg leading-tight">{new Date(event.dateDebut).toLocaleDateString(locale, { day: 'numeric', month: 'long' })}</p>
                     <p className="text-sm opacity-80">{event.heureDebut || t('labels.all_day')}</p>
                  </div>
               </div>

               {/* Location */}
               <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                     <MapPin className="w-6 h-6 text-emerald-400" />
                  </div>
                  <div>
                   <div>
                      <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-0.5">{t('labels.location')}</p>
                      <p className="font-bold text-lg leading-tight truncate max-w-[200px]">{event.lieu || event.commune.nom}</p>
                      <p className="text-sm opacity-80 truncate max-w-[200px]">{event.commune.nom}</p>
                   </div>
                  </div>
               </div>

               {/* Org */}
               <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                  <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                     <Building2 className="w-6 h-6 text-blue-300" />
                  </div>
                  <div>
                     <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-0.5">{t('labels.organizer')}</p>
                     <p className="font-bold text-lg leading-tight truncate max-w-[200px]">{event.organisateur || event.etablissement?.nom || 'N/A'}</p>
                     <p className="text-sm opacity-80 truncate max-w-[200px]">{t('labels.official_event')}</p>
                  </div>
               </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ==================== CONTENT LAYOUT ==================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 -mt-8 relative z-30">
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="lg:col-span-2 space-y-8">
             
             {/* Description Card */}
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
               className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
             >
                <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                   <div className={`p-3 rounded-xl ${config.bgLight}`}>
                      <Sparkles className="w-6 h-6 text-[hsl(213,80%,28%)]" />
                   </div>
                   <h2 className="text-2xl font-bold text-gray-900">{t('labels.about')}</h2>
                </div>
                <div className="prose prose-lg text-gray-600 leading-relaxed whitespace-pre-wrap">
                   {event.description}
                </div>

                {/* Tags */}
                {event.tags && event.tags.length > 0 && (
                   <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                      {event.tags.map(tag => (
                         <span key={tag} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-100 transition-colors cursor-default">
                            <Tag className="w-3.5 h-3.5" />
                            #{tag}
                         </span>
                      ))}
                   </div>
                )}
             </motion.div>

             {/* Gallery Preview */}
             {images.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
                >
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                         <div className="p-3 rounded-xl bg-purple-50">
                            <Eye className="w-6 h-6 text-purple-600" />
                         </div>
                         <h2 className="text-2xl font-bold text-gray-900">{t('labels.gallery')}</h2>
                      </div>
                      <button 
                        onClick={() => { setActiveImage(0); setShowGallery(true); }}
                        className="text-[hsl(213,80%,28%)] font-bold text-sm hover:underline"
                      >
                         {t('buttons.view_all')} ({images.length})
                      </button>
                   </div>
                   
                   <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {images.slice(0, 4).map((img, idx) => (
                         <div 
                           key={img.id}
                           onClick={() => { setActiveImage(idx); setShowGallery(true); }}
                           className="aspect-square rounded-xl overflow-hidden cursor-pointer relative group"
                         >
                            <OptimizedImage
                               src={img.urlPublique}
                               alt="Gallery preview"
                               fill
                               type="evenement"
                               className="object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                         </div>
                      ))}
                   </div>
                </motion.div>
             )}
             
             {/* Map Location */}
             {event.latitude && event.longitude && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
                >
                   <div className="flex items-center gap-3 mb-6">
                       <div className="p-3 rounded-xl bg-emerald-50">
                          <MapPin className="w-6 h-6 text-emerald-600" />
                       </div>
                       <h2 className="text-2xl font-bold text-gray-900">{t('labels.location')}</h2>
                    </div>
                   
                   <div className="h-64 w-full rounded-2xl overflow-hidden shadow-inner mb-4">
                      <LocationMap
                         position={{ lat: event.latitude, lng: event.longitude }}
                         onPositionChange={() => {}}
                         readonly
                      />
                   </div>
                   <div className="flex items-start gap-3 text-gray-600 bg-gray-50 p-4 rounded-xl">
                      <MapPin className="w-5 h-5 shrink-0 mt-0.5 text-gray-400" />
                      <p>{event.adresse || event.lieu || `${event.commune.nom}, Province de Médiouna`}</p>
                   </div>
                </motion.div>
             )}
          </div>

          {/* RIGHT COLUMN: Sidebar Info */}
          <div className="space-y-6">
             
             {/* Participation Card */}
             {!isEnded && (
                <motion.div
                   initial={{ opacity: 0, x: 20 }}
                   animate={{ opacity: 1, x: 0 }}
                   className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-24"
                >
                   <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                       <Ticket className="w-5 h-5 text-[hsl(45,93%,47%)]" />
                       {t('labels.participation')}
                   </h3>

                   {event.capaciteMax && (
                      <div className="mb-6">
                         <div className="flex justify-between text-sm mb-2 font-medium">
                            <span className="text-gray-500">{t('labels.reserved_places')}</span>
                            <span className="text-gray-900">{event.nombreInscrits} / {event.capaciteMax}</span>
                         </div>
                         <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                               className="h-full bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(213,80%,40%)] rounded-full transition-all duration-1000"
                               style={{ width: `${Math.min((event.nombreInscrits / event.capaciteMax) * 100, 100)}%` }}
                            />
                         </div>
                         {(event.nombreInscrits >= event.capaciteMax) && (
                            <p className="text-red-500 text-xs font-bold mt-2 flex items-center gap-1">
                               <X className="w-3 h-3" /> {t('labels.full')}
                            </p>
                         )}
                      </div>
                   )}

                   {event.inscriptionsOuvertes && event.lienInscription ? (
                      <PermissionGuard 
                         permission="evenements.participate"
                         fallback={
                            <Link
                               href={`/login?callbackUrl=${encodeURIComponent(pathname || '')}`}
                               className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all text-center"
                            >
                               {t('buttons.login_participate')}
                            </Link>
                         }
                      >
                         <a
                            href={event.lienInscription}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-[hsl(213,80%,28%)] text-white rounded-xl font-bold hover:bg-[hsl(213,80%,35%)] shadow-lg shadow-blue-900/20 transition-all transform hover:-translate-y-0.5"
                         >
                            {t('buttons.participate')}
                            <ExternalLink className="w-4 h-4" />
                         </a>
                      </PermissionGuard>
                    ) : (
                       <div className="w-full py-3 bg-gray-100 text-gray-400 font-bold text-center rounded-xl cursor-not-allowed">
                          {t('labels.closed')}
                       </div>
                    )}
                </motion.div>
             )}

             {/* Organization Info */}
             <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100"
             >
                 <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-gray-400" />
                    {t('labels.organization')}
                 </h3>
                
                <div className="flex items-center gap-4 mb-4">
                   <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-400 text-lg">
                      {event.etablissement?.nom?.[0] || '?'}
                   </div>
                   <div>
                      <p className="font-bold text-gray-900 leading-tight">{event.etablissement?.nom || 'N/A'}</p>
                      <p className="text-xs text-gray-500">{event.etablissement?.secteur || 'N/A'}</p>
                   </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-gray-100">
                   {event.contactOrganisateur && (
                      <a href={`tel:${event.contactOrganisateur}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[hsl(213,80%,28%)] transition-colors p-2 hover:bg-gray-50 rounded-lg">
                         <Phone className="w-4 h-4" />
                         {event.contactOrganisateur}
                      </a>
                   )}
                   {event.emailContact && (
                      <a href={`mailto:${event.emailContact}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[hsl(213,80%,28%)] transition-colors p-2 hover:bg-gray-50 rounded-lg">
                         <Mail className="w-4 h-4" />
                         {t('buttons.contact_email')}
                      </a>
                   )}
                </div>
             </motion.div>

             {/* Downloads / Reports (Protected) */}
             {isEnded && event.bilanDescription && (
                <PermissionGuard permission="evenements.report">
                   <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 }}
                      className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-100 shadow-sm"
                   >
                      <h3 className="text-lg font-bold text-emerald-900 mb-2 flex items-center gap-2">
                         <CheckCircle className="w-5 h-5" />
                         {t('labels.report')}
                      </h3>
                      <p className="text-emerald-700/80 text-sm mb-4">
                         {t('labels.report_hint')}
                      </p>
                      
                      {event.compteRenduUrl && (
                         <a 
                           href={event.compteRenduUrl}
                           target="_blank" 
                           rel="noopener noreferrer"
                           className="flex items-center justify-center gap-2 w-full py-2 bg-white text-emerald-700 font-bold rounded-xl shadow-sm hover:shadow-md transition-all text-sm border border-emerald-200"
                         >
                            <Download className="w-4 h-4" />
                            {t('buttons.download_report')}
                         </a>
                      )}
                   </motion.div>
                </PermissionGuard>
             )}
          </div>

        </div>
      </div>

      {/* ==================== GALLERY LIGHTBOX ==================== */}
      <AnimatePresence>
        {showGallery && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4 backdrop-blur-sm"
            onClick={() => setShowGallery(false)}
          >
            <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors p-2 z-10">
               <X className="w-10 h-10" />
            </button>
            
            <motion.div 
               key={activeImage}
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative w-full max-w-6xl h-[80vh] rounded-lg overflow-hidden flex items-center justify-center" 
               onClick={e => e.stopPropagation()}
            >
               <OptimizedImage
                  src={images[activeImage].urlPublique}
                  alt="Gallery"
                  fill
                  className="object-contain"
               />
            </motion.div>
            
            {images.length > 1 && (
               <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-6 items-center">
                  <button 
                     onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p - 1 + images.length) % images.length) }} 
                     className="p-4 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 hover:scale-110 transition-all"
                  >
                     <ChevronLeft className="w-6 h-6" />
                  </button>
                  <span className="text-white/70 font-mono font-medium text-lg">
                    {activeImage + 1} / {images.length}
                  </span>
                  <button 
                     onClick={(e) => { e.stopPropagation(); setActiveImage((p) => (p + 1) % images.length) }} 
                     className="p-4 bg-white/10 rounded-full hover:bg-white/20 text-white backdrop-blur-sm border border-white/10 hover:scale-110 transition-all"
                  >
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
