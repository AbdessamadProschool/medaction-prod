'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import {
  FileText,
  Clock,
  CheckCircle,
  Star,
  Building2,
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Calendar,
  MapPin,
  Loader2,
  Users,
  Map,
} from 'lucide-react';

interface Commune {
  id: number;
  nom: string;
  nomArabe: string | null;
  population: number | null;
  superficieKm2: number | null;
}

interface Etablissement {
  id: number;
  nom: string;
  secteur: string;
  noteMoyenne: number;
  nombreEvaluations: number;
  _count: {
    reclamations: number;
    evaluations: number;
    evenements: number;
  };
}

interface Stats {
  commune: Commune | null;
  reclamations: {
    total: number;
    enAttente: number;
    resolues: number;
    aujourdHui: number;
    tauxResolution: number;
  };
  etablissements: {
    total: number;
    liste: Etablissement[];
    noteMoyenne: number;
  };
  parCategorie: { categorie: string; count: number }[];
  parSecteur: { secteur: string; count: number }[];
}

interface Reclamation {
  id: number;
  titre: string;
  categorie: string;
  dateAffectation: string;
  isResolue: boolean;
  joursDepuisAffectation: number;
  commune: { nom: string };
  user: { nom: string; prenom: string };
}

const secteurColors: Record<string, string> = {
  EDUCATION: 'bg-gov-blue text-white',
  SANTE: 'bg-gov-green text-white',
  SPORT: 'bg-gov-gold text-gray-900',
  CULTUREL: 'bg-purple-600 text-white',
  SOCIAL: 'bg-pink-600 text-white',
  AUTRE: 'bg-gray-500 text-white',
};

