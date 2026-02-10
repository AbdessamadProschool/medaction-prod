'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { 
  FileText, 
  Calendar, 
  Users, 
  Building2, 
  Clock,
  Eye,
  BarChart3,
  Search,
  Loader2,
  CheckCircle2,
  Megaphone,
  MapPin,
  ArrowLeft,
  TrendingUp,
  ClipboardList,
  Image as ImageIcon,
  Star,
  ChevronDown,
  ChevronUp,
  ArrowDownToLine
} from 'lucide-react';
import { toast } from 'sonner';
import { getRecentReportsList, generateGovernorReport } from '@/app/actions/generateReport';

interface MediaItem {
  id: number;
  urlPublique: string;
  type: string;
  nomFichier: string;
}

interface BilanEvenement {
  id: number;
  titre: string;
  typeCategorique: string;
  secteur: string;
  dateDebut: string;
  dateFin?: string;
  statut: string;
  nombreInscrits: number;
  bilanDescription?: string;
  bilanNbParticipants?: number;
  bilanDatePublication?: string;
  etablissement?: { id: number; nom: string };
  commune?: { id: number; nom: string };
  createdByUser?: { nom: string; prenom: string };
  medias?: MediaItem[];
}

interface BilanActivite {
  id: number;
  titre: string;
  description?: string;
  typeActivite: string;
  date: string;
  heureDebut: string;
  heureFin: string;
  lieu?: string;
  statut: string;
  participantsAttendus?: number;
  presenceEffective?: number;
  tauxPresence?: number;
  commentaireDeroulement?: string;
  difficultes?: string;
  pointsPositifs?: string;
  photosRapport?: string[];
  noteQualite?: number;
  recommandations?: string;
  dateRapport?: string;
  etablissement: { id: number; nom: string; secteur: string; commune?: { nom: string } };
  createdByUser?: { nom: string; prenom: string };
}

interface BilanCampagne {
  id: number;
  titre: string;
  description?: string;
  statut: string;
  dateDebut?: string;
  dateFin?: string;
  objectifParticipations?: number;
  bilanDescription?: string;
  nombreParticipations: number;
  nombreVues: number;
  createdByUser?: { nom: string; prenom: string };
  medias?: MediaItem[];
}

const SECTEUR_COLORS: Record<string, string> = {
  'EDUCATION': 'bg-blue-100 text-blue-700',
  'SANTE': 'bg-red-100 text-red-700',
  'SPORT': 'bg-green-100 text-green-700',
  'SOCIAL': 'bg-purple-100 text-purple-700',
  'CULTUREL': 'bg-amber-100 text-amber-700',
  'AUTRE': 'bg-gray-100 text-gray-700',
};

