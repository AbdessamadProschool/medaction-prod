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
import Link from 'next/link';

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

const TYPE_LABELS: Record<string, string> = {
  NOUVELLE_RECLAMATION: 'Nouvelle réclamation',
  RECLAMATION_ACCEPTEE: 'Réclamation acceptée',
  RECLAMATION_REJETEE: 'Réclamation rejetée',
  RECLAMATION_AFFECTEE: 'Réclamation affectée',
  RECLAMATION_RESOLUE: 'Réclamation résolue',
  EVENEMENT_VALIDE: 'Événement validé',
  EVENEMENT_REJETE: 'Événement rejeté',
  NOUVEL_EVENEMENT: 'Nouvel événement',
  ROLE_CHANGED: 'Rôle modifié',
  ACCOUNT_ACTIVATED: 'Compte activé',
  SYSTEM: 'Système',
};

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  
  return date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export default function NotificationsPage() {
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
    if (!confirm('Supprimer toutes les notifications lues ?')) return;
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
            <p className="text-gray-500 mt-1">
              {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Toutes lues'}
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
                Tout marquer lu
              </button>
            )}
            <button
              onClick={deleteRead}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={18} />
              Supprimer lues
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
              Toutes ({pagination.total})
            </button>
            <button
              onClick={() => { setFilter('unread'); setPagination(p => ({ ...p, page: 1 })); }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Non lues ({unreadCount})
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
                Aucune notification
              </h3>
              <p className="text-gray-500">
                {filter === 'unread'
                  ? 'Vous avez lu toutes vos notifications.'
                  : 'Vous n\'avez pas encore de notifications.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {notifications.map((notif) => {
                const Icon = TYPE_ICONS[notif.type] || TYPE_ICONS.DEFAULT;
                const colors = TYPE_COLORS[notif.type] || TYPE_COLORS.DEFAULT;
                const typeLabel = TYPE_LABELS[notif.type] || notif.type;

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
                                {formatDate(notif.createdAt)}
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
                                title="Voir"
                              >
                                <ExternalLink size={18} />
                              </Link>
                            )}
                            {!notif.isLue && (
                              <button
                                onClick={() => markAsRead(notif.id)}
                                className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title="Marquer comme lu"
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
                Page {pagination.page} sur {pagination.totalPages}
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
