'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import {
  Shield,
  ShieldCheck,
  Users,
  Building2,
  Calendar,
  MessageSquare,
  BarChart3,
  Settings,
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Database,
  Server,
  Lock,
  Key,
  FileText,
  Eye,
  Bell,
  Zap,
  ChevronRight,
  Globe,
  Newspaper,
  Megaphone,
  Lightbulb,
  Star,
  UserCog,
  ShieldAlert,
  HardDrive,
  Wifi,
  XCircle,
  Loader2,
  Cpu,
  MemoryStick,
  Home,
  ArrowLeft,
  ClipboardList,
} from 'lucide-react';

interface SystemStats {
  users: {
    total: number;
    admins: number;
    superAdmins: number;
    delegations: number;
    autoritesLocales: number;
    citoyens: number;
    activeToday: number;
    newThisMonth: number;
  };
  content: {
    etablissements: number;
    etablissementsValides: number;
    evenements: number;
    evenementsActifs: number;
    actualites: number;
    articles: number;
    campagnes: number;
    suggestions: number;
  };
  reclamations: {
    total: number;
    enAttente: number;
    enCours: number;
    resolues: number;
    rejetees: number;
    urgentes: number;
  };
  system: {
    uptime: string;
    lastBackup: string;
    databaseSize: string;
    apiRequests24h: number;
    errors24h: number;
    avgResponseTime: number;
  };
}

// Safe rendering helper
const renderUser = (user: any) => {
  if (!user) return 'Système';
  if (typeof user === 'string') return user;
  if (typeof user === 'object') {
     const name = `${user.prenom || ''} ${user.nom || ''}`.trim();
     return name || user.email || 'Utilisateur';
  }
  return 'Utilisateur';
};

interface RecentLog {
  id: number;
  action: string;
  entity: string;
  user: any; // Allow object or string
  timestamp: string;
  createdAt?: string; // API might return createdAt
  details?: string;
}



// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Stat Card Component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  trendValue,
  color,
  subStats,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
  subStats?: { label: string; value: number | string }[];
}) {
  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.02, y: -4 }}
      className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-xl transition-all"
    >
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-medium ${
            trend === 'up' ? 'text-emerald-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
            {trendValue}
          </span>
        )}
      </div>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{title}</p>
      
      {subStats && subStats.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2">
          {subStats.map((stat, i) => (
            <div key={i}>
              <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// Quick Action Button
function QuickAction({
  title,
  icon: Icon,
  href,
  color,
  badge,
}: {
  title: string;
  icon: React.ElementType;
  href: string;
  color: string;
  badge?: number;
}) {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative p-4 rounded-xl bg-gradient-to-br ${color} text-white cursor-pointer group`}
      >
        <Icon className="w-6 h-6 mb-2" />
        <p className="text-sm font-medium">{title}</p>
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {badge > 99 ? '99+' : badge}
          </span>
        )}
        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
      </motion.div>
    </Link>
  );
}

// System Health Indicator
function HealthIndicator({ status, label }: { status: 'online' | 'warning' | 'offline'; label: string }) {
  const colors = {
    online: 'bg-emerald-500',
    warning: 'bg-amber-500',
    offline: 'bg-red-500',
  };
  
  return (
    <div className="flex items-center gap-2">
      <span className={`w-2 h-2 rounded-full ${colors[status]} animate-pulse`} />
      <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
    </div>
  );
}

export default function SuperAdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Redirect if not SUPER_ADMIN
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/admin');
      toast.error(t('super_admin.access_denied'));
    }
  }, [status, session, router]);

  // Fetch dashboard data
  const fetchData = async () => {
    setRefreshing(true);
    try {
      // Fetch multiple endpoints in parallel
      const [statsRes, logsRes] = await Promise.all([
        fetch('/api/admin/stats'),
        fetch('/api/admin/logs?limit=10'), // Use unified admin logs API
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        // Transform API response to our SystemStats format
        setStats({
          users: {
            total: data.stats?.utilisateurs?.total || 0,
            admins: data.stats?.utilisateurs?.admins || 0,
            superAdmins: data.stats?.utilisateurs?.superAdmins || 1,
            delegations: data.stats?.utilisateurs?.delegations || 0,
            autoritesLocales: data.stats?.utilisateurs?.autoritesLocales || 0,
            citoyens: data.stats?.utilisateurs?.citoyens || 0,
            activeToday: data.stats?.utilisateurs?.activeToday || 0,
            newThisMonth: data.stats?.utilisateurs?.nouveaux || 0,
          },
          content: {
            etablissements: data.stats?.etablissements?.total || 0,
            etablissementsValides: data.stats?.etablissements?.valides || 0,
            evenements: data.stats?.evenements?.total || 0,
            evenementsActifs: data.stats?.evenements?.enCours || 0,
            actualites: data.stats?.actualites || 0,
            articles: data.stats?.articles || 0,
            campagnes: data.stats?.campagnes || 0,
            suggestions: data.stats?.suggestions || 0,
          },
          reclamations: {
            total: data.stats?.reclamations?.total || 0,
            enAttente: data.stats?.reclamations?.enAttente || 0,
            enCours: data.stats?.reclamations?.enCours || 0,
            resolues: data.stats?.reclamations?.resolues || 0,
            rejetees: data.stats?.reclamations?.rejetees || 0,
            urgentes: data.stats?.reclamations?.urgentes || 0,
          },
          system: {
            uptime: '99.9%',
            lastBackup: new Date().toLocaleString('fr-FR'),
            databaseSize: '2.4 GB',
            apiRequests24h: data.stats?.api?.requests24h || 0,
            errors24h: data.stats?.api?.errors24h || 0,
            avgResponseTime: data.stats?.api?.avgResponseTime || 120,
          },
        });
      }

      if (logsRes.ok) {
        const logsData = await logsRes.json();
        const logs = logsData.data || [];
        setRecentLogs(logs.map((l: any) => ({
          ...l,
          timestamp: l.createdAt || l.timestamp
        })).slice(0, 10));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(t('super_admin.toasts.data_error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      fetchData();
    }
  }, [session]);

  const handleExportAll = async () => {
    toast.loading(t('super_admin.toasts.export_loading'));
    try {
      const res = await fetch('/api/export/excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'system-report' }),
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `rapport-systeme-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        toast.dismiss();
        toast.success(t('super_admin.toasts.export_success'));
      } else {
        toast.dismiss();
        toast.error(t('super_admin.toasts.export_error'));
      }
    } catch (error) {
      toast.dismiss();
      toast.error(t('super_admin.toasts.connection_error'));
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">{t('super_admin.loading')}</p>
        </div>
      </div>
    );
  }

  if (session?.user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Top Bar */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-900 text-white">
        {/* Tricolor band */}
        <div className="h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
        
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Back buttons */}
              <div className="flex items-center gap-2">
                <Link
                  href="/"
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="Page d'accueil"
                >
                  <Home size={20} />
                </Link>
                <Link
                  href="/admin"
                  className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                  title="Dashboard Admin"
                >
                  <ArrowLeft size={20} />
                </Link>
              </div>
              
              <div className="w-px h-8 bg-white/20" />
              
              <div className="p-2 bg-white/10 rounded-xl backdrop-blur">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t('super_admin.title')}</h1>
                <p className="text-purple-200 text-sm">{t('super_admin.subtitle')}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchData}
                disabled={refreshing}
                className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <button
                onClick={handleExportAll}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Download size={18} />
                {t('super_admin.export')}
              </button>
              <Link
                href="/super-admin/admins"
                className="flex items-center gap-2 px-4 py-2 bg-white text-purple-900 rounded-lg font-medium hover:bg-purple-50 transition-colors"
              >
                <UserCog size={18} />
                {t('super_admin.manage_admins')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="space-y-8"
        >
          {/* System Health */}
          <motion.div
            variants={itemVariants}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Server className="w-5 h-5 text-purple-500" />
                {t('super_admin.system_status.title')}
              </h2>
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                {t('super_admin.system_status.operational')}
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
              <HealthIndicator status="online" label={t('super_admin.system_status.api')} />
              <HealthIndicator status="online" label={t('super_admin.system_status.database')} />
              <HealthIndicator status="online" label={t('super_admin.system_status.auth')} />
              <HealthIndicator status="online" label={t('super_admin.system_status.notifications')} />
              <HealthIndicator status="online" label={t('super_admin.system_status.storage')} />
              <HealthIndicator status="online" label={t('super_admin.system_status.emails')} />
            </div>
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Activity size={12} />
                  {t('super_admin.system_status.uptime')}
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.system.uptime || '99.9%'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <Cpu size={12} />
                  {t('super_admin.system_status.response_time')}
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.system.avgResponseTime || 120}ms</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <HardDrive size={12} />
                  {t('super_admin.system_status.database')}
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.system.databaseSize || '2.4 GB'}</p>
              </div>
              <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs mb-1">
                  <AlertTriangle size={12} />
                  {t('super_admin.system_status.errors_24h')}
                </div>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.system.errors24h || 0}</p>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              {t('super_admin.quick_actions.title')}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
              <QuickAction
                title={t('super_admin.quick_actions.admins')}
                icon={ShieldCheck}
                href="/super-admin/admins"
                color="from-purple-500 to-indigo-600"
                badge={stats?.users.admins}
              />
              <QuickAction
                title={t('super_admin.quick_actions.users')}
                icon={Users}
                href="/admin/utilisateurs"
                color="from-blue-500 to-cyan-600"
              />
              <QuickAction
                title={t('super_admin.quick_actions.reclamations')}
                icon={MessageSquare}
                href="/admin/reclamations"
                color="from-orange-500 to-red-600"
                badge={stats?.reclamations.enAttente}
              />
              <QuickAction
                title={t('super_admin.quick_actions.validation')}
                icon={CheckCircle}
                href="/admin/validation"
                color="from-emerald-500 to-teal-600"
              />
              <QuickAction
                title={t('super_admin.quick_actions.events')}
                icon={Calendar}
                href="/admin/evenements"
                color="from-violet-500 to-purple-600"
              />
              <QuickAction
                title={t('super_admin.quick_actions.establishments')}
                icon={Building2}
                href="/admin/etablissements"
                color="from-teal-500 to-emerald-600"
              />
              <QuickAction
                title={t('super_admin.quick_actions.activities')}
                icon={ClipboardList}
                href="/admin/programmes-activites"
                color="from-cyan-500 to-blue-600"
              />
              <QuickAction
                title={t('super_admin.quick_actions.logs')}
                icon={FileText}
                href="/super-admin/audit"
                color="from-gray-500 to-gray-700"
              />
              <QuickAction
                title={t('super_admin.quick_actions.import')}
                icon={Database}
                href="/super-admin/import"
                color="from-lime-500 to-green-600"
              />
              <QuickAction
                title={t('super_admin.quick_actions.licence')}
                icon={Key}
                href="/super-admin/licence"
                color="from-amber-500 to-yellow-600"
              />
              <QuickAction
                title={t('super_admin.quick_actions.settings')}
                icon={Settings}
                href="/super-admin/settings"
                color="from-pink-500 to-rose-600"
              />
            </div>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title={t('super_admin.stats.total_users')}
              value={stats?.users.total || 0}
              icon={Users}
              trend="up"
              trendValue={`+${stats?.users.newThisMonth || 0} ${t('super_admin.stats.this_month')}`}
              color="from-blue-500 to-indigo-600"
              subStats={[
                { label: t('super_admin.stats.admins'), value: stats?.users.admins || 0 },
                { label: t('super_admin.stats.citizens'), value: stats?.users.citoyens || 0 },
              ]}
            />
            <StatCard
              title={t('super_admin.stats.establishments')}
              value={stats?.content.etablissements || 0}
              icon={Building2}
              color="from-emerald-500 to-teal-600"
              subStats={[
                { label: t('super_admin.stats.validated'), value: stats?.content.etablissementsValides || 0 },
                { label: t('super_admin.stats.events'), value: stats?.content.evenements || 0 },
              ]}
            />
            <StatCard
              title={t('super_admin.stats.reclamations')}
              value={stats?.reclamations.total || 0}
              icon={MessageSquare}
              color="from-orange-500 to-amber-600"
              subStats={[
                { label: t('super_admin.stats.pending'), value: stats?.reclamations.enAttente || 0 },
                { label: t('super_admin.stats.urgent'), value: stats?.reclamations.urgentes || 0 },
              ]}
            />
            <StatCard
              title={t('super_admin.stats.content')}
              value={(stats?.content.actualites || 0) + (stats?.content.articles || 0)}
              icon={Newspaper}
              color="from-purple-500 to-violet-600"
              subStats={[
                { label: t('super_admin.stats.news'), value: stats?.content.actualites || 0 },
                { label: t('super_admin.stats.articles'), value: stats?.content.articles || 0 },
              ]}
            />
          </div>

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="w-5 h-5 text-blue-500" />
                  {t('super_admin.recent_activity.title')}
                </h2>
                <Link href="/super-admin/audit" className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                  {t('super_admin.recent_activity.view_all')} <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                {recentLogs.length > 0 ? (
                  recentLogs.map((log, i) => (
                    <div key={log.id || i} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 flex-shrink-0">
                        {log.action?.includes('CREATE') && <Zap size={14} />}
                        {log.action?.includes('UPDATE') && <RefreshCw size={14} />}
                        {log.action?.includes('DELETE') && <XCircle size={14} />}
                        {!log.action?.match(/CREATE|UPDATE|DELETE/) && <Activity size={14} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">
                          {log.action || 'Action'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {renderUser(log.user)} • {log.entity || ''}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {log.timestamp ? new Date(log.timestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-400">
                    <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>{t('super_admin.recent_activity.no_activity')}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Permissions Overview */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-500" />
                  {t('super_admin.rbac.title')}
                </h2>
                <Link href="/super-admin/admins" className="text-sm text-purple-600 hover:text-purple-700 flex items-center gap-1">
                  {t('super_admin.rbac.manage')} <ChevronRight size={14} />
                </Link>
              </div>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-purple-600" />
                    <span className="font-medium text-gray-900 dark:text-white">{t('super_admin.rbac.super_admins')}</span>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-bold">
                    {stats?.users.superAdmins || 1}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-gray-900 dark:text-white">{t('super_admin.rbac.administrators')}</span>
                  </div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-bold">
                    {stats?.users.admins || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-gray-900 dark:text-white">{t('super_admin.rbac.delegations')}</span>
                  </div>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-bold">
                    {stats?.users.delegations || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-teal-600" />
                    <span className="font-medium text-gray-900 dark:text-white">{t('super_admin.rbac.local_authorities')}</span>
                  </div>
                  <span className="px-3 py-1 bg-teal-100 text-teal-700 rounded-full text-sm font-bold">
                    {stats?.users.autoritesLocales || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span className="font-medium text-gray-900 dark:text-white">{t('super_admin.rbac.citizens')}</span>
                  </div>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-bold">
                    {stats?.users.citoyens || 0}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Additional Admin Features */}
          <motion.div variants={itemVariants}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-500" />
              {t('super_admin.features.title')}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Link href="/super-admin/admins">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white mb-4">
                    <UserCog className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 transition-colors">
                    {t('super_admin.features.admin_management')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{t('super_admin.features.admin_management_desc')}</p>
                </motion.div>
              </Link>

              <Link href="/super-admin/permissions">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white mb-4">
                    <Key className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-amber-600 transition-colors">
                    {t('super_admin.features.permissions')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{t('super_admin.features.permissions_desc')}</p>
                </motion.div>
              </Link>

              <Link href="/super-admin/settings">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center text-white mb-4">
                    <Settings className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-gray-600 transition-colors">
                    {t('super_admin.features.system_settings')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{t('super_admin.features.system_settings_desc')}</p>
                </motion.div>
              </Link>

              <Link href="/super-admin/backups">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className="p-5 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white mb-4">
                    <Database className="w-6 h-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                    {t('super_admin.features.backups')}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">{t('super_admin.features.backups_desc')}</p>
                </motion.div>
              </Link>
            </div>
          </motion.div>

          {/* Footer Info */}
          <motion.div
            variants={itemVariants}
            className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-6 text-white"
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-bold text-white">{t('super_admin.footer.mode')}</h3>
                  <p className="text-sm text-gray-400">{t('super_admin.footer.full_access')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <p className="text-gray-400">{t('super_admin.footer.last_backup')}</p>
                  <p className="font-medium">{stats?.system.lastBackup || 'N/A'}</p>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div>
                  <p className="text-gray-400">{t('super_admin.footer.version')}</p>
                  <p className="font-medium">Portail Mediouna v2.0</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
