'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Activity,
  Server,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Clock,
  Globe,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  FileText,
  Eye,
  X,
  FileJson,
  Database,
  Monitor
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';

// Simple JSON renderer
const JSONValue = ({ value }: { value: any }) => {
  if (value === null || value === undefined) return <span className="text-gray-400 italic text-xs">null</span>;
  if (typeof value === 'boolean') return <span className={`text-xs font-bold ${value ? 'text-green-600' : 'text-red-600'}`}>{value.toString()}</span>;
  if (typeof value === 'string') return <span className="text-blue-600 break-all">"{value}"</span>;
  if (typeof value === 'number') return <span className="text-purple-600">{value}</span>;
  if (Array.isArray(value)) return (
    <div className="pl-2 border-l-2 border-gray-100">
      {value.map((v, i) => <div key={i}><span className="text-xs text-gray-400 mr-1">{i}:</span><JSONValue value={v} /></div>)}
    </div>
  );
  if (typeof value === 'object') return (
    <div className="pl-2 border-l-2 border-gray-100">
      {Object.entries(value).map(([k, v]) => (
        <div key={k} className="flex flex-col sm:flex-row sm:gap-1">
          <span className="text-xs font-semibold text-gray-500">{k}:</span>
          <JSONValue value={v} />
        </div>
      ))}
    </div>
  );
  return <span>{String(value)}</span>;
};

interface ActivityLog {
  id: number;
  userId: number | null;
  action: string;
  entity: string;
  entityId: number | null;
  details: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
  } | null;
}

interface SystemLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  details?: Record<string, unknown>;
}

type TabType = 'activity' | 'system';

// Styles des actions
const ACTION_STYLES: Record<string, string> = {
  'CREATE': 'bg-emerald-100 text-emerald-700',
  'UPDATE': 'bg-blue-100 text-blue-700',
  'DELETE': 'bg-red-100 text-red-700',
  'LOGIN': 'bg-purple-100 text-purple-700',
  'LOGOUT': 'bg-gray-100 text-gray-700',
  'VALIDATE': 'bg-teal-100 text-teal-700',
  'REJECT': 'bg-orange-100 text-orange-700',
  'EXPORT': 'bg-indigo-100 text-indigo-700',
  'EXPORT_LOGS': 'bg-indigo-100 text-indigo-700',
  'UPDATE_PERMISSIONS': 'bg-amber-100 text-amber-700',
};

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  info: <Info size={14} className="text-blue-500" />,
  warning: <AlertTriangle size={14} className="text-amber-500" />,
  error: <AlertCircle size={14} className="text-red-500" />,
  debug: <Bug size={14} className="text-gray-500" />,
};