export default function GouverneurBilansPage() {
  const t = useTranslations('governor');
  const tSectors = useTranslations('sectors');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  const [activeTab, setActiveTab] = useState<'reports' | 'evenements' | 'activites' | 'campagnes'>('reports');
  const [loading, setLoading] = useState(true);
  
  const [reports, setReports] = useState<any[]>([]);
  const [evenements, setEvenements] = useState<BilanEvenement[]>([]);
  const [activites, setActivites] = useState<BilanActivite[]>([]);
  const [campagnes, setCampagnes] = useState<BilanCampagne[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSecteur, setSelectedSecteur] = useState('');
  const [stats, setStats] = useState<any>(null);
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
  const [generatingReportId, setGeneratingReportId] = useState<string | null>(null);

  useEffect(() => {
    fetchBilans();
  }, [locale]);

  const fetchBilans = async () => {
    setLoading(true);
    try {
      const [reportsRes, evtRes, actRes, campRes] = await Promise.all([
        getRecentReportsList(locale),
        fetch('/api/admin/bilans/evenements'),
        fetch('/api/admin/bilans/activites'),
        fetch('/api/admin/bilans/campagnes'),
      ]);

      if (reportsRes.success) {
        setReports(reportsRes.data);
      }

      if (evtRes.ok) {
        const evtData = await evtRes.json();
        setEvenements(evtData.data || []);
        setStats(evtData.stats);
      }

      if (actRes.ok) {
        const actData = await actRes.json();
        setActivites(actData.data || []);
      }

      if (campRes.ok) {
        const campData = await campRes.json();
        setCampagnes(campData.data || []);
      }
    } catch (error) {
      console.error('Erreur chargement bilans:', error);
      toast.error('Erreur lors du chargement des bilans');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async (report: any) => {
    setGeneratingReportId(report.id);
    const toastId = toast.loading(t('reports.generating'));
    
    try {
      // Use periodValue if available, fallback to subtitle parsing
      const period = report.periodValue || report.subtitle;
      const result = await generateGovernorReport(period);
      
      if (result.success && result.data) {
        toast.dismiss(toastId);
        toast.success(t('reports.generated'));
        
        // Open Report Window
        const reportWindow = window.open('', '_blank');
        if (reportWindow) {
          const d = result.data;
          const htmlContent = `
            <!DOCTYPE html>
            <html dir="${isRTL ? 'rtl' : 'ltr'}">
            <head>
              <title>${isRTL ? 'تقرير الحاكم' : 'Rapport du Gouverneur'} - ${d.period}</title>
              <style>
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; direction: ${isRTL ? 'rtl' : 'ltr'}; }
                .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #e2e8f0; padding-bottom: 20px; }
                .logo { font-size: 24px; font-weight: 900; color: #0f172a; text-transform: uppercase; margin-bottom: 10px; }
                .meta { color: #64748b; font-size: 14px; margin-top: 10px; }
                .section { margin-bottom: 30px; page-break-inside: avoid; }
                h1 { margin: 0; font-size: 28px; color: #0f172a; }
                h2 { font-size: 18px; color: #334155; ${isRTL ? 'border-right: 4px solid #3b82f6; padding-right: 10px;' : 'border-left: 4px solid #3b82f6; padding-left: 10px;'} margin-bottom: 15px; background: #f8fafc; padding-top: 5px; padding-bottom: 5px; }
                .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
                .card { background: #fff; padding: 20px; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
                .card h3 { margin: 0 0 5px 0; font-size: 14px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                .card .value { font-size: 28px; font-weight: 800; color: #0f172a; }
                .table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
                .table th, .table td { padding: 12px; text-align: ${isRTL ? 'right' : 'left'}; border-bottom: 1px solid #e2e8f0; }
                .table th { background: #f1f5f9; font-weight: 700; color: #475569; }
                .table tr:last-child td { border-bottom: none; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
                @media print { body { padding: 0; } .no-print { display: none; } }
              </style>
            </head>
            <body>
              <div class="header">
                 <div class="logo">${isRTL ? 'المملكة المغربية - عمالة مديونة' : 'ROYAUME DU MAROC - PROVINCE DE MÉDIOUNA'}</div>
                 <h1>${isRTL ? 'تقرير النشاط' : 'Rapport d\'Activité'} : ${d.period}</h1>
                 <div class="meta">${isRTL ? 'تقرير رسمي • تم إنشاؤه تلقائياً بواسطة منصة الحاكم' : 'Rapport Officiel • Généré automatiquement par la plateforme Gouverneur'} • ${new Date(d.generatedAt).toLocaleString(locale)}</div>
              </div>

              <div class="section">
                 <h2>1. ${isRTL ? 'الملخص العام' : 'Synthèse Globale'}</h2>
                 <div class="grid">
                    <div class="card">
                       <h3>${isRTL ? 'الشكايات الواردة' : 'Réclamations Reçues'}</h3>
                       <div class="value">${d.stats.reclamations.total}</div>
                    </div>
                    <div class="card">
                       <h3>${isRTL ? 'نسبة المعالجة' : 'Taux de Résolution'}</h3>
                       <div class="value" style="color: ${d.stats.reclamations.resolutionRate > 80 ? '#10b981' : '#f59e0b'}">${d.stats.reclamations.resolutionRate}%</div>
                    </div>
                    <div class="card">
                       <h3>${isRTL ? 'المؤسسات' : 'Établissements'}</h3>
                       <div class="value">${d.stats.etablissements.total}</div>
                    </div>
                    <div class="card">
                       <h3>${isRTL ? 'الفعاليات القادمة' : 'Événements à Venir'}</h3>
                       <div class="value">${d.stats.evenements.upcoming}</div>
                    </div>
                 </div>
              </div>

              <div class="section">
                 <h2>2. ${isRTL ? 'التوزيع حسب الجماعة' : 'Détail par Commune'}</h2>
                 <table class="table">
                    <thead><tr><th>${isRTL ? 'الجماعة' : 'Commune'}</th><th>${isRTL ? 'عدد الملفات' : 'Dossiers'}</th></tr></thead>
                    <tbody>
                       ${d.communes.map((c: any) => `<tr><td>${c.nom}</td><td><strong>${c.count}</strong></td></tr>`).join('')}
                    </tbody>
                 </table>
              </div>

               <div class="section">
                 <h2>3. ${isRTL ? 'التوزيع القطاعي' : 'Répartition Sectorielle'}</h2>
                 <table class="table">
                    <thead><tr><th>${isRTL ? 'القطاع' : 'Secteur'}</th><th>${isRTL ? 'عدد المؤسسات' : 'Établissements'}</th></tr></thead>
                    <tbody>
                       ${d.stats.etablissements.bySector.map((s: any) => `<tr><td>${s.secteur}</td><td><strong>${s.count}</strong></td></tr>`).join('')}
                    </tbody>
                 </table>
              </div>

              <div class="footer">
                 ${isRTL ? 'تم إنشاء هذه الوثيقة من المنصة الإقليمية الرقمية.' : 'Document généré depuis la plateforme Gouverneur V2.0.'}<br/>
                 ${isRTL ? 'نسخة مصادق عليها إلكترونياً.' : 'Certifié conforme par le système d\'information.'}
              </div>

              <script>
                 window.onload = function() { setTimeout(function() { window.print(); }, 500); }
              </script>
            </body>
            </html>
          `;
          reportWindow.document.write(htmlContent);
          reportWindow.document.close();
        }
      } else {
        toast.error(isRTL ? 'خطأ في الإنشاء' : 'Erreur lors de la génération');
      }
    } catch (e) {
      console.error(e);
      toast.error(isRTL ? 'خطأ في الخادم' : 'Erreur serveur');
    } finally {
      setGeneratingReportId(null);
    }
  };

  const toggleExpand = (key: string) => {
    const newSet = new Set(expandedItems);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedItems(newSet);
  };

  const filteredEvenements = evenements.filter(evt => {
    const matchSearch = searchQuery === '' || 
      evt.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.etablissement?.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSecteur = selectedSecteur === '' || evt.secteur === selectedSecteur;
    return matchSearch && matchSecteur;
  });

  const filteredActivites = activites.filter(act => {
    const matchSearch = searchQuery === '' || 
      act.titre.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.etablissement?.nom.toLowerCase().includes(searchQuery.toLowerCase());
    const matchSecteur = selectedSecteur === '' || act.etablissement?.secteur === selectedSecteur;
    return matchSearch && matchSecteur;
  });

  const filteredCampagnes = campagnes.filter(camp => {
    return searchQuery === '' || 
      camp.titre.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Photo Gallery Component
  const PhotoGallery = ({ photos, title }: { photos: string[]; title: string }) => {
    if (!photos || photos.length === 0) return null;
    return (
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          {t('bilans_page.labels.photos')} ({photos.length})
        </h5>
        <div className="flex flex-wrap gap-2">
          {photos.map((photo, idx) => (
            <a key={idx} href={photo} target="_blank" rel="noopener noreferrer" className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors group">
              <img src={photo} alt={`${title} - Photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  // Media Gallery for events/campaigns
  const MediaGallery = ({ medias }: { medias?: MediaItem[] }) => {
    if (!medias || medias.length === 0) return null;
    const images = medias.filter(m => m.type === 'IMAGE');
    if (images.length === 0) return null;
    return (
      <div className="mt-4">
        <h5 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          {t('bilans_page.labels.photos')} ({images.length})
        </h5>
        <div className="flex flex-wrap gap-2">
          {images.map((media) => (
            <a key={media.id} href={media.urlPublique} target="_blank" rel="noopener noreferrer" className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-200 hover:border-emerald-500 transition-colors group">
              <img src={media.urlPublique} alt={media.nomFichier} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
            </a>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-emerald-600 mx-auto" />
          <p className="text-gray-500 mt-4">{t('bilans_page.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center gap-4 mb-2">
        <Link href="/gouverneur" className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
               <FileText size={24} />
            </div>
            {t('bilans_page.title')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('bilans_page.subtitle')}
          </p>
        </div>
      </div>

     {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-blue-100">{t('bilans_page.stats.events')}</p>
              <p className="text-2xl font-bold">{evenements.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <ClipboardList className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-purple-100">{t('bilans_page.stats.activities')}</p>
              <p className="text-2xl font-bold">{activites.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <Megaphone className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-amber-100">{t('bilans_page.stats.campaigns')}</p>
              <p className="text-2xl font-bold">{campagnes.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm text-emerald-100">{t('bilans_page.stats.participants')}</p>
              <p className="text-2xl font-bold">
                {(stats?.totalParticipants || 0) + activites.reduce((sum, a) => sum + (a.presenceEffective || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-3 font-bold transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
          }`}
        >
          <BarChart3 className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('sidebar.nav.reports')}
        </button>
        <button
          onClick={() => setActiveTab('evenements')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'evenements'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Calendar className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('bilans_page.tabs.events')} ({evenements.length})
        </button>
        <button
          onClick={() => setActiveTab('activites')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'activites'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClipboardList className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('bilans_page.tabs.activities')} ({activites.length})
        </button>
        <button
          onClick={() => setActiveTab('campagnes')}
          className={`px-6 py-3 font-medium transition-colors whitespace-nowrap ${
            activeTab === 'campagnes'
              ? 'text-emerald-600 border-b-2 border-emerald-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <Megaphone className={`w-4 h-4 inline ${isRTL ? 'ml-2' : 'mr-2'}`} />
          {t('bilans_page.tabs.campaigns')} ({campagnes.length})
        </button>
      </div>

       {/* Content - Reports */}
      {activeTab === 'reports' && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
             {reports.map((report, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500" />
                    <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                       <FileText size={32} />
                    </div>
                    <h3 className="text-xl font-black text-slate-800 mb-1">{report.title}</h3>
                    <p className="text-slate-500 font-medium text-sm mb-6">{report.subtitle}</p>
                    
                    <div className="mt-auto w-full">
                       <div className="flex items-center justify-center gap-2 mb-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                             report.status === 'Disponible' || report.status === 'متاح' || report.status === 'Validé' || report.status === 'مصادق عليه'
                             ? 'bg-emerald-100 text-emerald-600'
                             : 'bg-amber-100 text-amber-600'
                          }`}>
                             {report.status}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                             {new Date(report.date).toLocaleDateString(locale)}
                          </span>
                       </div>
                       
                       <button 
                          onClick={() => handleGenerateReport(report)}
                          disabled={generatingReportId === report.id}
                          className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                       >
                          {generatingReportId === report.id 
                            ? <Loader2 size={16} className="animate-spin" /> 
                            : <ArrowDownToLine size={18} />
                          }
                          {t('reports.download')}
                       </button>
                    </div>
                </div>
             ))}
             
             {/* Archive Button */}
             <button className="flex flex-col items-center justify-center p-6 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 hover:bg-indigo-50 transition-all gap-3 h-full">
                <Search size={32} />
                <span className="font-bold">{t('reports.view_all')}</span>
             </button>
         </div>
      )}

      {/* Filters (Active only for other tabs) */}
      {activeTab !== 'reports' && (
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="text"
              placeholder={t('bilans_page.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800`}
            />
          </div>
          
          {(activeTab === 'evenements' || activeTab === 'activites') && (
            <select
              value={selectedSecteur}
              onChange={(e) => setSelectedSecteur(e.target.value)}
              className="px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-gray-800"
            >
              <option value="">{t('bilans_page.sectors_all')}</option>
              <option value="EDUCATION">{tSectors('education')}</option>
              <option value="SANTE">{tSectors('sante')}</option>
              <option value="SPORT">{tSectors('sport')}</option>
              <option value="SOCIAL">{tSectors('social')}</option>
              <option value="CULTUREL">{tSectors('culturel')}</option>
              <option value="AUTRE">{tSectors('autre')}</option>
            </select>
          )}
        </div>
      )}

      {/* Content - Événements */}
      {activeTab === 'evenements' && (
        <div className="space-y-4">
          {filteredEvenements.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">{t('bilans_page.empty.events')}</h3>
              <p className="text-gray-500">{t('bilans_page.empty.desc')}</p>
            </div>
          ) : (
            filteredEvenements.map((evt) => {
              const isExpanded = expandedItems.has(`evt-${evt.id}`);
              return (
                <div 
                  key={evt.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${SECTEUR_COLORS[evt.secteur] || 'bg-gray-100'}`}>
                        {tSectors(evt.secteur.toLowerCase())}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(evt.dateDebut).toLocaleDateString(locale)}
                        {evt.dateFin && ` - ${new Date(evt.dateFin).toLocaleDateString(locale)}`}
                      </span>
                      {evt.medias && evt.medias.length > 0 && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {evt.medias.filter(m => m.type === 'IMAGE').length} {t('bilans_page.labels.photos')}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {evt.titre}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      {evt.etablissement && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-4 h-4" />
                          {evt.etablissement.nom}
                        </span>
                      )}
                      {evt.commune && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {evt.commune.nom}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <Users className="w-4 h-4" />
                        {evt.bilanNbParticipants || evt.nombreInscrits} {t('bilans_page.labels.participations')}
                      </span>
                    </div>

                    {/* Bilan Description */}
                    {evt.bilanDescription && (
                      <div className="bg-gradient-to-r from-gray-50 to-emerald-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-emerald-500">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600" />
                            {t('bilans_page.labels.closing_report')}
                          </h4>
                          <button 
                            onClick={() => toggleExpand(`evt-${evt.id}`)}
                            className="text-sm text-emerald-600 hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isExpanded ? t('bilans_page.labels.reduce') : t('bilans_page.labels.view_details')}
                          </button>
                        </div>
                        <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                          {isExpanded ? evt.bilanDescription : (evt.bilanDescription.length > 300 ? evt.bilanDescription.substring(0, 300) + '...' : evt.bilanDescription)}
                        </p>
                        {evt.bilanDatePublication && (
                          <p className="text-xs text-gray-400 mt-3">
                            📅 {t('bilans_page.labels.published_on')} {new Date(evt.bilanDatePublication).toLocaleDateString(locale)}
                          </p>
                        )}
                        
                        {/* Photos */}
                        {isExpanded && <MediaGallery medias={evt.medias} />}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content - Activités */}
      {activeTab === 'activites' && (
        <div className="space-y-4">
          {filteredActivites.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <ClipboardList className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">{t('bilans_page.empty.activities')}</h3>
              <p className="text-gray-500">{t('bilans_page.empty.desc')}</p>
            </div>
          ) : (
            filteredActivites.map((act) => {
              const isExpanded = expandedItems.has(`act-${act.id}`);
              return (
                <div 
                  key={act.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${SECTEUR_COLORS[act.etablissement.secteur] || 'bg-gray-100'}`}>
                        {tSectors(act.etablissement.secteur.toLowerCase())}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700">
                        {act.typeActivite}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(act.date).toLocaleDateString(locale)} • {act.heureDebut} - {act.heureFin}
                      </span>
                      {act.photosRapport && act.photosRapport.length > 0 && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {act.photosRapport.length} {t('bilans_page.labels.photos')}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {act.titre}
                    </h3>
                    
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {act.etablissement.nom}
                      </span>
                      {act.etablissement.commune && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {act.etablissement.commune.nom}
                        </span>
                      )}
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <Users className="w-4 h-4" />
                        {act.presenceEffective || 0} / {act.participantsAttendus || '?'} {t('bilans_page.labels.present')}
                        {act.tauxPresence && (
                          <span className="text-xs text-gray-400">({act.tauxPresence.toFixed(0)}%)</span>
                        )}
                      </span>
                      {act.noteQualite && (
                        <span className="flex items-center gap-1 text-amber-600">
                          <Star className="w-4 h-4 fill-current" />
                          {act.noteQualite}/5
                        </span>
                      )}
                    </div>

                    {/* Rapport */}
                    <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:bg-gray-700 rounded-lg p-4 border-l-4 border-purple-500">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                          <FileText className="w-4 h-4 text-purple-600" />
                          {t('bilans_page.labels.activity_report')}
                        </h4>
                        <button 
                          onClick={() => toggleExpand(`act-${act.id}`)}
                          className="text-sm text-purple-600 hover:underline flex items-center gap-1"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          {isExpanded ? t('bilans_page.labels.reduce') : t('bilans_page.labels.view_details')}
                        </button>
                      </div>
                      
                      {act.commentaireDeroulement && (
                        <p className="text-gray-700 dark:text-gray-300 text-sm mb-3">
                          <strong>{t('bilans_page.labels.progress')} :</strong> {isExpanded ? act.commentaireDeroulement : (act.commentaireDeroulement.length > 200 ? act.commentaireDeroulement.substring(0, 200) + '...' : act.commentaireDeroulement)}
                        </p>
                      )}
                      
                      {isExpanded && (
                        <>
                          {act.pointsPositifs && (
                            <p className="text-emerald-700 dark:text-emerald-400 text-sm mb-2">
                              <strong>✅ {t('bilans_page.labels.positives')} :</strong> {act.pointsPositifs}
                            </p>
                          )}
                          {act.difficultes && (
                            <p className="text-amber-700 dark:text-amber-400 text-sm mb-2">
                              <strong>⚠️ {t('bilans_page.labels.difficulties')} :</strong> {act.difficultes}
                            </p>
                          )}
                          {act.recommandations && (
                            <p className="text-blue-700 dark:text-blue-400 text-sm mb-2">
                              <strong>💡 {t('bilans_page.labels.recommendations')} :</strong> {act.recommandations}
                            </p>
                          )}
                          
                          {/* Photos du rapport */}
                          <PhotoGallery photos={act.photosRapport || []} title={act.titre} />
                        </>
                      )}
                      
                      {act.dateRapport && (
                        <p className="text-xs text-gray-400 mt-2">
                          {t('bilans_page.labels.report_completed_on')} {new Date(act.dateRapport).toLocaleDateString(locale)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Content - Campagnes */}
      {activeTab === 'campagnes' && (
        <div className="space-y-4">
          {filteredCampagnes.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
              <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700">{t('bilans_page.empty.campaigns')}</h3>
              <p className="text-gray-500">{t('bilans_page.empty.desc')}</p>
            </div>
          ) : (
            filteredCampagnes.map((camp) => {
              const isExpanded = expandedItems.has(`camp-${camp.id}`);
              return (
                <div 
                  key={camp.id} 
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                        {t('bilans_page.labels.citizen_campaign')}
                      </span>
                      {camp.dateDebut && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(camp.dateDebut).toLocaleDateString(locale)}
                          {camp.dateFin && ` - ${new Date(camp.dateFin).toLocaleDateString(locale)}`}
                        </span>
                      )}
                      {camp.medias && camp.medias.length > 0 && (
                        <span className="text-xs text-emerald-600 flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" />
                          {camp.medias.filter(m => m.type === 'IMAGE').length} {t('bilans_page.labels.photos')}
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {camp.titre}
                    </h3>
                    
                    {camp.description && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                        {camp.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-4 text-sm mb-4">
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <Users className="w-4 h-4" />
                        {camp.nombreParticipations} {t('bilans_page.labels.participations')}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500">
                        <Eye className="w-4 h-4" />
                        {camp.nombreVues} {t('bilans_page.labels.views')}
                      </span>
                      {camp.objectifParticipations && (
                        <span className="flex items-center gap-1 text-gray-500">
                          🎯 {t('bilans_page.labels.objective')}: {camp.objectifParticipations}
                        </span>
                      )}
                    </div>

                    {/* Success indicator */}
                    <div className="bg-gradient-to-r from-amber-50 to-green-50 rounded-lg p-4 border-l-4 border-amber-500">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-amber-700">
                          <CheckCircle2 className="w-5 h-5" />
                          <span className="font-medium">{t('bilans_page.labels.campaign_success')}</span>
                        </div>
                        {(camp.bilanDescription || (camp.medias && camp.medias.length > 0)) && (
                          <button 
                            onClick={() => toggleExpand(`camp-${camp.id}`)}
                            className="text-sm text-amber-600 hover:underline flex items-center gap-1"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            {isExpanded ? t('bilans_page.labels.reduce') : t('bilans_page.labels.view_details')}
                          </button>
                        )}
                      </div>
                      
                      {camp.objectifParticipations && (
                        <p className="text-sm text-gray-600">
                          {camp.objectifParticipations <= camp.nombreParticipations 
                            ? `✅ ${t('bilans_page.labels.objective')} ${t('bilans_page.labels.reached')} (${camp.nombreParticipations}/${camp.objectifParticipations})`
                            : `📊 ${camp.nombreParticipations}/${camp.objectifParticipations} ${t('bilans_page.labels.participations')}`
                          }
                        </p>
                      )}
                      
                      {isExpanded && camp.bilanDescription && (
                        <p className="text-gray-700 text-sm mt-3 whitespace-pre-wrap">
                          {camp.bilanDescription}
                        </p>
                      )}
                      
                      {isExpanded && <MediaGallery medias={camp.medias} />}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
