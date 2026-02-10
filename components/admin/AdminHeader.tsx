'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import {
  Bell,
  Search,
  Moon,
  Sun,
  LogOut,
  User,
  Settings,
  ChevronDown,
  ExternalLink,
  Check
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface Notification {
  id: number;
  titre: string;
  message: string;
  type: string;
  isLue: boolean;
  createdAt: string;
  lien?: string;
}

export default function AdminHeader() {
  const { data: session } = useSession();
  const t = useTranslations('admin.header');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10&unreadOnly=true');
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.count || 0);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (session?.user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', {
        method: 'PATCH',
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch(e) { console.error(e); }
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle('dark');
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('just_now');
    if (diffMins < 60) return t('minutes_ago', { count: diffMins });
    if (diffHours < 24) return t('hours_ago', { count: diffHours });
    return t('days_ago', { count: diffDays });
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b-2 border-[hsl(45,93%,47%)]/30 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_placeholder')}
              className="gov-input pl-10"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 ml-4">
          {/* Link to public site */}
          <Link
            href="/"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-[hsl(213,80%,28%)] hover:bg-[hsl(213,80%,28%)]/10 rounded-lg transition-colors font-medium"
          >
            <ExternalLink size={16} />
            {t('site_public')}
          </Link>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-gray-500 hover:text-[hsl(213,80%,28%)] hover:bg-[hsl(213,80%,28%)]/10 rounded-lg transition-colors"
          >
            {darkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="relative p-2 text-gray-500 hover:text-[hsl(213,80%,28%)] hover:bg-[hsl(213,80%,28%)]/10 rounded-lg transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-[hsl(348,83%,47%)] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 gov-card overflow-hidden"
                style={{ zIndex: 9999 }}
              >
                <div className="px-4 py-2 border-b border-gray-100 bg-gradient-to-r from-[hsl(213,80%,28%)]/5 to-transparent flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900">{t('notifications')} ({unreadCount})</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[hsl(213,80%,28%)] hover:underline flex items-center gap-1">
                      <Check size={12} /> {t('mark_all_read')}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-6 text-center text-gray-500 text-sm">
                      {t('no_notifications')}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <Link 
                        key={notif.id} 
                        href={notif.lien || '#'}
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 hover:bg-[hsl(213,80%,28%)]/5 cursor-pointer border-l-2 border-transparent hover:border-[hsl(45,93%,47%)] transition-colors"
                      >
                        <p className="text-sm font-semibold text-gray-900">{notif.titre}</p>
                        <p className="text-sm text-gray-600 line-clamp-2">{notif.message}</p>
                        <p className="text-xs text-gray-400 mt-1">{formatTime(notif.createdAt)}</p>
                      </Link>
                    ))
                  )}
                </div>
                <div className="px-4 py-2 border-t border-gray-100 bg-gray-50">
                  <Link href="/notifications" className="text-sm text-[hsl(213,80%,28%)] hover:underline font-medium block text-center">
                    {t('view_history')}
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1.5 hover:bg-[hsl(213,80%,28%)]/10 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 bg-[hsl(45,93%,47%)] rounded-full flex items-center justify-center text-gray-900 text-sm font-bold">
                {session?.user?.prenom?.[0] || session?.user?.nom?.[0] || 'A'}
              </div>
              <ChevronDown size={16} className="text-gray-500" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 overflow-hidden">
                {/* Gold top accent */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(213,80%,28%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
                <div className="px-4 py-3 border-b border-gray-100 bg-gray-50 mt-1">
                  <p className="font-semibold text-gray-900">
                    {session?.user?.prenom && session?.user?.nom ? `${session.user.prenom} ${session.user.nom}` : t('administrator')}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {session?.user?.email}
                  </p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-[hsl(213,80%,28%)]/10 text-[hsl(213,80%,28%)] text-xs rounded-full font-medium">
                    {session?.user?.role || 'Admin'}
                  </span>
                </div>
                <Link
                  href="/admin/profil"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[hsl(213,80%,28%)]/10 hover:text-[hsl(213,80%,28%)]"
                >
                  <User size={16} />
                  {t('my_profile')}
                </Link>
                <Link
                  href="/admin/settings"
                  className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-[hsl(213,80%,28%)]/10 hover:text-[hsl(213,80%,28%)]"
                >
                  <Settings size={16} />
                  {t('settings')}
                </Link>
                <hr className="my-2 border-gray-100" />
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-[hsl(348,83%,47%)] hover:bg-[hsl(348,83%,47%)]/10 w-full"
                >
                  <LogOut size={16} />
                  {t('logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click overlay to close menus */}
      {(showUserMenu || showNotifications) && (
        <div
          className="fixed inset-0 z-[-1]"
          onClick={() => {
            setShowUserMenu(false);
            setShowNotifications(false);
          }}
        />
      )}
    </header>
  );
}
