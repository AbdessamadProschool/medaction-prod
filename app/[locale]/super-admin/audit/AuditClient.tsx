'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield,
  Search,
  Filter,
  Clock,
  User,
  FileType,
  Activity,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  RefreshCw,
  Loader2,
  Calendar,
  Monitor,
  Smartphone,
  Globe,
  Database,
  Server,
  FileJson,
  Lock,
  LogOut,
  AlertOctagon,
  CheckCircle,
  AlertTriangle,
  Mail
} from 'lucide-react';
import { useAccessLogger } from '../../../../hooks/use-access-logger';

interface ActivityLog {
  id: number;
  userId: number;
  action: string;
  entity: string;
  entityId: number | null;
  details: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    role: string;
    photo: string | null;
  };
}

// Composant pour afficher une valeur JSON de manière lisible
const JSONValue = ({ value }: { value: any }) => {
  const locale = useLocale();
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic text-xs">null</span>;
  }
  
  if (value === 'N/A') {
    return <span className="text-gray-400 italic text-xs">{t('audit_log.modal.not_available')}</span>;
  }
  
  if (typeof value === 'boolean') {
    return (
      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${value ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
        {value ? 'TRUE' : 'FALSE'}
      </span>
    );
  }
  
  if (typeof value === 'string') {
    if (value.match(/^\d{4}-\d{2}-\d{2}T/)) {
        return <span className="text-blue-600 dark:text-blue-400 dir-ltr inline-block" dir="ltr">{new Date(value).toLocaleString(locale)}</span>;
    }
    return <span className="text-gray-800 dark:text-gray-200 break-words dir-ltr inline-block" dir="ltr">"{value}"</span>;
  }
  
  if (typeof value === 'number') {
    return <span className="text-purple-600 dark:text-purple-400 font-mono dir-ltr inline-block" dir="ltr">{value}</span>;
  }
  
  if (Array.isArray(value)) {
    if (value.length === 0) return <span className="text-gray-400">[]</span>;
    return (
      <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-1 my-1">
        {value.map((item, i) => (
          <div key={i} className="flex gap-2">
            <span className="text-gray-400 text-xs select-none">[{i}]</span>
            <JSONValue value={item} />
          </div>
        ))}
      </div>
    );
  }
  
  if (typeof value === 'object') {
    if (Object.keys(value).length === 0) return <span className="text-gray-400">{'{}'}</span>;
    return (
      <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-2 my-1">
        {Object.entries(value).map(([k, v]) => (
          <div key={k} className="flex flex-col sm:flex-row sm:gap-2 border-b border-gray-100 dark:border-gray-800 pb-1 last:border-0 last:pb-0">
            <span className="text-gray-500 dark:text-gray-400 font-bold text-xs sm:min-w-[120px] select-none uppercase tracking-wide pt-1">{k}</span>
            <div className="flex-1 overflow-x-auto">
              <JSONValue value={v} />
            </div>
          </div>
        ))}
      </div>
    );
  }
  
  return <span>{String(value)}</span>;
};

const LogDetailsViewer = ({ details }: { details: any }) => {
  const locale = useLocale();
  if (!details) return null;

  // Handle ACCESS_DENIED specific structure
  if (details.path && details.reason) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
               <span className="text-xs font-bold text-gray-500 uppercase block mb-2 flex items-center gap-2">
                 <AlertTriangle size={14} className="text-red-500" />
                 {t('audit_log.modal.reason')}
               </span>
               <span className="font-bold text-red-600 font-mono text-sm bg-red-50 dark:bg-red-900/10 px-2 py-1 rounded border border-red-100 dark:border-red-900/20 block w-full">
                 {details.reason}
               </span>
             </div>
             <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm">
               <span className="text-xs font-bold text-gray-500 uppercase block mb-2 flex items-center gap-2">
                 <Lock size={14} className="text-blue-500" />
                 {t('audit_log.modal.path')}
               </span>
               <span className="font-mono text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded border border-blue-100 dark:border-blue-900/20 block w-full text-left dir-ltr" dir="ltr">
                 {details.path}
               </span>
             </div>
        </div>
        {details.timestamp && (
           <div className="flex items-center justify-end gap-2 text-xs text-gray-400 bg-gray-50 dark:bg-gray-900 px-3 py-1 rounded-full w-fit mr-auto">
             <Clock size={12} />
             {t('audit_log.modal.timestamp')}: <span dir="ltr">{new Date(details.timestamp).toLocaleString(locale)}</span>
           </div>
        )}
        
        {/* Show other details if present */}
        {Object.keys(details).filter(k => !['path', 'reason', 'timestamp', 'success'].includes(k)).length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
             <p className="text-xs font-bold text-gray-500 uppercase mb-2">{t('audit_log.modal.other_details')}</p>
             <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 text-xs">
                {Object.entries(details).filter(([k]) => !['path', 'reason', 'timestamp', 'success'].includes(k)).map(([k, v]) => (
                    <div key={k} className="flex gap-2 mb-1">
                        <span className="font-bold text-gray-600">{k}:</span>
                        <JSONValue value={v} />
                    </div>
                ))}
             </div>
          </div>
        )}
      </div>
    );
  }

  // Generic render for other types
  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 text-sm">
       <JSONValue value={details} />
    </div>
  );
};

