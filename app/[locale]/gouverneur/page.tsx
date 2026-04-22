'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname, useParams } from 'next/navigation';
import { Link } from '@/i18n/navigation';
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
  Loader2,
  Download,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import { signOut } from 'next-auth/react';
import ReclamationsTab from './components/ReclamationsTab';
import PerformanceTab from './components/PerformanceTab';
import EvenementsTab from './components/EvenementsTab';
import DecisionCenterModal from './components/DecisionCenterModal';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';
import dynamic from 'next/dynamic';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { useTranslations, useLocale } from 'next-intl';
import { generateGovernorReport, getGovernorInsights, getRecentReportsList } from '@/app/actions/generateReport';

// Dynamically import map
const InteractiveMap = dynamic(() => import('@/components/maps/InteractiveMap'), {
  ssr: false,
  loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-3xl" />,
});



// Types
interface Stats {
  locale: {
    code: string;
    dir: 'ltr' | 'rtl';
  };
  communes: { total: number; actives: number; details?: any[] };
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
    actualites: number;
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
  type: 'EVENT_CLOSURE' | 'RECLAMATION_ASSIGN' | 'ACTIVITY_REPORT' | 'EVENT_UPCOMING';
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
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'reclamations' | 'map' | 'reports' | 'activites'>('overview');

  // Scroll to top on tab change for professional UX
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [activeTab]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<AlertAction[]>([]);
  
  // Alert color mapping
  const getAlertStyle = (priorite: string) => {
    switch (priorite) {
      case 'HAUTE': return { bg: 'bg-white', text: 'text-red-600', label: t('overview.alerts.urgent') };
      case 'MOYENNE': return { bg: 'bg-amber-100', text: 'text-amber-700', label: t('overview.alerts.info') };
      default: return { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Info' };
    }
  };

  const handleAlertClick = (alert: AlertAction) => {
     const idStr = String(alert.id);
     const numericId = parseInt(idStr.includes('-') ? idStr.split('-')[1] : idStr);

     if (alert.type === 'RECLAMATION_ASSIGN') {
        setSelectedReclamationId(numericId);
        setActiveTab('reclamations');
     } else if (alert.type === 'EVENT_CLOSURE' || alert.type === 'ACTIVITY_REPORT') {
        setHighlightedEventId(numericId);
        setActiveTab('activites');
     } else if (alert.type === 'EVENT_UPCOMING') {
        setActiveTab('map');
     }
     setIsMobileNavOpen(false);
  };

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedEtab, setSelectedEtab] = useState<any>(null);

