'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import {
  Users,
  Building2,
  Calendar,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  Activity,
  CheckCircle2,
  Clock,
  AlertTriangle,
  BarChart3,
  UserPlus,
  Newspaper,
  Megaphone,
  Lightbulb,
  FileText,
  Shield,
  Download,
  RefreshCw,
  ChevronRight,
  Bell,
  Zap,
  Target,
  Eye,
  Star,
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { GovButton } from '@/components/ui/GovButton';
import { KpiCard, KpiGrid } from '@/components/ui/KpiCard';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface DashboardStats {
  utilisateurs: { total: number; nouveaux: number; variation: number };
  etablissements: { total: number; valides: number; variation: number };
  evenements: { total: number; enCours: number; aCloturer?: number; variation: number };
  reclamations: { total: number; enAttente: number; variation: number };
  campagnesEnAttente?: number;
  campagnesBrouillon?: number;
  suggestionsEnAttente?: number;
  recentActivity?: Array<{
    id: number;
    type: string;
    message: string;
    time: string;
  }>;
}

interface ChartData {
  evenementsParSecteur: { secteur: string; count: number }[];
  reclamationsParStatut: { statut: string; count: number; color: string }[];
}

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// MetricCard is replaced by the global KpiCard component

// Quick Action Card
function QuickActionCard({
  title,
  description,
  icon: Icon,
  href,
  color,
  count,
  urgent = false,
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
  count?: number;
  urgent?: boolean;
}) {
  const t = useTranslations('admin.dashboard.quick_actions');
  
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.98 }}
        className={`relative p-5 rounded-2xl bg-gradient-to-br ${color} text-white overflow-hidden group cursor-pointer shadow-lg shadow-black/5 hover:shadow-xl transition-all duration-300`}
      >
        {/* Motif Royal Overlay */}
        <div className="absolute inset-0 opacity-10 gov-pattern" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            {count !== undefined && count > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${urgent ? 'bg-[hsl(var(--gov-red))] text-white animate-pulse' : 'bg-white/20 backdrop-blur'}`}>
                {count} {urgent ? '!' : ''}
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm opacity-80 line-clamp-1">{description}</p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-[-10px] group-hover:translate-x-0">
            {t('access')}
            <ChevronRight className="w-4 h-4" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// Mini Bar Chart Component
function MiniBarChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  return (
    <div className="h-64 mt-4 relative">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
          <XAxis 
            type="number" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
          />
          <YAxis 
            dataKey="label" 
            type="category" 
            width={100} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fontSize: 10, fontWeight: 'bold', fill: 'hsl(var(--muted-foreground))' }} 
          />
          <RechartsTooltip 
            cursor={{ fill: 'hsl(var(--muted)/0.3)' }}
            contentStyle={{ 
              backgroundColor: 'hsl(var(--card))', 
              border: '1px solid hsl(var(--border))', 
              borderRadius: '16px',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'
            }}
          />
          <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={24}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Donut Chart Component using Recharts
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const t = useTranslations('admin.dashboard.charts');

  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground opacity-30">
        <Activity size={48} />
        <p className="text-[10px] font-bold uppercase tracking-widest mt-4">{t('no_data')}</p>
      </div>
    );
  }

  return (
    <div className="h-64 mt-4 relative">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={8}
            dataKey="value"
            nameKey="label"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <RechartsTooltip 
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
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const t = useTranslations('admin.dashboard');
  const tCommon = useTranslations('common');

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.data.stats);
        setChartData(data.data.charts);
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error);
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
    toast.info(t('toasts.refreshing'));
  };

  const handleExport = async () => {
    toast.loading('Génération du rapport...');
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'dashboard' }),
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `dashboard-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.dismiss();
        toast.success('Rapport téléchargé');
      } else {
        toast.dismiss();
        toast.error('Erreur lors de l\'export');
      }
    } catch (error) {
      toast.dismiss();
      toast.error('Erreur de connexion');
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
              <div className="h-4 w-64 bg-gray-100 dark:bg-gray-800 rounded-lg" />
            </div>
          </div>
          <div className="flex gap-3">
            <div className="h-[46px] w-[46px] bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-[46px] w-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            <div className="h-[46px] w-32 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl" />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl border border-gray-100 dark:border-gray-700 p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700" />
              <div className="flex justify-between items-start">
                 <div className="space-y-3">
                    <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-10 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                    <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
                 </div>
                 <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-2xl" />
              </div>
              <div className="mt-4 h-6 w-24 bg-gray-100 dark:bg-gray-700 rounded-full" />
            </div>
          ))}
        </div>

        {/* Quick Actions Skeleton */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 bg-gray-200 dark:bg-gray-700 rounded-full" />
            <div className="h-6 w-40 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="p-5 rounded-2xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 h-36 flex flex-col justify-between">
                <div className="w-12 h-12 rounded-xl bg-gray-200 dark:bg-gray-700" />
                <div className="space-y-2 mt-auto">
                  <div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-full bg-gray-200 dark:bg-gray-700 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
           <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 h-80 flex flex-col border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
                <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
              <div className="flex-1 space-y-4 mt-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                      <div className="h-4 w-24 bg-gray-100 dark:bg-gray-800 rounded" />
                      <div className="h-4 w-8 bg-gray-100 dark:bg-gray-800 rounded" />
                    </div>
                    <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full" />
                  </div>
                ))}
              </div>
           </div>
           <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 h-80 flex flex-col border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-2">
                  <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
                  <div className="h-4 w-32 bg-gray-100 dark:bg-gray-800 rounded" />
                </div>
                <div className="h-4 w-20 bg-gray-100 dark:bg-gray-800 rounded" />
              </div>
              <div className="flex-1 flex items-center justify-center gap-6">
                <div className="w-32 h-32 rounded-full border-[12px] border-gray-100 dark:border-gray-700" />
                <div className="space-y-3 flex-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-2 items-center">
                      <div className="w-3 h-3 rounded-full bg-gray-200 dark:bg-gray-700" />
                      <div className="h-4 flex-1 bg-gray-100 dark:bg-gray-800 rounded" />
                      <div className="h-4 w-8 bg-gray-100 dark:bg-gray-800 rounded" />
                    </div>
                  ))}
                </div>
              </div>
           </div>
        </div>
        
        {/* Footer Stats Skeleton */}
        <div className="bg-gray-200 dark:bg-gray-800 rounded-3xl p-6 h-24" />
      </div>
    );
  }

  const reclamationVariation = stats?.reclamations?.variation ?? 0;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-[hsl(var(--gov-blue))/0.1] rounded-2xl flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
              <BarChart3 className="text-[hsl(var(--gov-blue))] w-6 h-6" />
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-foreground">
              {t('header.title')}
            </h1>
          </div>
          <p className="text-muted-foreground font-medium text-lg ml-1">
            {t('header.subtitle')}
          </p>
        </div>
 
        <div className="flex items-center gap-3">
          <GovButton
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            size="icon"
            loading={refreshing}
            title={tCommon('refresh')}
          />
          
          <GovButton
            onClick={handleExport}
            variant="outline"
            leftIcon={<Download size={18} />}
          >
            {t('header.export')}
          </GovButton>
          
          <GovButton
            asChild
            variant="primary"
            leftIcon={<FileText size={18} />}
            className="shadow-lg shadow-[hsl(var(--gov-blue))/0.2]"
          >
            <Link href="/admin/rapports">
              {t('header.reports')}
            </Link>
          </GovButton>
        </div>
      </div>

      {/* Alerts Section */}
      {stats?.evenements?.aCloturer && stats?.evenements?.aCloturer > 0 && (
        <motion.div variants={itemVariants} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
               <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
               <h3 className="font-semibold text-amber-900">{t('alerts.events_action_required')}</h3>
               <p className="text-sm text-amber-700">
                 {t('alerts.events_pending_closure', { count: stats?.evenements?.aCloturer })}
               </p>
            </div>
          </div>
          <Link 
            href="/admin/evenements?statut=A_CLOTURER" 
            className="px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
          >
            {t('alerts.manage_now')}
          </Link>
        </motion.div>
      )}

      {/* KPI Cards */}
      <KpiGrid cols={4}>
        <KpiCard
          index={0}
          label={t('metrics.users')}
          value={stats?.utilisateurs?.total ?? 0}
          change={stats?.utilisateurs?.variation}
          changeType={stats?.utilisateurs?.variation && stats?.utilisateurs?.variation > 0 ? 'up' : 'neutral'}
          icon={Users}
          variant="blue"
          subValue={stats?.utilisateurs?.nouveaux}
          subLabel={t('metrics.new_this_month')}
        />
        <KpiCard
          index={1}
          label={t('metrics.establishments')}
          value={stats?.etablissements?.total ?? 0}
          change={stats?.etablissements?.variation}
          changeType={stats?.etablissements?.variation && stats?.etablissements?.variation > 0 ? 'up' : 'neutral'}
          icon={Building2}
          variant="green"
          subValue={stats?.etablissements?.valides}
          subLabel={t('metrics.validated')}
        />
        <KpiCard
          index={2}
          label={t('metrics.events')}
          value={stats?.evenements?.total ?? 0}
          change={stats?.evenements?.variation}
          changeType={stats?.evenements?.variation && stats?.evenements?.variation > 0 ? 'up' : 'neutral'}
          icon={Calendar}
          variant="gold"
          subValue={stats?.evenements?.enCours}
          subLabel={t('metrics.in_progress')}
        />
        <KpiCard
          index={3}
          label={t('metrics.reclamations')}
          value={stats?.reclamations?.total ?? 0}
          change={reclamationVariation}
          changeType={reclamationVariation > 0 ? 'up' : reclamationVariation < 0 ? 'down' : 'neutral'}
          icon={MessageSquare}
          variant="red"
          subValue={stats?.reclamations?.enAttente}
          subLabel={t('metrics.pending')}
        />
      </KpiGrid>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-[hsl(var(--gov-gold))]" />
          {t('quick_actions.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionCard
            title={t('quick_actions.claims')}
            description={t('quick_actions.claims_desc')}
            icon={MessageSquare}
            href="/admin/reclamations"
            color="from-[hsl(var(--gov-red))] to-[hsl(var(--gov-red-dark))]"
            count={stats?.reclamations?.enAttente}
            urgent={!!(stats?.reclamations?.enAttente && stats?.reclamations?.enAttente > 0)}
          />
          <QuickActionCard
            title={t('quick_actions.validation')}
            description={t('quick_actions.validation_desc')}
            icon={CheckCircle2}
            href="/admin/validation"
            color="from-[hsl(var(--gov-green))] to-[hsl(var(--gov-green-dark))]"
          />
          <QuickActionCard
            title={t('quick_actions.campaigns')}
            description={t('quick_actions.campaigns_desc')}
            icon={Megaphone}
            href="/admin/campagnes"
            color="from-[hsl(var(--gov-gold))] to-[hsl(var(--gov-gold-dark))]"
            count={stats?.campagnesEnAttente}
            urgent={!!(stats?.campagnesEnAttente && stats.campagnesEnAttente > 0)}
          />
          <QuickActionCard
            title={t('quick_actions.users')}
            description={t('quick_actions.users_desc')}
            icon={Users}
            href="/admin/utilisateurs"
            color="from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]"
          />
        </div>
      </motion.div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Events by Sector */}
        <motion.div 
          variants={itemVariants}
          className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-[hsl(var(--gov-blue))/0.02]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">{t('charts.events_by_sector')}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{t('charts.events_distribution')}</p>
            </div>
            <Link href="/admin/evenements" className="w-10 h-10 flex items-center justify-center bg-muted rounded-xl hover:bg-foreground hover:text-background transition-all">
              <ChevronRight size={20} />
            </Link>
          </div>
          {chartData?.evenementsParSecteur && (
            <MiniBarChart 
              data={chartData.evenementsParSecteur.map((item, i) => ({
                label: item.secteur,
                value: item.count,
                color: [
                  'hsl(var(--gov-blue))', 
                  'hsl(var(--gov-green))', 
                  'hsl(var(--gov-yellow))', 
                  'hsl(var(--gov-red))',
                  'hsl(var(--gov-muted))',
                  '#8B5CF6'
                ][i % 6]
              }))}
            />
          )}
        </motion.div>
 
        {/* Reclamations by Status */}
        <motion.div 
          variants={itemVariants}
          className="bg-card border border-border rounded-3xl p-8 shadow-xl shadow-[hsl(var(--gov-blue))/0.02]"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-extrabold text-foreground">{t('charts.reclamations_by_status')}</h3>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mt-1">{t('charts.current_breakdown')}</p>
            </div>
            <Link href="/admin/reclamations" className="w-10 h-10 flex items-center justify-center bg-muted rounded-xl hover:bg-foreground hover:text-background transition-all">
              <ChevronRight size={20} />
            </Link>
          </div>
          {chartData?.reclamationsParStatut && (
            <DonutChart
              data={chartData.reclamationsParStatut.map((item, i) => ({
                label: item.statut.replace('_', ' '),
                value: item.count,
                color: [
                  'hsl(var(--gov-blue))', 
                  'hsl(var(--gov-green))', 
                  'hsl(var(--gov-yellow))', 
                  'hsl(var(--gov-red))',
                  'hsl(var(--gov-muted))',
                  '#8B5CF6'
                ][i % 6]
              }))}
            />
          )}
        </motion.div>
      </div>

      {/* Additional Management Sections */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-5 h-5 text-[hsl(var(--gov-blue-dark))]" />
          {t('other_sections.title')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/admin/actualites">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="gov-card p-5 group hover:border-[hsl(var(--gov-blue))] hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-blue)/0.1)] flex items-center justify-center text-[hsl(var(--gov-blue))] group-hover:scale-110 transition-transform">
                  <Newspaper className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors tracking-tight">{t('other_sections.news')}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('other_sections.news_desc')}</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/admin/campagnes">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="gov-card p-5 group hover:border-[hsl(var(--gov-gold))] hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-gold)/0.1)] flex items-center justify-center text-[hsl(var(--gov-gold-dark))] group-hover:scale-110 transition-transform">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-[hsl(var(--gov-gold-dark))] transition-colors tracking-tight">{t('other_sections.campaigns')}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('other_sections.campaigns_desc')}</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/admin/suggestions">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="gov-card p-5 group hover:border-[hsl(var(--gov-blue-light))] hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-blue-light)/0.1)] flex items-center justify-center text-[hsl(var(--gov-blue))] group-hover:scale-110 transition-transform">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-[hsl(var(--gov-blue))] transition-colors tracking-tight">{t('other_sections.suggestions')}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('other_sections.suggestions_desc')}</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/admin/talents">
            <motion.div
              whileHover={{ scale: 1.02, y: -2 }}
              className="gov-card p-5 group hover:border-[hsl(var(--gov-green))] hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-green)/0.1)] flex items-center justify-center text-[hsl(var(--gov-green))] group-hover:scale-110 transition-transform">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground group-hover:text-[hsl(var(--gov-green))] transition-colors tracking-tight">{t('other_sections.talents')}</h3>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('other_sections.talents_desc')}</p>
                </div>
              </div>
            </motion.div>
          </Link>
        </div>
      </motion.div>

      {/* Footer Stats */}
      <motion.div 
        variants={itemVariants}
        className="bg-gradient-to-r from-[hsl(var(--gov-blue-dark))] to-slate-900 rounded-3xl p-6 text-white shadow-lg"
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-white">{t('footer.system_activity')}</h3>
              <p className="text-sm text-white/60">{t('footer.system_operational')}</p>
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.utilisateurs?.nouveaux ?? 0}</p>
              <p className="text-xs text-white/60">{t('footer.new_users')}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.reclamations?.enAttente ?? 0}</p>
              <p className="text-xs text-white/60">{t('footer.to_process')}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.evenements?.enCours ?? 0}</p>
              <p className="text-xs text-white/60">{t('footer.active_events')}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