// Fonction simple pour parser le User Agent
const parseUserAgent = (uaString: string | null) => {
  if (!uaString) return { browser: 'Inconnu', os: 'Inconnu', device: 'Inconnu' };
  
  // Clean string if needed (remove quotes if double stringified)
  const ua = uaString.replace(/^["']|["']$/g, '');

  let browser = 'Inconnu';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge'; // Check Edge before Chrome
  else if (ua.includes('Chrome') || ua.includes('CriOS')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  
  let os = 'Inconnu';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  
  const isMobile = ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone');
  
  return { browser, os, device: isMobile ? 'Mobile' : 'Desktop' };
};

export default function AuditClient() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();
  const locale = useLocale();

  const getActionLabel = (action: string) => {
    // Basic fallback for common actions to avoid crashing if translation is missing
    const fallbacks: Record<string, string> = {
      'LOGIN_SUCCESS': 'Connexion réussie',
      'LOGIN_FAILED': 'Échec de connexion',
      'REGISTER': 'Inscription'
    };

    try {
      if (!action) return 'Action inconnue';
      const key = `audit_log.actions.${action}`;
      return t(key); 
    } catch (e) {
      if (fallbacks[action]) return fallbacks[action];
      return action;
    }
  };

  const getEntityLabel = (entity: string) => {
    try {
        const key = `audit_log.entities.${entity}`;
        const translated = t(key);
        return translated.includes('audit_log.entities') ? entity : translated;
    } catch {
        return entity;
    }
  };

  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Filtres
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterEntity, setFilterEntity] = useState('');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Modal Détails
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);

  const { logAccessDenied } = useAccessLogger();

  // Redirection si non-admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      logAccessDenied('/admin/audit', `Unauthorized access attempt by ${session.user.email} (Role: ${session.user.role})`);
      router.push('/admin');
    }
  }, [status, session, router, logAccessDenied]);

  const loadLogs = useCallback(async () => {
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      params.set('page', page.toString());
      params.set('limit', '20');
      if (search) params.set('search', search);
      if (filterAction) params.set('action', filterAction);
      if (filterEntity) params.set('entity', filterEntity);

      const res = await fetch(`/api/admin/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.data || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch (error) {
      console.error('Erreur chargement logs:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [page, search, filterAction, filterEntity]);

  useEffect(() => {
    if (session?.user?.role === 'SUPER_ADMIN') {
      loadLogs();
    }
  }, [loadLogs, session]);

  const getActionStyle = (action: string) => {
    if (action === 'LOGIN_SUCCESS') return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-300', icon: CheckCircle };
    if (action === 'LOGIN_FAILED') return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: AlertTriangle };
    if (action === 'REGISTER') return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: User };
    if (action.includes('LOGIN')) return { bg: 'bg-cyan-100 dark:bg-cyan-900/30', text: 'text-cyan-700 dark:text-cyan-300', icon: User };
    if (action.includes('RECLAMATION')) return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', icon: Mail };
    if (action.includes('CREATE')) return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', icon: Database };
    if (action.includes('UPDATE')) return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', icon: RefreshCw };
    if (action.includes('DELETE')) return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', icon: X };
    if (action.includes('BACKUP')) return { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', icon: Server };
    if (action === 'ACCESS_DENIED') return { bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300', icon: AlertOctagon };
    if (action === 'LOGOUT') return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', icon: LogOut };
    return { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', icon: Activity };
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-[#0061e8] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header avec animation */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg shadow-blue-500/20 text-white">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('audit_page.title')}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('audit_page.subtitle')}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={loadLogs}
            disabled={refreshing}
            className="p-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all active:scale-95 shadow-sm disabled:opacity-50 self-start md:self-center"
            title="Rafraîchir"
          >
            <RefreshCw size={20} className={`text-gray-600 dark:text-gray-300 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </motion.div>

        {/* Filtres avec Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4 items-center"
        >
          <div className="flex-1 w-full relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder={t('audit_page.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t('audit_page.search')}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <div className="flex flex-row gap-4 w-full md:w-auto">
            <div className="relative w-full md:w-48">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value)}
                  aria-label={t('audit_page.columns.action')}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="">{t('audit_page.filters.all_actions')}</option>
                  <option value="LOGIN_SUCCESS">{t('audit_log.actions.LOGIN_SUCCESS')}</option>
                  <option value="LOGIN_FAILED">{t('audit_log.actions.LOGIN_FAILED')}</option>
                  <option value="REGISTER">{t('audit_log.actions.REGISTER')}</option>
                  <option value="CREATE_USER">{t('audit_log.actions.CREATE_USER')}</option>
                  <option value="UPDATE_USER">{t('audit_log.actions.UPDATE_USER')}</option>
                  <option value="DELETE_USER">{t('audit_log.actions.DELETE_USER')}</option>
                  <option value="UPDATE_PERMISSIONS">{t('audit_log.actions.UPDATE_PERMISSIONS')}</option>
                  <option value="CREATE_BACKUP">{t('audit_log.actions.CREATE_BACKUP')}</option>
                  <option value="ACCESS_DENIED">{t('audit_log.actions.ACCESS_DENIED')}</option>
                  <option value="LOGOUT">{t('audit_log.actions.LOGOUT')}</option>
                </select>
            </div>
            <div className="relative w-full md:w-48">
                <FileType className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <select
                  value={filterEntity}
                  onChange={(e) => setFilterEntity(e.target.value)}
                  aria-label={t('audit_page.columns.target')}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none appearance-none cursor-pointer"
                >
                  <option value="">{t('audit_page.filters.all_entities')}</option>
                  <option value="User">{t('audit_log.entities.User')}</option>
                  <option value="Reclamation">{t('audit_log.entities.Reclamation')}</option>
                  <option value="System">{t('audit_log.entities.System')}</option>
                  <option value="Route">{t('audit_log.entities.Route') || 'Route'}</option>
                  <option value="Authentication">{t('audit_log.entities.Authentication') || 'Authentication'}</option>
                </select>
            </div>
          </div>
        </motion.div>

        {/* Tableau */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50/50 dark:bg-gray-700/30 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('audit_page.columns.date')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('audit_page.columns.user')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('audit_page.columns.action')}</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('audit_page.columns.target')}</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('audit_page.columns.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <AnimatePresence>
                    {logs.map((log, index) => {
                      const style = getActionStyle(log.action);
                      const Icon = style.icon;
                      
                      return (
                      <motion.tr 
                        key={log.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="hover:bg-blue-50/50 dark:hover:bg-blue-900/10 transition-colors group"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {new Date(log.createdAt).toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric' })}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(log.createdAt).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {log.user ? (
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800 text-blue-700 dark:text-blue-300 flex items-center justify-center font-bold text-xs ring-2 ring-white dark:ring-gray-800">
                                {log.user.prenom?.[0] || ''}{log.user.nom?.[0] || ''}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                  {log.user.prenom} {log.user.nom}
                                </span>
                                <span className="text-xs text-gray-500 dark:text-gray-400">{log.user.email}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 flex items-center justify-center font-bold text-xs">
                                SYS
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-gray-900 dark:text-white">{t('audit_log.modal.system')}</span>
                                <span className="text-xs text-gray-500 italic">-</span>
                              </div>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} border-transparent`}>
                            <Icon size={12} />
                            {getActionLabel(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <div className="p-1.5 rounded-md bg-gray-100 dark:bg-gray-700 text-gray-500">
                                <FileJson size={14} />
                             </div>
                             <div className="flex flex-col">
                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{getEntityLabel(log.entity)}</span>
                                <span className="text-xs text-gray-400">ID: {log.entityId || 'N/A'}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 dark:hover:text-blue-400 rounded-lg transition-all transform hover:scale-105"
                            title={t('audit_page.view_details')}
                            aria-label={t('audit_page.view_details')}
                          >
                            <Eye size={18} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                    })}
                </AnimatePresence>
                
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-3">
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center">
                            <Activity className="w-8 h-8 text-gray-300" />
                        </div>
                        <p className="text-lg font-medium">{t('audit_page.no_logs')}</p>
                        <p className="text-sm text-gray-400">{t('audit_page.modify_filters_hint')}</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/30 dark:bg-gray-800/50">
              <span className="text-sm text-gray-500">
                 Page <span className="font-medium text-gray-900 dark:text-white">{page}</span> sur {totalPages}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label={t('reclamation.actions.prev')}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  aria-label={t('reclamation.actions.next')}
                  className="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal Détails Améliorée */}
      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                        <FileJson size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                            {t('audit_log.modal.title', { id: selectedLog.id })}
                        </h3>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock size={10} />
                            <span dir="ltr">{new Date(selectedLog.createdAt).toLocaleString(locale)}</span>
                        </p>
                    </div>
                </div>
                <button 
                    onClick={() => setSelectedLog(null)} 
                    className="p-2 hover:bg-red-50 hover:text-red-500 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
              {/* Modal Content */}
              <div className="p-0 overflow-y-auto custom-scrollbar">
                
                {/* Métadonnées techniques */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-6 bg-gray-50/30 dark:bg-gray-900/10 border-b border-gray-100 dark:border-gray-700">
                    {(() => {
                        // Smart extraction of IP and UA
                        const rawIP = selectedLog.ipAddress && selectedLog.ipAddress !== 'N/A' 
                            ? selectedLog.ipAddress 
                            : (selectedLog.details as any)?.ip || (selectedLog.details as any)?.ip_address || (selectedLog.details as any)?.remote_ip;
                        const ip = rawIP || t('audit_log.modal.not_available');

                        const rawUA = selectedLog.userAgent && selectedLog.userAgent !== 'N/A'
                            ? selectedLog.userAgent
                            : (selectedLog.details as any)?.user_agent || (selectedLog.details as any)?.userAgent || (selectedLog.details as any)?.ua;
                        
                        const ua = parseUserAgent(rawUA);
                        const browser = ua.browser === 'Inconnu' ? t('audit_log.modal.unknown') : ua.browser;
                        const os = ua.os === 'Inconnu' ? t('audit_log.modal.unknown') : ua.os;

                        return (
                            <>
                                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center h-full">
                                    <div className="p-3 bg-purple-100 dark:bg-purple-900/20 text-purple-600 rounded-full mb-3">
                                        <Globe size={20} />
                                    </div>
                                    <div className="w-full">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            {t('audit_log.modal.ip_address')}
                                        </p>
                                        <p className="text-base font-bold text-gray-900 dark:text-white font-mono break-all" dir="ltr">
                                            {ip}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-sm text-center h-full">
                                    <div className="p-3 bg-pink-100 dark:bg-pink-900/20 text-pink-600 rounded-full mb-3">
                                        {ua.device === 'Mobile' ? <Smartphone size={20} /> : <Monitor size={20} />}
                                    </div>
                                    <div className="w-full">
                                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                                            {t('audit_log.modal.device')}
                                        </p>
                                        <p className="text-sm font-bold text-gray-900 dark:text-white mb-1" dir="ltr">
                                            {browser} <span className="text-gray-300 px-1">/</span> {os}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate w-full px-4" title={rawUA || ''} dir="ltr">
                                            {rawUA ? (rawUA.length > 30 ? rawUA.substring(0, 30) + '...' : rawUA) : t('audit_log.modal.not_available')}
                                        </p>
                                    </div>
                                </div>
                            </>
                        );
                    })()}
                </div>

                {/* Données JSON */}
                <div className="p-6">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
                        <Database size={16} className="text-blue-500" />
                        {t('audit_log.modal.saved_data')}
                    </h4>
                    
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden text-left" dir="ltr">
                        {selectedLog.details && Object.keys(selectedLog.details).length > 0 ? (
                            <div className="p-4 overflow-x-auto text-sm leading-relaxed">
                                <LogDetailsViewer details={selectedLog.details} />
                            </div>
                        ) : (
                            <div className="p-8 text-center text-gray-400 italic" dir="rtl">
                                {t('audit_log.modal.no_details')}
                            </div>
                        )}
                    </div>
                </div>

              </div>
              
              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/80 flex justify-end">
                <button
                    onClick={() => setSelectedLog(null)}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors shadow-sm text-sm font-medium"
                >
                    {t('audit_log.modal.close')}
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