export default function AutoriteDashboard() {
  const { data: session } = useSession();
  const t = useTranslations('authority_dashboard');
  const tSectors = useTranslations('admin_performance_tab.filters.sectors');
  const locale = useLocale();
  const isRtl = locale === 'ar';

  const [stats, setStats] = useState<Stats | null>(null);
  const [recentReclamations, setRecentReclamations] = useState<Reclamation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, reclamationsRes] = await Promise.all([
          fetch('/api/autorite/stats'),
          fetch('/api/autorite/reclamations?limit=5&statut=en_attente'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        } else {
          const errorData = await statsRes.json();
          setError(errorData.message || errorData.error);
        }

        if (reclamationsRes.ok) {
          const reclamationsData = await reclamationsRes.json();
          setRecentReclamations(reclamationsData.data || []);
        }
      } catch (err) {
        console.error('Erreur chargement données:', err);
        setError('Erreur de connexion au serveur');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-10 h-10 text-gov-blue animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="gov-card p-8 text-center max-w-md bg-white shadow-lg rounded-xl border border-red-100">
          <AlertCircle className="w-16 h-16 text-gov-gold mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">{isRtl ? 'الإعداد مطلوب' : 'Configuration requise'}</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  const communeName = isRtl && stats?.commune?.nomArabe ? stats.commune.nomArabe : stats?.commune?.nom;

  return (
    <div className={`space-y-6 ${isRtl ? 'font-cairo' : ''}`}>
      {/* Header avec info commune */}
      <div className="gov-card p-6 bg-gradient-to-l from-[#1e4066] to-[#2c5282] text-white rounded-xl shadow-lg relative overflow-hidden">
        {/* Motif décoratif d'arrière-plan */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20 shadow-inner">
              <Map className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
                {t('commune_prefix', { name: communeName })}
              </h1>
              {!isRtl && stats?.commune?.nomArabe && (
                <p className="text-white/80 font-cairo text-lg" dir="rtl">{stats.commune.nomArabe}</p>
              )}
               {isRtl && stats?.commune?.nom && (
                <p className="text-white/80 font-outfit text-sm" dir="ltr">{stats.commune.nom}</p>
              )}
              <p className="text-white/70 mt-2 text-sm md:text-base font-light">
                {t('welcome_message', { name: session?.user?.prenom })}
              </p>
            </div>
          </div>
          
          <div className="flex flex-row md:flex-col gap-4 md:gap-2 text-white/90 bg-white/10 p-3 rounded-lg backdrop-blur-sm border border-white/10">
            {stats?.commune?.population && (
              <div className="flex items-center gap-2">
                <Users size={16} className="text-gov-gold" />
                <span className="font-medium">{t('inhabitants', { count: stats.commune.population.toLocaleString(locale) })}</span>
              </div>
            )}
            {stats?.commune?.superficieKm2 && (
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-gov-green" />
                <span className="font-medium">{t('area', { km: stats.commune.superficieKm2 })}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        {/* Établissements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="gov-card p-6 border-b-4 border-gov-blue hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-4">
             <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-gov-blue">
              <Building2 className="w-6 h-6" />
            </div>
             <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('establishments')}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {stats?.etablissements.total || 0}
            </p>
            <div className="flex items-center gap-1 mt-2 text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded w-fit">
              <Star size={14} className="text-gov-gold fill-gov-gold" />
              <span>{t('avg_rating', { note: stats?.etablissements.noteMoyenne || 0 })}</span>
            </div>
          </div>
        </motion.div>

        {/* Réclamations en attente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="gov-card p-6 border-b-4 border-gov-gold-dark hover:shadow-lg transition-shadow duration-300"
        >
          <div className="flex items-center justify-between mb-4">
             <div className="w-12 h-12 rounded-xl bg-orange-50 flex items-center justify-center text-gov-gold-dark">
              <Clock className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('pending_reclamations')}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {stats?.reclamations.enAttente || 0}
            </p>
             <p className="text-xs text-gray-500 mt-2">
                {t('assigned_total_sub', { total: stats?.reclamations.total || 0 })}
              </p>
          </div>
        </motion.div>

        {/* Taux de résolution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="gov-card p-6 border-b-4 border-gov-green hover:shadow-lg transition-shadow duration-300"
        >
           <div className="flex items-center justify-between mb-4">
             <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-gov-green">
              <CheckCircle className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('resolution_rate')}</p>
          </div>
          <div>
             <div className="flex items-baseline gap-1">
              <p className="text-4xl font-bold text-gray-900">
                {stats?.reclamations.tauxResolution || 0}
              </p>
              <span className="text-xl font-semibold text-gray-500">%</span>
            </div>
             <p className="text-xs text-gray-500 mt-2">
                {t('resolved_count_sub', { count: stats?.reclamations.resolues || 0 })}
              </p>
          </div>
        </motion.div>

        {/* Aujourd'hui */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="gov-card p-6 border-b-4 border-gov-red hover:shadow-lg transition-shadow duration-300"
        >
           <div className="flex items-center justify-between mb-4">
             <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-gov-red">
              <Calendar className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{t('assigned_today')}</p>
          </div>
          <div>
            <p className="text-4xl font-bold text-gray-900">
              {stats?.reclamations.aujourdHui || 0}
            </p>
            <p className="text-xs text-gray-500 mt-2">
                 {t('new_reclamations_sub')}
              </p>
          </div>
        </motion.div>
      </div>

      {/* Contenu principal */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Réclamations récentes */}
        <div className="lg:col-span-2">
          <div className="gov-card h-full flex flex-col">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
              <h2 className="font-bold text-gray-900 flex items-center gap-2 text-lg">
                <div className="w-1 h-6 bg-gov-blue rounded-full"></div>
                {t('pending_list_title')}
              </h2>
              <Link 
                href="/autorite/reclamations"
                className="text-sm font-medium text-gov-blue hover:text-gov-blue-dark hover:bg-gov-blue/5 px-3 py-1.5 rounded-lg transition-colors"
              >
                {t('view_all')}
              </Link>
            </div>
            
            {recentReclamations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4 border border-green-100">
                   <CheckCircle className="w-10 h-10 text-gov-green" />
                </div>
                <p className="text-xl font-bold text-gray-900 mb-2">{t('no_pending_title')}</p>
                <p className="text-gray-500">{t('up_to_date')}</p>
              </div>
            ) : (
              <div className="flex-1 overflow-visible">
                {recentReclamations.map((reclamation, index) => (
                  <div
                    key={reclamation.id}
                    className={`relative p-4 hover:bg-blue-50/30 transition-all border-b border-gray-50 last:border-0 group ${index === 0 ? 'bg-blue-50/10' : ''}`}
                  >
                    <Link href={`/autorite/reclamations/${reclamation.id}`} className="absolute inset-0 z-0" />
                    <div className="flex items-start gap-4 relative z-10 pointer-events-none">
                      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                         reclamation.joursDepuisAffectation > 7
                          ? 'bg-gov-red'
                          : reclamation.joursDepuisAffectation > 3
                          ? 'bg-gov-gold'
                          : 'bg-gov-green'
                      }`} />
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-bold text-gray-900 truncate group-hover:text-gov-blue transition-colors">
                            {reclamation.titre}
                          </h3>
                           <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${
                            reclamation.joursDepuisAffectation > 7
                              ? 'bg-red-50 text-gov-red border border-red-100'
                              : reclamation.joursDepuisAffectation > 3
                              ? 'bg-orange-50 text-gov-gold-dark border border-orange-100'
                              : 'bg-green-50 text-gov-green border border-green-100'
                          }`}>
                            {reclamation.categorie}
                          </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5">
                            <MapPin size={14} className="text-gray-400" />
                            {reclamation.commune.nom}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Calendar size={14} className="text-gray-400" />
                            {t('ago_days', { count: reclamation.joursDepuisAffectation || 0 })}
                          </span>
                        </div>
                      </div>
                      
                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-gov-blue transition-colors rtl:rotate-180 self-center" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Établissements de la commune */}
          {stats?.etablissements.liste && stats.etablissements.liste.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="gov-card h-fit"
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 rounded-t-xl">
                 <h3 className="font-bold text-gray-900 flex items-center gap-2 text-base">
                  <Building2 size={18} className="text-gov-blue" />
                  {t('establishments_list_title', { count: stats.etablissements.total })}
                </h3>
              </div>
              <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                {stats.etablissements.liste.slice(0, 8).map((etab) => (
                  <Link
                    key={etab.id}
                    href={`/etablissements/${etab.id}`}
                    className="flex items-center justify-between p-3.5 hover:bg-gray-50 transition-all border-b border-gray-50 last:border-0 group"
                  >
                    <div className="flex-1 min-w-0 ml-2 rtl:ml-0 rtl:mr-2">
                      <p className="font-semibold text-gray-900 text-sm truncate group-hover:text-gov-blue transition-colors">
                        {etab.nom}
                      </p>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide mt-1 ${secteurColors[etab.secteur] || secteurColors.AUTRE}`}>
                        {tSectors(etab.secteur)}
                      </span>
                    </div>
                    <div className="text-end flex flex-col items-end gap-1">
                       <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-xs font-bold text-gray-700 border border-yellow-100">
                        <Star size={10} className="text-gov-gold fill-gov-gold" />
                        {etab.noteMoyenne.toFixed(1)}
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{etab._count.reclamations} {isRtl ? 'شكاية' : 'réc.'}</span>
                    </div>
                  </Link>
                ))}
              </div>
              {stats.etablissements.total > 8 && (
                <div className="p-3 border-t border-gray-100 bg-gray-50/30 rounded-b-xl">
                  <Link
                    href="/autorite/etablissement"
                    className="text-sm font-medium text-gov-blue hover:text-gov-blue-dark flex items-center justify-center gap-2 py-1 transition-colors"
                  >
                    {t('see_all_establishments', { count: stats.etablissements.total })}
                    <ChevronRight size={14} className="rtl:rotate-180" />
                  </Link>
                </div>
              )}
            </motion.div>
          )}

          {/* Par secteur */}
          {stats?.parSecteur && stats.parSecteur.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="gov-card p-5"
            >
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5 pb-2 border-b border-gray-100">
                <TrendingUp size={18} className="text-gov-blue" />
                {t('by_sector')}
              </h3>
              <div className="space-y-4">
                {stats.parSecteur.map((s) => (
                  <div key={s.secteur} className="flex items-center gap-3 group">
                    <span className={`w-2.5 h-2.5 rounded-full ring-4 ring-opacity-20 flex-shrink-0 ${secteurColors[s.secteur]?.split(' ')[0].replace('bg-', 'ring-') || 'ring-gray-300'} ${secteurColors[s.secteur]?.split(' ')[0] || 'bg-gray-500'}`} />
                    <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{tSectors(s.secteur)}</span>
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md min-w-[2rem] text-center">{s.count}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Par catégorie */}
          {stats?.parCategorie && stats.parCategorie.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="gov-card p-5"
            >
              <h3 className="font-bold text-gray-900 flex items-center gap-2 mb-5 pb-2 border-b border-gray-100">
                <TrendingUp size={18} className="text-gov-blue" />
                {t('by_category')}
              </h3>
              <div className="space-y-4">
                {stats.parCategorie.map((cat, index) => {
                   const colorClasses = [
                      'bg-gov-blue ring-gov-blue',
                      'bg-gov-gold ring-gov-gold',
                      'bg-gov-green ring-gov-green',
                      'bg-gov-red ring-gov-red',
                      'bg-purple-500 ring-purple-500',
                    ][index % 5];
                    
                   return (
                  <div key={cat.categorie} className="flex items-center gap-3 group">
                    <div className={`w-2.5 h-2.5 rounded-full ring-4 ring-opacity-20 flex-shrink-0 ${colorClasses}`} />
                    <span className="flex-1 text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors truncate">{cat.categorie}</span>
                    <span className="text-sm font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded-md min-w-[2rem] text-center">{cat.count}</span>
                  </div>
                )})}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
