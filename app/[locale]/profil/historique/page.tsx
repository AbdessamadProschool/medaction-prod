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
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
              <Link href="/profil" className={`inline-flex items-center gap-2 text-gray-500 hover:text-gov-blue font-medium mb-6 transition-colors ${locale === 'ar' ? 'flex-row-reverse' : ''}`}>
                <ArrowLeft size={18} className={locale === 'ar' ? 'rotate-180' : ''} />
                {t('security_page.back_profile', { fallback: 'Retour au profil' })}
              </Link>
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gov-blue text-white rounded-2xl shadow-lg shadow-blue-900/20">
                  <History className="w-8 h-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('system.my_history', { fallback: 'Mon Historique' })}</h1>
                  <p className="text-gray-500 mt-1 font-medium">{t('audit_page.total_entries', { count: total, fallback: `${total} actions enregistrées` })}</p>
                </div>
              </div>
          </div>
          <div className="bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-sm font-bold text-gray-700">Traçabilité Active</span>
          </div>
        </div>

        {/* Historique Timeline */}
        <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden relative">
          {logs.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                 <History className="w-10 h-10 text-gray-300" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Aucune activité récente</h3>
              <p className="text-gray-500 font-medium max-w-sm mx-auto">{t('audit_page.no_logs', { fallback: 'Votre historique de navigation et d\'actions apparaîtra ici de manière chronologique.' })}</p>
            </div>
          ) : (
            <div className="p-8 relative">
              {/* Ligne verticale de la timeline */}
              <div className={`absolute top-8 bottom-8 w-0.5 bg-gray-100 ${locale === 'ar' ? 'right-[51px]' : 'left-[51px]'}`}></div>
              
              <ul className="space-y-8 relative">
                {logs.map((log, index) => {
                  const style = getActionStyle(log.action);
                  const Icon = style.icon;
                  return (
                    <li key={log.id} className="relative flex items-start gap-6 group">
                      {/* Icône sur la timeline */}
                      <div className={`relative z-10 p-2.5 rounded-full border-4 border-white shrink-0 shadow-sm transition-transform group-hover:scale-110 ${style.color.replace('border-', 'bg-').split(' ')[0]} ${style.color.split(' ')[1]}`}>
                        <Icon size={18} className="text-current" />
                      </div>
                      
                      {/* Carte de contenu */}
                      <div className="flex-1 min-w-0 bg-gray-50 rounded-2xl p-5 border border-gray-100 transition-all hover:bg-white hover:shadow-md hover:border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                          <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                            {t(`audit_page.actions.${log.action}`, { fallback: log.action })}
                            {!log.success && (
                               <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] uppercase tracking-widest rounded-full">Échec</span>
                            )}
                          </h3>
                          <span className="text-xs text-gray-500 font-mono font-medium flex items-center gap-1.5 bg-white px-2 py-1 rounded-lg border border-gray-100 shadow-sm">
                            <Clock size={12} className="text-gray-400" />
                            {formatDate(log.createdAt)}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 mb-3">
                            <span className="text-sm font-bold text-gov-blue">
                              {t(`audit_page.entities.${log.resourceType}`, { fallback: log.resourceType || 'Système' })}
                            </span>
                            {log.resourceId && (
                                <span className="text-xs font-mono bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded font-bold">
                                  #{log.resourceId}
                                </span>
                            )}
                        </div>

                        {log.details && (
                          <div className="mt-4 border-t border-gray-200 pt-3">
                              <p className="text-[10px] uppercase tracking-widest text-gray-400 font-black mb-2">Détails Techniques</p>
                              <div className="text-xs text-gray-600 bg-gray-100/50 p-3 rounded-xl border border-gray-200 font-mono overflow-x-auto">
                                 {(() => {
                                   try {
                                       const parsed = JSON.parse(log.details);
                                       return (
                                          <pre className="whitespace-pre-wrap">
                                              {JSON.stringify(parsed, null, 2)}
                                          </pre>
                                       );
                                   } catch {
                                       return log.details;
                                   }
                                 })()}
                              </div>
                          </div>
                        )}
                        
                        {/* Affichage IP (si disponible) */}
                        {log.ipAddress && (
                            <div className="mt-3 flex items-center gap-2 text-[10px] text-gray-400 font-mono font-medium">
                                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                                IP: {log.ipAddress}
                            </div>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
              <span className="text-sm font-bold text-gray-500">
                {t('pagination.page_info', { page, total: totalPages, fallback: `Page ${page} sur ${totalPages}` })}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gov-blue hover:border-gov-blue hover:shadow-sm disabled:opacity-50 transition-all"
                >
                  <ChevronLeft size={20} className={locale === 'ar' ? 'rotate-180' : ''} />
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gov-blue hover:border-gov-blue hover:shadow-sm disabled:opacity-50 transition-all"
                >
                  <ChevronRight size={20} className={locale === 'ar' ? 'rotate-180' : ''} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
