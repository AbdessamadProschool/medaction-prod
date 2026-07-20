'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useData } from '@/hooks/use-data';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const ReclamationsStatusPieChart = dynamic(() => import('@/components/admin/RapportsCharts').then(mod => mod.ReclamationsStatusPieChart), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-muted rounded-xl"></div>
});

const ReclamationsEvolutionAreaChart = dynamic(() => import('@/components/admin/RapportsCharts').then(mod => mod.ReclamationsEvolutionAreaChart), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-muted rounded-xl"></div>
});

const ReclamationsCommuneBarChart = dynamic(() => import('@/components/admin/RapportsCharts').then(mod => mod.ReclamationsCommuneBarChart), {
  ssr: false,
  loading: () => <div className="w-full h-full animate-pulse bg-muted rounded-xl"></div>
});
import { 
  FileSpreadsheet, 
  Star, 
  Download, 
  Calendar, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  BarChart3, 
  MapPin,
  Building2,
  Users,
  RefreshCw,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GovDatePicker } from '@/components/ui/GovDatePicker';
import { GovPageHeader, GovButton } from '@/components/ui';

const COLORS = [
  'hsl(var(--gov-blue))',
  'hsl(var(--gov-green))',
  'hsl(var(--gov-yellow))',
  'hsl(var(--gov-red))',
  'hsl(var(--gov-muted))',
  '#8B5CF6'
];

