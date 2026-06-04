'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { 
  ArrowLeft, Target, Calendar, Users, MapPin, Share2, Loader2, Eye, 
  User, Tag, Sparkles, Building2, Heart, Mail, Phone, ExternalLink 
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';
import { cn } from '@/lib/utils';
import { OptimizedImage } from '@/components/ui/OptimizedImage';

interface Campagne {
  id: number;
  titre: string;
  titreAr?: string;
  description?: string;
  descriptionAr?: string;
  dateDebut?: string;
  dateFin?: string;
  objectif?: number;
  progression?: number;
  imageUrl?: string;
  unite?: string;
  statut?: string;
  lieu?: string;
  type?: string;
  contenu?: string;
  contenuAr?: string;
  nombreVues?: number;
  auteur?: { prenom: string; nom: string } | null;
  createdAt?: string;
  isOrganiseParProvince?: boolean;
  sousCouvertProvince?: boolean;
  lieuEtablissement?: { 
    id: number; 
    nom: string; 
    nomArabe?: string; 
    secteur: string;
    adresseComplete?: string;
    quartierDouar?: string;
    commune?: {
      id: number;
      nom: string;
      nomArabe?: string;
    };
  } | null;
}

export default function CampagneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();
  const locale = useLocale();
  const t = useTranslations('campaigns.detail');
  const tTypes = useTranslations('campaigns.types');
  const tErrors = useTranslations('campaigns.errors');
  const tEvent = useTranslations('event_page');
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [participating, setParticipating] = useState(false);
  const [liked, setLiked] = useState(false);
  const [error, setError] = useState(false);

  // ECC Hook
  const { data: rawData, isLoading: loading, error: fetchError, mutate: refreshCampagne } = useData(`/api/campagnes/${params.id}`);
  const participateMutation = useMutation(`/api/campagnes/${params.id}`);

  useEffect(() => {
    if (fetchError) {
      setError(true);
    }
    if (rawData) {
      const mappedData = {
        ...rawData,
        imageUrl: rawData.imagePrincipale || rawData.imageCouverture,
        objectif: rawData.objectifParticipations,
        progression: rawData.nombreParticipations || 0,
        statut: rawData.isActive ? 'EN_COURS' : rawData.statut,
        isOrganiseParProvince: rawData.isOrganiseParProvince,
        sousCouvertProvince: rawData.sousCouvertProvince,
      };
      setCampagne(mappedData);
    }
  }, [rawData, fetchError]);

  const handleParticipate = async () => {
    if (!session) {
      toast.error(t('auth_required'));
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    setParticipating(true);
    try {
      await participateMutation.post({});
      toast.success(t('participation_success'));
      await refreshCampagne();
    } catch (err: any) {
      toast.error(err.message || tErrors('participation_error'));
    } finally {
      setParticipating(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: campagne?.titre, url });
      } catch (e) { /* cancelled */ }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t('link_copied'));
      } catch (err) {
        toast.error(t('copy_failed'));
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 animate-spin text-gov-gold" />
      </div>
    );
  }

  if (error || !campagne) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <Target className="w-20 h-20 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('not_found_title')}</h1>
        <p className="text-gray-500 mb-6">{t('not_found_desc')}</p>
        <Link href="/campagnes" className="inline-flex items-center gap-2 px-6 py-3 bg-gov-gold text-gray-900 rounded-xl hover:bg-gov-gold-dark hover:text-white transition-colors">
          <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
          {t('back_to_list')}
        </Link>
      </div>
    );
  }

  const rawProgress = campagne.objectif ? ((campagne.progression || 0) / campagne.objectif) * 100 : 0;
  const displayProgress = isNaN(rawProgress) ? 0 : rawProgress;

  const getPreciseStatus = () => {
    if (!campagne.dateFin) return t('status_continuous');
    const end = new Date(campagne.dateFin);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const diffDays = Math.max(0, Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    if (diffDays === 0) return t('status_finishes_today');
    return t('status_days_left', { count: diffDays });
  };

  const dateRangeStr = (() => {
    if (!campagne.dateDebut) return locale === 'ar' ? 'مستمر' : 'En continu';
    const startStr = new Date(campagne.dateDebut).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    if (campagne.dateFin) {
      const endStr = new Date(campagne.dateFin).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
      if (campagne.dateDebut.split('T')[0] !== campagne.dateFin.split('T')[0]) {
        return locale === 'ar' ? `من ${startStr} إلى ${endStr}` : `Du ${startStr} au ${endStr}`;
      }
    }
    return startStr;
  })();

  const fullLocationStr = (() => {
    const parts: string[] = [];
    if (campagne.lieu) parts.push(campagne.lieu);
    if (campagne.lieuEtablissement) {
      parts.push(locale === 'ar' && campagne.lieuEtablissement.nomArabe ? campagne.lieuEtablissement.nomArabe : campagne.lieuEtablissement.nom);
      if (campagne.lieuEtablissement.quartierDouar) parts.push(campagne.lieuEtablissement.quartierDouar);
      if (campagne.lieuEtablissement.adresseComplete) parts.push(campagne.lieuEtablissement.adresseComplete);
      if (campagne.lieuEtablissement.commune) {
        parts.push(locale === 'ar' ? (campagne.lieuEtablissement.commune.nomArabe || campagne.lieuEtablissement.commune.nom) : campagne.lieuEtablissement.commune.nom);
      }
    }
    return parts.length > 0 ? parts.join(', ') : (locale === 'ar' ? 'عمالة مديونة' : 'Province de Médiouna');
  })();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative min-h-[500px] lg:h-[60vh] flex flex-col justify-end overflow-hidden bg-gray-900">
        {campagne.imageUrl ? (
          <div className="absolute inset-0 z-0">
            <OptimizedImage
              src={campagne.imageUrl}
              alt={locale === 'ar' && campagne.titreAr ? campagne.titreAr : campagne.titre}
              fill
              type="evenement"
              className="object-cover opacity-60"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213,80%,15%)] via-[hsl(213,80%,15%)]/60 to-[hsl(213,80%,15%)]/30 backdrop-blur-[2px]" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-gov-gold/30 to-gov-green/30">
            <div className="absolute inset-0 bg-black/20 pattern-grid-lg opacity-20" />
          </div>
        )}

        {/* Navigation & Actions */}
        <div className="absolute top-0 left-0 right-0 pt-24 px-4 md:px-8 z-[60]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="group flex items-center gap-2 px-5 py-2.5 bg-black/30 backdrop-blur-md text-white rounded-full hover:bg-black/40 transition-all border border-white/10"
            >
              <ArrowLeft className={`w-5 h-5 group-hover:-translate-x-1 transition-transform ${locale === 'ar' ? 'rotate-180' : ''}`} />
              <span className="font-medium hidden sm:inline">{tEvent('buttons.back')}</span>
            </button>

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
                <span className="font-medium hidden sm:inline">{tEvent('buttons.share')}</span>
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
              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gov-gold text-white font-bold text-sm rounded-full shadow-lg backdrop-blur-md">
                <Target className="w-4 h-4" />
                {campagne.statut === 'EN_COURS' ? t('status_active') : t('status_simple')}
              </span>
              
              {campagne.type && (
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white font-bold text-sm rounded-full backdrop-blur-md border border-white/20">
                  <Tag className="w-4 h-4" />
                  {tTypes(campagne.type)}
                </span>
              )}

              <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-black/30 backdrop-blur-md text-white rounded-full text-sm font-medium border border-white/10">
                <Eye className="w-4 h-4" />
                {campagne.nombreVues || 0} {tEvent('labels.views')}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1 
              dir="auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-8 max-w-5xl leading-tight text-shadow-sm"
            >
              {locale === 'ar' && campagne.titreAr ? campagne.titreAr : campagne.titre}
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
                  <Calendar className="w-6 h-6 text-gov-gold" />
                </div>
                <div>
                  <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-0.5">{tEvent('labels.date_time')}</p>
                  <p className="font-bold text-lg leading-tight">{dateRangeStr}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                  <MapPin className="w-6 h-6 text-gov-green" />
                </div>
                <div>
                  <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-0.5">{tEvent('labels.location')}</p>
                  <p className="font-bold text-lg leading-tight truncate max-w-[200px]" title={fullLocationStr}>
                    {campagne.lieu || (locale === 'ar' ? 'عمالة مديونة' : 'Province de Médiouna')}
                  </p>
                  <p className="text-xs opacity-80 truncate max-w-[200px]" title={fullLocationStr}>{fullLocationStr}</p>
                </div>
              </div>

              {/* Organizer / Patrons */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl backdrop-blur-sm border border-white/5 hover:bg-white/10 transition-colors">
                <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/10 shrink-0">
                  <Building2 className="w-6 h-6 text-blue-300" />
                </div>
                <div>
                  <p className="text-sm text-white/50 uppercase tracking-wider font-bold mb-0.5">{tEvent('labels.organizer')}</p>
                  <p className="font-bold text-lg leading-tight line-clamp-2">
                    {campagne.lieuEtablissement ? (locale === 'ar' ? (campagne.lieuEtablissement.nomArabe || campagne.lieuEtablissement.nom) : campagne.lieuEtablissement.nom) : 
                     (locale === 'ar' ? 'عمالة إقليم مديونة' : 'Province de Médiouna')}
                  </p>
                  {campagne.sousCouvertProvince ? (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[hsl(var(--gov-gold)/0.15)] border border-[hsl(var(--gov-gold)/0.3)] text-gov-gold text-xs font-bold shadow-sm backdrop-blur-md">
                      <Sparkles className="w-3 h-3" />
                      {locale === 'ar' ? 'تحت إشراف عمالة إقليم مديونة' : 'Sous couvert de la Province de Médiouna'}
                    </div>
                  ) : (
                    <div className="mt-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold border",
                        campagne.isOrganiseParProvince 
                          ? "bg-[hsl(var(--gov-gold)/0.1)] border-[hsl(var(--gov-gold)/0.25)] text-gov-gold" 
                          : "bg-white/10 border-white/20 text-white"
                      )}>
                        {campagne.isOrganiseParProvince ? (locale === 'ar' ? 'رسمي - عمالة مديونة' : 'Officiel - Province') : tEvent('labels.official_event')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 -mt-8 relative z-30">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-6 border-b border-gray-100 pb-4">
                <div className="p-3 rounded-xl bg-gov-blue/5">
                  <Sparkles className="w-6 h-6 text-gov-blue" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{t('about_title')}</h2>
              </div>
              <div 
                className="prose prose-lg text-gray-700 leading-relaxed whitespace-pre-wrap text-justify"
                dir="auto"
              >
                {locale === 'ar' && campagne.descriptionAr ? campagne.descriptionAr : campagne.description}
              </div>

              {campagne.contenu && (
                <div 
                  className="prose prose-lg text-gray-700 leading-relaxed whitespace-pre-wrap text-justify mt-6 pt-6 border-t border-gray-100"
                  dir="auto"
                >
                  {locale === 'ar' && campagne.contenuAr ? campagne.contenuAr : campagne.contenu}
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Progression & Participate Card */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100 sticky top-24 text-center"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center justify-center gap-2">
                <Target className="w-5 h-5 text-gov-gold" />
                {t('progression_title')}
              </h3>

              {campagne.objectif && (
                <>
                  <div className="text-center mb-4">
                    <div className="text-4xl font-black text-gov-gold">{displayProgress.toFixed(0)}%</div>
                    <div className="text-gray-500 font-bold">{t('goal_reached')}</div>
                  </div>

                  <div className="h-4 bg-gov-gold/10 rounded-full overflow-hidden mb-4 border border-gov-gold/5">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${displayProgress}%` }}
                      transition={{ duration: 1, ease: "easeOut" }}
                      className="h-full bg-gradient-to-r from-gov-gold to-orange-500 rounded-full shadow-[0_0_10px_rgba(212,175,55,0.3)]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-center mb-6">
                    <div>
                      <div className="text-2xl font-black text-gray-900">{(campagne.progression || 0).toLocaleString()}</div>
                      <div className="text-sm text-gray-500 font-bold">{campagne.unite || t('participants_default_unit')}</div>
                    </div>
                    <div>
                      <div className="text-2xl font-black text-gray-900">{campagne.objectif.toLocaleString()}</div>
                      <div className="text-sm text-gray-500 font-bold">{t('goal_label')}</div>
                    </div>
                  </div>
                </>
              )}

              <button 
                onClick={handleParticipate}
                disabled={participating || campagne?.statut !== 'EN_COURS'}
                className="w-full py-4 bg-gradient-to-r from-gov-blue-dark to-gov-blue text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20"
              >
                {participating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    {t('processing')}
                  </>
                ) : (
                  t('participate_btn')
                )}
              </button>

              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center">
                <div className="flex items-center gap-3 text-gov-blue font-black bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100/50 shadow-sm">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>{getPreciseStatus()}</span>
                </div>
              </div>
            </motion.div>

            {/* Organization Info */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-xl shadow-gray-200/50 border border-gray-100"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-center gap-2 border-b border-gray-100 pb-4">
                <Building2 className="w-5 h-5 text-gray-400" />
                {tEvent('labels.organization')}
              </h3>
              
              <div className="flex flex-col items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-gov-blue/5 rounded-2xl flex items-center justify-center font-bold text-gov-blue text-xl border border-gov-blue/10 shadow-inner">
                  {campagne.lieuEtablissement ? (locale === 'ar' ? (campagne.lieuEtablissement.nomArabe?.[0] || campagne.lieuEtablissement.nom?.[0]) : campagne.lieuEtablissement.nom?.[0]) : 'M'}
                </div>
                <div>
                  <p className="font-bold text-gray-900 leading-tight mt-0.5 text-center">
                    {campagne.lieuEtablissement ? (locale === 'ar' ? (campagne.lieuEtablissement.nomArabe || campagne.lieuEtablissement.nom) : campagne.lieuEtablissement.nom) : 
                     (locale === 'ar' ? 'عمالة إقليم مديونة' : 'Province de Médiouna')}
                  </p>
                  {campagne.sousCouvertProvince ? (
                    <div className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gov-gold/5 border border-gov-gold/30 text-gov-gold text-xs font-bold shadow-sm">
                      <Sparkles className="w-3.5 h-3.5" />
                      {locale === 'ar' ? 'تحت إشراف عمالة إقليم مديونة' : 'Sous couvert de la Province de Médiouna'}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-500 mt-0.5 text-center">
                      {campagne.lieuEtablissement?.secteur || tEvent('labels.provincial_organization')}
                    </p>
                  )}
                </div>
              </div>

              {campagne.auteur && (
                <div className="flex flex-col items-center justify-center space-y-3 pt-5 border-t border-gray-100">
                  <div className="flex items-center justify-center gap-3 text-sm font-medium text-gray-700 p-2 bg-gray-50 rounded-xl w-full">
                    <User className="w-4 h-4 text-gray-400" />
                    <span>{campagne.auteur.prenom} {campagne.auteur.nom}</span>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