  // UI States
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  // State for Real Reports & Insights
  const [reportPeriod, setReportPeriod] = useState('Mois Dernier');
  const [reportCommuneId, setReportCommuneId] = useState<number | undefined>(undefined);
  const [reportSector, setReportSector] = useState<string | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReclamationId, setSelectedReclamationId] = useState<number | null>(null);
  const [performanceSector, setPerformanceSector] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [recentReports, setRecentReports] = useState<any[]>([]);
  const [highlightedEventId, setHighlightedEventId] = useState<number | null>(null);

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
            if (reportsRes.success) setRecentReports(reportsRes.data ?? []);
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
      const result = await generateGovernorReport(reportPeriod, {
        communeId: reportCommuneId,
        secteur: reportSector
      });
      if (result.success && result.data) {
        toast.dismiss();
        toast.success(t('reports.generated'));
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          const d = result.data;
          const ref = `GOV-${new Date().getFullYear()}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
          const SL: Record<string,string>={EDUCATION:'Education',SANTE:'Sante',SPORT:'Sport',SOCIAL:'Social',CULTUREL:'Culturel',AUTRE:'Autre'};
          const html=`<!DOCTYPE html>
<html lang='fr'>
<head>
    <meta charset='UTF-8'>
    <title>Rapport Provincial - ${d.period}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;600;800&display=swap');
        
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:'Inter', sans-serif;background:#f8fafc;color:#1e293b;line-height:1.5;font-size:12px}
        .page{background:#fff;max-width:1000px;margin:20px auto;padding:60px 80px;box-shadow:0 0 40px rgba(0,0,0,0.05);position:relative;overflow:hidden}
        
        /* Watermark Background */
        .page::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-30deg);
            font-size: 150px;
            font-weight: 900;
            color: rgba(0, 0, 0, 0.02);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
            text-transform: uppercase;
        }

        .hdr-gov{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px;border-bottom:2px solid #1e3a8a;padding-bottom:20px;position:relative;z-index:1}
        .hdr-left{display:flex;align-items:center;gap:20px}
        .armoiries{width:60px;height:auto}
        .hdr-txt h1{font-family:'Cinzel', serif;font-size:16px;color:#1e3a8a;margin-bottom:2px}
        .hdr-txt p{font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px}
        
        .badge-conf{background:#fef2f2;color:#991b1b;padding:6px 16px;border-radius:6px;font-weight:800;font-size:10px;border:1px solid #fecaca;display:inline-block;margin-bottom:8px}
        .ref-box{text-align:right}
        .ref-txt{font-size:9px;color:#94a3b8;font-weight:600}

        .report-title{text-align:center;margin:40px 0;position:relative;z-index:1}
        .report-title h2{font-size:28px;font-weight:900;color:#1e3a8a;text-transform:uppercase;letter-spacing:-0.5px;margin-bottom:10px}
        .report-title .sub-title{font-size:14px;color:#475569;font-weight:600}
        .meta-period{display:inline-block;margin-top:15px;background:#1e3a8a;color:#fff;padding:4px 20px;border-radius:99px;font-size:11px;font-weight:700}

        .section{margin-top:45px;position:relative;z-index:1}
        .section-hdr{display:flex;align-items:center;gap:12px;margin-bottom:20px}
        .section-num{background:#1e3a8a;color:#fff;width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:14px}
        .section-hdr h3{font-size:16px;font-weight:800;color:#1e3a8a;text-transform:uppercase}

        .stats-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:15px;margin-bottom:25px}
        .stat-card{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:18px;position:relative}
        .stat-card.urgent{border-color:#fecaca;background:#fff1f2}
        .stat-label{font-size:9px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px}
        .stat-value{font-size:24px;font-weight:900;color:#0f172a}
        .stat-sub{font-size:9px;color:#475569;margin-top:5px;font-weight:600}

        .table-wrap{background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;margin-top:15px}
        table{width:100%;border-collapse:collapse}
        th{background:#f1f5f9;padding:12px 15px;font-size:10px;font-weight:800;color:#475569;text-align:left;text-transform:uppercase;border-bottom:1px solid #e2e8f0}
        td{padding:12px 15px;font-size:11px;border-bottom:1px solid #f1f5f9;font-weight:500}
        tr:last-child td{border-bottom:none}
        .td-bold{font-weight:800;color:#1e3a8a}

        .alert-item{background:#fffbeb;border:1px solid #fcd34d;border-radius:10px;padding:12px 16px;margin-bottom:10px;display:flex;gap:12px;align-items:flex-start}
        .alert-icon{color:#b45309;font-size:16px}
        .alert-content p{font-size:11px;font-weight:700;color:#92400e}

        .signature-area{margin-top:60px;display:flex;justify-content:space-between;align-items:flex-end;padding-top:30px;border-top:1px dashed #e2e8f0}
        .stamp-box{width:120px;height:120px;border:2px dashed #cbd5e1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#94a3b8;font-size:10px;font-weight:800;text-transform:uppercase;transform:rotate(-15deg)}
        .sig-block{text-align:center;width:250px}
        .sig-title{font-size:12px;font-weight:900;color:#1e3a8a;margin-bottom:60px}
        .sig-name{font-size:11px;font-weight:700;color:#475569}

        @media print{
            body{background:#fff}
            .page{margin:0;box-shadow:none;padding:20px}
            .meta-period{background:#1e3a8a !important;color:#fff !important;print-color-adjust:exact}
            @page{size:A4;margin:10mm}
        }
    </style>
</head>
<body>
    <div class='page'>
        <!-- Header -->
        <div class='hdr-gov'>
            <div class='hdr-left'>
                <img src='/images/armoiries.png' class='armoiries' alt='Royaume du Maroc'>
                <div class='hdr-txt'>
                    <h1>Royaume du Maroc</h1>
                    <p>Ministère de l'Intérieur</p>
                    <p>Province de Médiouna</p>
                </div>
                <div style='margin-left:20px;padding-left:20px;border-left:1px solid #e2e8f0;display:flex;align-items:center;'>
                    <img src='/images/logo.png' style='height:40px;width:auto;opacity:0.8;' alt='Medaction'>
                </div>
            </div>
            <div class='ref-box'>
                <span class='badge-conf'>CONFIDENTIEL</span>
                <div class='ref-txt'>Réf: ${ref}</div>
                <div class='ref-txt'>Édité le: ${new Date().toLocaleDateString('fr-FR', {day:'2-digit', month:'long', year:'numeric'})}</div>
            </div>
        </div>

        <!-- Title -->
        <div class='report-title'>
            <h2>Rapport Provincial de Pilotage Stratégique</h2>
            <div class='sub-title'>Tableau de Bord Analytique des Équipements et Services</div>
            <div class='meta-period'>Période : ${d.period}</div>
        </div>

        <!-- Section 1: Réclamations -->
        <div class='section'>
            <div class='section-hdr'>
                <div class='section-num'>01</div>
                <h3>Situation des Réclamations Citoyennes</h3>
            </div>
            <div class='stats-grid'>
                <div class='stat-card'>
                    <p class='stat-label'>Total Soumises</p>
                    <p class='stat-value'>${d.reclamations.total}</p>
                    <p class='stat-sub'>Sur l'ensemble de la province</p>
                </div>
                <div class='stat-card urgent'>
                    <p class='stat-label'>Critiques / +72h</p>
                    <p class='stat-value'>${d.reclamations.urgentes}</p>
                    <p class='stat-sub'>Priorité de traitement absolue</p>
                </div>
                <div class='stat-card'>
                    <p class='stat-label'>Taux de Résolution</p>
                    <p class='stat-value'>${d.reclamations.tauxResolution}%</p>
                    <p class='stat-sub'>Objectif cible : > 85%</p>
                </div>
                <div class='stat-card'>
                    <p class='stat-label'>Taux d'Acceptation</p>
                    <p class='stat-value'>${d.reclamations.tauxAcceptation}%</p>
                    <p class='stat-sub'>Validité des signalements</p>
                </div>
            </div>
        </div>

        <!-- Section 2: Suivi de l'Activité Provinciale -->
        <div class='section'>
            <div class='section-hdr'>
                <div class='section-num'>02</div>
                <h3>Détails des Événements et Campagnes Publiés</h3>
            </div>
            <div class='table-wrap'>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Titre de l'Activité</th>
                            <th>Secteur</th>
                            <th style='text-align:right'>Commune</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${d.activites.evenements.length > 0 ? d.activites.evenements.map((ev:any)=>`
                            <tr>
                                <td style='font-size:9px'>${new Date(ev.dateDebut).toLocaleDateString('fr-FR')}</td>
                                <td class='td-bold'>${ev.titre}</td>
                                <td style='font-weight:700;color:#475569'>${ev.secteur}</td>
                                <td style='text-align:right;font-weight:800'>${ev.commune?.nom}</td>
                            </tr>
                        `).join('') : "<tr><td colspan='4' style='text-align:center'>Aucun événement enregistré</td></tr>"}
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Section 3: Traitement des Réclamations Résolues -->
        <div class='section'>
            <div class='section-hdr'>
                <div class='section-num'>03</div>
                <h3>Suivi Opérationnel des Résolutions</h3>
            </div>
            <div class='table-wrap'>
                <table>
                    <thead>
                        <tr>
                            <th>Sujet</th>
                            <th>Établissement</th>
                            <th>RÉSOLU LE</th>
                            <th style='text-align:right'>Affecté à</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${d.reclamations.details.length > 0 ? d.reclamations.details.map((rec:any)=>`
                            <tr>
                                <td class='td-bold'>${rec.titre}</td>
                                <td>${rec.etablissement?.nom}</td>
                                <td style='color:#16a34a;font-weight:800'>${rec.dateResolution ? new Date(rec.dateResolution).toLocaleDateString('fr-FR') : '-'}</td>
                                <td style='text-align:right;font-weight:700'>${rec.affecteeAAutorite ? rec.affecteeAAutorite.prenom + ' ' + rec.affecteeAAutorite.nom : 'Admin'}</td>
                            </tr>
                        `).join('') : "<tr><td colspan='4' style='text-align:center'>Aucune résolution récente</td></tr>"}
                    </tbody>
                </table>
            </div>
        </div>


        <!-- Section 4: Alertes et Synthèse IA -->
        <div class='section'>
            <div class='section-hdr'>
                <div class='section-num'>04</div>
                <h3>Alertes et Recommandations Stratégiques</h3>
            </div>
            ${d.alerts.map((a:any)=>`
                <div class='alert-item'>
                    <div class='alert-icon'>⚠️</div>
                    <div class='alert-content'>
                        <p>${a.message}</p>
                    </div>
                </div>
            `).join('')}
            ${d.recommendations.map((r:string)=>`
                <div style='margin-left:5px;padding:8px 0;border-bottom:1px solid #f1f5f9;font-weight:600;display:flex;gap:10px'>
                    <span style='color:#1e3a8a'>•</span> ${r}
                </div>
            `).join('')}
        </div>

        <!-- Signature -->
        <div class='signature-area'>
            <div class='stamp-box'>Sceau de la<br/>Province</div>
            <div class='sig-block'>
                <div class='sig-title'>M. le Gouverneur de la Province de Médiouna</div>
                <div class='sig-name'>Génération Automatique - Plateforme MedAction</div>
            </div>
        </div>

        <!-- Footer -->
        <div style='margin-top:20px;text-align:center;font-size:8px;color:#94a3b8;border-top:1px solid #f1f5f9;padding-top:10px'>
            Généré par le Système Intelligent de Pilotage - Province de Médiouna | ID Document : ${ref}
        </div>
    </div>
    <script>window.onload=function(){setTimeout(()=>window.print(), 500);}</script>
</body>
</html>`;
          reportWindow.document.write(html);
          reportWindow.document.close();
        }
      } else {
        toast.dismiss();
        toast.error(result.error || 'Erreur de generation du rapport');
      }
    } catch (e) {
      toast.dismiss();
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

      if (statsRes.ok) {
        const data = await statsRes.json();
        if (data.success && data.data) {
          setStats(data.data);
        } else {
          console.error('Invalid stats data format:', data);
          toast.error(t('errors.invalid_data') || 'Données invalides reçues du serveur');
        }
      } else {
        const errorData = await statsRes.json().catch(() => ({}));
        console.error('Stats fetch failed:', statsRes.status, errorData);
        toast.error(`${t('errors.fetch_failed')} (${statsRes.status})`);
      }

      if (alertsRes.ok) {
        setAlerts((await alertsRes.json()).data || []);
      }
      
    } catch (err) {
      console.error('Dashboard Fetch Error:', err);
      toast.error(t('errors.server_error') || 'Erreur de communication avec le serveur');
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



  const getGreetingKey = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return "morning";
    if (hour < 18) return "afternoon";
    return "evening";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] relative" dir={dir}>
      {/* Background Pattern */}
      <div 
        className="absolute inset-0 z-0 opacity-[0.12] pointer-events-none"
        style={{
          backgroundImage: "url('/images/zellige-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }}
      />
      
      {/* 🏛️ MODERN SIDEBAR / NAVIGATION */}
      <div className="relative z-10">
      {/* Mobile Backdrop */}
      {isMobileNavOpen && (
        <div 
          onClick={() => setIsMobileNavOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1900] xl:hidden"
        />
      )}
      
      <div 
        style={{ [isRTL ? 'right' : 'left']: 0 }}
        className={`fixed top-0 bottom-0 w-72 bg-slate-900/95 backdrop-blur-3xl text-white z-[2030] transition-transform duration-300 xl:translate-x-0 flex flex-col border-white/10
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
                 <h1 className="text-xl font-bold tracking-tight text-white">{t('sidebar.title')}</h1>
             </div>
             <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{t('sidebar.subtitle')}</p>
          </div>

          <nav className="flex-1 p-4 space-y-2 mt-4">
             {[
               { id: 'overview', label: t('sidebar.nav.overview'), icon: PieChart },
               { id: 'performance', label: t('sidebar.nav.performance'), icon: Trophy },
               { id: 'reclamations', label: t('sidebar.nav.reclamations'), icon: FileText },
               { id: 'map', label: t('sidebar.nav.map'), icon: MapPin },
               { id: 'activites', label: isRTL ? 'الأنشطة والأحداث' : 'Activités & Événements', icon: Calendar },
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
      </div>

      {/* 📱 MOBILE HEADER */}
      <div className="xl:hidden bg-slate-900 text-white p-4 flex items-center justify-between sticky top-0 z-[60]">
         <div className="flex items-center gap-2">
            <Shield className="text-gov-gold" />
            <span className="font-bold">MÉDIOUNA ACTION</span>
         </div>
         <button 
           onClick={() => setIsMobileNavOpen(true)}
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
                  {activeTab === 'activites' && (isRTL ? 'الأنشطة والأحداث' : 'Activités & Événements')}
                  {activeTab === 'reports' && t('header.titles.reports')}
               </h2>
               <div className="hidden md:flex items-center gap-2 bg-slate-50 px-4 py-1.5 rounded-full border border-gray-100">
                  <Clock size={14} className="text-slate-600" />
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
                className={`p-2.5 text-slate-600 hover:text-gov-blue hover:bg-gov-blue/5 rounded-xl transition-all ${refreshing ? 'animate-spin' : ''}`}
               >
                 <RefreshCw size={20} />
               </button>
               
               <LanguageSwitcher />

               <div className="relative">
                  <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-gov-blue/10 text-gov-blue' : 'text-slate-600 hover:text-gov-blue hover:bg-gov-blue/5'}`}
                  >
                    <Bell size={20} />
                     {alerts.length > 0 && (
                       <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 rounded-full border-2 border-white text-[10px] font-black text-white flex items-center justify-center animate-bounce shadow-md">
                          {alerts.length}
                       </span>
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
                                <div className="flex flex-col items-center justify-center py-12 text-slate-600">
                                   <Bell size={40} className="mb-3 opacity-20" />
                                   <p className="text-sm font-medium">{t('header.notifications.none')}</p>
                                </div>
                             ) : (
                               alerts.map((alert, idx) => (
                                  <button key={idx} onClick={() => handleAlertClick(alert)} className="w-full text-start p-4 border-b border-gray-50 hover:bg-slate-50 transition-colors flex items-start gap-3 relative group">
                                     <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
                                       alert.priorite === 'HAUTE' ? 'bg-red-500' : 
                                       alert.priorite === 'MOYENNE' ? 'bg-amber-500' : 'bg-blue-500'
                                     }`} />
                                     <div>
                                        <p className="text-sm font-bold text-slate-800 mb-1 leading-snug">{alert.titre}</p>
                                        <p className="text-xs text-slate-700 mb-2 line-clamp-2">{alert.description}</p>
                                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                                          {new Date(alert.date).toLocaleDateString()} • {new Date(alert.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </p>
                                     </div>
                                  </button>
                               ))
                            )}
                         </div>
                         <div className="p-2 border-t border-gray-50 bg-slate-50/50 text-center">
                            <button 
                               onClick={() => {
                                 setActiveTab('reports');
                                 setShowNotifications(false);
                               }}
                               className="text-xs font-bold text-slate-700 hover:text-gov-blue transition-colors uppercase tracking-wide"
                             >
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
                          <p className="text-slate-600 font-medium">{t('overview.greeting.subtitle')}</p>
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
                           value: stats?.satisfaction?.moyenne?.toFixed(1) || '0.0', 
                           sub: t('overview.kpi.satisfaction_suffix') || '/ 5.0', 
                           icon: Star, 
                           color: 'text-amber-500', 
                           bg: 'bg-amber-100',
                           action: () => setActiveTab('performance'),
                           tooltip: t('overview.kpi.tooltip.satisfaction'),
                           detail: (stats?.etablissements?.total || 0) > 0 ? t('overview.kpi.evaluations_count', {count: stats?.etablissements?.total || 0}) : t('overview.kpi.no_evaluations')
                         },
                         { 
                           label: t('overview.kpi.resolution_rate'), 
                           value: `${stats?.reclamations?.tauxResolution ?? 0}%`, 
                           sub: t('overview.kpi.sub.reclamations'), 
                           icon: CheckCircle, 
                           color: 'text-emerald-500', 
                           bg: 'bg-emerald-100',
                           action: () => setActiveTab('reclamations'),
                           tooltip: t('overview.kpi.tooltip.resolution') || 'Taux de résolution des réclamations',
                           detail: t('overview.kpi.resolutions_count', {resolues: stats?.reclamations?.resolues || 0, total: stats?.reclamations?.total || 0})
                         },
                         { 
                           label: t('overview.kpi.participations'), 
                           value: (stats?.satisfaction?.engagement || 0) >= 1000 ? `${((stats?.satisfaction?.engagement || 0) / 1000).toFixed(1)}k` : (stats?.satisfaction?.engagement || 0).toString(), 
                           sub: t('overview.kpi.sub.engagement'), 
                           icon: Users, 
                           color: 'text-blue-500', 
                           bg: 'bg-blue-100',
                           action: () => setActiveTab('performance'),
                           tooltip: t('overview.kpi.tooltip.engagement') || 'Engagement citoyen (abonnements + participations)',
                           detail: (stats?.citoyens?.total || 0) > 0 ? t('overview.kpi.active_users', {count: stats?.citoyens?.actifsCeMois || 0}) : t('overview.kpi.no_data')
                         },
                         { 
                           label: t('overview.kpi.active_projects'), 
                           value: ((stats?.evenements?.enCours || 0) + (stats?.projects?.active || 0)).toString(), 
                           sub: t('overview.kpi.sub.ongoing'), 
                           icon: Activity, 
                           color: 'text-purple-500', 
                           bg: 'bg-purple-100',
                           action: () => setActiveTab('activites'),
                           tooltip: t('overview.kpi.tooltip.projects'),
                           detail: (stats?.evenements?.enCours || 0) + (stats?.projects?.active || 0) > 0 
                                      ? `${stats?.evenements?.enCours || 0} ${t('common.events')} • ${stats?.projects?.active || 0} ${t('common.campaigns')}`
                                      : t('overview.kpi.no_data')
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
                           className="bg-white/80 backdrop-blur-xl p-6 rounded-[2rem] shadow-sm border border-white/50 flex items-center justify-between text-start cursor-pointer hover:shadow-xl hover:border-gov-blue/20 transition-all group relative overflow-hidden"
                           title={kpi.tooltip}
                         >
                            {/* Hover gradient effect */}
                            <div className="absolute inset-0 bg-gradient-to-br from-gov-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            
                            <div className="relative z-10">
                               <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-1">{kpi.label}</p>
                               <div className="flex items-baseline gap-1">
                                  <motion.span 
                                    className="text-2xl font-black text-slate-900"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: i * 0.1 + 0.3 }}
                                  >
                                    {kpi.value}
                                  </motion.span>
                                  <span className="text-xs font-bold text-slate-600">{kpi.sub}</span>
                               </div>
                               {/* Contextual detail */}
                               <p className="text-[9px] font-bold text-slate-600 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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

                     {/* 📡 LIVE PROVINCE PULSE - SIMPLIFIED */}
                     <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl shadow-slate-200/50 border border-white/50 flex flex-col md:flex-row items-center gap-10">
                        <div className="flex-1 space-y-4">
                           <div className="flex items-center gap-3">
                              <span className="flex h-3 w-3 relative">
                                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                              </span>
                              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest">{t('overview.pulse.system_active')}</span>
                           </div>
                           
                           <div>
                              <h3 className="text-3xl font-black text-slate-900 mb-2">
                                 {t('overview.pulse.title')}
                              </h3>
                              <p className="text-slate-700 font-medium max-w-lg leading-relaxed">
                                 {t('overview.pulse.subtitle')}
                              </p>
                           </div>
                        </div>

                        {/* Live Status indicator Only - Simplified */}
                        <div className="flex items-center justify-center p-8 bg-slate-50/50 rounded-3xl border border-dashed border-slate-200 min-w-[200px]">
                           <div className="text-center">
                              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mb-1">{t('overview.pulse.system_active')}</p>
                              <div className="flex items-center justify-center gap-2">
                                <Activity size={16} className="text-emerald-500" />
                                <span className="text-lg font-black text-slate-800">ONLINE</span>
                              </div>
                           </div>
                        </div>
                     </div>

                     
                     {/* 🤖 STRATEGIC AI SYNTHESIS - Integrated into Overview */}
                     <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-8 shadow-xl border border-white/50 relative overflow-hidden">

                         <div className="flex flex-col md:flex-row gap-8 items-start relative z-10">
                            <div className="md:w-1/3 space-y-4">
                               <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-[10px] font-black uppercase tracking-widest border border-purple-100">
                                  <Wand2 size={12} /> {t('reports.ai_synthesis.digital_analysis')}
                               </div>
                               <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                  {t('reports.ai_synthesis.title')}
                               </h3>
                               <p className="text-slate-700 text-sm font-medium">
                                   {t('reports.ai_synthesis.subtitle')}
                                </p>
                               <Link 
                                  href={`/gouverneur/bilans`}
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
                                       <div className="flex items-center gap-4 p-4 rounded-2xl border bg-emerald-50 border-emerald-100 text-emerald-800">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm text-emerald-500">
                                             <TrendingUp size={16} />
                                          </div>
                                          <p className="font-bold text-sm leading-snug">
                                              {t('reports.ai_synthesis.growth_msg', { label: aiInsights.growth.label || '10%' })}
                                          </p>
                                       </div>
                                     )}

                                     {/* Alerts */}
                                     {aiInsights?.alerts && Array.isArray(aiInsights.alerts) && aiInsights.alerts.map((alert: any, i:number) => (
                                       <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border bg-red-50 border-red-100 text-red-800">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm text-red-500">
                                             <AlertTriangle size={16} />
                                          </div>
                                          <p className="font-bold text-sm leading-snug">{alert.message || alert.titre || t('reports.ai_synthesis.alert_detected')}</p>
                                       </div>
                                     ))}

                                     {/* Recommendation */}
                                     {aiInsights.recommendation && (
                                       <div className="flex items-center gap-4 p-4 rounded-2xl border bg-amber-50 border-amber-100 text-amber-800">
                                          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-white shadow-sm text-amber-500">
                                             <Target size={16} />
                                          </div>
                                          <p className="font-bold text-sm leading-snug">{aiInsights.recommendation.message || t('reports.ai_synthesis.recommendation_ready')}</p>
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
                      
                     </div>

                      <div className="grid lg:grid-cols-12 gap-8">
                        <div className="lg:col-span-8 space-y-8">
                           {/* 🚨 CRITICAL ACTIONS CENTER - High Attention */}
                           <div className="bg-red-50/80 backdrop-blur-xl p-8 rounded-[2.5rem] border-2 border-red-100 overflow-hidden relative group/alerts shadow-lg shadow-red-500/5">
                              <div className="absolute top-0 right-0 p-10 opacity-5 group-hover/alerts:scale-110 transition-transform"><Activity size={120} className="text-red-600" /></div>
                              <div className="relative z-10">
                                 <div className="flex items-center gap-3 mb-6">
                                    <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
                                    <h4 className="text-xl font-black text-red-900 uppercase tracking-tight">{locale === 'ar' ? 'إجراءات عاجلة مطلوبة' : 'Actions Urgentes Requises'}</h4>
                                 </div>
                                 <div className="grid sm:grid-cols-2 gap-4">
                                     <button 
                                       onClick={() => { setActiveTab('reclamations'); setSelectedReclamationId(null); }}
                                       className="flex items-center gap-4 p-5 bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all border border-red-200 group/item text-start hover:border-red-500 overflow-hidden relative"
                                     >
                                        <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        <div className="w-12 h-12 bg-red-500/10 text-red-600 rounded-2xl flex items-center justify-center shrink-0 group-hover/item:bg-red-500 group-hover/item:text-white transition-colors"><AlertTriangle size={20} /></div>
                                        <div>
                                           <p className="font-black text-slate-900 text-lg leading-tight">{stats?.reclamations?.enAttente || 0}</p>
                                           <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">{locale === 'ar' ? 'شكايات بانتظار التعيين' : 'Réclamations sans affectation'}</p>
                                        </div>
                                     </button>
                                     
                                     <button 
                                       onClick={() => setActiveTab('activites')}
                                       className="flex items-center gap-4 p-5 bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all border border-amber-200 group/item text-start hover:border-amber-500 overflow-hidden relative"
                                     >
                                        <div className="absolute inset-0 bg-amber-500/5 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                                        <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 group-hover/item:bg-amber-500 group-hover/item:text-white transition-colors"><Calendar size={20} /></div>
                                        <div>
                                           <p className="font-black text-slate-900 text-lg leading-tight">{stats?.evenements?.enCours || 0}</p>
                                           <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">{locale === 'ar' ? 'أحداث تتطلب الإغلاق' : 'Événements à clôturer'}</p>
                                        </div>
                                     </button>
                                 </div>
                              </div>
                           </div>
                         {/* SECTOR RANKING REMOVED AS PER USER REQUEST FOR CLARITY IF REDUNDANT, OR KEEP IF REFACTORED */}



                       </div>

                       {/* RIGHT SIDEBAR - QUICK STATS & NEWS */}
                       <div className="lg:col-span-4 space-y-6">
                          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden border border-slate-700/50 group">
                              {/* Background Pattern */}
                              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                              
                              <div className="relative z-10">
                                 <div className="flex items-center justify-between mb-8">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{locale === 'ar' ? 'مؤشر أداء الجماعات' : 'Indice de Performance Communes'}</p>
                                    <div className="p-2 bg-white/5 rounded-full backdrop-blur-sm border border-white/10">
                                       <MapPin size={14} className="text-gov-gold" />
                                    </div>
                                 </div>
                                 
                                 <div className="space-y-8">
                                    {[
                                      { label: t('overview.territorial.communes'), count: stats?.communes?.total || 0, total: 5, color: 'from-amber-400 to-amber-600', icon: MapPin, bg: 'bg-amber-500/20' },
                                      { label: t('overview.territorial.establishments'), count: stats?.etablissements?.total || 0, total: 200, color: 'from-emerald-400 to-emerald-600', icon: Building2, bg: 'bg-emerald-500/20' },
                                      { label: t('overview.territorial.events'), count: stats?.evenements?.total || 0, total: Math.max(stats?.evenements?.total || 0, 50), color: 'from-blue-400 to-blue-600', icon: Calendar, bg: 'bg-blue-500/20' },
                                    ].map(item => (
                                      <div key={item.label} className="group/item">
                                         <div className="flex justify-between items-center text-sm font-black mb-3">
                                            <div className="flex items-center gap-3">
                                               <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center border border-white/10`}>
                                                  <item.icon size={14} className="text-white" />
                                               </div>
                                               <span className="text-slate-200">{item.label}</span>
                                            </div>
                                            <span className="text-xl">{item.count}</span>
                                         </div>
                                         <div className="h-3 bg-slate-950 rounded-full overflow-hidden border border-white/5 p-0.5">
                                            <motion.div 
                                              initial={{ width: 0 }}
                                              animate={{ width: `${(item.count / item.total) * 100}%` }}
                                              className={`h-full bg-gradient-to-r ${item.color} rounded-full shadow-[0_0_12px_rgba(255,255,255,0.2)]`} 
                                              transition={{ duration: 1.5, ease: "easeOut" }}
                                            />
                                         </div>
                                      </div>
                                    ))}
                                 </div>

                                 <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-1 gap-4">
                                     {(stats?.communes?.details || []).map((commune: any) => (
                                       <div key={commune.id} className="flex flex-col gap-2 group/c">
                                          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-tight text-slate-400 group-hover:text-white transition-colors">
                                              <span className="flex items-center gap-2">
                                                 <div className={`w-1.5 h-1.5 rounded-full ${commune.rate < 50 ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : (commune.rate < 80 ? 'bg-amber-500' : 'bg-emerald-500')} transition-all`} />
                                                 {commune.nom}
                                              </span>
                                              <span className={commune.rate < 50 ? 'text-red-400' : (commune.rate < 80 ? 'text-amber-400' : 'text-emerald-400')}>{commune.rate}%</span>
                                          </div>
                                          <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                              <div 
                                                className={`h-full ${commune.rate < 50 ? 'bg-red-500' : (commune.rate < 80 ? 'bg-amber-500' : 'bg-emerald-500')} opacity-30 group-hover:opacity-100 transition-all`}
                                                style={{ width: `${commune.rate}%` }}
                                              />
                                          </div>
                                       </div>
                                    ))}
                                 </div>

                              </div>
                              <div className="absolute -bottom-20 -right-20 w-64 h-64 bg-gov-blue/20 rounded-full blur-[80px] pointer-events-none" />
                          </div>

                           {/* RECENT ACTIVITY LOGS - MOVED TO SIDEBAR */}
                           <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-sm border border-white/50">
                               <h4 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-3">
                                  <History size={16} className="text-gov-blue" />
                                  {t('overview.activity_log.title')}
                               </h4>
                                <div className="space-y-3">
                                   {stats?.recentActivity && stats?.recentActivity.length > 0 ? (
                                      stats?.recentActivity.slice(0, 8).map((log, i) => {
                                          const Icon = log.icon === 'AlertTriangle' ? AlertTriangle : (log.icon === 'Star' ? Star : (log.icon === 'Calendar' ? Calendar : FileText));
                                          const style = log.color === 'red' ? 'bg-red-50 text-red-500' : (log.color === 'amber' ? 'bg-amber-50 text-amber-500' : 'bg-blue-50 text-blue-500');

                                          return (
                                             <div key={i} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-slate-100">
                                                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${style} shrink-0`}>
                                                   <Icon size={14} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                      <p className="font-bold text-slate-900 text-xs truncate text-start" dir="auto">{log.title}</p>
                                                      <p className="text-[10px] text-slate-500 truncate text-start" dir="auto">{log.subtitle}</p>
                                                </div>
                                             </div>
                                          );
                                      })
                                   ) : (
                                      <div className="text-center py-4 text-slate-400 text-[10px]">
                                          {t('overview.activity_log.none')}
                                      </div>
                                   )}
                                </div>
                                <Link href="/gouverneur/bilans" className="block text-center text-gov-blue text-[10px] font-black pt-4 hover:underline">
                                    {t('overview.activity_log.view_reports')}
                                </Link>
                           </div>



                       </div>
                    </div>
                 </motion.div>
               )}



                {/* 📊 REPORTS TAB - DECISION COMMAND CENTER */}
                {activeTab === 'reports' && (
                   <motion.div
                      key="reports"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      className="space-y-8"
                   >
                      {/* 🎯 EXECUTIVE KPIs - Decision Triggers */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                         {[
                           { label: t('reports.kpi.pending_decisions'), value: stats?.reclamations?.enAttente || 0, icon: AlertCircle, color: 'bg-red-500', subLabel: (stats?.reclamations?.nouveauCetteSemaine || 0) > 0 ? `+${stats?.reclamations?.nouveauCetteSemaine} ${t('reports.kpi.this_week') || 'cette sem.'}` : null, urgent: (stats?.reclamations?.enAttente || 0) > 0 },
                           { label: t('reports.kpi.resolution_rate'), value: `${stats?.reclamations?.tauxResolution || 0}%`, icon: CheckCircle, color: 'bg-emerald-500', subLabel: (stats?.reclamations?.resolues || 0) > 0 ? `${stats?.reclamations?.resolues} résolues` : null },
                           { label: t('reports.kpi.active_projects'), value: stats?.projects?.active || 0, icon: Target, color: 'bg-blue-500', subLabel: (stats?.evenements?.enCours || 0) > 0 ? `${stats?.evenements?.enCours} en cours` : null },
                           { label: t('reports.kpi.monthly_events'), value: stats?.evenements?.cetMois || 0, icon: Calendar, color: 'bg-purple-500', subLabel: (stats?.evenements?.aVenir || 0) > 0 ? t('reports.kpi.upcoming', {count: stats?.evenements?.aVenir || 0}) : null },
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
                                     <p className={`text-xs font-bold uppercase tracking-wider ${kpi.urgent ? 'text-red-100' : 'text-slate-600'}`}>{kpi.label}</p>
                                     <p className={`text-4xl font-black mt-2 ${kpi.urgent ? 'text-white' : 'text-slate-900'}`}>{kpi.value}</p>
                                     {kpi.subLabel && (
                                       <span className={`text-xs font-bold mt-1 inline-block px-2 py-0.5 rounded-full ${kpi.urgent ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'}`}>
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
                      {((stats?.reclamations?.urgentes || 0) > 0 || (stats?.reclamations?.enAttente || 0) > 5) && (
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
                                     <p className="text-red-100 text-sm">{stats?.reclamations?.urgentes || 0} {t('reports.alert.urgent')} • {stats?.reclamations?.enAttente || 0} {t('reports.alert.pending')}</p>
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
                                       className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${chartPeriod === period ? 'bg-white shadow text-slate-900' : 'text-slate-700 hover:text-slate-900'}`}
                                     >
                                       {t(`reports.filters.${period}`)}
                                     </button>
                                   ))}
                                </div>
                             </div>
                             <div className="h-64 w-full flex-1">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                   <BarChart data={stats?.charts.auditTrends}>
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
                                <button className="text-xs text-slate-600 font-bold hover:text-gov-blue transition-colors flex items-center gap-1">
                                   {t('reports.compliance_details.title')} <ChevronDown size={14} />
                                </button>
                             </div>
                             
                             <div className="flex flex-col md:flex-row items-center gap-8">
                                <div className="h-64 w-full md:w-1/2 relative">
                                   <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                      <RePieChart>
                                      <Pie
                                        data={Array.isArray(stats?.charts?.compliance) ? stats?.charts.compliance : []}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={70}
                                        outerRadius={90}
                                        paddingAngle={8} 
                                        dataKey="value"
                                        stroke="none"
                                     >
                                        {stats?.charts?.compliance && Array.isArray(stats?.charts.compliance) && stats?.charts.compliance.map((entry: any, index: number) => (
                                           <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                     </Pie>
                                     <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                                  </RePieChart>
                               </ResponsiveContainer>
                                   {/* Center Key Metric */}
                                   <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                      <span className="text-3xl font-black text-slate-900">
                                         {Math.round(((Array.isArray(stats?.charts?.compliance) ? stats?.charts.compliance : []).find((c: any) => c.name.toLowerCase().includes('conforme'))?.value || 0) / Math.max(1, stats?.etablissements?.total || 1) * 100)}%
                                      </span>
                                       <span className="text-[10px] uppercase font-bold text-slate-600">{t('reports.index')}</span>
                                   </div>
                                </div>
                                
                                <div className="w-full md:w-1/2 space-y-4">
                                   {(Array.isArray(stats?.charts?.compliance) ? stats?.charts.compliance : []).map((item, i) => {
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
                                                 <span className="text-xs font-bold uppercase text-slate-700">{item.name}</span>
                                              </div>
                                              <span className="font-black text-slate-900">{item.value}</span>
                                           </div>
                                           <div className="text-[10px] text-slate-600 pl-4.5 border-l-2 border-slate-100 group-hover:border-slate-200 transition-colors">
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
                                    href="/gouverneur/bilans"
                                    className="px-4 py-2 bg-gov-blue text-white text-xs font-bold rounded-xl hover:bg-gov-blue/90 transition-all flex items-center gap-2"
                                 >
                                    {t('reports.view_all')} <ArrowUpRight size={14} />
                                 </Link>
                              </div>
                              <div className="space-y-3">
                                  {Array.isArray(recentReports) && recentReports.length > 0 ? recentReports.map((doc, i) => (
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
                                                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 font-medium">
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
                                                 className="w-10 h-10 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all flex items-center justify-center shadow-sm"
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


                          {/* ARCHIVE AND BILANS TRIGGER - SIMPLIFIED AS PER REQUEST */}
                          <Link href="/gouverneur/bilans" className="bg-gradient-to-br from-[#0f172a] via-[#1e1b4b] to-[#312e81] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden flex flex-col border border-indigo-500/30 group">
                              <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                              <div className="relative z-10 flex items-center justify-between">
                                 <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10">
                                       <FileText size={28} className="text-white" />
                                    </div>
                                    <div>
                                       <h3 className="text-xl font-black tracking-tight">{t('reports.view_all')}</h3>
                                       <p className="text-indigo-200 text-xs font-medium mt-1 opacity-80">{locale === 'ar' ? 'الوصول إلى سجل التقارير والمراجعات الميدانية' : 'Accéder à l\'historique des rapports et audits de terrain'}</p>
                                    </div>
                                 </div>
                                 <div className="w-12 h-12 bg-white text-slate-900 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <ArrowUpRight size={20} />
                                 </div>
                              </div>
                          </Link>

                      </div>
                   </motion.div>
                )}

                

               {/* 🏆 PERFORMANCE TAB */}
               {activeTab === 'performance' && (
                  <motion.div
                     key="performance"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.2 }}
                  >
                     <PerformanceTab initialSector={performanceSector} />
                  </motion.div>
               )}

               {/* 📋 RECLAMATIONS TAB */}
               {activeTab === 'reclamations' && (
                  <motion.div
                     key="reclamations"
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     exit={{ opacity: 0, x: -20 }}
                     transition={{ duration: 0.2 }}
                  >
                     <ReclamationsTab initialSelectedId={selectedReclamationId || undefined} />
                  </motion.div>
               )}

               {/* 🗺️ MAP TAB */}
               {activeTab === 'map' && (
                  <motion.div
                    key="map"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full w-full relative"
                  >
                     <InteractiveMap 
                        key={`map-${locale}`}
                        height="h-full"
                        mode="GOVERNOR"
                        onEtablissementSelect={handleEtabSelection}
                     />
                  </motion.div>
               )}

               {/* 📅 ACTIVITÉS TAB */}
               {activeTab === 'activites' && (
                  <motion.div
                    key="activites"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                     <EvenementsTab highlightId={highlightedEventId || undefined} />
                  </motion.div>
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