export default function RapportsPage() {
  const t = useTranslations('admin.reports_page');
  const params_route = useParams();
  const locale = (params_route?.locale as string) || 'fr';
  const isAr = locale === 'ar';
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const params = new URLSearchParams(dateRange as any).toString();

  const { data: reclamationsData, isLoading: loadingRec, mutate: fetchRec } = useData(`/api/rapports/reclamations?${params}`);
  const { data: evenementsData, isLoading: loadingEvt, mutate: fetchEvt } = useData(`/api/rapports/evenements?${params}`);
  const { data: satisfactionData, isLoading: loadingSat, mutate: fetchSat } = useData(`/api/rapports/satisfaction?${params}`);

  const loading = loadingRec || loadingEvt || loadingSat;

  const fetchData = async () => {
    await Promise.all([fetchRec(), fetchEvt(), fetchSat()]);
  };

  const handleExport = async (format: 'excel' | 'pdf', type: 'reclamations' | 'evenements' | 'global') => {
    try {
      if (format === 'excel') {
        const res = await fetch('/api/export/excel', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, ...dateRange })
        });
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-${type}.csv`;
        a.click();
      } else {
        const res = await fetch('/api/export/pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, ...dateRange })
        });
        const rawData = await res.json();
        const data = rawData?.data || rawData;
        
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
          alert(locale === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة لطباعة التقرير.' : 'Veuillez autoriser les fenêtres surgissantes (popups) pour imprimer le rapport.');
          return;
        }

        const isAr = locale === 'ar';
        const dir = isAr ? 'rtl' : 'ltr';
        
        const formatStatus = (status: string, lang: string) => {
          const statusMap: Record<string, Record<string, string>> = {
            EN_ATTENTE: { ar: 'في الانتظار', fr: 'En attente' },
            EN_COURS: { ar: 'قيد المعالجة', fr: 'En cours' },
            RESOLUE: { ar: 'تم حلها', fr: 'Résolue' },
            REJETEE: { ar: 'مرفوضة', fr: 'Rejetée' }
          };
          return statusMap[status]?.[lang] || status;
        };

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <title>${isAr ? 'تقرير النشاط الإجمالي' : "Rapport Global d'Activité"}</title>
              <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
              <style>
                @media print {
                  body { -webkit-print-color-adjust: exact; }
                  .no-print { display: none; }
                }
                body {
                  font-family: system-ui, -apple-system, sans-serif;
                }
              </style>
            </head>
            <body dir="${dir}" class="p-12 bg-white text-gray-800">
              <div class="flex items-center justify-between border-b-2 border-gray-200 pb-6 mb-8">
                <div>
                  <h1 class="text-3xl font-extrabold text-gray-900">${isAr ? 'بوابة مديونة الرقمية' : 'Portail Numérique de Médiouna'}</h1>
                  <p class="text-sm font-medium text-gray-500 mt-1">${isAr ? 'عمالة إقليم مديونة' : 'Province de Médiouna'}</p>
                </div>
                <img src="/images/logo-portal-mediouna.png" alt="Logo" class="h-16 w-auto object-contain">
              </div>

              <div class="mb-8">
                <h2 class="text-2xl font-black text-gray-800 mb-2">${isAr ? 'تقرير النشاط الإجمالي للرقابة والمتابعة' : "Rapport Global d'Activité et de Suivi"}</h2>
                <p class="text-sm font-bold text-gray-600 bg-gray-100 px-4 py-2 rounded-xl inline-block">
                  ${isAr ? 'الفترة الزمنية:' : 'Période :'} ${dateRange.startDate} ${isAr ? 'إلى' : 'à'} ${dateRange.endDate}
                </p>
              </div>

              <!-- KPIs Grid -->
              <div class="grid grid-cols-3 gap-6 mb-10">
                <div class="p-6 border border-gray-200 rounded-2xl bg-gray-50/50">
                  <p class="text-xs font-black uppercase tracking-wider text-gray-500">${isAr ? 'إجمالي الشكايات' : 'Total Réclamations'}</p>
                  <p class="text-4xl font-black text-red-600 mt-2">${data.stats?.reclamations || 0}</p>
                </div>
                <div class="p-6 border border-gray-200 rounded-2xl bg-gray-50/50">
                  <p class="text-xs font-black uppercase tracking-wider text-gray-500">${isAr ? 'إجمالي الفعاليات' : 'Total Événements'}</p>
                  <p class="text-4xl font-black text-blue-600 mt-2">${data.stats?.evenements || 0}</p>
                </div>
                <div class="p-6 border border-gray-200 rounded-2xl bg-gray-50/50">
                  <p class="text-xs font-black uppercase tracking-wider text-gray-500">${isAr ? 'إجمالي المستخدمين الجدد' : 'Total Nouveaux Utilisateurs'}</p>
                  <p class="text-4xl font-black text-green-600 mt-2">${data.stats?.users || 0}</p>
                </div>
              </div>

              <!-- Reclamations by Status -->
              <div class="mb-10">
                <h3 class="text-lg font-black text-gray-800 mb-4 border-b border-gray-200 pb-2">${isAr ? 'توزيع الشكايات حسب حالة المعالجة' : 'Répartition des réclamations par statut'}</h3>
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="bg-gray-100 text-gray-700">
                      <th class="p-3 text-sm font-black border-b border-gray-200">${isAr ? 'حالة الشكاية' : 'Statut de la réclamation'}</th>
                      <th class="p-3 text-sm font-black border-b border-gray-200 text-right">${isAr ? 'عدد الشكايات' : 'Nombre de réclamations'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${(Array.isArray(data.details?.reclamationsByStatus) ? data.details.reclamationsByStatus : []).map((item: any) => `
                      <tr class="border-b border-gray-100 text-gray-600">
                        <td class="p-3 text-sm font-bold">${formatStatus(item.statut, isAr ? 'ar' : 'fr')}</td>
                        <td class="p-3 text-sm font-bold text-right">${item._count?._all || 0}</td>
                      </tr>
                    `).join('')}
                    ${(!data.details?.reclamationsByStatus || data.details.reclamationsByStatus.length === 0) ? `
                      <tr>
                        <td colspan="2" class="p-6 text-sm text-gray-400 text-center">${isAr ? 'لا توجد بيانات متاحة حالياً' : 'Aucune donnée disponible actuellement'}</td>
                      </tr>
                    ` : ''}
                  </tbody>
                </table>
              </div>

              <!-- Signature Footer -->
              <div class="mt-24 flex justify-between text-sm text-gray-500">
                <div>
                  <p>${isAr ? 'تم استخراج هذا التقرير في:' : 'Rapport extrait le :'} ${new Date().toLocaleDateString()}</p>
                  <p class="text-xs text-gray-400 mt-1">${isAr ? 'النظام الرقمي لعمالة إقليم مديونة' : 'Système Numérique de la Province de Médiouna'}</p>
                </div>
                <div class="text-right">
                  <p class="font-extrabold text-gray-700 mb-12">${isAr ? 'توقيع واعتماد الإدارة' : "Cachet et Signature de l'Administration"}</p>
                  <div class="w-48 border-b-2 border-gray-400 h-10 inline-block"></div>
                </div>
              </div>

              <script>
                window.onload = function() {
                  window.print();
                }
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    }
  };

  if (loading && !reclamationsData) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[hsl(var(--gov-blue))/0.1] border-t-[hsl(var(--gov-blue))] rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground animate-pulse">
            {t('loading') || 'Génération des rapports...'}
          </p>
        </div>
      </div>
    );
  }

  const formatStatusLabel = (status: string) => {
    const statusMap: Record<string, Record<string, string>> = {
      EN_ATTENTE: { ar: 'في الانتظار', fr: 'En attente' },
      EN_COURS: { ar: 'قيد المعالجة', fr: 'En cours' },
      RESOLUE: { ar: 'تم حلها', fr: 'Résolue' },
      REJETEE: { ar: 'مرفوضة', fr: 'Rejetée' }
    };
    return statusMap[status]?.[locale] || status;
  };

  const rData = reclamationsData?.data || reclamationsData;
  const eData = evenementsData?.data || evenementsData;
  const sData = satisfactionData?.data || satisfactionData;

  const translatedStatusData = Array.isArray(rData?.byStatus)
    ? rData.byStatus.map((item: any) => ({
        ...item,
        statut: formatStatusLabel(item.statut)
      }))
    : [];

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      <GovPageHeader
        title={t('title')}
        subtitle={t('subtitle')}
        icon={<BarChart3 className="w-8 h-8" />}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <GovDatePicker
              value={dateRange.startDate}
              onChange={val => setDateRange({...dateRange, startDate: val})}
              placeholder={isAr ? 'من تاريخ' : 'Du'}
              containerClassName="w-40"
              className="!py-2 !px-3 text-xs"
            />
            <ArrowRight size={14} className="text-muted-foreground/30" />
            <GovDatePicker
              value={dateRange.endDate}
              onChange={val => setDateRange({...dateRange, endDate: val})}
              placeholder={isAr ? 'إلى تاريخ' : 'Au'}
              containerClassName="w-40"
              className="!py-2 !px-3 text-xs"
            />
            
            <GovButton
              onClick={async () => { await fetchData(); }}
              variant="outline"
              size="icon"
            >
              <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
            </GovButton>
          </div>
        }
      />

      {/* Actions Export */}
      <div className="flex flex-wrap items-center gap-4">
        <button 
            onClick={() => handleExport('excel', 'reclamations')}
            className="gov-btn-outline h-12 px-6 rounded-2xl text-[10px] uppercase tracking-widest font-black flex items-center gap-3 bg-[hsl(var(--gov-green))/0.05] border-[hsl(var(--gov-green))/0.2] text-[hsl(var(--gov-green))] hover:bg-[hsl(var(--gov-green))] hover:text-white"
        >
            <FileSpreadsheet size={18} /> 
            {t('export_buttons.excel_reclamations')}
        </button>
        <button 
            onClick={() => handleExport('excel', 'evenements')}
            className="gov-btn-outline h-12 px-6 rounded-2xl text-[10px] uppercase tracking-widest font-black flex items-center gap-3 bg-[hsl(var(--gov-blue))/0.05] border-[hsl(var(--gov-blue))/0.2] text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue))] hover:text-white"
        >
            <Download size={18} /> 
            {t('export_buttons.excel_events')}
        </button>
        <button 
            onClick={() => handleExport('pdf', 'global')}
            className="gov-btn-outline h-12 px-6 rounded-2xl text-[10px] uppercase tracking-widest font-black flex items-center gap-3 bg-muted/50 border-border text-muted-foreground hover:bg-foreground hover:text-background"
        >
            <FileText size={18} /> 
            {locale === 'ar' ? 'تصدير التقرير العام (PDF)' : 'Export Rapport Global PDF'}
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {[
          { 
            label: t('kpi_cards.total_reclamations'), 
            value: rData?.total || 0, 
            icon: AlertCircle, 
            color: 'hsl(var(--gov-red))'
          },
          { 
            label: t('kpi_cards.total_events'), 
            value: eData?.total || 0, 
            icon: Calendar, 
            color: 'hsl(var(--gov-blue))'
          },
          { 
            label: t('kpi_cards.average_rating'), 
            value: typeof sData?.global?.average === 'number' ? sData.global.average.toFixed(1) : 'N/A', 
            icon: Star, 
            color: 'hsl(var(--gov-yellow))',
            suffix: ' ★'
          },
          { 
            label: t('kpi_cards.event_participation'), 
            value: eData?.participation?.totalInscrits || 0, 
            icon: Users, 
            color: 'hsl(var(--gov-green))' 
          },
          {
            label: locale === 'ar' ? 'نسبة الحل' : 'Taux de résolution',
            value: sData?.global?.resolutionRate ?? '—',
            icon: CheckCircle,
            color: 'hsl(var(--gov-green))',
            suffix: sData?.global?.resolutionRate !== undefined ? '%' : ''
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="gov-stat-card group relative overflow-hidden"
          >
            <div 
              className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-[0.03] transition-transform group-hover:scale-110 group-hover:rotate-12"
              style={{ color: stat.color }}
            >
              <stat.icon className="w-full h-full" />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div 
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-current/10"
                  style={{ backgroundColor: `${stat.color}08`, color: stat.color }}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              <p className="text-3xl font-black text-foreground mb-1 tracking-tight">
                {stat.value}{stat.suffix}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts Section 1: Réclamations */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-[hsl(var(--gov-blue))/0.02]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">{t('charts.reclamations_by_status')}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{locale === 'ar' ? 'التوزيع حسب حالة المعالجة' : 'Répartition par état de traitement'}</p>
            </div>
          </div>
          <div className="h-80">
              <ReclamationsStatusPieChart data={translatedStatusData} />
          </div>
        </motion.div>
 
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-[hsl(var(--gov-blue))/0.02]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">{t('charts.reclamations_evolution')}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{locale === 'ar' ? 'سجل شكايات المواطنين' : 'Historique des dépôts citoyens'}</p>
            </div>
          </div>
          <div className="h-80">
              <ReclamationsEvolutionAreaChart data={Array.isArray(rData?.evolution) ? rData.evolution : []} />
          </div>
        </motion.div>
      </div>

      {/* Charts Section 2: Communes & Satisfaction */}
      <div className="grid lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-[hsl(var(--gov-blue))/0.02]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">{t('charts.reclamations_by_commune')}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{locale === 'ar' ? 'التركيز الجغرافي للشكايات' : 'Focus géographique sur les doléances'}</p>
            </div>
          </div>
          <div className="h-80">
              <ReclamationsCommuneBarChart data={Array.isArray(rData?.byCommune) ? rData.byCommune : []} />
          </div>
        </motion.div>
 
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-[hsl(var(--gov-blue))/0.02]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">{t('charts.top_5_establishments')}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{locale === 'ar' ? 'مستوى رضا المواطنين' : 'Palmarès de la satisfaction citoyenne'}</p>
            </div>
          </div>
          <div className="space-y-4">
            {Array.isArray(sData?.topEtablissements) && sData.topEtablissements.map((etab: any, i: number) => (
                <div key={i} className="group flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/50 transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-xs font-black text-muted-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors shadow-sm">
                        #{i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors line-clamp-1">{etab.nom}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Building2 size={12} className="text-muted-foreground/40" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{etab.secteur || (locale === 'ar' ? 'القطاع العام' : 'Secteur Public')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[hsl(var(--gov-yellow))/0.1] rounded-full border border-[hsl(var(--gov-yellow))/0.2]">
                          <span className="text-xs font-black text-[hsl(var(--gov-yellow))]">{typeof etab.noteMoyenne === 'number' ? etab.noteMoyenne.toFixed(1) : etab.noteMoyenne}</span>
                          <Star size={12} className="text-[hsl(var(--gov-yellow))] fill-current" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5 opacity-40">
                          {t('reviews_count', { count: etab.nombreEvaluations })}
                        </span>
                    </div>
                </div>
            ))}
            {(!sData?.topEtablissements || sData.topEtablissements.length === 0) && (
                <div className="flex flex-col items-center justify-center py-12 opacity-30">
                  <TrendingUp size={48} />
                  <p className="text-[10px] font-bold uppercase tracking-widest mt-4">{t('no_data')}</p>
                </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
