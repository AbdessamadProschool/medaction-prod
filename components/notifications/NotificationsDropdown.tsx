'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
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
  Loader2,
  ClipboardCheck,
  FileCheck,
} from 'lucide-react';

interface Notification {
  id: number;
  type: string;
  titre: string;
  message: string;
  lien: string | null;
  isLue?: boolean;
  isRead?: boolean;
  createdAt: string;
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
  ACTIVITE_A_VALIDER: ClipboardCheck,
  ACTIVITES_A_VALIDER: ClipboardCheck,
  ACTIVITE_VALIDEE: FileCheck,
  ACTIVITE_REJETEE: X,
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
  ACTIVITE_A_VALIDER: 'bg-amber-100 text-amber-600',
  ACTIVITES_A_VALIDER: 'bg-amber-100 text-amber-600',
  ACTIVITE_VALIDEE: 'bg-emerald-100 text-emerald-600',
  ACTIVITE_REJETEE: 'bg-red-100 text-red-600',
  DEFAULT: 'bg-gray-100 text-gray-600',
};

export default function NotificationsDropdown() {
  const t = useTranslations('notifications');
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Charger les notifications
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=10');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || data.data || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  // Charger au montage et rafraîchir périodiquement
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000); // Toutes les 30s
    return () => clearInterval(interval);
  }, []);

  // Fermer au clic extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Marquer comme lue
  const markAsRead = async (id: number) => {
    try {
      await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Marquer toutes comme lues
  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PATCH' });
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  // Check if notification is read (support both isLue and isRead)
  const isNotifRead = (notif: Notification) => notif.isLue || notif.isRead;

  function formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.just_now');
    if (diffMins < 60) return t('time.min_ago', { count: diffMins });
    if (diffHours < 24) return t('time.hour_ago', { count: diffHours });
    if (diffDays < 7) return t('time.day_ago', { count: diffDays });
    return date.toLocaleDateString('ar-MA');
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bouton Bell avec animation */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
          if (!isOpen) fetchNotifications();
        }}
        className="relative p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gov-blue/50"
      >
        <Bell className="w-5 h-5 text-gray-500" />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown avec animation */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-1/2 mt-3 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-visible text-right z-[100]"
            style={{ zIndex: 100, transformOrigin: 'top center' }}
            dir="rtl"
          >
            {/* Arrow/Beak pointing to the bell */}
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-t border-r border-gray-100 dark:border-gray-700 transform -rotate-45 z-[101]" />

            {/* Header */}
            <div className="relative px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 rounded-t-2xl z-[102]">
              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 rounded-xl text-blue-600">
                    <Bell className="w-5 h-5" />
                </div>
                {t('title')}
              </h3>
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold hover:underline"
                  >
                    {t('mark_all_read')}
                  </button>
                )}
                <span className="text-xs font-bold text-white bg-red-500 px-2.5 py-1 rounded-full shadow-sm shadow-red-200">
                  {unreadCount}
                </span>
              </div>
            </div>

            {/* Liste */}
            <div className="max-h-[28rem] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-100">
              {loading ? (
                <div className="py-12 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="py-16 text-center">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring" }}
                    className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4"
                  >
                    <Bell className="w-8 h-8 text-gray-300" />
                  </motion.div>
                  <p className="text-gray-900 text-sm font-bold">{t('empty')}</p>
                  <p className="text-gray-500 text-xs mt-1">{t('empty_desc')}</p>
                </div>
              ) : (
                notifications.map((notif, index) => {
                  const Icon = TYPE_ICONS[notif.type] || TYPE_ICONS.DEFAULT;
                  const colors = TYPE_COLORS[notif.type] || TYPE_COLORS.DEFAULT;
                  const isRead = isNotifRead(notif);

                  return (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`relative group px-5 py-4 border-b border-gray-50 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all cursor-pointer ${
                        !isRead ? 'bg-blue-50/40 dark:bg-blue-900/10' : ''
                      }`}
                    >
                      {!isRead && (
                          <div className="absolute top-4 right-2 w-1.5 h-1.5 rounded-full bg-red-500 shadow-sm" />
                      )}
                      
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${colors} flex items-center justify-center flex-shrink-0 shadow-sm mt-1`}>
                          <Icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1.5">
                          <p className={`text-sm ${isRead ? 'font-semibold text-gray-700' : 'font-bold text-gray-900'} dark:text-white leading-snug`}>
                            {notif.titre}
                          </p>
                          <p className="text-xs text-gray-500 leading-relaxed line-clamp-2" dir="auto">
                            {notif.message}
                          </p>
                          
                          <div className="flex items-center justify-between pt-2">
                            <span className="text-[10px] text-gray-400 font-medium bg-gray-100 px-2 py-0.5 rounded-md">
                              {formatTimeAgo(notif.createdAt)}
                            </span>
                            
                            <div className="flex items-center gap-2">
                              {notif.lien && (
                                <Link
                                  href={notif.lien}
                                  onClick={() => {
                                    markAsRead(notif.id);
                                    setIsOpen(false);
                                  }}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-transparent hover:border-blue-100 bg-blue-50/50"
                                  title={t('view')}
                                >
                                  <ExternalLink size={14} className="transform rotate-180" />
                                </Link>
                              )}
                              <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    markAsRead(notif.id);
                                }}
                                className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100 bg-emerald-50/50"
                                title="Marquer comme lu"
                              >
                                <Check size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
              <Link
                href="/notifications"
                onClick={() => setIsOpen(false)}
                className="block text-center text-sm text-blue-600 hover:text-blue-700 font-bold transition-colors flex items-center justify-center gap-2"
              >
                {t('view_all')}
                <span className="text-lg">←</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
