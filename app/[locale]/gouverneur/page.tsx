'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MapPin,
  AlertCircle,
  Building2,
  Users,
  Calendar,
  FileText,
  BarChart3,
  LogOut,
  Activity,
  Eye,
  Megaphone,
  Shield,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  RefreshCw,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownToLine,
  Globe,
  PieChart,
  ClipboardList,
  Menu,
  X,
  History,
  Star,
  Zap,
  Bell,
  Trophy,
  Wand2,
  FolderKanban,
  ChevronDown,
  ShieldCheck,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import ReclamationsTab from './components/ReclamationsTab';
import PerformanceTab from './components/PerformanceTab';
import DecisionCenterModal from './components/DecisionCenterModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import dynamic from 'next/dynamic';
import { useTranslations, useLocale } from 'next-intl';
import { generateGovernorReport, getGovernorInsights, getRecentReportsList } from '@/app/actions/generateReport';

// Dynamically import map
const InteractiveMap = dynamic(() => import('@/components/maps/InteractiveMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-3xl" />,
});

// Types
interface Stats {
  communes: { total: number; actives: number };
  reclamations: { 
    total: number; 
    enAttente: number; 
    enCours: number; 
    resolues: number; 
    rejetees: number;
    tauxResolution: number;
    urgentes: number;
    nouveauCetteSemaine: number;
  };
  etablissements: { total: number; parSecteur: Record<string, number> };
  evenements: { total: number; aVenir: number; enCours: number; cetMois: number };
  projects: { active: number };
  citoyens: { total: number; actifsCeMois: number; nouveauxCetteSemaine: number };
  satisfaction: { moyenne: number; engagement: number };
  sectorRankings: Array<{
    secteur: string;
    etablissements: number;
    evenements: number;
    reclamations: number;
    noteMoyenne: number;
    score: number;
    rank: number;
  }>;
  charts: {
    auditTrends: Array<{ name: string; audits: number; conformite: number }>;
    compliance: Array<{ name: string; value: number; color: string }>;
  };
  alerts: Array<{
    id: string; 
    type: string; 
    label: string; 
    message: string; 
    date: string; 
    level: string; 
  }>;
  recentActivity?: Array<{
    id: string;
    entity: string;
    title: string;
    subtitle: string;
    date: string;
    status: string;
    icon: string;
    color: string;
  }>;
}

interface AlertAction {
  id: string | number;
  type: 'EVENT_CLOSURE' | 'RECLAMATION_ASSIGN' | 'ACTIVITY_REPORT';
  titre: string;
  description: string;
  date: string;
  priorite: 'HAUTE' | 'MOYENNE' | 'BASSE';
}

