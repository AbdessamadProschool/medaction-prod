'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
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
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

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

// KPI Card Component with enhanced design
function MetricCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  gradient,
  subValue,
  subLabel,
}: {
  title: string;
  value: number | string;
  change?: number;
  changeType?: 'up' | 'down' | 'neutral';
  icon: React.ElementType;
  gradient: string;
  subValue?: number | string;
  subLabel?: string;
}) {
  const t = useTranslations('admin.dashboard.metrics');
  
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      className="relative bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 overflow-hidden group"
    >
      {/* Background gradient accent */}
      <div className={`absolute top-0 left-0 w-full h-1 bg-gradient-to-r ${gradient}`} />
      
      <div className="flex items-start justify-between relative z-10">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-4xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          {subValue !== undefined && (
            <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
              <span className="font-semibold text-emerald-600">{subValue}</span>
              <span>{subLabel}</span>
            </p>
          )}
        </div>
        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="w-8 h-8 text-white" />
        </div>
      </div>

      {change !== undefined && (
        <div className={`mt-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
          changeType === 'up' 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
            : changeType === 'down'
            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
            : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        }`}>
          {changeType === 'up' && <TrendingUp className="w-3 h-3" />}
          {changeType === 'down' && <TrendingDown className="w-3 h-3" />}
          {change > 0 ? '+' : ''}{change}% {t('this_month')}
        </div>
      )}
    </motion.div>
  );
}

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
        className={`relative p-5 rounded-2xl bg-gradient-to-br ${color} text-white overflow-hidden group cursor-pointer`}
      >
        {/* Pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/20" />
          <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-white/10" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Icon className="w-6 h-6" />
            </div>
            {count !== undefined && count > 0 && (
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${urgent ? 'bg-red-500 text-white animate-pulse' : 'bg-white/20 backdrop-blur'}`}>
                {count} {urgent ? '!' : ''}
              </span>
            )}
          </div>
          <h3 className="font-bold text-lg mb-1">{title}</h3>
          <p className="text-sm opacity-80">{description}</p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
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
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="space-y-3">
      {data.map((item, i) => (
        <div key={i} className="group">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-600 dark:text-gray-400 truncate">{item.label}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.8, delay: i * 0.1 }}
              className="h-full rounded-full"
              style={{ backgroundColor: item.color }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

// Donut Chart Component
function DonutChart({ data }: { data: { label: string; value: number; color: string }[] }) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const t = useTranslations('admin.dashboard.charts');
  let cumulativePercent = 0;

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-400">
        {t('no_data')}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-6">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 36 36" className="w-32 h-32 -rotate-90">
          {data.map((item, i) => {
            const percent = (item.value / total) * 100;
            const dashArray = `${percent} ${100 - percent}`;
            const dashOffset = 100 - cumulativePercent;
            cumulativePercent += percent;
            
            return (
              <circle
                key={i}
                cx="18"
                cy="18"
                r="15.915"
                fill="transparent"
                stroke={item.color}
                strokeWidth="3"
                strokeDasharray={dashArray}
                strokeDashoffset={dashOffset}
                className="transition-all duration-500"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{total}</p>
            <p className="text-xs text-gray-500">{t('total')}</p>
          </div>
        </div>
      </div>
      <div className="space-y-2 flex-1">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
            <span className="text-gray-600 dark:text-gray-400 flex-1">{item.label}</span>
            <span className="font-semibold text-gray-900 dark:text-white">{item.value}</span>
          </div>
        ))}
      </div>
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
        setStats(data.stats);
        setChartData(data.charts);
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
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('loading')}</p>
        </div>
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <motion.h1 
            variants={itemVariants}
            className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
              <BarChart3 className="w-6 h-6" />
            </div>
            {t('header.title')}
          </motion.h1>
          <motion.p variants={itemVariants} className="text-gray-500 dark:text-gray-400 mt-2">
            {t('header.subtitle')}
          </motion.p>
        </div>

        <motion.div variants={itemVariants} className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-300"
          >
            <Download size={18} />
            {t('header.export')}
          </button>
          <Link
            href="/admin/rapports"
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30 hover:shadow-xl transition-all"
          >
            <FileText size={18} />
            {t('header.reports')}
          </Link>
        </motion.div>
      </div>

      {/* Alerts Section */}
      {stats?.evenements.aCloturer && stats.evenements.aCloturer > 0 && (
        <motion.div variants={itemVariants} className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
               <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
               <h3 className="font-semibold text-amber-900">{t('alerts.events_action_required')}</h3>
               <p className="text-sm text-amber-700">
                 {t('alerts.events_pending_closure', { count: stats.evenements.aCloturer })}
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title={t('metrics.users')}
          value={stats?.utilisateurs.total ?? 0}
          change={stats?.utilisateurs.variation ?? 0}
          changeType={stats?.utilisateurs.variation && stats.utilisateurs.variation > 0 ? 'up' : 'neutral'}
          icon={Users}
          gradient="from-[hsl(var(--gov-blue))] to-[hsl(var(--gov-blue-dark))]"
          subValue={stats?.utilisateurs.nouveaux ?? 0}
          subLabel={t('metrics.new_this_month')}
        />
        <MetricCard
          title={t('metrics.establishments')}
          value={stats?.etablissements.total ?? 0}
          change={stats?.etablissements.variation ?? 0}
          changeType={stats?.etablissements.variation && stats.etablissements.variation > 0 ? 'up' : 'neutral'}
          icon={Building2}
          gradient="from-[hsl(var(--gov-green))] to-[hsl(var(--gov-green-dark))]"
          subValue={stats?.etablissements.valides ?? 0}
          subLabel={t('metrics.validated')}
        />
        <MetricCard
          title={t('metrics.events')}
          value={stats?.evenements.total ?? 0}
          change={stats?.evenements.variation ?? 0}
          changeType={stats?.evenements.variation && stats.evenements.variation > 0 ? 'up' : 'neutral'}
          icon={Calendar}
          gradient="from-[hsl(var(--gov-gold))] to-[hsl(var(--gov-gold-dark))]"
          subValue={stats?.evenements.enCours ?? 0}
          subLabel={t('metrics.in_progress')}
        />
        <MetricCard
          title={t('metrics.reclamations')}
          value={stats?.reclamations.total ?? 0}
          change={reclamationVariation}
          changeType={reclamationVariation > 0 ? 'up' : reclamationVariation < 0 ? 'down' : 'neutral'}
          icon={MessageSquare}
          gradient="from-[hsl(var(--gov-red))] to-[hsl(var(--gov-red-dark))]"
          subValue={stats?.reclamations.enAttente ?? 0}
          subLabel={t('metrics.pending')}
        />
      </div>

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
            count={stats?.reclamations.enAttente}
            urgent={!!(stats?.reclamations.enAttente && stats.reclamations.enAttente > 0)}
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Events by Sector */}
        <motion.div 
          variants={itemVariants}
          className="gov-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{t('charts.events_by_sector')}</h3>
              <p className="text-sm text-gray-500">{t('charts.events_distribution')}</p>
            </div>
            <Link href="/admin/evenements" className="text-sm text-[hsl(var(--gov-blue))] hover:underline flex items-center gap-1">
              {t('charts.view_all')} <ChevronRight className="w-4 h-4" />
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
                  'hsl(var(--gov-gold))', 
                  'hsl(var(--gov-red))',
                  'hsl(var(--gov-blue-light))',
                  'hsl(var(--gov-green-light))'
                ][i % 6]
              }))}
            />
          )}
        </motion.div>

        {/* Reclamations by Status */}
        <motion.div 
          variants={itemVariants}
          className="gov-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{t('charts.reclamations_by_status')}</h3>
              <p className="text-sm text-gray-500">{t('charts.current_breakdown')}</p>
            </div>
            <Link href="/admin/reclamations" className="text-sm text-[hsl(var(--gov-blue))] hover:underline flex items-center gap-1">
              {t('charts.view_all')} <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {chartData?.reclamationsParStatut && (
            <DonutChart
              data={chartData.reclamationsParStatut.map(item => ({
                label: item.statut.replace('_', ' '),
                value: item.count,
                color: item.color // Ensure colors from API match charter if possible, otherwise rely on API
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
              whileHover={{ scale: 1.02 }}
              className="gov-card p-5 group hover:border-[hsl(var(--gov-blue))]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-blue)/0.1)] flex items-center justify-center text-[hsl(var(--gov-blue))]">
                  <Newspaper className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[hsl(var(--gov-blue))] transition-colors">{t('other_sections.news')}</h3>
                  <p className="text-sm text-gray-500">{t('other_sections.news_desc')}</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/admin/campagnes">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="gov-card p-5 group hover:border-[hsl(var(--gov-gold))]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-gold)/0.1)] flex items-center justify-center text-[hsl(var(--gov-gold-dark))]">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[hsl(var(--gov-gold-dark))] transition-colors">{t('other_sections.campaigns')}</h3>
                  <p className="text-sm text-gray-500">{t('other_sections.campaigns_desc')}</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/admin/suggestions">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="gov-card p-5 group hover:border-[hsl(var(--gov-blue-light))]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-blue-light)/0.1)] flex items-center justify-center text-[hsl(var(--gov-blue))]">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[hsl(var(--gov-blue))] transition-colors">{t('other_sections.suggestions')}</h3>
                  <p className="text-sm text-gray-500">{t('other_sections.suggestions_desc')}</p>
                </div>
              </div>
            </motion.div>
          </Link>

          <Link href="/admin/talents">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="gov-card p-5 group hover:border-[hsl(var(--gov-green))]"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-[hsl(var(--gov-green)/0.1)] flex items-center justify-center text-[hsl(var(--gov-green))]">
                  <Star className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-[hsl(var(--gov-green))] transition-colors">{t('other_sections.talents')}</h3>
                  <p className="text-sm text-gray-500">{t('other_sections.talents_desc')}</p>
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
              <p className="text-2xl font-bold">{stats?.utilisateurs.nouveaux ?? 0}</p>
              <p className="text-xs text-white/60">{t('footer.new_users')}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.reclamations.enAttente ?? 0}</p>
              <p className="text-xs text-white/60">{t('footer.to_process')}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="text-center">
              <p className="text-2xl font-bold">{stats?.evenements.enCours ?? 0}</p>
              <p className="text-xs text-white/60">{t('footer.active_events')}</p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
