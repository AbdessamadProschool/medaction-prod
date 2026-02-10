'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  Calendar,
  Newspaper,
  FileText,
  Megaphone,
  TrendingUp,
  Eye,
  CheckCircle,
  Clock,
  ChevronRight,
  Loader2,
  AlertCircle,
  MousePointer2,
  ArrowUpRight,
  Users
} from 'lucide-react';

interface Stats {
  evenements: { total: number; publies: number; enAttente: number; aCloturer?: number };
  actualites: { total: number; publiees: number; vues: number };
  articles: { total: number; publies: number; vues: number };
  campagnes: { total: number; actives: number; participations: number };
}

interface RecentItem {
  id: number;
  titre: string;
  type: 'evenement' | 'actualite' | 'article' | 'campagne';
  statut: string;
  date: string;
  vues?: number;
}

export default function DelegationDashboard() {
  const t = useTranslations('delegation.dashboard');
  const tSectors = useTranslations('delegation.sectors');
  const { data: session } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration des secteurs (Move inside to use translations if needed, or keep strictly for Icons/Colors)
  // We can use tSectors for labels dynamically
  const SECTEUR_CONFIG: Record<string, { labelKey: string; icon: string; color: string; bgColor: string; borderColor: string }> = {
    SANTE: { labelKey: 'health', icon: '🏥', color: 'hsl(348,83%,47%)', bgColor: 'hsl(348,83%,96%)', borderColor: 'hsl(348,83%,90%)' },
    EDUCATION: { labelKey: 'education', icon: '🎓', color: 'hsl(213,80%,28%)', bgColor: 'hsl(213,80%,96%)', borderColor: 'hsl(213,80%,90%)' },
    SPORT: { labelKey: 'sport', icon: '⚽', color: 'hsl(145,63%,32%)', bgColor: 'hsl(145,63%,96%)', borderColor: 'hsl(145,63%,90%)' },
    CULTURE: { labelKey: 'culture', icon: '🎭', color: 'hsl(280,60%,50%)', bgColor: 'hsl(280,60%,96%)', borderColor: 'hsl(280,60%,90%)' },
    JEUNESSE: { labelKey: 'youth', icon: '👥', color: 'hsl(45,93%,47%)', bgColor: 'hsl(45,93%,96%)', borderColor: 'hsl(45,93%,90%)' },
    SOCIAL: { labelKey: 'social', icon: '🤝', color: 'hsl(180,60%,40%)', bgColor: 'hsl(180,60%,96%)', borderColor: 'hsl(180,60%,90%)' },
    ENVIRONNEMENT: { labelKey: 'environment', icon: '🌿', color: 'hsl(120,50%,40%)', bgColor: 'hsl(120,50%,96%)', borderColor: 'hsl(120,50%,90%)' },
    ADMINISTRATION: { labelKey: 'administration', icon: '🏛️', color: 'hsl(220,20%,40%)', bgColor: 'hsl(220,20%,96%)', borderColor: 'hsl(220,20%,90%)' },
  };

  const userSecteur = session?.user?.secteurResponsable || 'ADMINISTRATION';
  const secteurConfig = SECTEUR_CONFIG[userSecteur] || SECTEUR_CONFIG.ADMINISTRATION;
  const sectorLabel = tSectors(secteurConfig.labelKey as any);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, recentRes] = await Promise.all([
          fetch('/api/delegation/stats'),
          fetch('/api/delegation/recent'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData.data);
        }

        if (recentRes.ok) {
          const recentData = await recentRes.json();
          setRecentItems(recentData.data || []);
        }
      } catch (error) {
        console.error('Erreur chargement données:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  },[]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-[hsl(213,80%,28%)] animate-spin" />
      </div>
    );
  }

  // Calcul du taux d'engagement global (fictif pour démo)
  const engagementRate = 68; 

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header avec résumé sectoriel */}
      <div className="relative overflow-hidden bg-white rounded-3xl p-8 shadow-sm border border-gray-100 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        {/* Background decorative blob */}
        <div 
          className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full opacity-10 pointer-events-none ltr:right-0 ltr:-mr-16 rtl:left-0 rtl:-ml-16 rtl:right-auto"
          style={{ backgroundColor: secteurConfig.color }}
        />
        
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-2">
            <span className="text-4xl bg-gray-50 p-3 rounded-2xl shadow-sm border border-gray-100">{secteurConfig.icon}</span>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                {t('title', { sector: sectorLabel })}
              </h1>
              <p className="text-gray-500 text-base font-medium mt-1">
                {t('welcome', { name: session?.user?.prenom || '' })}
              </p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-8 divide-x divide-gray-100 bg-gray-50/80 backdrop-blur-sm px-8 py-4 rounded-2xl border border-gray-100 rtl:divide-x-reverse">
          <div className="text-center ltr:pr-4 rtl:pl-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('content_summary')}</p>
            <p className="text-3xl font-black text-gray-900 leading-none">
              {((stats?.evenements.total || 0) + (stats?.actualites.total || 0) + (stats?.articles.total || 0))}
            </p>
          </div>
          <div className="text-center px-6">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('total_views')}</p>
            <p className="text-3xl font-black text-gray-900 leading-none">
              {((stats?.actualites.vues || 0) + (stats?.articles.vues || 0))}
            </p>
          </div>
          <div className="text-center ltr:pl-4 rtl:pr-4">
            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">{t('engagement')}</p>
            <p className="text-3xl font-black text-emerald-600 leading-none flex items-center justify-center gap-1">
              {engagementRate}% <TrendingUp size={20} className="mb-1" />
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards Détaillées */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Événements */}
        <Link href="/delegation/evenements" className="group">
          <div className="h-full bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group-hover:border-[hsl(280,60%,50%)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(280,60%,96%)] rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110 rtl:right-auto rtl:left-0 rtl:-ml-4 rtl:rounded-bl-none rtl:rounded-br-[100px]" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-[hsl(280,60%,95%)] text-[hsl(280,60%,40%)] shadow-sm`}>
                  <Calendar size={24} strokeWidth={2.5} />
                </div>
                {stats?.evenements?.enAttente ? (
                  <span className="text-xs font-bold bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full border border-yellow-100 animate-pulse">
                    {t('kpi.pending', { count: stats.evenements.enAttente })}
                  </span>
                ) : null}
              </div>
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide">{t('kpi.events')}</h3>
              <p className="text-4xl font-black text-gray-900 mt-2 mb-4">{stats?.evenements.total || 0}</p>
              
              <div className="space-y-2">
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(280,60%,50%)] rounded-full" 
                    style={{ width: `${(stats?.evenements.publies! / (stats?.evenements.total || 1)) * 100}%` }} 
                  />
                </div>
                <p className="text-xs font-medium text-gray-500 flex justify-between">
                  <span>{t('kpi.published', { count: stats?.evenements.publies || 0, total: stats?.evenements.total || 0 })}</span>
                  <ArrowUpRight size={14} className="opacity-0 group-hover:opacity-100 transition-opacity text-[hsl(280,60%,50%)]" />
                </p>
              </div>
            </div>
          </div>
        </Link>
        
        {/* Actualités */}
        <Link href="/delegation/actualites" className="group">
          <div className="h-full bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group-hover:border-[hsl(25,95%,53%)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(25,95%,96%)] rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110 rtl:right-auto rtl:left-0 rtl:-ml-4 rtl:rounded-bl-none rtl:rounded-br-[100px]" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-[hsl(25,95%,95%)] text-[hsl(25,95%,45%)] shadow-sm`}>
                  <Newspaper size={24} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide">{t('kpi.news')}</h3>
              <p className="text-4xl font-black text-gray-900 mt-2 mb-4">{stats?.actualites.total || 0}</p>
              
              <div className="flex items-center gap-2 mt-auto p-2 bg-[hsl(25,95%,98%)] rounded-lg text-xs font-semibold text-[hsl(25,95%,45%)] border border-[hsl(25,95%,90%)]">
                <Eye size={14} className="text-[hsl(25,95%,53%)]" />
                <span>{t('kpi.views_this_month', { count: stats?.actualites.vues || 0 })}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Campagnes */}
        <Link href="/delegation/campagnes" className="group">
          <div className="h-full bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group-hover:border-[hsl(145,63%,32%)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(145,63%,90%)] rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110 rtl:right-auto rtl:left-0 rtl:-ml-4 rtl:rounded-bl-none rtl:rounded-br-[100px]" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-[hsl(145,63%,90%)] text-[hsl(145,63%,32%)] shadow-sm`}>
                  <Megaphone size={24} strokeWidth={2.5} />
                </div>
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-white"></span>
                </span>
              </div>
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide">{t('kpi.campaigns')}</h3>
              <p className="text-4xl font-black text-gray-900 mt-2 mb-4">{stats?.campagnes.actives || 0}</p>
              
              <p className="text-xs font-semibold text-gray-500 flex items-center gap-1.5 ">
                <Users size={14} className="text-[hsl(145,63%,32%)]" />
                {t('kpi.participants', { count: stats?.campagnes.participations || 0 })}
              </p>
            </div>
          </div>
        </Link>

        {/* Articles */}
        <Link href="/delegation/articles" className="group">
          <div className="h-full bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group-hover:border-[hsl(213,80%,28%)]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[hsl(213,80%,93%)] rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110 rtl:right-auto rtl:left-0 rtl:-ml-4 rtl:rounded-bl-none rtl:rounded-br-[100px]" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl bg-[hsl(213,80%,93%)] text-[hsl(213,80%,28%)] shadow-sm`}>
                  <FileText size={24} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-gray-500 text-sm font-bold uppercase tracking-wide">{t('kpi.library')}</h3>
              <p className="text-4xl font-black text-gray-900 mt-2 mb-4">{stats?.articles.total || 0}</p>
              
              <div className="space-y-2">
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-[hsl(213,80%,28%)] rounded-full" 
                    style={{ width: `${(stats?.articles.publies! / (stats?.articles.total || 1)) * 100}%` }} 
                  />
                </div>
                <p className="text-xs font-medium text-gray-500">
                  {t('kpi.publication_rate')}: {Math.round((stats?.articles.publies! / (stats?.articles.total || 1)) * 100 || 0)}%
                </p>
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Colonne Principale - Tableau Activités */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Clock className="text-gray-400" size={20} />
              {t('recent_activity.title')}
            </h2>
            <Link href="/delegation/statistiques" className="text-sm font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1">
              {t('recent_activity.view_all')} <ChevronRight size={14} className="rtl:rotate-180" />
            </Link>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left rtl:text-right">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-4 rounded-tl-2xl rtl:rounded-tr-2xl rtl:rounded-tl-none">{t('recent_activity.columns.title')}</th>
                  <th className="px-6 py-4">{t('recent_activity.columns.type')}</th>
                  <th className="px-6 py-4">{t('recent_activity.columns.date')}</th>
                  <th className="px-6 py-4 text-center">{t('recent_activity.columns.status')}</th>
                  <th className="px-6 py-4 text-right rtl:text-left">{t('recent_activity.columns.performance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400 font-medium">
                      {t('recent_activity.empty')}
                    </td>
                  </tr>
                ) : (
                  recentItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50/50 transition-colors group">
                      <td className="px-6 py-4">
                        <Link href={`/delegation/${item.type}s/${item.id}`} className="font-bold text-gray-900 hover:text-emerald-600 block min-w-[180px] break-words line-clamp-2">
                          {item.titre}
                        </Link>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-xs font-semibold text-gray-600 bg-gray-100 px-2 py-1 rounded-lg w-fit">
                          {item.type === 'evenement' && <Calendar size={14} className="text-purple-600" />}
                          {item.type === 'actualite' && <Newspaper size={14} className="text-orange-600" />}
                          {item.type === 'article' && <FileText size={14} className="text-blue-600" />}
                          {item.type === 'campagne' && <Megaphone size={14} className="text-green-600" />}
                          {t(`recent_activity.types.${item.type}` as any)}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-gray-500 tabular-nums">
                        {new Date(item.date).toLocaleDateString(session?.user?.role === 'ADMIN' ? 'fr-FR' : 'ar-MA', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                          ['PUBLIEE', 'PUBLIE', 'ACTIVE'].includes(item.statut)
                            ? 'bg-green-100 text-green-700'
                            : ['EN_ATTENTE'].includes(item.statut)
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {['PUBLIEE', 'PUBLIE', 'ACTIVE'].includes(item.statut) ? t('recent_activity.status.published') : 
                           item.statut === 'EN_ATTENTE' ? t('recent_activity.status.pending') : t('recent_activity.status.draft')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left">
                        {item.vues !== undefined ? (
                          <div className="flex items-center justify-end rtl:justify-start gap-1.5 text-sm font-bold text-gray-700">
                            {item.vues} <Eye size={16} className="text-gray-400 group-hover:text-emerald-500 transition-colors" />
                          </div>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Colonne Droite - Actions Rapides + Performance */}
        <div className="space-y-6">
          {/* Actions Rapides */}
          <div className="bg-gradient-to-br from-[hsl(213,80%,20%)] to-[hsl(213,80%,30%)] rounded-3xl p-6 text-white shadow-xl shadow-blue-900/10">
            <h2 className="font-bold text-lg flex items-center gap-2 mb-6">
              <MousePointer2 size={20} className="text-blue-300" />
              {t('quick_actions.title')}
            </h2>
            <div className="space-y-3">
              <Link href="/delegation/evenements/nouveau" className="flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5 group active:scale-95">
                <div className="bg-white/20 p-2.5 rounded-xl group-hover:bg-white/30 transition-colors shadow-inner">
                  <Calendar size={20} />
                </div>
                <div>
                  <span className="block font-bold text-sm">{t('quick_actions.new_event')}</span>
                  <span className="text-xs text-blue-200 opacity-80">{t('quick_actions.new_event_desc')}</span>
                </div>
                <ChevronRight size={18} className="ml-auto text-blue-200 rtl:rotate-180" />
              </Link>

              <Link href="/delegation/actualites/nouvelle" className="flex items-center gap-4 p-4 bg-white/10 hover:bg-white/20 rounded-2xl transition-all border border-white/5 group active:scale-95">
                <div className="bg-white/20 p-2.5 rounded-xl group-hover:bg-white/30 transition-colors shadow-inner">
                  <Newspaper size={20} />
                </div>
                <div>
                  <span className="block font-bold text-sm">{t('quick_actions.new_news')}</span>
                  <span className="text-xs text-blue-200 opacity-80">{t('quick_actions.new_news_desc')}</span>
                </div>
                <ChevronRight size={18} className="ml-auto text-blue-200 rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {/* Rappels / Notifications */}
          <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
            <h2 className="font-bold text-lg text-gray-900 mb-5 flex items-center gap-2">
              <AlertCircle size={20} className="text-orange-500" />
              {t('todo.title')}
            </h2>
            <div className="space-y-4">
              {stats?.evenements.aCloturer && stats.evenements.aCloturer > 0 && (
                <div className="flex items-start gap-3 p-4 bg-red-50 text-red-900 rounded-2xl text-sm border border-red-100 shadow-sm">
                  <AlertCircle size={18} className="mt-0.5 shrink-0 text-red-600" />
                  <div>
                    <span className="font-bold block mb-1">{t('todo.to_close', { count: stats.evenements.aCloturer })}</span>
                    <Link href="/delegation/evenements?statut=A_CLOTURER" className="inline-flex items-center text-xs font-bold bg-white px-2 py-1 rounded-lg border border-red-200 hover:bg-red-50 transition-colors mt-2 text-red-700">
                      {t('todo.manage_now')} &rarr;
                    </Link>
                  </div>
                </div>
              )}
              {stats?.evenements.enAttente ? (
                <div className="flex items-start gap-3 p-4 bg-orange-50 text-orange-900 rounded-2xl text-sm border border-orange-100 shadow-sm">
                  <CheckCircle size={18} className="mt-0.5 shrink-0 text-orange-600" />
                  <div>
                    <span className="font-bold">{t('todo.pending_validation', { count: stats.evenements.enAttente })}</span>
                  </div>
                </div>
              ) : (
                <div className="text-sm font-medium text-gray-500 flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100/50">
                  <div className="bg-green-100 p-1.5 rounded-full">
                    <CheckCircle size={14} className="text-green-600" />
                  </div>
                  {t('todo.all_good')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
