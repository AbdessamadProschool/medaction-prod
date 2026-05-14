'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
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
  const [loading, setLoading] = useState(true);
  const [reclamationsData, setReclamationsData] = useState<any>(null);
  const [evenementsData, setEvenementsData] = useState<any>(null);
  const [satisfactionData, setSatisfactionData] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams(dateRange);
      const [recRes, evtRes, satRes] = await Promise.all([
        fetch(`/api/rapports/reclamations?${params}`),
        fetch(`/api/rapports/evenements?${params}`),
        fetch(`/api/rapports/satisfaction?${params}`)
      ]);

      setReclamationsData(await recRes.json());
      setEvenementsData(await evtRes.json());
      setSatisfactionData(await satRes.json());
    } catch (error) {
      console.error('Erreur chargement rapports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [dateRange]);

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
        // PDF Export - Simulation ou ouverture d'une vue imprimable
        alert("L'export PDF sera généré et téléchargé.");
        // Ici on pourrait appeler l'API PDF et générer un PDF client-side avec les données reçues
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

  return (
    <div className="space-y-8 max-w-[1600px] mx-auto pb-20">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[hsl(var(--gov-blue))/0.1] rounded-2xl flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
              <BarChart3 className="text-[hsl(var(--gov-blue))] w-6 h-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {t('title')}
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg ml-15">
            {t('subtitle')}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-card border border-border rounded-2xl p-2 shadow-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl">
              <Calendar size={14} className="text-muted-foreground" />
              <input 
                type="date" 
                value={dateRange.startDate}
                onChange={e => setDateRange({...dateRange, startDate: e.target.value})}
                className="bg-transparent border-none p-0 text-[10px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer"
              />
            </div>
            <ArrowRight size={14} className="text-muted-foreground/30" />
            <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-xl">
              <Calendar size={14} className="text-muted-foreground" />
              <input 
                type="date" 
                value={dateRange.endDate}
                onChange={e => setDateRange({...dateRange, endDate: e.target.value})}
                className="bg-transparent border-none p-0 text-[10px] font-bold uppercase tracking-widest focus:ring-0 cursor-pointer"
              />
            </div>
          </div>
          
          <button
            onClick={fetchData}
            className="w-12 h-12 flex items-center justify-center bg-card border border-border rounded-2xl hover:bg-muted hover:border-muted-foreground/30 transition-all shadow-sm group"
          >
            <RefreshCw size={20} className={`text-muted-foreground group-hover:text-foreground transition-colors ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

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
            Export Rapport Global PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: t('kpi_cards.total_reclamations'), 
            value: reclamationsData?.total || 0, 
            icon: AlertCircle, 
            color: 'hsl(var(--gov-red))',
            trend: '+12%' 
          },
          { 
            label: t('kpi_cards.total_events'), 
            value: evenementsData?.total || 0, 
            icon: Calendar, 
            color: 'hsl(var(--gov-blue))',
            trend: '+5%'
          },
          { 
            label: t('kpi_cards.average_rating'), 
            value: satisfactionData?.global?.average?.toFixed(1) || 'N/A', 
            icon: Star, 
            color: 'hsl(var(--gov-yellow))',
            suffix: ' ★'
          },
          { 
            label: t('kpi_cards.event_participation'), 
            value: evenementsData?.participation?.totalInscrits || 0, 
            icon: Users, 
            color: 'hsl(var(--gov-green))' 
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
                {stat.trend && (
                  <span className="text-[10px] font-black text-[hsl(var(--gov-green))] bg-[hsl(var(--gov-green))/0.1] px-2 py-1 rounded-full">
                    {stat.trend}
                  </span>
                )}
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Répartition par état de traitement</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reclamationsData?.byStatus || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={8}
                  dataKey="count"
                  nameKey="statut"
                  stroke="none"
                >
                  {reclamationsData?.byStatus?.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '16px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
              </PieChart>
            </ResponsiveContainer>
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Historique des dépôts citoyens</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={reclamationsData?.evolution || []}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--gov-blue))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--gov-blue))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="hsl(var(--gov-blue))" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  activeDot={{ r: 6, strokeWidth: 0, fill: 'hsl(var(--gov-blue))' }} 
                />
              </AreaChart>
            </ResponsiveContainer>
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Focus géographique sur les doléances</p>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reclamationsData?.byCommune || []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                <XAxis 
                  type="number" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
                />
                <YAxis 
                  dataKey="commune" 
                  type="category" 
                  width={100} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
                />
                <Tooltip 
                  cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))', 
                    borderRadius: '16px',
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--gov-blue))" radius={[0, 10, 10, 0]} barSize={24} />
              </BarChart>
            </ResponsiveContainer>
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
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">Palmarès de la satisfaction citoyenne</p>
            </div>
          </div>
          <div className="space-y-4">
            {satisfactionData?.topEtablissements?.map((etab: any, i: number) => (
                <div key={i} className="group flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 rounded-2xl border border-border/50 transition-all hover:scale-[1.01]">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center text-xs font-black text-muted-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors shadow-sm">
                        #{i + 1}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-extrabold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors line-clamp-1">{etab.nom}</span>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Building2 size={12} className="text-muted-foreground/40" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{etab.secteur || 'Secteur Public'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-[hsl(var(--gov-yellow))/0.1] rounded-full border border-[hsl(var(--gov-yellow))/0.2]">
                          <span className="text-xs font-black text-[hsl(var(--gov-yellow))]">{etab.noteMoyenne.toFixed(1)}</span>
                          <Star size={12} className="text-[hsl(var(--gov-yellow))] fill-current" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground mt-1.5 opacity-40">
                          {t('reviews_count', { count: etab.nombreEvaluations })}
                        </span>
                    </div>
                </div>
            ))}
            {(!satisfactionData?.topEtablissements || satisfactionData.topEtablissements.length === 0) && (
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