const LEVEL_COLORS: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  error: 'bg-red-50 text-red-700 border-red-200',
  debug: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function AdminLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('audit_page');
  
  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [systemLogs, setSystemLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  
  // Auto-refresh settings
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  
  // Filtres
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    entity: '',
    userId: '',
    level: '',
    source: '',
    dateFrom: '',
    dateTo: '',
  });
  
  // Stats
  const [, setStats] = useState<any>(null);
  
  // Last update time
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Selected Log for Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | SystemLog | null>(null);

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      router.push('/');
    }
  }, [status, session, router]);

  // Charger les logs
  const loadLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '30');
      
      if (activeTab === 'activity') {
        if (filters.search) params.set('search', filters.search);
        if (filters.action) params.set('action', filters.action);
        if (filters.entity) params.set('entity', filters.entity);
        if (filters.userId) params.set('userId', filters.userId);
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.set('dateTo', filters.dateTo);
        
        const res = await fetch(`/api/logs/activity?${params}`);
        if (res.ok) {
          const data = await res.json();
          setActivityLogs(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotal(data.pagination?.total || 0);
          setStats(data.stats);
        }
      } else {
        if (filters.level) params.set('level', filters.level);
        if (filters.source) params.set('source', filters.source);
        if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
        if (filters.dateTo) params.set('dateTo', filters.dateTo);
        
        const res = await fetch(`/api/logs/system?${params}`);
        if (res.ok) {
          const data = await res.json();
          setSystemLogs(data.data || []);
          setTotalPages(data.pagination?.totalPages || 1);
          setTotal(data.pagination?.total || 0);
          setStats(data.stats);
        }
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLastUpdate(new Date());
    }
  }, [page, activeTab, filters]);

  useEffect(() => {
    if (session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      loadLogs();
    }
  }, [loadLogs, session]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadLogs();
    }, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadLogs]);

  // Exporter les logs
  const handleExport = async (format: 'csv' | 'json') => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      params.set('format', format);
      if (filters.action) params.set('action', filters.action);
      if (filters.entity) params.set('entity', filters.entity);
      if (filters.userId) params.set('userId', filters.userId);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      
      const res = await fetch(`/api/logs/export?${params}`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs_export_${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success(t('toasts.export_success'));
      }
    } catch (error) {
      console.error('Erreur export:', error);
    } finally {
      setExporting(false);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      search: '',
      action: '',
      entity: '',
      userId: '',
      level: '',
      source: '',
      dateFrom: '',
      dateTo: '',
    });
    setPage(1);
  };

  // Change tab
  const changeTab = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    resetFilters();
  };

  // Format date
  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get action label and color
  const getActionInfo = (action: string) => {
    const key = Object.keys(ACTION_STYLES).find(k => action.toUpperCase().includes(k));
    if (key) {
        return {
            label: t(`actions.${key}`),
            color: ACTION_STYLES[key]
        };
    }
    return { label: action, color: 'bg-gray-100 text-gray-700' };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 p-6 ${locale === 'ar' ? 'font-cairo' : ''}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className={locale === 'ar' ? 'text-right' : 'text-left'}>
            <div className={`flex items-center gap-3 mb-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('title')}
              </h1>
            </div>
            <div className={`flex items-center gap-4 text-sm ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <span className="text-gray-500">{t('total_entries', { count: total })}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">
                {t('last_update', { time: lastUpdate.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : 'fr-FR') })}
              </span>
              {autoRefresh && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {t('live')}
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-refresh controls */}
            <div className={`flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
                {autoRefresh ? t('live') : t('auto')}
              </button>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border-0 bg-transparent focus:ring-0 text-gray-600 dark:text-gray-400"
                disabled={!autoRefresh}
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>1min</option>
              </select>
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <Filter size={16} />
              {t('filters_btn')}
            </button>
            
            <button
              onClick={loadLogs}
              disabled={refreshing}
              className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 text-gray-700 dark:text-gray-300"
              title={t('refresh_now')}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            
            {activeTab === 'activity' && (
              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className={`flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 ${locale === 'ar' ? 'border-l' : 'border-r'} border-gray-200 dark:border-gray-700`}
                >
                  <Download size={14} />
                  {t('export_csv')}
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  {t('export_json')}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => changeTab('activity')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'activity'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
            }`}
          >
            <Activity size={18} />
            {t('user_activity')}
          </button>
          
          {isSuperAdmin && (
            <button
              onClick={() => changeTab('system')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'system'
                  ? 'bg-slate-700 dark:bg-slate-600 text-white shadow-lg shadow-slate-500/30'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Server size={18} />
              {t('system_logs')}
            </button>
          )}
        </div>

        {/* Filtres */}
        <AnimatePresence>
          {showFilters && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-gray-900 dark:text-white">{t('advanced_filters')}</h3>
                <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  {t('reset')}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeTab === 'activity' ? (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('search')}</label>
                      <div className="relative">
                        <Search className={`absolute ${locale === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-gray-400`} size={16} />
                        <input
                          type="text"
                          placeholder={`${t('action_label')}, ${t('entity')}, ${t('ip')}...`}
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className={`w-full ${locale === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('action_label')}</label>
                      <select
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white"
                      >
                        <option value="">{t('all_actions')}</option>
                        {Object.keys(ACTION_STYLES).map(key => (
                            <option key={key} value={key}>{t(`actions.${key}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('entity')}</label>
                      <select
                        value={filters.entity}
                        onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white"
                      >
                        <option value="">{t('all')}</option>
                        <option value="User">{t('entities.User')}</option>
                        <option value="Reclamation">{t('entities.Reclamation')}</option>
                        <option value="Evenement">{t('entities.Evenement')}</option>
                        <option value="Actualite">{t('entities.Actualite')}</option>
                        <option value="Etablissement">{t('entities.Etablissement')}</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('level')}</label>
                      <select
                        value={filters.level}
                        onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white"
                      >
                        <option value="">{t('all')}</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Erreur</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('source')}</label>
                      <input
                        type="text"
                        placeholder="system, database, auth..."
                        value={filters.source}
                        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('date_from')}</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">{t('date_to')}</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-lg text-sm text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => { setPage(1); loadLogs(); }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
                >
                  {t('apply_filters')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'activity' ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('date')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('user')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('action_label')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('entity')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('ip')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activityLogs.map((log) => {
                    const actionInfo = getActionInfo(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock size={14} className="text-gray-400 shrink-0" />
                            <span className="text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">{formatDate(log.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                {log.user.prenom?.[0]}{log.user.nom?.[0]}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{log.user.prenom} {log.user.nom}</p>
                                <p className="text-[10px] text-gray-500 truncate">{log.user.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400 italic font-medium">{t('system_user')}</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${actionInfo.color}`}>
                            {actionInfo.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <span className="text-gray-900 dark:text-gray-200 font-medium">{t(`entities.${log.entity}`, { fallback: log.entity })}</span>
                            {log.entityId && (
                              <span className="text-gray-400 ml-1 font-mono text-xs">#{log.entityId}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.ipAddress ? (
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 dark:text-gray-400 font-mono">
                              <Globe size={12} className="shrink-0" />
                              {log.ipAddress}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                          >
                            {t('view_details')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('date')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('level')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('source')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('message')}</th>
                    <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider`}>{t('details')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Clock size={14} className="text-gray-400 shrink-0" />
                          <span className="text-gray-600 dark:text-gray-400 font-mono whitespace-nowrap">{formatDate(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${LEVEL_COLORS[log.level]}`}>
                          {LEVEL_ICONS[log.level]}
                          {t(`levels.${log.level}`)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[10px] text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-bold">
                          {log.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900 dark:text-white line-clamp-1" title={log.message}>{log.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold transition-colors"
                        >
                          {t('view_details')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {((activeTab === 'activity' && activityLogs.length === 0) || 
            (activeTab === 'system' && systemLogs.length === 0)) && (
            <div className="text-center py-20">
              <FileText className="w-20 h-20 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400 font-bold text-lg">{t('no_logs')}</p>
              <p className="text-gray-400 dark:text-gray-500 mt-1">{t('modify_filters_hint')}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <p className="text-sm text-gray-500 font-medium">
                {t('page_x_of_y', { current: page, total: totalPages, count: total.toLocaleString() })}
              </p>
              <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 disabled:opacity-30 disabled:hover:border-gray-200 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} className={locale === 'ar' ? 'rotate-180' : ''} />
                </button>
                <div className="flex gap-1">
                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && page > 3) {
                            pageNum = Math.min(page - 2 + i, totalPages - 4 + i);
                        }
                        return (
                            <button
                                key={i}
                                onClick={() => setPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === pageNum ? 'bg-blue-600 text-white shadow-md' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-200 dark:hover:border-blue-800 disabled:opacity-30 disabled:hover:border-gray-200 transition-all shadow-sm"
                >
                  <ChevronRight size={20} className={locale === 'ar' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-white/20"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-7 border-b border-gray-100 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
                        <FileJson size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white">
                            {t('details_modal_title', { id: selectedLog.id })}
                        </h3>
                        <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-bold uppercase tracking-wider mt-1">
                            <Clock size={12} />
                            {'timestamp' in selectedLog 
                                ? formatDate(selectedLog.timestamp)
                                : formatDate(selectedLog.createdAt)
                            }
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setSelectedLog(null)} 
                    className="p-2.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-2xl transition-all text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-7 overflow-y-auto custom-scrollbar space-y-8">
                
                {/* Info Principales */}
                <div className="grid grid-cols-2 gap-5">
                     <div className="p-5 bg-blue-50/50 dark:bg-blue-900/10 rounded-2xl border border-blue-100/50 dark:border-blue-800/30">
                        <p className={`text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase mb-2 tracking-widest ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('type_level')}</p>
                        {'level' in selectedLog ? (
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-sm ${LEVEL_COLORS[selectedLog.level]}`}>
                                {LEVEL_ICONS[selectedLog.level]}
                                {t(`levels.${selectedLog.level}`)}
                             </span>
                        ) : (
                             <span className="text-sm font-black text-gray-900 dark:text-white">{t('user_activity')}</span>
                        )}
                     </div>
                     <div className="p-5 bg-gov-gold/5 rounded-2xl border border-gov-gold/10">
                        <p className={`text-[10px] font-black text-gov-gold uppercase mb-2 tracking-widest ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('source_action')}</p>
                        {'source' in selectedLog ? (
                            <span className="font-mono text-xs bg-gov-gold/10 px-2 py-1 rounded-lg text-gov-gold-dark font-bold">{selectedLog.source}</span>
                        ) : (
                            <span className="text-sm font-black text-gray-900 dark:text-white">{getActionInfo(selectedLog.action).label}</span>
                        )}
                     </div>
                </div>

                {/* User Agent / IP (Activity Log Only) */}
                {'ipAddress' in selectedLog && (
                    <div className="grid grid-cols-2 gap-5">
                         <div className="p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className={`flex items-center gap-2 mb-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <Globe size={16} className="text-emerald-500" />
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{t('ip')}</p>
                            </div>
                            <p className="text-sm font-mono text-gray-900 dark:text-white font-bold">{selectedLog.ipAddress || '?'}</p>
                         </div>
                         <div className="p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                            <div className={`flex items-center gap-2 mb-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <Monitor size={16} className="text-purple-500" />
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">USER AGENT</p>
                            </div>
                            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed truncate" title={selectedLog.userAgent || ''}>{selectedLog.userAgent || '?'}</p>
                         </div>
                    </div>
                )}

                {/* Détails JSON */}
                <div>
                   <h4 className={`text-sm font-black text-gray-900 dark:text-white mb-4 flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Database size={18} className="text-blue-500" />
                      {t('technical_data')}
                   </h4>
                   <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs overflow-x-auto border-2 border-slate-800 shadow-2xl max-h-80 overflow-y-auto" dir="ltr">
                        {selectedLog.details && Object.keys(selectedLog.details).length > 0 ? (
                           <JSONValue value={selectedLog.details} />
                        ) : (
                           <span className="text-slate-500 italic">{t('no_tech_data')}</span>
                        )}
                   </div>
                </div>

              </div>
              
              <div className={`p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex ${locale === 'ar' ? 'justify-start' : 'justify-end'}`}>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-8 py-3 bg-gradient-to-r from-gov-green to-gov-green-dark text-white rounded-2xl hover:opacity-90 transition-all text-sm font-black shadow-lg shadow-gov-green/20 uppercase tracking-widest"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
