'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  Monitor,
  Trash2,
  History,
  Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTranslations, useLocale } from 'next-intl';
import { useData } from '@/hooks/use-data';

// Simple JSON renderer
const JSONValue = ({ value }: { value: any }) => {
  if (value === null || value === undefined) return <span className="text-gray-400 italic text-xs">null</span>;
  if (typeof value === 'boolean') return <span className={`text-xs font-bold ${value ? 'text-green-600' : 'text-red-600'}`}>{value.toString()}</span>;
  if (typeof value === 'string') return <span className="text-blue-600 break-all">"{value}"</span>;
  if (typeof value === 'number') return <span className="text-gov-blue-dark">{value}</span>;
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

interface AuditLog {
  id: number;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  userId: number | null;
  details: string | null;
  previousValue: string | null;
  newValue: string | null;
  ipAddress: string | null;
  success: boolean;
  user: {
    name: string;
    email: string;
    role: string;
  } | null;
  createdAt: string;
}

type TabType = 'activity' | 'system' | 'audit';

// Styles des actions
const ACTION_STYLES: Record<string, string> = {
  'CREATE': 'bg-gov-green/10 text-gov-green-dark',
  'UPDATE': 'bg-blue-100 text-blue-700',
  'DELETE': 'bg-red-100 text-red-700',
  'LOGIN': 'bg-gov-blue/10 text-gov-blue-dark',
  'LOGOUT': 'bg-gray-100 text-gray-700',
  'VALIDATE': 'bg-gov-green/10 text-gov-green',
  'REJECT': 'bg-gov-gold/10 text-gov-gold',
  'EXPORT': 'bg-gov-blue/10 text-gov-blue-dark',
  'EXPORT_LOGS': 'bg-gov-blue/10 text-gov-blue-dark',
  'UPDATE_PERMISSIONS': 'bg-gov-gold/10 text-gov-gold',
  'CLOTURE': 'bg-slate-100 text-slate-700 border border-slate-200',
};

const LEVEL_ICONS: Record<string, React.ReactNode> = {
  info: <Info size={14} className="text-blue-500" />,
  warning: <AlertTriangle size={14} className="text-gov-gold" />,
  error: <AlertCircle size={14} className="text-red-500" />,
  debug: <Bug size={14} className="text-gray-500" />,
};

const LEVEL_COLORS: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  warning: 'bg-gov-gold/5 text-gov-gold border-gov-gold/30',
  error: 'bg-red-50 text-red-700 border-red-200',
  debug: 'bg-gray-50 text-gray-700 border-gray-200',
};

