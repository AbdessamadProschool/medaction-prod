'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Bell,
  Check,
  CheckCheck,
  X,
  MessageSquare,
  Calendar,
  AlertTriangle,
  UserCheck,
  Shield,
  ExternalLink,
  Trash2,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations, useLocale } from 'next-intl';

interface Notification {
  id: number;
  type: string;
  titre: string;
  message: string;
  lien: string | null;
  isLue: boolean;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  NOUVELLE_RECLAMATION: MessageSquare,
  RECLAMATION_ACCEPTEE: Check,
  RECLAMATION_REJETEE: X,
  RECLAMATION_AFFECTEE: AlertTriangle,
  RECLAMATION_RESOLUE: CheckCheck,
  EVENEMENT_VALIDE: Calendar,
  EVENEMENT_REJETE: X,
  NOUVEL_EVENEMENT: Calendar,
  ROLE_CHANGED: Shield,
  ACCOUNT_ACTIVATED: UserCheck,
  DEFAULT: Bell,
};

const TYPE_COLORS: Record<string, string> = {
  NOUVELLE_RECLAMATION: 'bg-blue-100 text-blue-600',
  RECLAMATION_ACCEPTEE: 'bg-green-100 text-green-600',
  RECLAMATION_REJETEE: 'bg-red-100 text-red-600',
  RECLAMATION_AFFECTEE: 'bg-orange-100 text-orange-600',
  RECLAMATION_RESOLUE: 'bg-emerald-100 text-emerald-600',
  EVENEMENT_VALIDE: 'bg-purple-100 text-purple-600',
  EVENEMENT_REJETE: 'bg-red-100 text-red-600',
  NOUVEL_EVENEMENT: 'bg-purple-100 text-purple-600',
  ROLE_CHANGED: 'bg-indigo-100 text-indigo-600',
  ACCOUNT_ACTIVATED: 'bg-green-100 text-green-600',
  DEFAULT: 'bg-gray-100 text-gray-600',
};

// TYPE_LABELS removed in favor of translations

const getFormatDate = (dateString: string, t: any, locale: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return t('notifications_page.time.just_now');
  if (diffMins < 60) return t('notifications_page.time.minutes_ago', { count: diffMins });
  if (diffHours < 24) return t('notifications_page.time.hours_ago', { count: diffHours });
  if (diffDays < 7) return t('notifications_page.time.days_ago', { count: diffDays });
  
  return date.toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
};

export default function NotificationsPage() {
  const t = useTranslations();
  const locale = useLocale();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        unreadOnly: (filter === 'unread').toString(),
      });

      const res = await fetch(`/api/notifications?${params}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications);
        setUnreadCount(data.unreadCount);
        setPagination(prev => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, isLue: true } : n))
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications(prev => prev.map(n => ({ ...n, isLue: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const deleteRead = async () => {
    if (!confirm(t('notifications_page.confirm_delete'))) return;
    try {
      await fetch('/api/notifications', { method: 'DELETE' });
      fetchNotifications();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
           <div>
             <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('notifications_page.title')}</h1>
             <p className="text-gray-500 mt-1">
               {unreadCount > 0 ? t('notifications_page.unread_count', { count: unreadCount }) : t('notifications_page.all_read')}
             </p>
           </div>
           <div className="flex items-center gap-3">
             <button
               onClick={() => fetchNotifications()}
               className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
             >
               <RefreshCw size={20} />
             </button>
             {unreadCount > 0 && (
               <button
                 onClick={markAllAsRead}
                 className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
               >
                 <CheckCheck size={18} />
                 {t('notifications_page.mark_all_read')}
               </button>
             )}
             <button
               onClick={deleteRead}
               className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
             >
               <Trash2 size={18} />
               {t('notifications_page.delete_read')}
             </button>
          </div>
        </div>

        {/* Filtres */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-4">
            <Filter size={18} className="text-gray-400" />
            <button
              onClick={() => { setFilter('all'); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('notifications_page.filter_all', { count: pagination.total })}
            </button>
            <button
              onClick={() => { setFilter('unread'); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {t('notifications_page.filter_unread', { count: unreadCount })}
            </button>
          </div>
        </div>

        {/* Liste */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          {loading ? (
            <div className="py-12 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center">
              <Bell className="w-16 h-16 text-gray-200 mx-auto mb-4" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                {t('notifications_page.empty_title')}
              </h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? t('notifications_page.empty_unread')
                  : t('notifications_page.empty_all')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notif) => {
                const Icon = TYPE_ICONS[notif.type] || TYPE_ICONS.DEFAULT;
                const colors = TYPE_COLORS[notif.type] || TYPE_COLORS.DEFAULT;
                
                // Get type translation safely
                let typeLabel = notif.type;
                try {
                    typeLabel = t(`notifications_page.types.${notif.type}`);
                    // Fallback if key equals value (next-intl default behavior for missing keys)
                    if (typeLabel === `notifications_page.types.${notif.type}`) {
                        typeLabel = notif.type;
                    }
                } catch {
                    typeLabel = notif.type;
                }

                return (
                  <div
                    key={notif.id}
                    className={`p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                      !notif.isLue ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl ${colors} flex items-center justify-center flex-shrink-0`}>
                        <Icon size={22} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {notif.titre}
                              </h3>
                              {!notif.isLue && (
                                <span className="w-2 h-2 bg-emerald-500 rounded-full" />
                              )}
                            </div>
                            {/* <p className="text-sm text-gray-600 dark:text-gray-300">
                              {notif.message}
                            </p> */}{/* Masqué selon demande utilisateur */}
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-xs text-gray-400">
                                {getFormatDate(notif.createdAt, t, locale)}
                              </span>
                              <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                {typeLabel}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {notif.lien && (
                              <Link
                                href={notif.lien}
                                onClick={() => !notif.isLue && markAsRead(notif.id)}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                title={t('notifications_page.actions.view')}
                              >
                                <ExternalLink size={18} />
                              </Link>
                            )}
                            {!notif.isLue && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title={t('notifications_page.actions.mark_read')}
                              >
                                <Check size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/30 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                {t('notifications_page.page_info', { current: pagination.page, total: pagination.totalPages })}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                  disabled={pagination.page === 1}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
