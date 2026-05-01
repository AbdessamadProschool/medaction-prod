'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
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
  Users,
  Heart,
  GraduationCap,
  Dumbbell,
  Palette,
  UserCheck,
  Handshake,
  Leaf,
  Landmark,
  Building2,
  type LucideIcon
} from 'lucide-react';

interface Stats {
  evenements: { total: number; publies: number; enAttente: number; aCloturer?: number };
  actualites: { total: number; publiees: number; vues: number };
  articles: { total: number; publies: number; vues: number };
  campagnes: { total: number; actives: number; participations: number; aCloturer?: number };
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
  const locale = useLocale();
  const direction = locale === 'ar' ? 'rtl' : 'ltr';
  const [stats, setStats] = useState<Stats | null>(null);
  const [recentItems, setRecentItems] = useState<RecentItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Configuration des secteurs (Move inside to use translations if needed, or keep strictly for Icons/Colors)
  // We can use tSectors for labels dynamically
  const SECTEUR_CONFIG: Record<string, { labelKey: string; icon: LucideIcon; color: string; bgColor: string; borderColor: string }> = {
    SANTE: { labelKey: 'health', icon: Heart, color: 'hsl(348,83%,47%)', bgColor: 'hsl(348,83%,96%)', borderColor: 'hsl(348,83%,90%)' },
    EDUCATION: { labelKey: 'education', icon: GraduationCap, color: 'hsl(213,80%,28%)', bgColor: 'hsl(213,80%,96%)', borderColor: 'hsl(213,80%,90%)' },
    SPORT: { labelKey: 'sport', icon: Dumbbell, color: 'hsl(145,63%,32%)', bgColor: 'hsl(145,63%,96%)', borderColor: 'hsl(145,63%,90%)' },
    CULTURE: { labelKey: 'culture', icon: Palette, color: 'hsl(280,60%,50%)', bgColor: 'hsl(280,60%,96%)', borderColor: 'hsl(280,60%,90%)' },
    JEUNESSE: { labelKey: 'youth', icon: UserCheck, color: 'hsl(45,93%,47%)', bgColor: 'hsl(45,93%,96%)', borderColor: 'hsl(45,93%,90%)' },
    SOCIAL: { labelKey: 'social', icon: Handshake, color: 'hsl(180,60%,40%)', bgColor: 'hsl(180,60%,96%)', borderColor: 'hsl(180,60%,90%)' },
    ENVIRONNEMENT: { labelKey: 'environment', icon: Leaf, color: 'hsl(120,50%,40%)', bgColor: 'hsl(120,50%,96%)', borderColor: 'hsl(120,50%,90%)' },
    ADMINISTRATION: { labelKey: 'administration', icon: Landmark, color: 'hsl(220,20%,40%)', bgColor: 'hsl(220,20%,96%)', borderColor: 'hsl(220,20%,90%)' },
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
      {/* Header Ultra-Compact */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative z-10 flex items-center gap-4">
          <div className="p-2.5 rounded-xl shadow-inner border border-gray-100 dark:border-gray-700" style={{ backgroundColor: secteurConfig.bgColor, color: secteurConfig.color }}>
            {(() => { const Icon = secteurConfig.icon; return <Icon size={24} strokeWidth={2.5} />; })()}
          </div>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white tracking-tight leading-tight">
              {t('title', { sector: sectorLabel })}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-xs font-bold">
              {t('welcome', { name: session?.user?.prenom || '' })}
            </p>
          </div>
        </div>
        
        <div className="relative z-10 flex items-center gap-4 bg-gray-50/80 dark:bg-gray-900/40 px-5 py-2 rounded-xl border border-gray-100 dark:border-gray-800">
           <div className="flex flex-col items-end">
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-black uppercase tracking-widest">{t('engagement')}</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400 leading-none">
                {engagementRate}%
              </p>
           </div>
        </div>
      </div>

      {/* KPI Cards Détaillées */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Événements */}
        <Link href="/delegation/evenements" className="group">
          <div className="h-full bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group-hover:border-purple-500/50">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 shadow-sm">
                  <Calendar size={24} strokeWidth={2.5} />
                </div>
                {stats?.evenements?.enAttente ? (
                  <span className="text-[10px] font-black bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full border border-yellow-100 animate-pulse uppercase">
                    {t('kpi.pending', { count: stats.evenements.enAttente })}
                  </span>
                ) : null}
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">{t('kpi.events')}</h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 mb-4 tabular-nums">{stats?.evenements.total || 0}</p>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${(stats?.evenements.publies! / (stats?.evenements.total || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </Link>
        
        {/* Actualités */}
        <Link href="/delegation/actualites" className="group">
          <div className="h-full bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group-hover:border-orange-500/50">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 shadow-sm">
                  <Newspaper size={24} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">{t('kpi.news')}</h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 mb-4 tabular-nums">{stats?.actualites.total || 0}</p>
              <div className="flex items-center gap-2 p-2 bg-orange-50/50 dark:bg-orange-900/10 rounded-xl text-xs font-bold text-orange-700 dark:text-orange-400 border border-orange-100/50 dark:border-orange-900/30">
                <Eye size={14} />
                <span>{t('kpi.views_this_month', { count: stats?.actualites.vues || 0 })}</span>
              </div>
            </div>
          </div>
        </Link>

        {/* Campagnes */}
        <Link href="/delegation/campagnes" className="group">
          <div className="h-full bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group-hover:border-emerald-500/50">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 shadow-sm">
                  <Megaphone size={24} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">{t('kpi.campaigns')}</h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 mb-4 tabular-nums">{stats?.campagnes.actives || 0}</p>
              <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                <Users size={14} />
                {t('kpi.participants', { count: stats?.campagnes.participations || 0 })}
              </p>
            </div>
          </div>
        </Link>

        {/* Bibliothèque */}
        <Link href="/delegation/articles" className="group">
          <div className="h-full bg-white dark:bg-gray-800 rounded-3xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all duration-300 relative overflow-hidden group-hover:border-blue-500/50">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 shadow-sm">
                  <FileText size={24} strokeWidth={2.5} />
                </div>
              </div>
              <h3 className="text-gray-500 dark:text-gray-400 text-xs font-black uppercase tracking-widest">{t('kpi.library')}</h3>
              <p className="text-3xl font-black text-gray-900 dark:text-white mt-2 mb-4 tabular-nums">{stats?.articles.total || 0}</p>
              <div className="w-full bg-gray-100 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(stats?.articles.publies! / (stats?.articles.total || 1)) * 100}%` }} />
              </div>
            </div>
          </div>
        </Link>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Colonne Principale - Tableau Activités */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                <Clock className="text-gray-500 dark:text-gray-400" size={20} />
              </div>
              {t('recent_activity.title')}
            </h2>
            <Link href="/delegation/statistiques" className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              {t('recent_activity.view_all')} <ChevronRight size={14} className="rtl:rotate-180" />
            </Link>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left rtl:text-right border-collapse">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-[11px] uppercase text-gray-600 dark:text-gray-400 font-black tracking-widest border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4">{t('recent_activity.columns.title')}</th>
                  <th className="px-6 py-4">{t('recent_activity.columns.type')}</th>
                  <th className="px-6 py-4">{t('recent_activity.columns.date')}</th>
                  <th className="px-6 py-4 text-center">{t('recent_activity.columns.status')}</th>
                  <th className="px-6 py-4 text-right rtl:text-left">{t('recent_activity.columns.performance')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {recentItems.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest">
                      {t('recent_activity.empty')}
                    </td>
                  </tr>
                ) : (
                  recentItems.map((item) => (
                    <tr key={`${item.type}-${item.id}`} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20 transition-all group">
                      <td className="px-6 py-5">
                        <Link href={`/delegation/${item.type}s/${item.id}`} className="font-black text-gray-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 transition-colors block line-clamp-2 leading-tight">
                          {item.titre}
                        </Link>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700/50 px-2.5 py-1 rounded-lg w-fit uppercase tracking-wider border border-gray-200/50 dark:border-gray-700">
                          {item.type === 'evenement' && <Calendar size={12} className="text-purple-600" />}
                          {item.type === 'actualite' && <Newspaper size={12} className="text-orange-600" />}
                          {item.type === 'article' && <FileText size={12} className="text-blue-600" />}
                          {item.type === 'campagne' && <Megaphone size={12} className="text-green-600" />}
                          {t(`recent_activity.types.${item.type}` as any)}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-bold text-gray-500 dark:text-gray-400 tabular-nums">
                        {new Date(item.date).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          ['PUBLIEE', 'PUBLIE', 'ACTIVE'].includes(item.statut)
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                            : ['CLOTURE', 'CLOTUREE', 'TERMINEE', 'FINISHED'].includes(item.statut)
                            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                            : ['EN_ATTENTE', 'EN_ATTENTE_VALIDATION'].includes(item.statut)
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400'
                        }`}>
                          {['PUBLIEE', 'PUBLIE', 'ACTIVE'].includes(item.statut) ? t('recent_activity.status.published') : 
                           ['CLOTURE', 'CLOTUREE', 'TERMINEE', 'FINISHED'].includes(item.statut) ? t('recent_activity.status.closed') :
                           ['EN_ATTENTE', 'EN_ATTENTE_VALIDATION'].includes(item.statut) ? t('recent_activity.status.pending') : t('recent_activity.status.draft')}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right rtl:text-left">
                        {item.vues !== undefined ? (
                          <div className="flex items-center justify-end rtl:justify-start gap-1.5 text-sm font-black text-gray-900 dark:text-white tabular-nums">
                            {item.vues} <Eye size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
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

        {/* Colonne Droite - Actions Rapides */}
        <div className="space-y-8">
          {/* Actions Rapides - Palette Blue Deep */}
          <div className="bg-[#1e3a8a] dark:bg-blue-950 rounded-3xl p-7 text-white shadow-2xl shadow-blue-900/20 relative overflow-hidden border border-white/5">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <h2 className="font-black text-xl flex items-center gap-3 mb-8 relative z-10">
              <div className="p-2 bg-white/10 rounded-xl">
                <MousePointer2 size={24} className="text-blue-300" />
              </div>
              {t('quick_actions.title')}
            </h2>
            <div className="space-y-4 relative z-10">
              <Link href="/delegation/evenements/nouveau" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group active:scale-95 shadow-sm">
                <div className="bg-white/10 p-3 rounded-xl group-hover:bg-white/20 transition-colors">
                  <Calendar size={22} className="text-blue-200" />
                </div>
                <div>
                  <span className="block font-black text-sm tracking-tight">{t('quick_actions.new_event')}</span>
                  <span className="text-[11px] text-blue-200/60 font-bold uppercase tracking-wider">{t('quick_actions.new_event_desc')}</span>
                </div>
                <ChevronRight size={20} className="ml-auto text-blue-300/50 group-hover:text-white transition-colors rtl:rotate-180" />
              </Link>

              <Link href="/delegation/actualites/nouvelle" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group active:scale-95 shadow-sm">
                <div className="bg-white/10 p-3 rounded-xl group-hover:bg-white/20 transition-colors">
                  <Newspaper size={22} className="text-blue-200" />
                </div>
                <div>
                  <span className="block font-black text-sm tracking-tight">{t('quick_actions.new_news')}</span>
                  <span className="text-[11px] text-blue-200/60 font-bold uppercase tracking-wider">{t('quick_actions.new_news_desc')}</span>
                </div>
                <ChevronRight size={20} className="ml-auto text-blue-300/50 group-hover:text-white transition-colors rtl:rotate-180" />
              </Link>

              <Link href="/delegation/etablissements" className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-2xl transition-all border border-white/5 group active:scale-95 shadow-sm">
                <div className="bg-white/10 p-3 rounded-xl group-hover:bg-white/20 transition-colors">
                  <Building2 size={22} className="text-blue-200" />
                </div>
                <div>
                  <span className="block font-black text-sm tracking-tight">{t('quick_actions.establishments')}</span>
                  <span className="text-[11px] text-blue-200/60 font-bold uppercase tracking-wider">{t('quick_actions.establishments_desc')}</span>
                </div>
                <ChevronRight size={20} className="ml-auto text-blue-300/50 group-hover:text-white transition-colors rtl:rotate-180" />
              </Link>
            </div>
          </div>

          {/* Rappels / Notifications */}
          <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-200 dark:border-gray-700 p-7">
            <h2 className="font-black text-lg text-gray-900 dark:text-white mb-6 flex items-center gap-3">
              <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl">
                <AlertCircle size={22} className="text-orange-600 dark:text-orange-400" />
              </div>
              {t('todo.title')}
            </h2>
            <div className="space-y-4">
              {(() => {
                const toCloseEvents = stats?.evenements.aCloturer || 0;
                const toCloseCampaigns = stats?.campagnes.aCloturer || 0;
                const pendingValidation = stats?.evenements.enAttente || 0;
                
                const hasTasks = toCloseEvents > 0 || toCloseCampaigns > 0 || pendingValidation > 0;

                if (!hasTasks) {
                  return (
                    <div className="text-sm font-bold text-gray-500 dark:text-gray-400 flex items-center gap-4 p-5 bg-gray-50 dark:bg-gray-900/30 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-inner">
                      <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-full border border-green-200 dark:border-green-800">
                        <CheckCircle size={16} className="text-green-600 dark:text-green-400" />
                      </div>
                      {t('todo.all_good')}
                    </div>
                  );
                }

                return (
                  <>
                    {toCloseEvents > 0 && (
                      <div className="flex items-start gap-4 p-5 bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 rounded-2xl text-sm border border-red-100 dark:border-red-900/30 shadow-sm">
                        <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-600" />
                        <div className="flex-1">
                          <span className="font-black block mb-2">{t('todo.to_close', { count: toCloseEvents })}</span>
                          <Link href="/delegation/evenements?statut=A_CLOTURER" className="inline-flex items-center text-xs font-black bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all text-red-700 dark:text-red-400 no-underline shadow-sm active:scale-95">
                            {t('todo.manage_now')} &rarr;
                          </Link>
                        </div>
                      </div>
                    )}
                    
                    {toCloseCampaigns > 0 && (
                      <div className="flex items-start gap-4 p-5 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-400 rounded-2xl text-sm border border-emerald-100 dark:border-emerald-900/30 shadow-sm">
                        <Megaphone size={20} className="mt-0.5 shrink-0 text-emerald-600" />
                        <div className="flex-1">
                          <span className="font-black block mb-2">{t('todo.to_close_campaigns', { count: toCloseCampaigns })}</span>
                          <Link href="/delegation/campagnes?statut=A_CLOTURER" className="inline-flex items-center text-xs font-black bg-white dark:bg-gray-800 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-emerald-700 dark:text-emerald-400 no-underline shadow-sm active:scale-95">
                            {t('todo.manage_now')} &rarr;
                          </Link>
                        </div>
                      </div>
                    )}

                    {pendingValidation > 0 && (
                      <div className="flex items-start gap-4 p-5 bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-400 rounded-2xl text-sm border border-orange-100 dark:border-orange-900/30 shadow-sm font-black">
                        <CheckCircle size={20} className="mt-0.5 shrink-0 text-orange-600" />
                        <div className="flex-1">
                          {t('todo.pending_validation', { count: pendingValidation })}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
