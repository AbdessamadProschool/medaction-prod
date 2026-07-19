'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { 
  ArrowLeft, Target, Calendar, Users, MapPin, Share2, Loader2, Eye, 
  User, Tag, Sparkles, Building2, Heart, CheckCircle, Clock, 
  TrendingUp, Info, Star, Award
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';
import { useData } from '@/hooks/use-data';
import { useMutation } from '@/hooks/use-mutation';
import { cn, decodeHtmlEntities } from '@/lib/utils';
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

  const { data: rawData, isLoading: loading, error: fetchError, mutate: refreshCampagne } = useData(`/api/campagnes/${params.id}`);
  const participateMutation = useMutation(`/api/campagnes/${params.id}`);

  useEffect(() => {
    if (fetchError) setError(true);
    if (rawData) {
      const actualData = rawData.data || rawData;
      const mappedData = {
        ...actualData,
        imageUrl: actualData.imagePrincipale || actualData.imageCouverture,
        objectif: actualData.objectifParticipations,
        progression: actualData.nombreParticipations || 0,
        statut: actualData.isActive ? 'EN_COURS' : actualData.statut,
        isOrganiseParProvince: actualData.isOrganiseParProvince,
        sousCouvertProvince: actualData.sousCouvertProvince,
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
      try { await navigator.share({ title: campagne?.titre, url }); } catch (e) {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success(t('link_copied'));
      } catch { toast.error(t('copy_failed')); }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 animate-spin text-[hsl(var(--gov-gold))]" />
          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
            {locale === 'ar' ? 'جاري التحميل...' : 'Chargement...'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !campagne) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50">
        <Target className="w-20 h-20 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('not_found_title')}</h1>
        <p className="text-gray-500 mb-6">{t('not_found_desc')}</p>
        <Link href="/campagnes" className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--gov-gold))] text-white rounded-xl hover:opacity-90 transition-opacity">
          <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
          {t('back_to_list')}
        </Link>
      </div>
    );
  }

  const rawProgress = campagne.objectif ? ((campagne.progression || 0) / campagne.objectif) * 100 : 0;
  const displayProgress = isNaN(rawProgress) ? 0 : Math.min(rawProgress, 100);

  const getPreciseStatus = () => {
    if (!campagne.dateFin) return t('status_continuous');
    const end = new Date(campagne.dateFin);
    end.setHours(23, 59, 59, 999);
    const now = new Date();
    if (now > end) return locale === 'ar' ? 'انتهت الحملة' : 'Campagne terminée';
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
    const addPart = (val: any) => {
      if (val && typeof val === 'string') {
        const cleaned = val.trim();
        if (cleaned && cleaned.toLowerCase() !== 'null' && cleaned.toLowerCase() !== 'undefined') parts.push(cleaned);
      }
    };
    addPart(campagne.lieu);
    if (campagne.lieuEtablissement) {
      addPart(locale === 'ar' && campagne.lieuEtablissement.nomArabe ? campagne.lieuEtablissement.nomArabe : campagne.lieuEtablissement.nom);
      addPart(campagne.lieuEtablissement.quartierDouar);
      addPart(campagne.lieuEtablissement.adresseComplete);
      if (campagne.lieuEtablissement.commune) {
        addPart(locale === 'ar' ? (campagne.lieuEtablissement.commune.nomArabe || campagne.lieuEtablissement.commune.nom) : campagne.lieuEtablissement.commune.nom);
      }
    }
    return parts.length > 0 ? parts.join(', ') : (locale === 'ar' ? 'عمالة مديونة' : 'Province de Médiouna');
  })();

  const isEnCours = campagne.statut === 'EN_COURS';
  const isDateExpired = !!(campagne?.dateFin && new Date() > new Date(new Date(campagne.dateFin).setHours(23, 59, 59)));

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* ── Hero Banner ── */}
      <div className="relative min-h-[420px] sm:min-h-[500px] lg:h-[58vh] flex flex-col justify-end overflow-hidden bg-[hsl(var(--gov-blue-dark))]">
        {campagne.imageUrl ? (
          <div className="absolute inset-0 z-0">
            <OptimizedImage
              src={campagne.imageUrl}
              alt={locale === 'ar' && campagne.titreAr ? campagne.titreAr : campagne.titre}
              fill
              type="evenement"
              className="object-cover opacity-50"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(213,80%,12%)] via-[hsl(213,80%,15%)]/75 to-[hsl(213,80%,20%)]/40" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-gradient-to-br from-[hsl(var(--gov-blue-dark))] to-[hsl(213,60%,28%)]" />
            <div className="absolute inset-0 gov-pattern opacity-20" />
          </div>
        )}

        {/* Nav bar */}
        <div className="absolute top-0 start-0 end-0 pt-20 sm:pt-24 px-4 md:px-8 z-[60]">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-2 px-4 py-2.5 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/55 transition-all border border-white/15 text-sm font-semibold"
            >
              <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
              <span className="hidden sm:inline">{tEvent('buttons.back')}</span>
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLiked(!liked)}
                className={`p-2.5 rounded-full backdrop-blur-md border transition-all ${liked ? 'bg-red-500/80 border-red-400 text-white' : 'bg-black/40 border-white/15 text-white hover:bg-black/55'}`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-current' : ''}`} />
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="flex items-center gap-2 px-4 py-2.5 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/55 border border-white/15 text-sm font-semibold"
              >
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">{tEvent('buttons.share')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hero content */}
        <div className="relative z-10 w-full px-4 md:px-8 pb-8 pt-4">
          <div className="max-w-7xl mx-auto">
            {/* Badges */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex flex-wrap items-center gap-2 mb-4"
            >
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wide",
                isEnCours && !isDateExpired
                  ? "bg-green-500 text-white"
                  : "bg-white/20 text-white border border-white/30"
              )}>
                <span className={cn("w-1.5 h-1.5 rounded-full", isEnCours && !isDateExpired ? "bg-white animate-pulse" : "bg-white/60")} />
                {isEnCours && !isDateExpired ? (locale === 'ar' ? 'جارية' : 'En cours') : (locale === 'ar' ? 'منتهية' : 'Terminée')}
              </span>

              {campagne.type && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/15 text-white text-xs font-bold rounded-full border border-white/20">
                  <Tag className="w-3.5 h-3.5" />
                  {tTypes(campagne.type)}
                </span>
              )}

              {campagne.isOrganiseParProvince && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[hsl(var(--gov-gold)/0.25)] text-[hsl(var(--gov-gold))] text-xs font-bold rounded-full border border-[hsl(var(--gov-gold)/0.4)]">
                  <Award className="w-3.5 h-3.5" />
                  {locale === 'ar' ? 'رسمي - إقليم مديونة' : 'Officiel - Province'}
                </span>
              )}

              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black/30 text-white text-xs font-medium rounded-full border border-white/10">
                <Eye className="w-3.5 h-3.5" />
                {(campagne.nombreVues || 0).toLocaleString()} {tEvent('labels.views')}
              </span>
            </motion.div>

            {/* Title */}
            <motion.h1
              dir="auto"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white mb-6 max-w-4xl leading-tight drop-shadow-sm"
            >
              {locale === 'ar' && campagne.titreAr ? campagne.titreAr : campagne.titre}
            </motion.h1>

            {/* Key info grid - 2 cols on mobile, 4 on desktop */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-3"
            >
              {/* Date */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Calendar className="w-4 h-4 text-[hsl(var(--gov-gold))] shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{tEvent('labels.date_time')}</p>
                </div>
                <p className="font-bold text-white text-sm leading-tight">{dateRangeStr}</p>
              </div>

              {/* Location */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{tEvent('labels.location')}</p>
                </div>
                <p className="font-bold text-white text-sm leading-tight line-clamp-2">{fullLocationStr}</p>
              </div>

              {/* Organizer */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <Building2 className="w-4 h-4 text-blue-300 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">{tEvent('labels.organizer')}</p>
                </div>
                <p className="font-bold text-white text-sm leading-tight line-clamp-2">
                  {campagne.lieuEtablissement
                    ? (locale === 'ar' ? (campagne.lieuEtablissement.nomArabe || campagne.lieuEtablissement.nom) : campagne.lieuEtablissement.nom)
                    : (locale === 'ar' ? 'عمالة إقليم مديونة' : 'Province de Médiouna')}
                </p>
              </div>

              {/* Progress / Views */}
              <div className="bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl p-3 sm:p-4">
                <div className="flex items-center gap-2 mb-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-300 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70">
                    {campagne.objectif ? t('progression_title') : (locale === 'ar' ? 'المشاركة' : 'Participation')}
                  </p>
                </div>
                {campagne.objectif ? (
                  <>
                    <p className="font-black text-white text-lg leading-none">{displayProgress.toFixed(0)}<span className="text-sm font-bold text-white/70">%</span></p>
                    <p className="text-[10px] text-white/60 mt-0.5">{(campagne.progression || 0).toLocaleString()} / {campagne.objectif.toLocaleString()}</p>
                  </>
                ) : (
                  <p className="font-bold text-white text-sm">{campagne.progression || 0} {campagne.unite || ''}</p>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">

          {/* Left - Description */}
          <div className="lg:col-span-2 space-y-6">

            {/* Description card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <Info className="w-5 h-5 text-[hsl(var(--gov-blue))]" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">{t('about_title')}</h2>
              </div>
              <div className="prose prose-sm sm:prose text-gray-700 leading-relaxed whitespace-pre-wrap" dir="auto">
                {decodeHtmlEntities(locale === 'ar' && campagne.descriptionAr ? campagne.descriptionAr : campagne.description || (locale === 'ar' ? 'لا يوجد وصف متاح.' : 'Aucune description disponible.'))}
              </div>

              {campagne.contenu && (
                <div className="prose prose-sm sm:prose text-gray-700 leading-relaxed whitespace-pre-wrap mt-6 pt-6 border-t border-gray-100" dir="auto">
                  {decodeHtmlEntities(locale === 'ar' && campagne.contenuAr ? campagne.contenuAr : campagne.contenu)}
                </div>
              )}
            </motion.div>

            {/* Essential details card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100"
            >
              <div className="flex items-center gap-3 mb-5 pb-4 border-b border-gray-100">
                <Star className="w-5 h-5 text-[hsl(var(--gov-gold))]" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  {locale === 'ar' ? 'معلومات الحملة' : 'Informations de la campagne'}
                </h2>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                {campagne.type && (
                  <div className="flex items-start gap-3">
                    <Tag className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        {locale === 'ar' ? 'النوع' : 'Type'}
                      </dt>
                      <dd className="text-sm font-semibold text-gray-800">{tTypes(campagne.type)}</dd>
                    </div>
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <Calendar className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                      {locale === 'ar' ? 'التاريخ' : 'Période'}
                    </dt>
                    <dd className="text-sm font-semibold text-gray-800">{dateRangeStr}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                      {locale === 'ar' ? 'المكان' : 'Lieu'}
                    </dt>
                    <dd className="text-sm font-semibold text-gray-800">{fullLocationStr}</dd>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Eye className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                  <div>
                    <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                      {locale === 'ar' ? 'المشاهدات' : 'Vues'}
                    </dt>
                    <dd className="text-sm font-semibold text-gray-800">{(campagne.nombreVues || 0).toLocaleString()}</dd>
                  </div>
                </div>
                {campagne.auteur && (
                  <div className="flex items-start gap-3">
                    <User className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        {locale === 'ar' ? 'المنسق' : 'Responsable'}
                      </dt>
                      <dd className="text-sm font-semibold text-gray-800">{campagne.auteur.prenom} {campagne.auteur.nom}</dd>
                    </div>
                  </div>
                )}
                {campagne.createdAt && (
                  <div className="flex items-start gap-3">
                    <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                    <div>
                      <dt className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        {locale === 'ar' ? 'تاريخ النشر' : 'Publié le'}
                      </dt>
                      <dd className="text-sm font-semibold text-gray-800">
                        {new Date(campagne.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </dd>
                    </div>
                  </div>
                )}
              </dl>
            </motion.div>
          </div>

          {/* Right - Sidebar */}
          <div className="space-y-4 sm:space-y-6">

            {/* Progression card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-base font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Target className="w-5 h-5 text-[hsl(var(--gov-gold))]" />
                {t('progression_title')}
              </h3>

              {campagne.objectif && (
                <>
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <p className="text-3xl font-black text-[hsl(var(--gov-gold))]">{displayProgress.toFixed(0)}%</p>
                      <p className="text-xs text-gray-500 font-medium">{t('goal_reached')}</p>
                    </div>
                    <div className="text-end">
                      <p className="text-lg font-black text-gray-900">{campagne.objectif.toLocaleString()}</p>
                      <p className="text-xs text-gray-500">{t('goal_label')}</p>
                    </div>
                  </div>
                  <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${displayProgress}%` }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--gov-gold))] to-orange-400"
                    />
                  </div>
                  <p className="text-sm text-center text-gray-600 font-semibold">
                    {(campagne.progression || 0).toLocaleString()} {campagne.unite || t('participants_default_unit')}
                  </p>
                  <div className="border-t border-gray-100 mt-4 pt-4" />
                </>
              )}

              <button
                onClick={handleParticipate}
                disabled={participating || campagne?.statut !== 'EN_COURS' || isDateExpired}
                className="w-full py-3.5 bg-[hsl(var(--gov-blue))] text-white font-bold rounded-xl hover:bg-[hsl(var(--gov-blue-dark))] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {participating ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />{t('processing')}</>
                ) : isDateExpired ? (
                  locale === 'ar' ? 'انتهت الحملة' : 'Campagne terminée'
                ) : t('participate_btn')}
              </button>

              {/* Time remaining */}
              <div className="mt-4 flex items-center justify-center gap-2 px-3 py-2.5 bg-blue-50 rounded-xl border border-blue-100">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-bold text-blue-700">{getPreciseStatus()}</span>
              </div>
            </motion.div>

            {/* Organization card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 shadow-sm border border-gray-100"
            >
              <h3 className="text-base font-bold text-gray-900 mb-4 pb-3 border-b border-gray-100 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                {tEvent('labels.organization')}
              </h3>

              <div className="space-y-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">
                    {locale === 'ar' ? 'المنظِّم' : 'Organisateur'}
                  </p>
                  <p className="text-sm font-bold text-gray-800">
                    {campagne.lieuEtablissement
                      ? (locale === 'ar' ? (campagne.lieuEtablissement.nomArabe || campagne.lieuEtablissement.nom) : campagne.lieuEtablissement.nom)
                      : (locale === 'ar' ? 'عمالة إقليم مديونة' : 'Province de Médiouna')}
                  </p>
                  {campagne.lieuEtablissement?.secteur && (
                    <p className="text-xs text-gray-500 mt-0.5">{campagne.lieuEtablissement.secteur}</p>
                  )}
                </div>

                {campagne.sousCouvertProvince && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-[hsl(var(--gov-gold)/0.06)] border border-[hsl(var(--gov-gold)/0.25)] rounded-lg">
                    <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--gov-gold))]" />
                    <p className="text-xs font-bold text-[hsl(var(--gov-gold-dark))]">
                      {locale === 'ar' ? 'تحت إشراف عمالة إقليم مديونة' : 'Sous couvert de la Province de Médiouna'}
                    </p>
                  </div>
                )}

                {campagne.auteur && (
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--gov-blue)/0.08)] flex items-center justify-center text-xs font-black text-[hsl(var(--gov-blue))] shrink-0">
                      {campagne.auteur.prenom[0]}{campagne.auteur.nom[0]}
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium">{locale === 'ar' ? 'المنسق' : 'Responsable'}</p>
                      <p className="text-sm font-bold text-gray-800">{campagne.auteur.prenom} {campagne.auteur.nom}</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Status summary card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[hsl(var(--gov-blue-dark))] rounded-2xl sm:rounded-3xl p-5 sm:p-6"
            >
              <h3 className="text-sm font-black uppercase tracking-widest text-white/70 mb-4">
                {locale === 'ar' ? 'حالة الحملة' : 'État de la campagne'}
              </h3>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">{locale === 'ar' ? 'الحالة' : 'Statut'}</span>
                  <span className={cn(
                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black",
                    isEnCours && !isDateExpired ? "bg-green-500/20 text-green-400" : "bg-white/10 text-white/70"
                  )}>
                    <span className={cn("w-1.5 h-1.5 rounded-full", isEnCours && !isDateExpired ? "bg-green-400 animate-pulse" : "bg-white/40")} />
                    {isEnCours && !isDateExpired ? (locale === 'ar' ? 'جارية' : 'Active') : (locale === 'ar' ? 'منتهية' : 'Terminée')}
                  </span>
                </div>
                {campagne.dateFin && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">{locale === 'ar' ? 'الموعد النهائي' : 'Échéance'}</span>
                    <span className="text-sm font-bold text-white">{getPreciseStatus()}</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/80">{locale === 'ar' ? 'المشاهدات' : 'Vues'}</span>
                  <span className="text-sm font-bold text-white">{(campagne.nombreVues || 0).toLocaleString()}</span>
                </div>
                {campagne.objectif && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/80">{locale === 'ar' ? 'التقدم' : 'Progression'}</span>
                    <span className="text-sm font-bold text-[hsl(var(--gov-gold))]">{displayProgress.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
