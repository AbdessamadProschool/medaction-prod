'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { ArrowLeft, Target, Calendar, Users, MapPin, Share2, Loader2, Eye, User, Tag } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useLocale, useTranslations } from 'next-intl';

interface Campagne {
  id: number;
  titre: string;
  description?: string;
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
  nombreVues?: number;
  auteur?: { prenom: string; nom: string };
  createdAt?: string;
}

export default function CampagneDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const locale = useLocale();
  const t = useTranslations('campaigns.detail');
  const tTypes = useTranslations('campaigns.types');
  const tErrors = useTranslations('campaigns.errors');
  const [campagne, setCampagne] = useState<Campagne | null>(null);
  const [loading, setLoading] = useState(true);
  const [participating, setParticipating] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchCampagne = async () => {
      try {
        const response = await fetch(`/api/campagnes/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          // Mapping des données API vers le format local
          const mappedData = {
            ...data.data,
            imageUrl: data.data.imagePrincipale || data.data.imageCouverture,
            objectif: data.data.objectifParticipations,
            progression: data.data.nombreParticipations || 0,
            statut: data.data.isActive ? 'EN_COURS' : data.data.statut // Fallback pour affichage statut
          };
          setCampagne(mappedData);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error('Erreur:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchCampagne();
    }
  }, [params.id]);

  const handleParticipate = async () => {
    if (!session) {
      toast.error(t('auth_required'));
      router.push(`/login?callbackUrl=${encodeURIComponent(window.location.href)}`);
      return;
    }

    setParticipating(true);
    try {
      const res = await fetch(`/api/campagnes/${params.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}), // Corps vide pour participation simple
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(t('participation_success'));
        // Rafraîchir les données
        const updatedRes = await fetch(`/api/campagnes/${params.id}`);
        if (updatedRes.ok) {
           const updatedData = await updatedRes.json();
           const mappedData = {
            ...updatedData.data,
            imageUrl: updatedData.data.imagePrincipale || updatedData.data.imageCouverture,
            objectif: updatedData.data.objectifParticipations,
            progression: updatedData.data.nombreParticipations || 0,
            statut: updatedData.data.isActive ? 'EN_COURS' : updatedData.data.statut
          };
          setCampagne(mappedData);
        }
      } else {
        toast.error(data.error || tErrors('participation_error'));
      }
    } catch (error) {
      toast.error(tErrors('connection_error'));
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-gov-gold" />
      </div>
    );
  }

  if (error || !campagne) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Target className="w-20 h-20 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('not_found_title')}</h1>
        <p className="text-gray-500 mb-6">{t('not_found_desc')}</p>
        <Link href="/campagnes" className="inline-flex items-center gap-2 px-6 py-3 bg-gov-gold text-white rounded-xl hover:bg-gov-gold-dark transition-colors">
          <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
          {t('back_to_list')}
        </Link>
      </div>
    );
  }

  const rawProgress = campagne.objectif ? ((campagne.progression || 0) / campagne.objectif) * 100 : 0;
  const displayProgress = isNaN(rawProgress) ? 0 : rawProgress;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

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

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[400px] bg-gray-900">
        {campagne.imageUrl ? (
          <Image
            src={campagne.imageUrl}
            alt={campagne.titre}
            fill
            className="object-cover opacity-60"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-gov-gold/30 to-gov-green/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
        
        {/* Back button */}
        <div className={`absolute top-6 ${locale === 'ar' ? 'right-6' : 'left-6'} z-10`}>
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm text-white rounded-xl hover:bg-white/20 transition-colors shadow-sm"
          >
            <ArrowLeft className={`w-4 h-4 ${locale === 'ar' ? 'rotate-180' : ''}`} />
            {t('back')}
          </button>
        </div>

        {/* Content */}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-gray-900 via-gray-900/80 to-transparent pt-32 pb-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-4xl"
            >
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-gov-gold/20 text-gov-gold-light rounded-full text-sm font-bold border border-gov-gold/30">
                  <Target className="w-4 h-4" />
                  {campagne.statut === 'EN_COURS' ? t('status_active') : t('status_simple')}
                </span>
                {campagne.type && (
                  <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 text-white rounded-full text-sm font-semibold backdrop-blur-sm border border-white/20">
                    <Tag className="w-4 h-4" />
                    {t('sector_prefix')} {tTypes(campagne.type)}
                  </span>
                )}
              </div>
              
              <h1 className={`text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6 drop-shadow-lg ${locale === 'ar' ? 'font-cairo leading-tight' : 'leading-tight'}`}>
                {campagne.titre}
              </h1>
              
              <div className="flex flex-wrap items-center gap-y-4 gap-x-8 text-white text-sm md:text-base font-semibold drop-shadow-md">
                {campagne.dateDebut && (
                  <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                    <Calendar className="w-5 h-5 text-gov-gold-light" />
                    {formatDate(campagne.dateDebut)} {campagne.dateFin && campagne.dateFin !== campagne.dateDebut ? `- ${formatDate(campagne.dateFin)}` : ''}
                  </span>
                )}
                
                {campagne.auteur && (
                  <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                    <User className="w-5 h-5 text-blue-300" />
                    {campagne.auteur.prenom} {campagne.auteur.nom}
                  </span>
                )}
                
                <span className="flex items-center gap-2 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                  <Eye className="w-5 h-5 text-emerald-300" />
                  {t('views', { count: campagne.nombreVues || 0 })}
                </span>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl shadow-lg p-8"
            >
               <h2 className={`text-2xl font-black text-gray-900 mb-6 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('about_title')}</h2>
              <div className="prose prose-lg max-w-none">
                <p className={`text-gray-600 leading-relaxed whitespace-pre-line ${locale === 'ar' ? 'text-lg font-medium' : ''}`}>
                  {campagne.description}
                </p>
                {campagne.contenu && (
                  <>
                    <hr className="my-6 border-gray-100" />
                    <div className={`text-gray-800 leading-relaxed whitespace-pre-line ${locale === 'ar' ? 'text-lg leading-loose' : ''}`}>
                      {campagne.contenu}
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <h3 className={`text-lg font-black text-gray-900 mb-4 ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('progression_title')}</h3>
              
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

                  <div className="grid grid-cols-2 gap-4 text-center">
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

              <div className="mt-6 pt-6 border-t border-gray-100 flex items-center justify-center">
                <div className="flex items-center gap-3 text-[hsl(213,80%,28%)] font-black bg-blue-50 px-4 py-2.5 rounded-xl border border-blue-100/50 shadow-sm">
                  <Calendar className="w-5 h-5 text-blue-500" />
                  <span>{getPreciseStatus()}</span>
                </div>
              </div>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl shadow-lg p-6"
            >
              <button 
                onClick={handleParticipate}
                disabled={participating || campagne?.statut !== 'EN_COURS'}
                className="w-full py-4 bg-gradient-to-r from-[hsl(213,80%,20%)] to-[hsl(213,80%,28%)] text-white font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              
              <button 
                onClick={handleShare}
                className="w-full mt-3 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                {t('share_btn')}
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
}
