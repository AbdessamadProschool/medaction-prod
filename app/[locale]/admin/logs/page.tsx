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
  User,
  Calendar,
  Clock,
  Globe,
  AlertTriangle,
  AlertCircle,
  Info,
  Bug,
  FileText,
  X,
  Check,
} from 'lucide-react';

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

// Mapping des actions pour affichage
const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  'CREATE': { label: 'Création', color: 'bg-emerald-100 text-emerald-700' },
  'UPDATE': { label: 'Modification', color: 'bg-blue-100 text-blue-700' },
  'DELETE': { label: 'Suppression', color: 'bg-red-100 text-red-700' },
  'LOGIN': { label: 'Connexion', color: 'bg-purple-100 text-purple-700' },
  'LOGOUT': { label: 'Déconnexion', color: 'bg-gray-100 text-gray-700' },
  'VALIDATE': { label: 'Validation', color: 'bg-teal-100 text-teal-700' },
  'REJECT': { label: 'Rejet', color: 'bg-orange-100 text-orange-700' },
  'EXPORT': { label: 'Export', color: 'bg-indigo-100 text-indigo-700' },
  'EXPORT_LOGS': { label: 'Export Logs', color: 'bg-indigo-100 text-indigo-700' },
  'UPDATE_PERMISSIONS': { label: 'Modif. Permissions', color: 'bg-amber-100 text-amber-700' },
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
  const [stats, setStats] = useState<any>(null);
  
  // Messages
  const [success, setSuccess] = useState<string | null>(null);
  
  // Last update time
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

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
        
        setSuccess('Export téléchargé avec succès!');
        setTimeout(() => setSuccess(null), 3000);
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
    return new Date(date).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // Get action style
  const getActionStyle = (action: string) => {
    const key = Object.keys(ACTION_LABELS).find(k => action.toUpperCase().includes(k));
    return key ? ACTION_LABELS[key] : { label: action, color: 'bg-gray-100 text-gray-700' };
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Success message */}
        {success && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2 text-emerald-700">
            <Check size={18} />
            {success}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-gradient-to-br from-slate-600 to-slate-800 rounded-lg">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Logs & Activités
              </h1>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <span className="text-gray-500">{total.toLocaleString()} entrées au total</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-400">
                Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
              </span>
              {autoRefresh && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  Live
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            {/* Auto-refresh controls */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-sm font-medium transition-colors ${
                  autoRefresh 
                    ? 'bg-green-100 text-green-700 border border-green-200' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <RefreshCw size={14} className={autoRefresh ? 'animate-spin' : ''} />
                {autoRefresh ? 'Live' : 'Auto'}
              </button>
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border-0 bg-transparent focus:ring-0 text-gray-600"
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
                showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <Filter size={16} />
              Filtres
            </button>
            
            <button
              onClick={loadLogs}
              disabled={refreshing}
              className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              title="Rafraîchir maintenant"
            >
              <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
            </button>
            
            {activeTab === 'activity' && (
              <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                <button
                  onClick={() => handleExport('csv')}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-sm font-medium border-r border-gray-200"
                >
                  <Download size={14} />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  disabled={exporting}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-sm font-medium"
                >
                  JSON
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
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
            }`}
          >
            <Activity size={18} />
            Activités Utilisateurs
          </button>
          
          {isSuperAdmin && (
            <button
              onClick={() => changeTab('system')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'system'
                  ? 'bg-slate-700 text-white shadow-lg shadow-slate-500/30'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <Server size={18} />
              Logs Système
            </button>
          )}
        </div>

        {/* Filtres */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 border border-gray-100 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-gray-900">Filtres avancés</h3>
              <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
                Réinitialiser
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {activeTab === 'activity' ? (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        placeholder="Action, entité, IP..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Action</label>
                    <select
                      value={filters.action}
                      onChange={(e) => setFilters({ ...filters, action: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Toutes</option>
                      <option value="CREATE">Création</option>
                      <option value="UPDATE">Modification</option>
                      <option value="DELETE">Suppression</option>
                      <option value="LOGIN">Connexion</option>
                      <option value="VALIDATE">Validation</option>
                      <option value="EXPORT">Export</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Entité</label>
                    <select
                      value={filters.entity}
                      onChange={(e) => setFilters({ ...filters, entity: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Toutes</option>
                      <option value="User">Utilisateur</option>
                      <option value="Reclamation">Réclamation</option>
                      <option value="Evenement">Événement</option>
                      <option value="Actualite">Actualité</option>
                      <option value="Etablissement">Établissement</option>
                    </select>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Niveau</label>
                    <select
                      value={filters.level}
                      onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                      <option value="">Tous</option>
                      <option value="info">Info</option>
                      <option value="warning">Warning</option>
                      <option value="error">Erreur</option>
                      <option value="debug">Debug</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Source</label>
                    <input
                      type="text"
                      placeholder="system, database, auth..."
                      value={filters.source}
                      onChange={(e) => setFilters({ ...filters, source: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    />
                  </div>
                </>
              )}
              
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date début</label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Date fin</label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => { setPage(1); loadLogs(); }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                Appliquer les filtres
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            {activeTab === 'activity' ? (
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700/50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Utilisateur</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Entité</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {activityLogs.map((log) => {
                    const actionStyle = getActionStyle(log.action);
                    return (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 text-sm">
                            <Clock size={14} className="text-gray-400" />
                            <span className="text-gray-600">{formatDate(log.createdAt)}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.user ? (
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white text-xs font-medium">
                                {log.user.prenom?.[0]}{log.user.nom?.[0]}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{log.user.prenom} {log.user.nom}</p>
                                <p className="text-xs text-gray-500">{log.user.email}</p>
                              </div>
                            </div>
                          ) : (
                            <span className="text-sm text-gray-400 italic">Système</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-1 rounded text-xs font-medium ${actionStyle.color}`}>
                            {actionStyle.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-sm">
                            <span className="text-gray-900">{log.entity}</span>
                            {log.entityId && (
                              <span className="text-gray-400 ml-1">#{log.entityId}</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {log.ipAddress ? (
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Globe size={12} />
                              {log.ipAddress}
                            </div>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {log.details ? (
                            <button
                              onClick={() => alert(JSON.stringify(log.details, null, 2))}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Voir détails
                            </button>
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Niveau</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Message</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {systemLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 text-sm">
                          <Clock size={14} className="text-gray-400" />
                          <span className="text-gray-600">{formatDate(log.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded border text-xs font-medium ${LEVEL_COLORS[log.level]}`}>
                          {LEVEL_ICONS[log.level]}
                          {log.level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                          {log.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">{log.message}</p>
                      </td>
                      <td className="px-4 py-3">
                        {log.details ? (
                          <button
                            onClick={() => alert(JSON.stringify(log.details, null, 2))}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Voir détails
                          </button>
                        ) : (
                          <span className="text-gray-300">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {((activeTab === 'activity' && activityLogs.length === 0) || 
            (activeTab === 'system' && systemLogs.length === 0)) && (
            <div className="text-center py-16">
              <FileText className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">Aucun log trouvé</p>
              <p className="text-sm text-gray-400 mt-1">Modifiez vos filtres pour voir plus de résultats</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <p className="text-sm text-gray-500">
                Page {page} sur {totalPages} ({total.toLocaleString()} entrées)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
