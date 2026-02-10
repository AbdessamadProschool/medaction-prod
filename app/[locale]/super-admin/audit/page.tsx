'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
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
  Calendar
} from 'lucide-react';

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

export default function AuditPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const t = useTranslations();

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

  // Redirection si non-admin
  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role !== 'SUPER_ADMIN') {
      router.push('/admin');
    }
  }, [status, session, router]);

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

  const getActionColor = (action: string) => {
    if (action.includes('LOGIN')) return 'bg-cyan-100 text-cyan-700';
    if (action.includes('CREATE')) return 'bg-emerald-100 text-emerald-700';
    if (action.includes('UPDATE')) return 'bg-amber-100 text-amber-700';
    if (action.includes('DELETE')) return 'bg-red-100 text-red-700';
    if (action.includes('BACKUP')) return 'bg-purple-100 text-purple-700';
    return 'bg-gray-100 text-gray-700';
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="w-6 h-6 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('audit_page.title')}</h1>
            </div>
            <p className="text-gray-500">{t('audit_page.subtitle')}</p>
          </div>
          
          <button
            onClick={loadLogs}
            disabled={refreshing}
            className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 self-start md:self-center"
          >
            <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={t('audit_page.search_placeholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('audit_page.filters.all_actions')}</option>
              <option value="LOGIN">Connexions</option>
              <option value="CREATE_USER">Création User</option>
              <option value="UPDATE_USER">Modif. User</option>
              <option value="DELETE_USER">Suppr. User</option>
              <option value="UPDATE_PERMISSIONS">Permissions</option>
              <option value="CREATE_BACKUP">Backups</option>
            </select>
          </div>
          <div className="w-full md:w-48">
            <select
              value={filterEntity}
              onChange={(e) => setFilterEntity(e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t('audit_page.filters.all_entities')}</option>
              <option value="User">Utilisateurs</option>
              <option value="Reclamation">Réclamations</option>
              <option value="System">Système</option>
            </select>
          </div>
        </div>

        {/* Tableau */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 uppercase font-medium">
                <tr>
                  <th className="px-6 py-3 text-left">{t('audit_page.columns.date')}</th>
                  <th className="px-6 py-3 text-left">{t('audit_page.columns.user')}</th>
                  <th className="px-6 py-3 text-left">{t('audit_page.columns.action')}</th>
                  <th className="px-6 py-3 text-left">{t('audit_page.columns.target')}</th>
                  <th className="px-6 py-3 text-right">{t('audit_page.columns.details')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td className="px-6 py-4 text-sm text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        {new Date(log.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                        <Clock size={12} />
                        {new Date(log.createdAt).toLocaleTimeString('fr-FR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {log.user ? (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {log.user.prenom?.[0] || '?'}{log.user.nom?.[0] || '?'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {log.user.prenom} {log.user.nom}
                            </p>
                            <p className="text-xs text-gray-500">{log.user.email}</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold text-xs">
                            SYS
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              Système / Inconnu
                            </p>
                            <p className="text-xs text-gray-500">-</p>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {log.entity} #{log.entityId || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {log.details && (
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Voir les détails"
                        >
                          <Eye size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
                
                {logs.length === 0 && !loading && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      <Activity className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                      <p>Aucune activité enregistrée pour le moment</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-700">
              <p className="text-sm text-gray-500">
                Page {page} sur {totalPages} ({total} entrées)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Détails JSON */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Détails de l'activité
              </h3>
              <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto font-mono text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
              
              <div className="mt-6 grid grid-cols-2 gap-4 text-sm text-gray-500">
                <div>
                  <span className="block font-medium text-gray-900 dark:text-white">IP Address</span>
                  {selectedLog.ipAddress || 'N/A'}
                </div>
                <div>
                  <span className="block font-medium text-gray-900 dark:text-white">User Agent</span>
                  <span className="line-clamp-2" title={selectedLog.userAgent || ''}>
                    {selectedLog.userAgent || 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