export default function GouverneurDashboard() {
  const t = useTranslations('governor');
  const currentLocale = useLocale(); // Get locale from next-intl
  const pathname = usePathname();
  
  // Robust RTL detection: use next-intl locale + fallback to URL check
  const isRTL = currentLocale === 'ar' || currentLocale?.startsWith('ar') || pathname?.includes('/ar') || false;
  const locale = isRTL ? 'ar' : 'fr';
  const dir = isRTL ? 'rtl' : 'ltr';
  
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'reclamations' | 'map' | 'reports'>('overview');
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<AlertAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEtab, setSelectedEtab] = useState<any>(null);

  // UI States
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // State for Real Reports & Insights
  const [reportPeriod, setReportPeriod] = useState('Mois Dernier');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);

  // Fetch Real Data on Mount
  useEffect(() => {
    const fetchReportsData = async () => {
        try {
            // Parallel fetch for speed
            const [insightsRes, reportsRes] = await Promise.all([
                getGovernorInsights(locale),
                getRecentReportsList(locale)
            ]);

            if (insightsRes.success) setAiInsights(insightsRes.data);
            if (reportsRes.success) setRecentReports(reportsRes.data);
        } catch (e) {
            console.error("Failed to fetch report data", e);
        }
    };
    fetchReportsData();
  }, [locale]);

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    toast.loading(t('reports.generating'));
    
    try {
      const result = await generateGovernorReport(reportPeriod);
      
      if (result.success && result.data) {
        toast.dismiss();
        toast.success(t('reports.generated'));
        
        // Open Report Window
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          const d = result.data;
          const htmlContent = `
            <!DOCTYPE html>
            <html dir="${isRTL ? 'rtl' : 'ltr'}">
            <head>
              <title>Rapport du Gouverneur - ${d.period}</title>
              <style>
                body { font-family: 'Segoe UI', sans-serif; padding: 40px; color: #1e293b; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                .logo { font-size: 24px; font-weight: 900; color: #0f172a; }
                .meta { color: #64748b; font-size: 14px; margin-top: 10px; }
                .section { margin-bottom: 30px; }
                h2 { font-size: 18px; color: #334155; border-left: 4px solid #3b82f6; padding-left: 10px; margin-bottom: 15px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
                .card { background: #f8fafc; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; }
                .card h3 { margin: 0 0 5px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                .card .value { font-size: 28px; font-weight: 800; color: #0f172a; }
                .table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0; }
                .table th { background: #f1f5f9; font-size: 12px; text-transform: uppercase; color: #475569; }
                .footer { margin-top: 50px; text-align: right; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                @media print { body { padding: 0; } }
              </style>
            </head>
            <body>
              <div class="header">
                 <div class="logo">ROYAUME DU MAROC - PROVINCE DE MÉDIOUNA</div>
                 <div class="meta">Rapport Officiel • Généré automatiquement par l'IA • ${new Date(d.generatedAt).toLocaleString(locale)}</div>
                 <h1>Rapport d'Activité : ${d.period}</h1>
              </div>

              <div class="section">
                 <h2>1. Synthèse Globale</h2>
                 <div class="grid">
                    <div class="card">
                       <h3>Réclamations Reçues</h3>
                       <div class="value">${d.stats.reclamations.total}</div>
                    </div>
                    <div class="card">
                       <h3>Taux de Résolution</h3>
                       <div class="value">${d.stats.reclamations.resolutionRate}%</div>
                    </div>
                    <div class="card">
                       <h3>Établissements</h3>
                       <div class="value">${d.stats.etablissements.total}</div>
                    </div>
                    <div class="card">
                       <h3>Événements à Venir</h3>
                       <div class="value">${d.stats.evenements.upcoming}</div>
                    </div>
                 </div>
              </div>

              <div class="section">
                 <h2>2. Détail par Commune</h2>
                 <table class="table">
                    <thead><tr><th>Commune</th><th>Réclamations / Activité</th></tr></thead>
                    <tbody>
                       ${d.communes.map((c: any) => `<tr><td>${c.nom}</td><td><strong>${c.count}</strong> dossiers</td></tr>`).join('')}
                    </tbody>
                 </table>
              </div>

               <div class="section">
                 <h2>3. Répartition Sectorielle</h2>
                 <table class="table">
                    <thead><tr><th>Secteur</th><th>Établissements</th></tr></thead>
                    <tbody>
                       ${d.stats.etablissements.bySector.map((s: any) => `<tr><td>${s.secteur}</td><td><strong>${s.count}</strong></td></tr>`).join('')}
                    </tbody>
                 </table>
              </div>

              <div class="footer">
                 Document généré depuis la plateforme Gouverneur V2.0.<br/>
                 Certifié conforme par le système d'information.
              </div>

              <script>
                 window.onload = function() { window.print(); }
              </script>
            </body>
            </html>
          `;
          reportWindow.document.write(htmlContent);
          reportWindow.document.close();
        }
      } else {
        toast.error('Erreur lors de la génération');
      }
    } catch (e) {
      toast.error('Erreur serveur');
    } finally {
      setIsGenerating(false);
    }
  };
  


  // Clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Auth check
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/gouverneur');
    } else if (status === 'authenticated' && 
      !['GOUVERNEUR', 'ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      router.push('/acces-refuse');
    }
  }, [status, session, router]);
  
  const [chartPeriod, setChartPeriod] = useState<'6m' | '1y' | 'all'>('6m');

  const handleEtabSelection = (etab: any) => {
     // Transform map data to Situation Room format
     const penalty = (etab.reclamationsCount || 0) * 5; 
     const score = ((etab.noteMoyenne || 0) * 10) + ((etab.abonnementsCount || 0) * 0.5) + ((etab.evenementsCount || 0) * 5) - penalty;
     
     const richEtab = {
        ...etab,
        score: Math.max(0, score).toFixed(0),
        commune: etab.communeNom,
        annexe: etab.annexeNom,
        stats: {
           note: etab.noteMoyenne || 0,
           reclamations: etab.reclamationsCount || 0,
           evenements: etab.evenementsCount || 0,
        },
        presentation: {
           reclamations: [] // Placeholder for now, or fetch real data if available
        }
     };
     setSelectedEtab(richEtab);
  };

  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const [statsRes, alertsRes] = await Promise.all([
        fetch(`/api/dashboard/gouverneur?locale=${locale}`),
        fetch('/api/gouverneur/alerts') // New endpoint for alerts
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (alertsRes.ok) setAlerts((await alertsRes.json()).data || []);
      
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') fetchData();
  }, [status, fetchData]);

  if (loading || status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gov-blue/20 border-t-gov-blue rounded-full animate-spin" />
          <p className="text-gray-500 font-medium">{t('sidebar.loading')}</p>
        </div>
      </div>
    );
  }

  const s = stats || {
    communes: { total: 0, actives: 0 },
    reclamations: { total: 0, enAttente: 0, enCours: 0, resolues: 0, rejetees: 0, tauxResolution: 0, urgentes: 0, nouveauCetteSemaine: 0 },
    etablissements: { total: 0, parSecteur: {} },
    evenements: { total: 0, aVenir: 0, enCours: 0, cetMois: 0 },
    projects: { active: 0 },
    charts: { auditTrends: [], compliance: [] },
    alerts: [],
    recentActivity: [],
    citoyens: { total: 0, actifsCeMois: 0, nouveauxCetteSemaine: 0 },
    satisfaction: { moyenne: 0, engagement: 0 },
    sectorRankings: []
  };

  const getGreetingKey = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]" dir={dir}>
      {/* 🏛️ MODERN SIDEBAR / NAVIGATION */}
      <>
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1900] xl:hidden"
        />
      )}
      
      <div 
        style={{ [isRTL ? 'right' : 'left']: 0 }}
        className={`fixed top-0 bottom-0 w-72 bg-slate-900 text-white z-[2000] transition-transform duration-300 xl:translate-x-0 flex flex-col border-white/10
        ${isRTL ? 'border-l' : 'border-r'} 
        ${isMobileNavOpen ? 'translate-x-0' : (isRTL ? 'translate-x-full' : '-translate-x-full')}
        `}>
          <div className="p-8 border-b border-white/10 relative">
             {/* Mobile Close Button */}
             <button 
               onClick={() => setIsMobileNavOpen(false)}
               className="absolute top-4 right-4 p-2 text-white/50 hover:text-white xl:hidden"
             >
               <X size={20} />
             </button>
             <div className="flex items-center gap-4 mb-2">
                <div className="w-10 h-10 bg-gov-gold rounded-xl flex items-center justify-center text-slate-900 shadow-lg shadow-gov-gold/20">
                   <Shield size={24} />
                </div>
                <h1 className="text-xl font-bold tracking-tight">{t('sidebar.title')}</h1>
             </div>
             <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('sidebar.subtitle')}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-4">
             {[
               { id: 'overview', label: t('sidebar.nav.overview'), icon: PieChart },
               { id: 'performance', label: t('sidebar.nav.performance'), icon: Trophy },
               { id: 'reclamations', label: t('sidebar.nav.reclamations'), icon: FileText },
               { id: 'map', label: t('sidebar.nav.map'), icon: MapPin },
               { id: 'reports', label: t('sidebar.nav.reports'), icon: BarChart3 },
             ].map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                    activeTab === item.id 
                    ? 'bg-gov-blue text-white shadow-lg shadow-gov-blue/20' 
                    : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon size={20} />
                  <span className="font-semibold text-sm">{item.label}</span>
                  {activeTab === item.id && <motion.div layoutId="activeNav" className="ml-auto w-1.5 h-1.5 bg-white rounded-full" />}
                </button>
             ))}
          </nav>

          <div className="p-6 mt-auto border-t border-white/10">
              <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl mb-4">
                 <div className="w-10 h-10 bg-gov-gold/20 text-gov-gold rounded-full flex items-center justify-center font-bold">
                    {session?.user?.prenom?.[0]}{session?.user?.nom?.[0]}
                 </div>
                 <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{session?.user?.prenom} {session?.user?.nom}</p>
                    <p className="text-[10px] text-white/40 uppercase font-black">{t('sidebar.role_label')}</p>
                 </div>
              </div>
              <button 
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 text-red-400 rounded-xl hover:bg-red-500/20 transition-all font-bold text-xs"
              >
                <LogOut size={16} />
                {t('sidebar.logout')}
              </button>
          </div>
      </div>
      </>

      {/* 📱 MOBILE HEADER */}
      <div className="xl:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-[60]">
         <div className="flex items-center gap-2">
            <Shield className="text-gov-gold" />
            <span className="font-bold">MÉDIOUNA ACTION</span>
         </div>
         <button 
           className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
         >
            <Menu size={24} />
         </button>
      </div>

      {/* 🚀 MAIN CONTENT AREA */}
      <div className={`min-h-screen ${isRTL ? 'xl:pr-72' : 'xl:pl-72'}`}>
         {/* HEADER BAR */}
         <header className="bg-white/80 backdrop-blur-md border-b border-gray-100 sticky top-0 z-40 px-8 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">
               <h2 className="text-lg font-black text-slate-800 uppercase tracking-tight">
                  {activeTab === 'overview' && t('header.titles.overview')}
                  {activeTab === 'performance' && t('header.titles.performance')}
                  {activeTab === 'reclamations' && t('header.titles.reclamations')}
                  {activeTab === 'map' && t('header.titles.map')}
                  {activeTab === 'reports' && t('header.titles.reports')}
               </h2>
               <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-gray-100">
                  <Clock size={14} className="text-slate-400" />
                  <span className="text-xs font-bold text-slate-600">
                     {currentTime.toLocaleDateString(isRTL ? 'ar-MA' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                     <span className="mx-2 opacity-30">|</span>
                     {currentTime.toLocaleTimeString(isRTL ? 'ar-MA' : 'fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
               </div>
            </div>
             
             <div className="flex items-center gap-3">
               <button 
                onClick={fetchData}
                className={`p-2.5 text-slate-400 hover:text-gov-blue hover:bg-gov-blue/5 rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}
               >
                 <RefreshCw size={20} />
               </button>
               <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-gov-blue/10 text-gov-blue' : 'text-slate-400 hover:text-gov-blue hover:bg-gov-blue/5'}`}
                  >
                    <Bell size={20} />
                    {alerts.length > 0 && (
                      <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  <AnimatePresence>
                    {showNotifications && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-gray-100 p-0 z-[100] overflow-hidden"
                      >
                          <div className="p-4 border-b border-gray-50 flex items-center justify-between bg-slate-50/50">
                             <h4 className="font-black text-slate-800 text-sm uppercase tracking-wide">{t('header.notifications.title')}</h4>
                             <span className="text-xs font-bold text-gov-blue bg-gov-blue/10 px-2 py-1 rounded-full">{t('header.notifications.new', {count: alerts.length})}</span>
                          </div>
                          <div className="max-h-[350px] overflow-y-auto custom-scrollbar">
                             {alerts.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                   <Bell size={40} className="mb-3 opacity-20" />
                                   <p className="text-sm font-medium">{t('header.notifications.none')}</p>
                                </div>
                             ) : (
                               alerts.map((alert, idx) => (
                                  <button key={idx} className="w-full text-left p-4 border-b border-gray-50 hover:bg-slate-50 transition-colors flex items-start gap-3 relative group">
                                     <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                       alert.priorite === 'HAUTE' ? 'bg-red-500' : 
                                       alert.priorite === 'MOYENNE' ? 'bg-amber-500' : 'bg-blue-500'
                                     }`} />
                                     <div>
                                        <p className="text-sm font-bold text-slate-800 mb-1 leading-snug">{alert.titre}</p>
                                        <p className="text-xs text-slate-500 mb-2 line-clamp-2">{alert.description}</p>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                          {new Date(alert.date).toLocaleDateString()} • {new Date(alert.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                     </div>
                                  </button>
                               ))
                            )}
                         </div>
                         <div className="p-2 border-t border-gray-50 bg-slate-50/50 text-center">
                            <button className="text-xs font-bold text-slate-500 hover:text-gov-blue transition-colors uppercase tracking-wide">
                               {t('header.notifications.view_all')}
                            </button>
                         </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
               </div>
            </div>
         </header>

         {/* MAIN SCROLLABLE VIEW */}
         <main className={activeTab === 'map' ? 'p-0 h-[calc(100vh-5rem)]' : 'p-8'}>
            <AnimatePresence mode="wait">
               {/* 🏠 OVERVIEW TAB */}
               {activeTab === 'overview' && (
                 <motion.div
                   key="overview"
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -20 }}
                   className="space-y-8"
                 >
                    <div className="flex items-center justify-between">
                       <div>
                          <h3 className="text-2xl font-black text-slate-900">{t(`overview.greeting.${getGreetingKey()}`)}{t('overview.greeting.suffix')}</h3>
                          <p className="text-slate-400 font-medium">{t('overview.greeting.subtitle')}</p>
                       </div>
                       <Link 
                          href="/" 
                          target="_blank"
                          className="flex items-center gap-2 px-6 py-3 bg-gov-blue text-white rounded-2xl font-bold shadow-lg shadow-gov-blue/20 hover:scale-105 transition-all text-sm"
                       >
                          <ArrowUpRight size={18} />
                          {t('overview.public_portal_btn')}
                       </Link>
                    </div>

                    {/* KPI CARDS - INTERACTIVE & CLICKABLE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                       {[
                         { 
                           label: t('overview.kpi.satisfaction'), 
                           value: s.satisfaction.moyenne.toFixed(1), 
                           sub: '/ 5.0', 
                           icon: Star, 
                           color: 'text-amber-500', 
                           bg: 'bg-amber-100',
                           action: () => setActiveTab('performance'),
                           tooltip: t('overview.kpi.tooltip.satisfaction'),
                           detail: s.etablissements.total > 0 ? t('overview.kpi.evaluations_count', {count: s.etablissements.total}) : t('overview.kpi.no_evaluations')
                         },
                         { 
                           label: t('overview.kpi.resolution_rate'), 
                           value: `${s.reclamations.tauxResolution}%`, 
                           sub: t('overview.kpi.sub.reclamations'), 
                           icon: CheckCircle, 
                           color: 'text-emerald-500', 
                           bg: 'bg-emerald-100',
                           action: () => setActiveTab('reclamations'),
                           tooltip: t('overview.kpi.tooltip.resolution') || 'Taux de résolution des réclamations',
                           detail: `${s.reclamations.resolues}/${s.reclamations.total} résolues`
                         },
                         { 
                           label: t('overview.kpi.participations'), 
                           value: s.satisfaction.engagement >= 1000 ? `${(s.satisfaction.engagement / 1000).toFixed(1)}k` : s.satisfaction.engagement.toString(), 
                           sub: t('overview.kpi.sub.engagement'), 
                           icon: Users, 
                           color: 'text-blue-500', 
                           bg: 'bg-blue-100',
                           action: () => setActiveTab('performance'),
                           tooltip: t('overview.kpi.tooltip.engagement') || 'Engagement citoyen (abonnements + participations)',
                           detail: s.citoyens.total > 0 ? `${s.citoyens.actifsCeMois} actifs ce mois` : 'Données indisponibles'
                         },
                         { 
                           label: t('overview.kpi.active_projects'), 
                           value: s.projects.active.toString(), 
                           sub: t('overview.kpi.sub.ongoing'), 
                           icon: FolderKanban, 
                           color: 'text-purple-500', 
                           bg: 'bg-purple-100',
                           action: () => setActiveTab('reports'),
                           tooltip: t('overview.kpi.tooltip.projects') || 'Campagnes et événements en cours',
                           detail: `${s.evenements.enCours} événements actifs`
                         },
                       ].map((kpi, i) => (
                         <motion.button 
                           key={i}
                           onClick={kpi.action}
                           initial={{ opacity: 0, scale: 0.95, y: 20 }}
                           animate={{ opacity: 1, scale: 1, y: 0 }}
                           whileHover={{ scale: 1.02, y: -4 }}
                           whileTap={{ scale: 0.98 }}
                           transition={{ delay: i * 0.1, type: 'spring', stiffness: 300 }}
                           className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex items-center justify-between text-left cursor-pointer hover:shadow-xl hover:border-gov-blue/20 transition-all group relative overflow-hidden"
                           title={kpi.tooltip}
                         >
                            {/* Hover gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gov-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative z-10">
                               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{kpi.label}</p>
                               <div className="flex items-baseline gap-1">
                                  <motion.span 
                                    className="text-2xl font-black text-slate-900"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 + 0.3 }}
                                  >
                                    {kpi.value}
                                  </motion.span>
                                  <span className="text-xs font-bold text-slate-400">{kpi.sub}</span>
                               </div>
                               {/* Contextual detail */}
                               <p className="text-[9px] font-bold text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                  {kpi.detail}
                               </p>
                            </div>
                            <div className={`w-12 h-12 ${kpi.bg} ${kpi.color} rounded-2xl flex items-center justify-center shadow-inner relative z-10 group-hover:scale-110 transition-transform`}>
                               <kpi.icon size={24} />
                            </div>
                            
                            {/* Click indicator */}
                            <ChevronRight className="absolute right-4 text-slate-200 opacity-0 group-hover:opacity-100 group-hover:right-3 transition-all" size={16} />
                         </motion.button>
                       ))}
                    </div>

                    {/* ACTION CENTER & ALERTS */}
                    <div className="grid lg:grid-cols-12 gap-8">
                       <div className="lg:col-span-8 space-y-8">
                          {/* CRITICAL ALERTS */}
                          {/* GAMIFIED SECTOR LEADERBOARD */}
                          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 border border-slate-100">
                             <div className="flex items-center justify-between mb-8">
                                <h4 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                   <Trophy size={24} className="text-gov-gold" />
                                    {t('overview.sectors.title')}
                                 </h4>
                                 <span className="bg-emerald-50 text-emerald-600 px-4 py-1.5 rounded-full text-xs font-black uppercase">
                                    {t('overview.sectors.realtime')}
                                 </span>
                              </div>

                              <div className="space-y-4">
                                 {(s.sectorRankings.length > 0 ? s.sectorRankings.slice(0, 5) : [
                                   { rank: 1, secteur: 'EDUCATION', score: 0, noteMoyenne: 0, evenements: 0, etablissements: 0, reclamations: 0 },
                                   { rank: 2, secteur: 'SANTE', score: 0, noteMoyenne: 0, evenements: 0, etablissements: 0, reclamations: 0 },
                                   { rank: 3, secteur: 'SPORT', score: 0, noteMoyenne: 0, evenements: 0, etablissements: 0, reclamations: 0 }
                                 ]).map((sector, idx) => {
                                   const rankColors: Record<number, string> = {
                                     1: 'from-amber-300 to-amber-500',
                                     2: 'from-slate-300 to-slate-400',
                                     3: 'from-orange-300 to-orange-400',
                                     4: 'from-blue-300 to-blue-400',
                                     5: 'from-purple-300 to-purple-400'
                                   };
                                   const sectorKeyMap: Record<string, string> = {
                                     'EDUCATION': 'education',
                                     'SANTE': 'health',
                                     'SPORT': 'sport',
                                     'SOCIAL': 'social',
                                     'CULTUREL': 'cultural'
                                   };
                                   return (
                                   <motion.button 
                                     key={sector.rank}
                                     initial={{ opacity: 0, x: -20 }}
                                     animate={{ opacity: 1, x: 0 }}
                                     transition={{ delay: idx * 0.1 }}
                                     whileHover={{ x: 4, scale: 1.01 }}
                                     onClick={() => setActiveTab('performance')}
                                     className="w-full group p-5 bg-slate-50 hover:bg-white rounded-3xl border border-gray-100 hover:border-gov-blue/30 hover:shadow-xl transition-all flex items-center gap-4 relative overflow-hidden cursor-pointer text-left"
                                   >
                                      {/* Rank badge */}
                                      <div className={`w-12 h-12 shrink-0 rounded-2xl flex items-center justify-center font-black text-white shadow-lg bg-gradient-to-br ${rankColors[sector.rank] || 'from-slate-300 to-slate-400'} group-hover:scale-110 transition-transform`}>
                                         #{sector.rank}
                                      </div>
                                      
                                      {/* Sector info */}
                                      <div className="flex-1 min-w-0 relative z-10">
                                         <p className="font-black text-slate-900 text-lg">{t(`overview.sectors.names.${sectorKeyMap[sector.secteur] || 'autre'}`)}</p>
                                         
                                         {/* Progress bar */}
                                         <div className="flex items-center gap-2 mt-1">
                                            <div className="h-2 flex-1 max-w-32 bg-slate-200 rounded-full overflow-hidden">
                                               <motion.div 
                                                 className={`h-full bg-gradient-to-r ${rankColors[sector.rank] || 'from-slate-300 to-slate-400'}`} 
                                                 initial={{ width: 0 }}
                                                 animate={{ width: `${sector.score}%` }}
                                                 transition={{ delay: idx * 0.1 + 0.3, duration: 0.8, ease: 'easeOut' }}
                                               />
                                            </div>
                                            <span className="text-xs font-black text-slate-600">{sector.score}/100</span>
                                         </div>
                                         
                                          {/* Detailed stats grid - Clear Layout */}
                                          <div className="grid grid-cols-2 gap-3 mt-4">
                                             <div className="bg-slate-100 rounded-xl p-2 flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1 text-slate-400 mb-1">
                                                   <Building2 size={10} />
                                                   <span className="text-[9px] font-bold uppercase">{t('overview.territorial.establishments')}</span>
                                                </div>
                                                <span className="font-black text-slate-900">{sector.etablissements}</span>
                                             </div>
                                             
                                             <div className="bg-slate-100 rounded-xl p-2 flex flex-col items-center justify-center">
                                                <div className="flex items-center gap-1 text-slate-400 mb-1">
                                                   <Calendar size={10} />
                                                   <span className="text-[9px] font-bold uppercase">{t('overview.territorial.events')}</span>
                                                </div>
                                                <span className="font-black text-slate-900">{sector.evenements}</span>
                                             </div>

                                             <div className="bg-slate-100 rounded-xl p-2 col-span-2 flex items-center justify-between px-4">
                                                <div className="flex items-center gap-1 text-amber-500">
                                                   <Star size={12} fill="currentColor" />
                                                   <span className="font-black text-sm">{sector.noteMoyenne.toFixed(1)}</span>
                                                </div>
                                                {sector.reclamations > 0 ? (
                                                   <span className="text-[10px] font-bold text-red-500 flex items-center gap-1">
                                                      <AlertTriangle size={10} /> {sector.reclamations} {t('reports.chart.audits')}
                                                   </span>
                                                ) : (
                                                   <span className="text-[10px] font-bold text-emerald-500 flex items-center gap-1">
                                                      <CheckCircle size={10} /> {locale === 'ar' ? 'مطابق' : 'Conforme'}
                                                   </span>
                                                )}
                                             </div>
                                          </div>
                                       </div>
                                       
                                       {/* Arrow indicator */}
                                       <div className="flex items-center justify-center pl-2">
                                          <ChevronRight className="text-slate-200 group-hover:text-gov-blue opacity-0 group-hover:opacity-100 transition-all" size={20} />
                                       </div>
                                    </motion.button>
                                  );})}
                             </div>
                          </div>

                          {/* RECENT ACTIVITY LOGS */}
                          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
                              <h4 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                                 <History size={24} className="text-gov-blue" />
                                 {t('overview.activity_log.title')}
                              </h4>
                               <div className="space-y-4">
                                  {s.recentActivity && s.recentActivity.length > 0 ? (
                                     s.recentActivity.map((log, i) => {
                                         // Dynamic Icon Mapping
                                         const getIcon = (iconName: string) => {
                                             switch(iconName) {
                                                 case 'AlertTriangle': return AlertTriangle;
                                                 case 'Star': return Star;
                                                 case 'Calendar': return Calendar;
                                                 default: return FileText;
                                             }
                                         };
                                         const Icon = getIcon(log.icon);
                                         
                                         // Dynamic styling based on color string from API (red, amber, blue)
                                         const getStyles = (color: string) => {
                                             if (color === 'red') return { bg: 'bg-red-50 text-red-500' };
                                             if (color === 'amber') return { bg: 'bg-amber-50 text-amber-500' };
                                             if (color === 'blue') return { bg: 'bg-blue-50 text-blue-500' };
                                             return { bg: 'bg-slate-50 text-slate-500' };
                                         };
                                         const style = getStyles(log.color);

                                         return (
                                            <div key={i} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer group">
                                               <div className={`w-10 h-10 rounded-full flex items-center justify-center ${style.bg} shrink-0`}>
                                                  <Icon size={18} />
                                               </div>
                                               <div className="flex-1 min-w-0">
                                                  <div className="flex items-center justify-between mb-0.5">
                                                     <p className="font-bold text-slate-800 text-sm truncate pr-2">{log.title}</p>
                                                     <span className="text-[10px] font-bold text-slate-400 bg-white px-2 py-0.5 rounded-full shadow-sm border border-slate-100 whitespace-nowrap">
                                                         {new Date(log.date).toLocaleDateString(locale)}
                                                     </span>
                                                  </div>
                                                  <div className="flex items-center gap-2">
                                                     <span className="text-xs text-slate-500 truncate">{log.subtitle}</span>
                                                     {log.status === 'EN_ATTENTE' && <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />}
                                                  </div>
                                               </div>
                                               <ChevronRight size={16} className="text-slate-200 group-hover:text-gov-blue transition-colors opacity-0 group-hover:opacity-100" />
                                            </div>
                                         );
                                     })
                                  ) : (
                                     <div className="text-center py-8 text-slate-400 text-sm">
                                         Aucune activité récente.
                                     </div>
                                  )}
                               </div>   <p className="text-center text-slate-400 text-xs font-bold pt-2 cursor-pointer hover:text-gov-blue transition-colors">
                                    {t('overview.activity_log.view_reports')}
                                 </p>
                          </div>
                       </div>

                       {/* RIGHT SIDEBAR - QUICK STATS & NEWS */}
                       <div className="lg:col-span-4 space-y-6">
                          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
                              <div className="relative z-10">
                                 <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-6">{t('overview.territorial.title')}</p>
                                 <div className="space-y-6">
                                    {[
                                      { label: t('overview.territorial.communes'), count: s.communes.total, total: 6, color: 'bg-gov-gold', icon: MapPin },
                                      { label: t('overview.territorial.establishments'), count: s.etablissements.total, total: 200, color: 'bg-emerald-400', icon: Building2 },
                                      { label: t('overview.territorial.events'), count: s.evenements.total, total: Math.max(s.evenements.total, 50), color: 'bg-blue-400', icon: Calendar },
                                    ].map(item => (
                                      <div key={item.label} className="space-y-2">
                                         <div className="flex justify-between items-center text-sm font-black">
                                            <div className="flex items-center gap-2">
                                               <item.icon size={14} className="opacity-70" />
                                               <span>{item.label}</span>
                                            </div>
                                            <span className="opacity-80 font-medium text-xs">{item.count} <span className="text-white/30">/ {item.total}</span></span>
                                         </div>
                                         <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${(item.count / item.total) * 100}%` }}
                                              className={`h-full ${item.color} shadow-[0_0_10px_rgba(255,255,255,0.3)]`} 
                                            />
                                         </div>
                                      </div>
                                    ))}
                                 </div>
                              </div>
                              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl" />
                          </div>

                           <div className="bg-red-500 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden">
                              <div className="relative z-10">
                                 <h5 className="font-black text-lg mb-4 flex items-center gap-2"><AlertTriangle size={20} className="text-white" /> {t('overview.alerts.title')}</h5>
                                 <div className="space-y-3">
                                     {s.alerts.length > 0 ? (
                                        s.alerts.map((alert) => (
                                          <div key={alert.id} className="bg-white/10 p-3 rounded-xl border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
                                              <div className="flex items-center justify-between mb-1">
                                                 <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase inline-block ${
                                                     alert.level === 'critical' ? 'bg-white text-red-500' : 'bg-white text-orange-500'
                                                 }`}>
                                                     {alert.level === 'critical' ? t('overview.alerts.urgent') : t('overview.alerts.info')}
                                                 </span>
                                                 <span className="text-[9px] font-bold opacity-70">Just now</span>
                                              </div>
                                              <p className="text-xs font-bold leading-tight mt-1">{alert.message}</p>
                                          </div>
                                        ))
                                     ) : (
                                         <div className="text-center py-6 text-white/50 text-sm font-medium border border-dashed border-white/20 rounded-2xl">
                                            {t('overview.alerts.none')}
                                         </div>
                                     )}
                                 </div>
                              </div>
                              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-red-400 rounded-full blur-3xl opacity-50" />
                           </div>


                       </div>
                    </div>
                 </motion.div>
               )}

               {/* 🏆 PERFORMANCE TAB */}
               {activeTab === 'performance' && (
                  <PerformanceTab />
               )}

               {/* 📋 RECLAMATIONS TAB */}
               {activeTab === 'reclamations' && (
                  <ReclamationsTab />
               )}

               {/* 🗺️ MAP TAB */}
               {activeTab === 'map' && (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full w-full relative"
                  >
                     <InteractiveMap 
                        height="h-full"
                        mode="GOVERNOR"
                        onEtablissementSelect={handleEtabSelection}
                     />
                  </motion.div>
               )}

                {/* 📊 REPORTS TAB - DECISION COMMAND CENTER */}
                {activeTab === 'reports' && (
                   <div className="space-y-8">
                      {/* 🎯 EXECUTIVE KPIs - Decision Triggers */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                         {[
                           { label: t('reports.kpi.pending_decisions'), value: s.reclamations?.enAttente || 0, icon: AlertCircle, color: 'bg-red-500', subLabel: s.reclamations?.nouveauCetteSemaine > 0 ? `+${s.reclamations.nouveauCetteSemaine} ${t('reports.kpi.this_week') || 'cette sem.'}` : null, urgent: (s.reclamations?.enAttente || 0) > 0 },
                           { label: t('reports.kpi.resolution_rate'), value: `${s.reclamations?.tauxResolution || 0}%`, icon: CheckCircle, color: 'bg-emerald-500', subLabel: s.reclamations?.resolues > 0 ? `${s.reclamations.resolues} résolues` : null },
                           { label: t('reports.kpi.active_projects'), value: s.projects?.active || 0, icon: Target, color: 'bg-blue-500', subLabel: s.evenements?.enCours > 0 ? `${s.evenements.enCours} en cours` : null },
                           { label: t('reports.kpi.monthly_events'), value: s.evenements?.cetMois || 0, icon: Calendar, color: 'bg-purple-500', subLabel: s.evenements?.aVenir > 0 ? t('reports.kpi.upcoming', {count: s.evenements.aVenir}) : null },
                         ].map((kpi, i) => (
                            <motion.div 
                               key={i}
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: i * 0.1 }}
                               className={`relative p-6 rounded-3xl ${kpi.urgent ? 'bg-gradient-to-br from-red-500 to-red-600 text-white' : 'bg-white border border-slate-100'} shadow-sm overflow-hidden group hover:shadow-lg transition-all`}
                            >
                               <div className="flex items-start justify-between">
                                  <div>
                                     <p className={`text-xs font-bold uppercase tracking-wider ${kpi.urgent ? 'text-red-100' : 'text-slate-400'}`}>{kpi.label}</p>
                                     <p className={`text-4xl font-black mt-2 ${kpi.urgent ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</p>
                                     {kpi.subLabel && (
                                       <span className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${kpi.urgent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                                          {kpi.subLabel}
                                       </span>
                                     )}
                                  </div>
                                  <div className={`w-12 h-12 ${kpi.urgent ? 'bg-white/20' : kpi.color + '/10'} rounded-2xl flex items-center justify-center`}>
                                     <kpi.icon size={24} className={kpi.urgent ? 'text-white' : kpi.color.replace('bg-', 'text-')} />
                                  </div>
                               </div>
                               {kpi.urgent && <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl" />}
                            </motion.div>
                         ))}
                      </div>

                      {/* 🚨 CRITICAL ALERTS - Immediate Action Required */}
                      {(s.reclamations?.urgentes > 0 || s.reclamations?.enAttente > 5) && (
                         <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-red-500 via-red-600 to-orange-500 rounded-[2rem] p-6 text-white shadow-xl"
                         >
                            <div className="flex items-center justify-between flex-wrap gap-4">
                               <div className="flex items-center gap-4">
                                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center animate-pulse">
                                     <AlertTriangle size={28} />
                                  </div>
                                  <div>
                                     <h4 className="text-xl font-black">{t('reports.alert.title')}</h4>
                                     <p className="text-red-100 text-sm">{s.reclamations?.urgentes || 0} {t('reports.alert.urgent')} • {s.reclamations?.enAttente || 0} {t('reports.alert.pending')}</p>
                                  </div>
                               </div>
                               <button 
                                  onClick={() => setActiveTab('reclamations')}
                                  className="px-6 py-3 bg-white text-red-600 font-black rounded-xl hover:bg-red-50 transition-all flex items-center gap-2 shadow-lg"
                               >
                                  {t('reports.alert.action')} <ChevronRight size={18} />
                               </button>
                            </div>
                         </motion.div>
                      )}

                      {/* 📊 CHARTS SECTION - INTERACTIVE ANALYTICS */}
                      <div className="grid lg:grid-cols-2 gap-8">
                          {/* Audit Trends with Period Filter */}
                          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 flex flex-col">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                   <BarChart3 className="text-gov-blue" /> {t('reports.audit_trends')}
                                </h3>
                                <div className="flex bg-slate-100 rounded-xl p-1">
                                   {(['6m', '1y', 'all'] as const).map((period) => (
                                     <button
                                       key={period}
                                       onClick={() => setChartPeriod(period)}
                                       className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartPeriod === period ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-900'}`}
                                     >
                                       {t(`reports.filters.${period}`)}
                                     </button>
                                   ))}
                                </div>
                             </div>
                             <div className="h-64 w-full flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                   <BarChart data={s.charts.auditTrends}>
                                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                                      <RechartsTooltip 
                                        contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} 
                                        cursor={{fill: '#f1f5f9'}}
                                      />
                                      <Bar dataKey="audits" name={t('reports.chart.audits')} fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} />
                                      <Bar dataKey="conformite" name={t('reports.chart.resolved')} fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                                   </BarChart>
                                </ResponsiveContainer>
                             </div>
                          </div>

                          {/* Compliance with Drill-Down info */}
                          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                             <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                   <PieChart className="text-emerald-500" /> {t('reports.compliance')}
                                </h3>
                                <button className="text-xs text-slate-400 font-bold hover:text-gov-blue transition-colors flex items-center gap-1">
                                   {t('reports.compliance_details.title')} <ChevronDown size={14} />
                                </button>
                             </div>
                             
                             <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="h-64 w-full md:w-1/2 relative">
                                   <ResponsiveContainer width="100%" height="100%">
                                      <RePieChart>
                                         <Pie 
                                            data={s.charts.compliance} 
                                            innerRadius={65} 
                                            outerRadius={85} 
                                            paddingAngle={8} 
                                            dataKey="value"
                                            stroke="none"
                                         >
                                            {s.charts.compliance.map((entry, index) => (
                                               <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                         </Pie>
                                         <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                      </RePieChart>
                                   </ResponsiveContainer>
                                   {/* Center Key Metric */}
                                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                      <span className="text-3xl font-black text-slate-900">
                                         {Math.round((s.charts.compliance.find(c => c.name.toLowerCase().includes('conforme'))?.value || 0) / Math.max(1, s.etablissements.total) * 100)}%
                                      </span>
                                      <span className="text-[10px] uppercase font-bold text-slate-400">{t('reports.index')}</span>
                                   </div>
                                </div>
                                
                                <div className="w-full md:w-1/2 space-y-4">
                                   {s.charts.compliance.map((item, i) => {
                                      let descKey = 'conforme_desc';
                                      const name = item.name.toLowerCase();
                                      const code = (item as any).code;

                                      if (code === 'NON_CONFORME' || name.includes('non')) descKey = 'nonconforme_desc';
                                      else if (code === 'EN_COURS' || name.includes('cours') || name.includes('إنجاز')) descKey = 'encours_desc';
                                      
                                      return (
                                        <div key={i} className="group cursor-default">
                                           <div className="flex items-center justify-between mb-1">
                                              <div className="flex items-center gap-2">
                                                 <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                                                 <span className="text-xs font-bold uppercase text-slate-500">{item.name}</span>
                                              </div>
                                              <span className="font-black text-slate-900">{item.value}</span>
                                           </div>
                                           <div className="text-[10px] text-slate-400 pl-4.5 border-l-2 border-slate-100 group-hover:border-slate-200 transition-colors">
                                              {t(`reports.compliance_details.${descKey}`)}
                                           </div>
                                        </div>
                                      );
                                   })}
                                </div>
                             </div>
                          </div>
                      </div>

                      {/* 📁 DOCUMENTS & GENERATOR + VIEW REPORTS BUTTON */}
                      <div className="grid lg:grid-cols-3 gap-8">
                          {/* Recent Reports */}
                          <div className="lg:col-span-2 bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                              <div className="flex items-center justify-between mb-6">
                                 <h3 className="text-xl font-black text-slate-900 flex items-center gap-3">
                                     <FileText className="text-gov-blue" /> {t('reports.automated_reports')}
                                 </h3>
                                 <Link 
                                    href={`/${currentLocale}/gouverneur/bilans`}
                                    className="px-4 py-2 bg-gov-blue text-white text-xs font-bold rounded-xl hover:bg-gov-blue/90 transition-all flex items-center gap-2"
                                 >
                                    {t('reports.view_all')} <ArrowUpRight size={14} />
                                 </Link>
                              </div>
                              <div className="space-y-3">
                                  {recentReports.length > 0 ? recentReports.map((doc, i) => (
                                      <motion.div 
                                         key={i} 
                                         initial={{ opacity: 0, x: -20 }}
                                         animate={{ opacity: 1, x: 0 }}
                                         transition={{ delay: i * 0.1 }}
                                         className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors cursor-pointer group border border-transparent hover:border-slate-200"
                                      >
                                          <div className="flex items-center gap-4">
                                              <div className={`w-12 h-12 rounded-xl flex items-center justify-center border shadow-sm ${doc.type === 'audit' ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-white border-slate-200 text-gov-blue'}`}>
                                                  {doc.type === 'audit' ? <ShieldCheck size={20} /> : <FileText size={20} />}
                                              </div>
                                              <div>
                                                  <h4 className="font-bold text-slate-900 leading-tight">{doc.title}</h4>
                                                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400 font-medium">
                                                      <span className="flex items-center gap-1"><Calendar size={10} /> {new Date(doc.date).toLocaleDateString(locale)}</span>
                                                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                      <span className="flex items-center gap-1"><Users size={10} /> {t('reports.authors.system_ia')}</span>
                                                      <span className="w-1 h-1 rounded-full bg-slate-300" />
                                                      <span>{doc.subtitle}</span>
                                                  </div>
                                              </div>
                                          </div>
                                          
                                          <div className="flex items-center gap-3">
                                              <button 
                                                 onClick={() => {
                                                    // Use technical period value for generation
                                                    setReportPeriod(doc.periodValue || doc.subtitle); 
                                                    handleGenerateReport(); 
                                                 }}
                                                 className="w-10 h-10 bg-white border border-slate-200 text-slate-400 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center shadow-sm"
                                                 title={t('reports.download')}
                                              >
                                                  <ArrowDownToLine size={16} />
                                              </button>
                                              
                                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                                  doc.status === 'Validé' || doc.status === 'Disponible'
                                                  ? 'bg-emerald-50 text-emerald-600' 
                                                  : 'bg-amber-100 text-amber-600'
                                              }`}> {doc.status} </span> </div> </motion.div> )) : (
                                       // Skeleton
                                      [1, 2, 3].map(i => (
                                          <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl animate-pulse">
                                              <div className="flex items-center gap-4">
                                                  <div className="w-12 h-12 bg-slate-200 rounded-xl" />
                                                  <div className="space-y-2">
                                                      <div className="h-3 w-32 bg-slate-200 rounded-lg" />
                                                      <div className="h-2 w-20 bg-slate-200 rounded-lg" />
                                                  </div>
                                              </div>
                                          </div>
                                      ))
                                  )}
                              </div> 

                          </div>


                          {/* Generator Card - Control Panel */}
                          <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col border border-slate-800">
                              <div className="relative z-10 space-y-6">
                                  <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center border border-indigo-500/30">
                                        <Wand2 size={24} className="text-indigo-400" />
                                     </div>
                                     <div>
                                        <h3 className="text-xl font-black">{t('reports.generator.title')}</h3>
                                        <p className="text-slate-400 text-xs font-medium">{t('reports.generator.desc')}</p>
                                     </div>
                                  </div>
                                  
                                  {/* Period & Format Selectors */}
                                  <div className="grid grid-cols-2 gap-3">
                                     <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('reports.generator.period')}</span>
                                        <select 
                                          value={reportPeriod}
                                          onChange={(e) => setReportPeriod(e.target.value)}
                                          className="w-full bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500 px-3 py-2.5"
                                        >
                                           <option value="Mois Dernier">{locale === 'ar' ? 'الشهر الماضي' : 'Mois Dernier'}</option>
                                           <option value="Trimestre T4">{locale === 'ar' ? 'الربع الرابع' : 'Trimestre T4'}</option>
                                           <option value="Année 2025">{locale === 'ar' ? 'سنة 2025' : 'Année 2025'}</option>
                                        </select>
                                     </div>
                                     <div className="space-y-1.5">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{t('reports.generator.format')}</span>
                                        <select className="w-full bg-slate-800 border-none rounded-xl text-xs font-bold text-slate-200 focus:ring-2 focus:ring-indigo-500 px-3 py-2.5">
                                           <option>{locale === 'ar' ? 'نسخة ويب (قابل للطباعة)' : 'Web View (Imprimable)'}</option>
                                        </select>
                                     </div>
                                  </div>

                                  <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                                        {locale === 'ar' ? 'الوحدات المضمنة' : 'Modules inclus'}
                                      </span>
                                      {[
                                        { id: 'stats', label: t('reports.generator.options.stats'), icon: BarChart3 },
                                        { id: 'reclamations', label: t('reports.generator.options.reclamations'), icon: AlertCircle },
                                      ].map((opt) => (
                                          <label key={opt.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors border border-white/5 group">
                                              <input type="checkbox" className="rounded border-slate-600 text-indigo-500 focus:ring-offset-slate-900" defaultChecked={true} />
                                              <opt.icon size={14} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                              <span className="text-sm font-bold">{opt.label}</span>
                                          </label>
                                      ))}
                                  </div>

                                  <button 
                                     onClick={handleGenerateReport}
                                     disabled={isGenerating}
                                     className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-500 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transform"
                                  >
                                      {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 size={18} />} 
                                      {t('reports.generator.btn')}
                                  </button>
                              </div>
                              <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
                          </div>
                      </div>

                      {/* 🧠 AI STRATEGIC INSIGHTS - REPLACES GENERIC BANNER */}
                      <motion.div 
                         initial={{ opacity: 0, y: 20 }}
                         animate={{ opacity: 1, y: 0 }}
                         className="bg-white rounded-[2rem] p-8 shadow-xl border border-slate-100/60 relative overflow-hidden"
                      >
                         <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                            <div className="md:w-1/3 space-y-4">
                               <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
                                  <Wand2 size={12} /> Intelligence Artificielle
                               </div>
                               <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                  {locale === 'ar' ? 'التحليل الاستراتيجي الرقمي' : 'Synthèse Stratégique IA'}
                               </h3>
                               <p className="text-slate-500 text-sm font-medium">
                                  {locale === 'ar' 
                                    ? 'خوارزميات التحليل تقترح التوصيات التالية بناءً على بيانات الأسبوع الحالي.' 
                                    : 'Nos algorithmes ont analysé les tendances actuelles et généré ces recommandations prioritaires.'}
                               </p>
                               <Link 
                                  href={`/${currentLocale}/gouverneur/bilans`}
                                  className="inline-flex items-center gap-2 text-xs font-black text-purple-600 hover:text-purple-700 hover:underline mt-2"
                               >
                                  {t('reports.view_all')} <ArrowUpRight size={14} />
                               </Link>
                            </div>

                            <div className="md:w-2/3 grid gap-4">
                               {aiInsights ? (
                                   <>
                                     {/* Growth Insight */}
                                     {aiInsights.growth && (
                                       <div className="flex items-start gap-4 p-4 rounded-2xl border bg-emerald-50 border-emerald-100 text-emerald-800">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm text-emerald-500">
                                             <TrendingUp size={16} />
                                          </div>
                                          <div>
                                             <p className="font-bold text-sm leading-snug">
                                                {locale === 'ar' 
                                                  ? `نمو في النشاط بنسبة ${aiInsights.growth.label} ${aiInsights.growth.period}` 
                                                  : `Activité en évolution de ${aiInsights.growth.label} ${aiInsights.growth.period}`}
                                             </p>
                                          </div>
                                       </div>
                                     )}

                                     {/* Alerts */}
                                     {aiInsights.alerts && aiInsights.alerts.map((alert: any, i:number) => (
                                       <div key={i} className="flex items-start gap-4 p-4 rounded-2xl border bg-red-50 border-red-100 text-red-800">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm text-red-500">
                                             <AlertTriangle size={16} />
                                          </div>
                                          <div>
                                             <p className="font-bold text-sm leading-snug">{alert.message}</p>
                                          </div>
                                       </div>
                                     ))}

                                     {/* Recommendation */}
                                     {aiInsights.recommendation && (
                                       <div className="flex items-start gap-4 p-4 rounded-2xl border bg-amber-50 border-amber-100 text-amber-800">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm text-amber-500">
                                             <Target size={16} />
                                          </div>
                                          <div>
                                             <p className="font-bold text-sm leading-snug">{aiInsights.recommendation.message}</p>
                                          </div>
                                       </div>
                                     )}
                                   </>
                               ) : (
                                  // Insights Skeleton
                                  [1, 2, 3].map(i => (
                                     <div key={i} className="h-16 bg-slate-100 rounded-2xl animate-pulse" />
                                  ))
                               )}
                               
                            </div>
                         </div>
                         <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-purple-500/5 to-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 -z-0" />
                      </motion.div>
                   </div>
                )}
            </AnimatePresence>

            <DecisionCenterModal 
               isOpen={!!selectedEtab}
               etablissement={selectedEtab}
               onClose={() => setSelectedEtab(null)}
            />
         </main>
      </div>
    </div>
  );
}
