'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';
import {
  History,
  Clock,
  ArrowLeft,
  Loader2,
  FileText,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Edit,
  Trash2,
  PlusCircle,
  Database
} from 'lucide-react';
import { useData } from '@/hooks/use-data';

interface AuditLog {
  id: number;
  action: string;
  resourceType: string | null;
  resourceId: string | null;
  details: string | null;
  createdAt: string;
  ipAddress: string | null;
  success: boolean;
}

const ACTION_STYLES: Record<string, { icon: React.ElementType, color: string }> = {
  'CREATE': { icon: PlusCircle, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  'UPDATE': { icon: Edit, color: 'bg-blue-100 text-blue-700 border-blue-200' },
  'DELETE': { icon: Trash2, color: 'bg-red-100 text-red-700 border-red-200' },
  'LOGIN': { icon: ShieldAlert, color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  'LOGOUT': { icon: ShieldAlert, color: 'bg-gray-100 text-gray-700 border-gray-200' },
  'CLOTURE': { icon: Database, color: 'bg-slate-100 text-slate-700 border-slate-200' }
};

export default function UserHistoriquePage() {
  const t = useTranslations();
  const locale = useLocale();
  const { data: session, status } = useSession();
  const router = useRouter();

  const [page, setPage] = useState(1);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, router]);

  const endpoint = session?.user ? `/api/users/me/historique?page=${page}&limit=20` : null;
  const { data, isLoading } = useData(endpoint);

  const logs: AuditLog[] = data?.data || [];
  const totalPages = data?.pagination?.totalPages || 1;
  const total = data?.pagination?.total || 0;

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getActionStyle = (action: string) => {
    const key = Object.keys(ACTION_STYLES).find(k => action.toUpperCase().includes(k));
    return key ? ACTION_STYLES[key] : { icon: FileText, color: 'bg-gray-100 text-gray-700 border-gray-200' };
  };

  if (status === 'loading' || (isLoading && !data)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 text-gov-blue animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className={`min-h-screen bg-gray-50 py-8 px-4 ${locale === 'ar' ? 'font-cairo' : ''}`} dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/profil" className={`inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
            <ArrowLeft size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
            {t('security_page.back_profile', { fallback: 'Retour au profil' })}
          </Link>
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gov-blue text-white rounded-none shadow-sm">
              <History className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('system.my_history', { fallback: 'Mon Historique' })}</h1>
              <p className="text-gray-500">{t('audit_page.total_entries', { count: total, fallback: `${total} actions enregistrées` })}</p>
            </div>
          </div>
        </div>

        {/* Historique Timeline */}
        <div className="bg-white rounded-none shadow-sm border border-gray-200 overflow-hidden">
          {logs.length === 0 ? (
            <div className="text-center py-16">
              <History className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">{t('audit_page.no_logs', { fallback: 'Aucun historique trouvé' })}</p>
            </div>
          ) : (
            <div className="p-0">
              <ul className="divide-y divide-gray-100">
                {logs.map((log) => {
                  const style = getActionStyle(log.action);
                  const Icon = style.icon;
                  return (
                    <li key={log.id} className="p-6 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className={`p-2 rounded-none border ${style.color} shrink-0 mt-1`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-4 mb-1">
                            <h3 className="text-sm font-bold text-gray-900">
                              {t(`audit_page.actions.${log.action}`, { fallback: log.action })}
                            </h3>
                            <span className="text-xs text-gray-500 font-mono whitespace-nowrap flex items-center gap-1.5">
                              <Clock size={12} />
                              {formatDate(log.createdAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            {t(`audit_page.entities.${log.resourceType}`, { fallback: log.resourceType || 'Système' })} 
                            {log.resourceId && <span className="text-gray-400 font-mono ms-1">#{log.resourceId}</span>}
                          </p>
                          {log.details && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border border-gray-100 font-mono mt-2 overflow-x-auto">
                               {(() => {
                                 try {
                                     const parsed = JSON.parse(log.details);
                                     return JSON.stringify(parsed, null, 2);
                                 } catch {
                                     return log.details;
                                 }
                               })()}
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-sm text-gray-500">
                {t('pagination.page_info', { page, total: totalPages, fallback: `Page ${page} sur ${totalPages}` })}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white border border-gray-200 rounded text-gray-600 hover:text-gov-blue hover:border-gov-blue disabled:opacity-50"
                >
                  <ChevronLeft size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white border border-gray-200 rounded text-gray-600 hover:text-gov-blue hover:border-gov-blue disabled:opacity-50"
                >
                  <ChevronRight size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