export default function AdminLogsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations('audit_page');
  
  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const [viewMode, setViewMode] = useState<'table' | 'timeline'>('table');
  const [exporting, setExporting] = useState(false);
  
  // Auto-refresh settings
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<number>(30); // seconds
  
  // Pagination
  const [page, setPage] = useState(1);
  
  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);
  
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
    resourceType: '',
    success: '',
  });
  
  const searchParams = useSearchParams();
  const queryUserId = searchParams.get('userId');
  const [selectedUserFilter, setSelectedUserFilter] = useState<{ prenom: string; nom: string } | null>(null);

  useEffect(() => {
    if (queryUserId) {
      setFilters(prev => ({ ...prev, userId: queryUserId }));
      setViewMode('timeline');
      setActiveTab('activity');
    }
  }, [queryUserId]);

  useEffect(() => {
    if (filters.userId) {
      fetch(`/api/users/${filters.userId}`)
        .then(res => res.json())
        .then(data => {
          if (data && data.success && data.data) {
            setSelectedUserFilter(data.data);
          } else if (data && data.prenom) {
            setSelectedUserFilter(data);
          }
        })
        .catch(() => setSelectedUserFilter(null));
    } else {
      setSelectedUserFilter(null);
    }
  }, [filters.userId]);
  
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
      resourceType: '',
      success: '',
    });
    setPage(1);
  };
  
  // Last update time
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  
  // Selected Log for Modal
  const [selectedLog, setSelectedLog] = useState<ActivityLog | SystemLog | AuditLog | null>(null);
  
  // Cleanup confirmation state
  const [showCleanupConfirm, setShowCleanupConfirm] = useState(false);

  // Endpoint dynamique mémoïsé
  const endpoint = useMemo(() => {
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
      return `/api/logs/activity?${params}`;
    } else if (activeTab === 'system') {
      if (filters.level) params.set('level', filters.level);
      if (filters.source) params.set('source', filters.source);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      return `/api/logs/system?${params}`;
    } else if (activeTab === 'audit') {
      if (filters.search) params.set('search', filters.search);
      if (filters.action) params.set('action', filters.action);
      if (filters.resourceType) params.set('resourceType', filters.resourceType);
      if (filters.success) params.set('success', filters.success);
      if (filters.dateFrom) params.set('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.set('dateTo', filters.dateTo);
      return `/api/audit?${params}`;
    }
    return null;
  }, [activeTab, page, filters]);

  // shouldFetch dynamique mémoïsé
  const shouldFetch = useMemo(() => {
    return session?.user && ['ADMIN', 'SUPER_ADMIN'].includes(session.user.role) ? endpoint : null;
  }, [session?.user, endpoint]);

  const handleCleanup = async () => {
    setShowCleanupConfirm(false);
    
    const cleanupPromise = new Promise<string>(async (resolve, reject) => {
      try {
        const res = await fetch('/api/admin/system/cleanup-logs', { method: 'POST' });
        const data = await res.json();
        if (res.ok) {
          loadLogs();
          resolve(data.message || 'Nettoyage réussi');
        } else {
          reject(new Error(data.error || 'Erreur lors du nettoyage'));
        }
      } catch (error) {
        reject(error);
      }
    });

    toast.promise(cleanupPromise, {
      loading: t('cleaning_logs', { defaultValue: 'Nettoyage des logs en cours...' }),
      success: (message) => message,
      error: (err) => err.message || 'Erreur lors du nettoyage',
    });
  };
  
  const { data: logsData, isLoading: loading, isValidating: refreshing, mutate: loadLogs } = useData(shouldFetch, {
    refreshInterval: autoRefresh ? refreshInterval * 1000 : 0
  });

  useEffect(() => {
    if (logsData) {
      setLastUpdate(new Date());
    }
  }, [logsData]);

  // Derived states
  // API: successResponse({ data: logs[], pagination }) → { success, data: { data: logs[], pagination } }
  const extractLogs = (data: any): any[] => {
    if (!data) return [];
    const nestedArr = data?.data?.data;
    if (Array.isArray(nestedArr)) return nestedArr;
    if (Array.isArray(data?.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  };
  const activityLogs: ActivityLog[] = activeTab === 'activity' ? extractLogs(logsData) : [];
  const systemLogs: SystemLog[] = activeTab === 'system' ? extractLogs(logsData) : [];
  const auditLogs: AuditLog[] = activeTab === 'audit' ? extractLogs(logsData) : [];
  
  const totalPages = logsData?.data?.pagination?.totalPages || logsData?.pagination?.totalPages || 1;
  const total = logsData?.data?.pagination?.total || logsData?.pagination?.total || 0;
  const stats = logsData?.data?.stats || logsData?.stats || null;

  // Vérifier authentification
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && !['ADMIN', 'SUPER_ADMIN'].includes(session?.user?.role || '')) {
      router.push('/');
    }
  }, [status, session, router]);

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
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
    return null;
  }

  const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

  return (
    <div className={`min-h-screen bg-background text-foreground p-6 ${locale === 'ar' ? 'font-cairo' : ''}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="text-start">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gov-blue text-white rounded-none">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">
                {t('title')}
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>{t('total_entries', { count: total })}</span>
              <span>•</span>
              <span>
                {t('last_update', { time: lastUpdate.toLocaleTimeString(locale === 'ar' ? 'ar-MA' : 'fr-FR') })}
              </span>
              {autoRefresh && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium dark:bg-green-950/30 dark:text-green-400">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  {t('live')}
                </span>
              )}
            </div>
          </div>
            <div className="flex flex-wrap items-center gap-3">
            {/* Auto-refresh controls */}
            <div className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded-lg">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 border border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900' 
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
                {autoRefresh ? t('live') : t('auto')}
              </button>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border-0 bg-transparent focus:ring-0 text-muted-foreground"
                disabled={!autoRefresh}
              >
                <option value={15}>15s</option>
                <option value={30}>30s</option>
                <option value={60}>1min</option>
              </select>
            </div>
            
            {/* View Mode Toggle */}
            <div className="flex items-center border border-border rounded-lg overflow-hidden bg-card">
              <button
                onClick={() => setViewMode('table')}
                className={`p-2 transition-colors ${
                  viewMode === 'table' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted bg-card'
                }`}
                title={locale === 'ar' ? 'جدول' : 'Tableau'}
              >
                <Monitor size={16} />
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`p-2 transition-colors ${
                  viewMode === 'timeline' 
                    ? 'bg-blue-600 text-white shadow-sm' 
                    : 'text-muted-foreground hover:bg-muted bg-card'
                }`}
                title={locale === 'ar' ? 'المخطط الزمني' : 'Timeline'}
              >
                <History size={16} />
              </button>
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/20 dark:border-blue-800 dark:text-blue-400' : 'bg-card border-border text-foreground hover:bg-muted'
              }`}
            >
              <Filter size={16} />
              {t('filters_btn')}
            </button>
            
            <button
              onClick={loadLogs}
              disabled={refreshing}
              className="p-2 bg-card border border-border rounded-lg hover:bg-muted disabled:opacity-50 text-foreground"
              title={t('refresh_now')}
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            
            {isSuperAdmin && activeTab === 'audit' && (
              <button
                onClick={() => {
                  setConfirmModal({
                    title: t('confirm_cleanup_title') || 'Nettoyage des journaux',
                    message: t('confirm_cleanup') || 'Voulez-vous vraiment nettoyer les journaux ?',
                    onConfirm: async () => {
                      try {
                        const res = await fetch('/api/admin/system/cleanup-logs', { method: 'POST' });
                        const data = await res.json();
                        if (res.ok) {
                          toast.success(data.message);
                          loadLogs();
                        } else {
                          toast.error(data.error);
                        }
                      } catch (error) {
                        toast.error('Erreur lors du nettoyage');
                      }
                    }
                  });
                }}
                className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-sm font-medium transition-colors dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
              >
                <Trash2 size={16} />
                {t('cleanup')}
              </button>
            )}

            {activeTab === 'activity' && (
              <div className="flex items-center border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-muted text-sm font-medium text-foreground border-e border-border"
                >
                  <Download size={14} />
                  {t('export_csv')}
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-card hover:bg-muted text-sm font-medium text-foreground"
                >
                  {t('export_json')}
                </button>
              </div>
            )}
          </div>
        </div>

        {selectedUserFilter && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-center justify-between shadow-sm dark:bg-blue-950/20 dark:border-blue-900 dark:text-blue-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              <span className="text-sm font-semibold">
                {locale === 'ar' 
                  ? `تصفية حسب المستخدم: ${selectedUserFilter.prenom} ${selectedUserFilter.nom}`
                  : `Filtré par l'utilisateur : ${selectedUserFilter.prenom} ${selectedUserFilter.nom}`}
              </span>
            </div>
            <button
              onClick={() => {
                setFilters(prev => ({ ...prev, userId: '' }));
                const url = new URL(window.location.href);
                url.searchParams.delete('userId');
                window.history.pushState({}, '', url.toString());
              }}
              className="text-xs bg-blue-100 hover:bg-blue-200 dark:bg-blue-950 dark:hover:bg-blue-900 text-blue-800 dark:text-blue-400 font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 animate-fade-in"
            >
              <X size={14} />
              {locale === 'ar' ? 'إزالة التصفية' : 'Effacer'}
            </button>
          </div>
        )}

        {/* Onglets */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => changeTab('activity')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
              activeTab === 'activity'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-card text-muted-foreground hover:bg-muted border border-border'
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
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border'
              }`}
            >
              <Server size={18} />
              {t('system_logs')}
            </button>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => changeTab('audit')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'audit'
                  ? 'bg-gov-green text-white shadow-lg shadow-gov-green/30'
                  : 'bg-card text-muted-foreground hover:bg-muted border border-border'
              }`}
            >
              <Database size={18} />
              {t('security_audit')}
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
              className="bg-card rounded-xl p-4 mb-6 border border-border shadow-sm overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium text-foreground">{t('advanced_filters')}</h3>
                <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline dark:text-blue-400">
                  {t('reset')}
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {activeTab === 'activity' ? (
                  <>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('search')}</label>
                      <div className="relative">
                        <Search className={`absolute ${locale === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-muted-foreground`} size={16} />
                        <input
                          type="text"
                          placeholder={`${t('action_label')}, ${t('entity')}, ${t('ip')}...`}
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className={`w-full ${locale === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 border border-border bg-background rounded-lg text-sm text-foreground`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('action_label')}</label>
                      <select
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
                      >
                        <option value="">{t('all_actions')}</option>
                        {Object.keys(ACTION_STYLES).map(key => (
                            <option key={key} value={key}>{t(`actions.${key}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('entity')}</label>
                      <select
                        value={filters.entity}
                        onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
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
                ) : activeTab === 'audit' ? (
                  <>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('search')}</label>
                      <div className="relative">
                        <Search className={`absolute ${locale === 'ar' ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 text-muted-foreground`} size={16} />
                        <input
                          type="text"
                          placeholder={`${t('user')}, ${t('details')}...`}
                          value={filters.search}
                          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                          className={`w-full ${locale === 'ar' ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 border border-border bg-background rounded-lg text-sm text-foreground`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('action')}</label>
                      <select
                        value={filters.action}
                        onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
                      >
                        <option value="">{t('all_actions')}</option>
                        {Object.keys(ACTION_STYLES).map(key => (
                            <option key={key} value={key}>{t(`actions.${key}`)}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('resource')}</label>
                      <select
                        value={filters.resourceType}
                        onChange={(e) => setFilters({ ...filters, resourceType: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
                      >
                        <option value="">{t('all')}</option>
                        <option value="User">{t('entities.User')}</option>
                        <option value="Reclamation">{t('entities.Reclamation')}</option>
                        <option value="Evenement">{t('entities.Evenement')}</option>
                        <option value="Actualite">{t('entities.Actualite')}</option>
                        <option value="Etablissement">{t('entities.Etablissement')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('status')}</label>
                      <select
                        value={filters.success}
                        onChange={(e) => setFilters({ ...filters, success: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
                      >
                        <option value="">{t('all')}</option>
                        <option value="true">{t('success')}</option>
                        <option value="false">{t('failure')}</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('level')}</label>
                      <select
                        value={filters.level}
                        onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
                      >
                        <option value="">{t('all')}</option>
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="error">Erreur</option>
                        <option value="debug">Debug</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm text-muted-foreground mb-1">{t('source')}</label>
                      <input
                        type="text"
                        placeholder="system, database, auth..."
                        value={filters.source}
                        onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                        className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
                      />
                    </div>
                  </>
                )}
                
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('date_from')}</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-1">{t('date_to')}</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                    className="w-full px-3 py-2 border border-border bg-background rounded-lg text-sm text-foreground"
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

        {/* Table / Timeline container */}
        <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'activity' && (
              viewMode === 'table' ? (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('date')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('user')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('action_label')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('entity')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('ip')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('details')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {activityLogs.map((log) => {
                      const actionInfo = getActionInfo(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock size={14} className="shrink-0" />
                              <span className="font-mono whitespace-nowrap">{formatDate(log.createdAt)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    setFilters(prev => ({ ...prev, userId: String(log.user?.id || '') }));
                                    setViewMode('timeline');
                                    const url = new URL(window.location.href);
                                    url.searchParams.set('userId', String(log.user?.id || ''));
                                    window.history.pushState({}, '', url.toString());
                                  }}
                                  className="w-7 h-7 rounded-none bg-gov-blue hover:bg-gov-blue-dark flex items-center justify-center text-white text-[10px] font-bold shrink-0 transition-colors"
                                  title={locale === 'ar' ? 'عرض السجل الزمني' : 'Voir la timeline'}
                                >
                                  {log.user.prenom?.[0]}{log.user.nom?.[0]}
                                </button>
                                <div className="min-w-0 text-start">
                                  <button
                                    onClick={() => {
                                      setFilters(prev => ({ ...prev, userId: String(log.user?.id || '') }));
                                      setViewMode('timeline');
                                      const url = new URL(window.location.href);
                                      url.searchParams.set('userId', String(log.user?.id || ''));
                                      window.history.pushState({}, '', url.toString());
                                    }}
                                    className="text-xs font-bold text-foreground hover:text-blue-600 hover:underline text-start truncate block"
                                    title={locale === 'ar' ? 'عرض السجل الزمني' : 'Voir la timeline'}
                                  >
                                    {log.user.prenom} {log.user.nom}
                                  </button>
                                  <p className="text-[10px] text-muted-foreground truncate">{log.user.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic font-medium">{t('system_user')}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${actionInfo.color}`}>
                              {actionInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <span className="text-foreground font-medium">{t(`entities.${log.entity}`, { fallback: log.entity })}</span>
                              {log.entityId && (
                                <span className="text-muted-foreground ms-1 font-mono text-xs">#{log.entityId}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {log.ipAddress ? (
                              <div className="flex items-center gap-1 text-[11px] text-muted-foreground font-mono">
                                <Globe size={12} className="shrink-0" />
                                {log.ipAddress}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
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
                <div className="p-8 relative">
                  <div className={`absolute top-8 bottom-8 w-0.5 bg-border ${locale === 'ar' ? 'right-[23px]' : 'left-[23px]'}`}></div>
                  <ul className="space-y-8 relative">
                    {activityLogs.map((log) => {
                      const actionInfo = getActionInfo(log.action);
                      return (
                        <li key={log.id} className="relative flex items-start gap-6 group">
                          <div className={`relative z-10 p-2.5 rounded-full border-4 border-card shrink-0 shadow-sm transition-transform group-hover:scale-110 ${actionInfo.color.replace('text-', 'bg-').split(' ')[0]} ${actionInfo.color.split(' ')[1]}`}>
                            <Activity size={18} className="text-current" />
                          </div>
                          <div className="flex-1 min-w-0 bg-muted/20 dark:bg-muted/5 rounded-2xl p-5 border border-border transition-all hover:bg-card hover:shadow-md hover:border-border">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                              <h3 className="text-base font-black text-foreground flex items-center gap-2 flex-wrap">
                                {log.user ? (
                                  <button
                                    onClick={() => {
                                      setFilters(prev => ({ ...prev, userId: String(log.user?.id || '') }));
                                      const url = new URL(window.location.href);
                                      url.searchParams.set('userId', String(log.user?.id || ''));
                                      window.history.pushState({}, '', url.toString());
                                    }}
                                    className="font-bold text-foreground hover:text-blue-600 hover:underline text-start transition-colors"
                                    title={locale === 'ar' ? 'عرض السجل الزمني' : 'Voir la timeline'}
                                  >
                                    {log.user.prenom} {log.user.nom}
                                  </button>
                                ) : (
                                  <span className="font-bold text-muted-foreground">{t('system_user')}</span>
                                )}
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${actionInfo.color}`}>
                                  {actionInfo.label}
                                </span>
                              </h3>
                              <span className="text-xs text-muted-foreground font-mono font-medium flex items-center gap-1.5 bg-card px-2 py-1 rounded-lg border border-border shadow-sm">
                                <Clock size={12} className="text-muted-foreground/60" />
                                {formatDate(log.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-bold text-gov-blue">
                                {t(`entities.${log.entity}`, { fallback: log.entity })}
                              </span>
                              {log.entityId && (
                                <span className="text-xs font-mono bg-muted text-foreground px-1.5 py-0.5 rounded font-bold">
                                  #{log.entityId}
                                </span>
                              )}
                            </div>
                            {log.ipAddress && (
                              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground font-mono font-medium">
                                <Globe size={12} className="shrink-0" />
                                IP: {log.ipAddress}
                              </div>
                            )}
                            <div className="mt-3">
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                              >
                                {t('view_details')}
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            )}

            {activeTab === 'system' && (
              viewMode === 'table' ? (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('date')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('level')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('source')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('message')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('details')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {systemLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock size={14} className="shrink-0" />
                            <span className="font-mono whitespace-nowrap">{formatDate(log.timestamp)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${LEVEL_COLORS[log.level]}`}>
                            {LEVEL_ICONS[log.level]}
                            {t(`levels.${log.level}`)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded font-bold">
                            {log.source}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-foreground line-clamp-1" title={log.message}>{log.message}</p>
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
              ) : (
                <div className="p-8 relative">
                  <div className={`absolute top-8 bottom-8 w-0.5 bg-border ${locale === 'ar' ? 'right-[23px]' : 'left-[23px]'}`}></div>
                  <ul className="space-y-8 relative">
                    {systemLogs.map((log) => (
                      <li key={log.id} className="relative flex items-start gap-6 group">
                        <div className={`relative z-10 p-2.5 rounded-full border-4 border-card shrink-0 shadow-sm transition-transform group-hover:scale-110 bg-slate-100 text-slate-700`}>
                          <Server size={18} className="text-current" />
                        </div>
                        <div className="flex-1 min-w-0 bg-muted/20 dark:bg-muted/5 rounded-2xl p-5 border border-border transition-all hover:bg-card hover:shadow-md hover:border-border">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                            <h3 className="text-base font-black text-foreground flex items-center gap-2 flex-wrap">
                              <span className="font-bold">{log.source}</span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-bold ${LEVEL_COLORS[log.level]}`}>
                                {t(`levels.${log.level}`)}
                              </span>
                            </h3>
                            <span className="text-xs text-muted-foreground font-mono font-medium flex items-center gap-1.5 bg-card px-2 py-1 rounded-lg border border-border shadow-sm">
                              <Clock size={12} className="text-muted-foreground/60" />
                              {formatDate(log.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-foreground mb-3" title={log.message}>{log.message}</p>
                          <div className="mt-3">
                            <button
                              onClick={() => setSelectedLog(log)}
                              className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold transition-colors"
                            >
                              {t('view_details')}
                            </button>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            )}

            {activeTab === 'audit' && (
              viewMode === 'table' ? (
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('date')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('user')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('action_label')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('resource')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('status')}</th>
                      <th className={`px-4 py-3 ${locale === 'ar' ? 'text-right' : 'text-left'} text-xs font-medium text-muted-foreground uppercase tracking-wider`}>{t('details')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {auditLogs.map((log) => {
                      const actionInfo = getActionInfo(log.action);
                      return (
                        <tr key={log.id} className="hover:bg-muted/50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock size={14} className="shrink-0" />
                              <span className="font-mono whitespace-nowrap">{formatDate(log.createdAt)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            {log.user ? (
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => {
                                    if (log.userId) {
                                      setFilters(prev => ({ ...prev, userId: String(log.userId) }));
                                      setViewMode('timeline');
                                      setActiveTab('activity');
                                      const url = new URL(window.location.href);
                                      url.searchParams.set('userId', String(log.userId));
                                      window.history.pushState({}, '', url.toString());
                                    }
                                  }}
                                  disabled={!log.userId}
                                  className={`w-7 h-7 rounded-none bg-gov-blue flex items-center justify-center text-white text-[10px] font-bold shrink-0 transition-colors ${log.userId ? 'hover:bg-gov-blue-dark' : 'cursor-default'}`}
                                  title={log.userId ? (locale === 'ar' ? 'عرض السجل الزمني' : 'Voir la timeline') : undefined}
                                >
                                  {log.user.name?.[0]}
                                </button>
                                <div className="min-w-0 text-start">
                                  {log.userId ? (
                                    <button
                                      onClick={() => {
                                        setFilters(prev => ({ ...prev, userId: String(log.userId) }));
                                        setViewMode('timeline');
                                        setActiveTab('activity');
                                        const url = new URL(window.location.href);
                                        url.searchParams.set('userId', String(log.userId));
                                        window.history.pushState({}, '', url.toString());
                                      }}
                                      className="text-xs font-bold text-foreground hover:text-blue-600 hover:underline text-start truncate block"
                                      title={locale === 'ar' ? 'عرض السجل الزمني' : 'Voir la timeline'}
                                    >
                                      {log.user.name}
                                    </button>
                                  ) : (
                                    <p className="text-xs font-bold text-foreground truncate">{log.user.name}</p>
                                  )}
                                  <p className="text-[10px] text-muted-foreground truncate">{log.user.email}</p>
                                </div>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground italic font-medium">{t('system_user')}</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${actionInfo.color}`}>
                              {actionInfo.label}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm">
                              <span className="text-foreground font-medium">{t(`entities.${log.resourceType ?? ''}`, { fallback: log.resourceType ?? '' })}</span>
                              {log.resourceId && (
                                <span className="text-muted-foreground ms-1 font-mono text-xs">#{log.resourceId}</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${log.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                              {log.success ? <Check size={10} /> : <X size={10} />}
                              {log.success ? t('success') : t('failure')}
                            </span>
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
                <div className="p-8 relative">
                  <div className={`absolute top-8 bottom-8 w-0.5 bg-border ${locale === 'ar' ? 'right-[23px]' : 'left-[23px]'}`}></div>
                  <ul className="space-y-8 relative">
                    {auditLogs.map((log) => {
                      const actionInfo = getActionInfo(log.action);
                      return (
                        <li key={log.id} className="relative flex items-start gap-6 group">
                          <div className={`relative z-10 p-2.5 rounded-full border-4 border-card shrink-0 shadow-sm transition-transform group-hover:scale-110 ${actionInfo.color.replace('text-', 'bg-').split(' ')[0]} ${actionInfo.color.split(' ')[1]}`}>
                            <Database size={18} className="text-current" />
                          </div>
                          <div className="flex-1 min-w-0 bg-muted/20 dark:bg-muted/5 rounded-2xl p-5 border border-border transition-all hover:bg-card hover:shadow-md hover:border-border">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                              <h3 className="text-base font-black text-foreground flex items-center gap-2 flex-wrap">
                                {log.user ? (
                                  log.userId ? (
                                    <button
                                      onClick={() => {
                                        setFilters(prev => ({ ...prev, userId: String(log.userId) }));
                                        setViewMode('timeline');
                                        setActiveTab('activity');
                                        const url = new URL(window.location.href);
                                        url.searchParams.set('userId', String(log.userId));
                                        window.history.pushState({}, '', url.toString());
                                      }}
                                      className="font-bold text-foreground hover:text-blue-600 hover:underline text-start transition-colors"
                                      title={locale === 'ar' ? 'عرض السجل الزمني' : 'Voir la timeline'}
                                    >
                                      {log.user.name}
                                    </button>
                                  ) : (
                                    <span className="font-bold">{log.user.name}</span>
                                  )
                                ) : (
                                  <span className="font-bold text-muted-foreground">{t('system_user')}</span>
                                )}
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${actionInfo.color}`}>
                                  {actionInfo.label}
                                </span>
                                {!log.success && (
                                  <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full">Échec</span>
                                )}
                              </h3>
                              <span className="text-xs text-muted-foreground font-mono font-medium flex items-center gap-1.5 bg-card px-2 py-1 rounded-lg border border-border shadow-sm">
                                <Clock size={12} className="text-muted-foreground/60" />
                                {formatDate(log.createdAt)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              <span className="text-sm font-bold text-gov-blue">
                                {t(`entities.${log.resourceType ?? ''}`, { fallback: log.resourceType ?? '' })}
                              </span>
                              {log.resourceId && (
                                <span className="text-xs font-mono bg-muted text-foreground px-1.5 py-0.5 rounded font-bold">
                                  #{log.resourceId}
                                </span>
                              )}
                            </div>
                            {log.ipAddress && (
                              <div className="mt-3 flex items-center gap-2 text-[10px] text-muted-foreground font-mono font-medium">
                                <Globe size={12} className="shrink-0" />
                                IP: {log.ipAddress}
                              </div>
                            )}
                            <div className="mt-3">
                              <button
                                onClick={() => setSelectedLog(log)}
                                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-bold flex items-center gap-1 transition-colors"
                              >
                                {t('view_details')}
                              </button>
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )
            )}
          </div>

          {((activeTab === 'activity' && activityLogs.length === 0) || 
            (activeTab === 'system' && systemLogs.length === 0) ||
            (activeTab === 'audit' && auditLogs.length === 0)) && (
            <div className="text-center py-20">
              <FileText className="w-20 h-20 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground font-bold text-lg">{t('no_logs')}</p>
              <p className="text-muted-foreground/60 mt-1">{t('modify_filters_hint')}</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
              <p className="text-sm text-muted-foreground font-medium">
                {t('page_x_of_y', { current: page, total: totalPages, count: total.toLocaleString() })}
              </p>
              <div className={`flex items-center gap-3 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft size={20} className={locale === 'ar' ? 'rotate-180' : ''} />
                </button>
                <div className="flex gap-1">
                    {[...Array(Math.min(5, Number(totalPages) || 0))].map((_, i) => {
                        let pageNum = i + 1;
                        if (totalPages > 5 && page > 3) {
                            pageNum = Math.min(page - 2 + i, totalPages - 4 + i);
                        }
                        return (
                            <button
                                key={i}
                                onClick={() => setPage(pageNum)}
                                className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${page === pageNum ? 'bg-blue-600 text-white shadow-md' : 'bg-card text-foreground border border-border hover:bg-muted'}`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-card border border-border rounded-lg text-muted-foreground hover:text-blue-600 hover:border-blue-200 disabled:opacity-30 transition-all shadow-sm"
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
              className="bg-card border border-border rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-7 border-b border-border bg-slate-50">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gov-blue text-white rounded-none">
                        <FileJson size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-foreground">
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
                    className="p-2.5 hover:bg-muted rounded-2xl transition-all text-muted-foreground hover:text-foreground"
                >
                  <X size={24} />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-7 overflow-y-auto custom-scrollbar space-y-8">
                
                {/* Info Principales */}
                <div className="grid grid-cols-2 gap-5">
                     <div className="p-5 bg-muted/30 rounded-2xl border border-border">
                        <p className={`text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-widest ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('type_level')}</p>
                        {'level' in selectedLog ? (
                             <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border shadow-sm ${LEVEL_COLORS[selectedLog.level]}`}>
                                {LEVEL_ICONS[selectedLog.level]}
                                {t(`levels.${selectedLog.level}`)}
                             </span>
                        ) : (
                             <span className="text-sm font-black text-foreground">{t('user_activity')}</span>
                        )}
                     </div>
                     <div className="p-5 bg-muted/30 rounded-2xl border border-border">
                        <p className={`text-[10px] font-black text-muted-foreground uppercase mb-2 tracking-widest ${locale === 'ar' ? 'text-right' : 'text-left'}`}>{t('source_action')}</p>
                        {'source' in selectedLog ? (
                            <span className="font-mono text-xs bg-muted px-2 py-1 rounded-lg text-foreground font-bold">{selectedLog.source}</span>
                        ) : (
                            <span className="text-sm font-black text-foreground">{getActionInfo(selectedLog.action).label}</span>
                        )}
                     </div>
                </div>

                {/* User Agent / IP (Activity Log Only) */}
                {'ipAddress' in selectedLog && (
                    <div className="grid grid-cols-2 gap-5">
                         <div className="p-5 bg-muted/30 rounded-2xl border border-border">
                            <div className={`flex items-center gap-2 mb-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <Globe size={16} className="text-muted-foreground" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{t('ip')}</p>
                            </div>
                            <p className="text-sm font-mono text-foreground font-bold">{selectedLog.ipAddress || '?'}</p>
                         </div>
                         <div className="p-5 bg-muted/30 rounded-2xl border border-border">
                            <div className={`flex items-center gap-2 mb-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                                <Monitor size={16} className="text-muted-foreground" />
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">USER AGENT</p>
                            </div>
                            <p className="text-[11px] text-muted-foreground font-medium leading-relaxed truncate" title={(selectedLog as any).userAgent || ''}>{(selectedLog as any).userAgent || '?'}</p>
                         </div>
                    </div>
                )}

                {/* Valeurs Audit (Uniquement pour AuditLog) */}
                {'previousValue' in selectedLog && (selectedLog.previousValue || selectedLog.newValue) && (
                    <div className="space-y-4">
                        <h4 className={`text-sm font-black text-foreground flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                            <History size={18} className="text-blue-500" />
                            {t('changes_comparison') || 'Comparaison des changements'}
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">{t('previous_value') || 'ANCIENNE VALEUR'}</p>
                                <div className="bg-red-50 dark:bg-red-950/20 p-4 rounded-xl border border-red-200 dark:border-red-900/50 font-mono text-xs overflow-auto max-h-40">
                                    <pre className="whitespace-pre-wrap break-all">{selectedLog.previousValue || t('none') || 'Aucune'}</pre>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-widest">{t('new_value') || 'NOUVELLE VALEUR'}</p>
                                <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-xl border border-green-200 dark:border-green-900/50 font-mono text-xs overflow-auto max-h-40">
                                    <pre className="whitespace-pre-wrap break-all">{selectedLog.newValue || t('none') || 'Aucune'}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Détails JSON */}
                <div>
                   <h4 className={`text-sm font-black text-foreground mb-4 flex items-center gap-2 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                      <Database size={18} className="text-blue-500" />
                      {t('technical_data')}
                   </h4>
                   <div className="bg-slate-900 rounded-2xl p-6 font-mono text-xs overflow-x-auto border-2 border-slate-800 shadow-2xl max-h-80 overflow-y-auto" dir="ltr">
                        {(() => {
                            if (!selectedLog.details) return <span className="text-slate-500 italic">{t('no_tech_data')}</span>;
                            
                            let detailsObj = selectedLog.details;
                            if (typeof detailsObj === 'string') {
                                try {
                                    detailsObj = JSON.parse(detailsObj);
                                } catch {
                                    return <pre className="text-slate-300">{String(detailsObj)}</pre>;
                                }
                            }
                            
                            if (Object.keys(detailsObj).length === 0) {
                                return <span className="text-slate-500 italic">{t('no_tech_data')}</span>;
                            }
                            
                            return <JSONValue value={detailsObj} />;
                        })()}
                   </div>
                </div>

              </div>
              <div className="p-6 border-t border-border bg-slate-50 flex justify-end">
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="px-8 py-3 bg-gov-blue text-white rounded-none hover:bg-gov-blue-dark transition-colors text-sm font-bold uppercase tracking-wider"
                >
                  {t('close')}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cleanup Confirmation Modal */}
      <AnimatePresence>
        {showCleanupConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-50 p-4"
            onClick={() => setShowCleanupConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-3xl max-w-md w-full p-7 shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
              dir={locale === 'ar' ? 'rtl' : 'ltr'}
            >
              <div className="flex flex-col items-center text-center">
                <div className="p-4 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 rounded-2xl mb-4">
                  <Trash2 size={32} />
                </div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">
                  {t('cleanup_confirm_title', { defaultValue: 'Confirmation de nettoyage' })}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  {t('confirm_cleanup', { defaultValue: 'Êtes-vous sûr de vouloir nettoyer les logs de sécurité ? Cette action est irréversible.' })}
                </p>
                <div className="flex w-full gap-3">
                  <button
                    onClick={() => setShowCleanupConfirm(false)}
                    className="flex-1 px-5 py-3 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-bold transition-colors"
                  >
                    {t('cancel', { defaultValue: 'Annuler' })}
                  </button>
                  <button
                    onClick={handleCleanup}
                    className="flex-1 px-5 py-3 bg-red-600 text-white rounded-2xl hover:bg-red-700 text-sm font-bold transition-colors shadow-lg shadow-red-500/20"
                  >
                    {t('confirm', { defaultValue: 'Confirmer' })}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
