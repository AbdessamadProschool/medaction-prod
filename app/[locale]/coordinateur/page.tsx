'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { 
  Calendar, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Plus,
  ChevronLeft, 
  Loader2,
  FileText,
  Activity,
  Sparkles,
  CalendarDays,
  Play,
  BarChart3,
  RefreshCw,
  ArrowLeft,
  Home,
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  etablissements: number;
  activitesAujourdhui: number;
  activitesSemaine: number;
  rapportsEnAttente: number;
  activitesEnCours: number;
  activitesTerminees: number;
}

interface Activite {
  id: number;
  titre: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  statut: string;
  etablissement: { id: number; nom: string; secteur: string };
}

// Animations
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function CoordinateurDashboard() {
  const t = useTranslations('coordinator.dashboard');
  const tStatus = useTranslations('coordinator.status');
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activitesProchaines, setActivitesProchaines] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Status Configuration
  const STATUT_CONFIG: Record<string, { bg: string; text: string; icon: React.ElementType; labelKey: string }> = {
    PLANIFIEE: { 
      bg: 'bg-slate-100', 
      text: 'text-slate-600', 
      icon: Calendar, 
      labelKey: 'planned' 
    },
    EN_COURS: { 
      bg: 'bg-blue-100', 
      text: 'text-blue-700', 
      icon: Play, 
      labelKey: 'in_progress' 
    },
    TERMINEE: { 
      bg: 'bg-emerald-100', 
      text: 'text-emerald-700', 
      icon: CheckCircle, 
      labelKey: 'completed' 
    },
    RAPPORT_COMPLETE: { 
      bg: 'bg-purple-100', 
      text: 'text-purple-700', 
      icon: FileText, 
      labelKey: 'report_done' 
    },
    ANNULEE: { 
      bg: 'bg-red-100', 
      text: 'text-red-700', 
      icon: AlertCircle, 
      labelKey: 'cancelled' 
    },
    REPORTEE: { 
      bg: 'bg-amber-100', 
      text: 'text-amber-700', 
      icon: Clock, 
      labelKey: 'postponed' 
    },
  };

  const fetchData = useCallback(async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      const res = await fetch(
        `/api/programmes-activites?dateDebut=${today}&dateFin=${nextWeek}&limit=10`
      );
      
      if (res.ok) {
        const data = await res.json();
        setActivitesProchaines(data.data || []);
        
        const activites = data.data || [];
        const uniqueEtablissements = new Set(activites.map((a: any) => a.etablissementId));
        
        setStats({
          etablissements: uniqueEtablissements.size,
          activitesAujourdhui: activites.filter((a: any) => 
            new Date(a.date).toDateString() === new Date().toDateString()
          ).length,
          activitesSemaine: activites.length,
          rapportsEnAttente: activites.filter((a: any) => 
            a.statut === 'TERMINEE'
          ).length,
          activitesEnCours: activites.filter((a: any) => 
            a.statut === 'EN_COURS'
          ).length,
          activitesTerminees: activites.filter((a: any) => 
            a.statut === 'RAPPORT_COMPLETE'
          ).length,
        });
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-MA', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const formatTime = (time: string) => {
    return time?.slice(0, 5) || '00:00';
  };

  const groupedActivites = activitesProchaines.reduce((groups, activite) => {
    const date = activite.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activite);
    return groups;
  }, {} as Record<string, Activite[]>);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
        </div>
      </div>
    );
  }

  const userName = session?.user?.prenom || 'Coordinateur';
  const activitiesToday = stats?.activitesAujourdhui || 0;

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Hero Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 p-8 md:p-12 text-white shadow-xl"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-2xl" />
        
        <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-amber-300 text-sm font-bold">
              <Sparkles className="w-4 h-4" />
              <span>{t('title')}</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black leading-tight">
              {t('welcome', { name: userName })}
            </h1>
            <p className="text-blue-100 text-lg max-w-lg leading-relaxed opacity-90">
              {t('subtitle', { count: activitiesToday })}
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl backdrop-blur transition-all font-bold text-white border border-white/10"
            >
              <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              {t('refresh')}
            </button>
            <Link
              href="/coordinateur/calendrier"
              className="flex items-center gap-2 px-6 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-all shadow-lg hover:shadow-xl shadow-amber-500/20"
            >
              <Plus className="w-5 h-5" />
              {t('new_activity')}
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Alert Banner Closure */}
      {stats?.rapportsEnAttente && stats.rapportsEnAttente > 0 ? (
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           className="bg-red-50 border border-red-100 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm"
        >
          <div className="flex items-center gap-4 text-red-800">
             <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center shrink-0">
               <AlertCircle className="w-6 h-6 text-red-600" />
             </div>
             <div>
               <h3 className="font-bold text-lg mb-1">{t('alert.title')}</h3>
               <p className="text-red-700/80" 
                  dangerouslySetInnerHTML={{ __html: t.raw('alert.message').replace('{count}', stats.rapportsEnAttente) }} 
               />
             </div>
          </div>
          <Link
            href="/coordinateur/calendrier?filter=rapport"
            className="whitespace-nowrap px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-red-500/20"
          >
            {t('alert.action')}
          </Link>
        </motion.div>
      ) : null}

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {/* Aujourd'hui */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-2">{t('stats.today')}</p>
              <p className="text-4xl font-black text-gray-900 mb-1">
                {stats?.activitesAujourdhui || 0}
              </p>
              <p className="text-xs text-gray-400 font-medium">{t('stats.activity_unit')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
              <CalendarDays className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        {/* Cette semaine */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-2">{t('stats.week')}</p>
              <p className="text-4xl font-black text-gray-900 mb-1">
                {stats?.activitesSemaine || 0}
              </p>
              <p className="text-xs text-gray-400 font-medium">{t('stats.programmed')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        {/* En cours */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-2">{t('stats.running')}</p>
              <p className="text-4xl font-black text-gray-900 mb-1">
                {stats?.activitesEnCours || 0}
              </p>
              <p className="text-xs text-gray-400 font-medium">{t('stats.now')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 shadow-sm group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        {/* Rapports en attente */}
        <motion.div
          variants={itemVariants}
          className="relative overflow-hidden bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all group"
        >
          <div className="flex items-start justify-between relative z-10">
            <div>
              <p className="text-sm text-gray-500 font-bold mb-2">{t('stats.reports')}</p>
              <p className="text-4xl font-black text-gray-900 mb-1">
                {stats?.rapportsEnAttente || 0}
              </p>
              <p className="text-xs text-gray-400 font-medium">{t('stats.to_complete')}</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 shadow-sm group-hover:scale-110 transition-transform">
              <FileText className="w-6 h-6" />
            </div>
          </div>
          {(stats?.rapportsEnAttente || 0) > 0 && (
            <span className="absolute top-4 right-4 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
            </span>
          )}
        </motion.div>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-8">
        {/* Activités prochaines - 2 colonnes */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="p-8 border-b border-gray-50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{t('upcoming.title')}</h2>
                <p className="text-sm text-gray-500 font-medium">{t('upcoming.subtitle')}</p>
              </div>
            </div>
            <Link
              href="/coordinateur/calendrier"
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
            >
              {t('upcoming.view_all')}
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {activitesProchaines.length === 0 ? (
              <div className="p-16 text-center">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Calendar className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
                  {t('upcoming.empty.title')}
                </h3>
                <p className="text-gray-500 mb-6 font-medium">
                  {t('upcoming.empty.subtitle')}
                </p>
                <Link
                  href="/coordinateur/calendrier"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:bg-blue-700 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  {t('upcoming.empty.action')}
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {Object.entries(groupedActivites).map(([date, activites]) => (
                  <div key={date}>
                    <div className="px-8 py-3 bg-gray-50/50 sticky top-0 backdrop-blur-sm z-10">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {formatDate(date)}
                      </span>
                    </div>
                    {activites.map((activite) => {
                      const config = STATUT_CONFIG[activite.statut] || STATUT_CONFIG.PLANIFIEE;
                      const StatusIcon = config.icon;
                      
                      return (
                        <Link
                          key={activite.id}
                          href={`/coordinateur/calendrier?activite=${activite.id}`}
                          className="flex items-center gap-6 px-8 py-6 hover:bg-gray-50 transition-colors group"
                        >
                          <div className="flex-shrink-0 w-16 h-16 rounded-2xl bg-blue-50 flex flex-col items-center justify-center text-blue-700 font-black border border-blue-100">
                             <span className="text-2xl leading-none mb-1">{new Date(activite.date).getDate()}</span>
                             <span className="text-[10px] uppercase opacity-70">
                                {new Date(activite.date).toLocaleDateString('ar-MA', { month: 'short' })}
                             </span>
                          </div>
                          
                          <div className="flex-1 min-w-0 space-y-2">
                            <h4 className="text-lg font-bold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                              {activite.titre}
                            </h4>
                            <div className="flex items-center gap-4 text-sm font-medium text-gray-500">
                              <span className="flex items-center gap-1.5 bg-gray-100 px-2 py-1 rounded-lg">
                                <Clock className="w-3.5 h-3.5" />
                                {formatTime(activite.heureDebut)} - {formatTime(activite.heureFin)}
                              </span>
                              <span className="flex items-center gap-1.5 text-gray-400">
                                <Building2 className="w-3.5 h-3.5" />
                                {activite.etablissement?.nom || 'Établissement'}
                              </span>
                            </div>
                          </div>
                          
                          <span className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold ${config.bg} ${config.text}`}>
                            <StatusIcon className="w-4 h-4" />
                            {tStatus(config.labelKey as any)}
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions - 1 colonne */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-6"
        >
          {/* Actions rapides */}
          <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 bg-gradient-to-l from-amber-50 to-transparent">
              <h2 className="font-bold text-gray-900 flex items-center gap-3 text-lg">
                <div className="p-2 bg-amber-100 rounded-xl text-amber-600">
                   <Sparkles className="w-5 h-5" />
                </div>
                {t('quick_actions.title')}
              </h2>
            </div>
            <div className="p-4 space-y-3">
              <Link
                href="/coordinateur/calendrier"
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-blue-50 transition-colors group border border-transparent hover:border-blue-100"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform shadow-sm">
                  <Plus className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-blue-700">{t('quick_actions.create.title')}</p>
                  <p className="text-xs text-gray-500 font-medium">{t('quick_actions.create.subtitle')}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/coordinateur/etablissements"
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-emerald-50 transition-colors group border border-transparent hover:border-emerald-100"
              >
                <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 group-hover:scale-110 transition-transform shadow-sm">
                  <Building2 className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-emerald-700">{t('quick_actions.establishments.title')}</p>
                  <p className="text-xs text-gray-500 font-medium">{t('quick_actions.establishments.subtitle')}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/coordinateur/calendrier?filter=rapport"
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-50 transition-colors group border border-transparent hover:border-rose-100"
              >
                <div className="w-12 h-12 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 group-hover:scale-110 transition-transform shadow-sm">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-rose-700">{t('quick_actions.report.title')}</p>
                  <p className="text-xs text-gray-500 font-medium">{t('quick_actions.report.subtitle')}</p>
                </div>
                {(stats?.rapportsEnAttente || 0) > 0 && (
                  <span className="px-3 py-1 bg-rose-500 text-white text-xs font-bold rounded-full shadow-lg shadow-rose-500/30">
                    {stats?.rapportsEnAttente}
                  </span>
                )}
                <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:-translate-x-1 transition-transform" />
              </Link>

              <Link
                href="/"
                className="flex items-center gap-4 p-4 rounded-2xl hover:bg-gray-50 transition-colors group border border-transparent hover:border-gray-200"
              >
                <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 group-hover:scale-110 transition-transform shadow-sm">
                  <Home className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-gray-900 group-hover:text-gray-700">{t('quick_actions.home.title')}</p>
                  <p className="text-xs text-gray-500 font-medium">{t('quick_actions.home.subtitle')}</p>
                </div>
                <ChevronLeft className="w-5 h-5 text-gray-300 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* Statistiques rapides */}
          <div className="bg-gradient-to-br from-blue-900 to-indigo-900 rounded-[2rem] p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
            
            <div className="flex items-center justify-between mb-8 relative z-10">
              <h3 className="font-bold text-white text-lg">{t('side_stats.title')}</h3>
              <div className="p-2 bg-white/10 rounded-lg">
                 <BarChart3 className="w-5 h-5 text-blue-200" />
              </div>
            </div>
            
            <div className="space-y-6 relative z-10">
              <div className="flex items-end justify-between">
                <span className="text-blue-200 font-medium">{t('side_stats.completed')}</span>
                <span className="font-black text-4xl">{stats?.activitesTerminees || 0}</span>
              </div>
              
              <div className="space-y-2">
                 <div className="h-3 bg-black/20 rounded-full overflow-hidden backdrop-blur-sm">
                    <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                    style={{ 
                        width: `${stats?.activitesSemaine ? ((stats.activitesTerminees || 0) / stats.activitesSemaine) * 100 : 0}%` 
                    }}
                    />
                 </div>
                 <p className="text-xs text-blue-200 font-medium text-right">
                    {t('side_stats.progression', { percent: stats?.activitesSemaine ? Math.round(((stats.activitesTerminees || 0) / stats.activitesSemaine) * 100) : 0 })}
                 </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
