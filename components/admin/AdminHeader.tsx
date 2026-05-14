'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
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
    <header className="sticky top-0 z-20 bg-card/80 backdrop-blur-md border-b-2 border-[hsl(var(--gov-gold)/0.3)] px-4 sm:px-6 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Search */}
        <div className="flex-1 max-w-lg">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors" />
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
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-sm text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue)/0.1)] rounded-lg transition-all font-bold"
          >
            <ExternalLink size={16} />
            {t('site_public')}
          </Link>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue)/0.1)] rounded-lg transition-colors"
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
              className="relative p-2 text-muted-foreground hover:text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-blue)/0.1)] rounded-lg transition-colors"
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-[hsl(var(--gov-red))] text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse shadow-sm">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div 
                className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-2xl border border-border py-0 gov-card overflow-hidden z-[9999]"
              >
                <div className="px-4 py-3 border-b border-border bg-gradient-to-r from-[hsl(var(--gov-blue))/0.05] to-transparent flex justify-between items-center">
                  <h3 className="font-bold text-foreground">{t('notifications')} ({unreadCount})</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-[hsl(var(--gov-blue))] hover:underline flex items-center gap-1 font-semibold">
                      <Check size={12} /> {t('mark_all_read')}
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-muted-foreground text-sm flex flex-col items-center gap-2">
                      <Bell className="w-8 h-8 opacity-20" />
                      {t('no_notifications')}
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <Link 
                        key={notif.id} 
                        href={notif.lien || '#'}
                        onClick={() => setShowNotifications(false)}
                        className="block px-4 py-3 hover:bg-[hsl(var(--gov-blue))/0.05] cursor-pointer border-l-4 border-transparent hover:border-[hsl(var(--gov-gold))] transition-all"
                      >
                        <p className="text-sm font-bold text-foreground">{notif.titre}</p>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                        <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wider font-bold mt-1.5">{formatTime(notif.createdAt)}</p>
                      </Link>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-border bg-muted/30">
                  <Link href="/notifications" className="text-sm text-[hsl(var(--gov-blue))] hover:underline font-bold block text-center">
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
              <div className="absolute right-0 mt-2 w-64 bg-card rounded-xl shadow-2xl border border-border py-0 overflow-hidden z-[9999]">
                {/* Gold top accent */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[hsl(var(--gov-blue))] via-[hsl(var(--gov-gold))] to-[hsl(var(--gov-green))]" />
                <div className="px-4 py-4 border-b border-border bg-muted/30 mt-1.5">
                  <p className="font-bold text-foreground text-base">
                    {session?.user?.prenom && session?.user?.nom ? `${session.user.prenom} ${session.user.nom}` : t('administrator')}
                  </p>
                  <p className="text-xs text-muted-foreground truncate font-medium">
                    {session?.user?.email}
                  </p>
                  <div className="mt-2.5">
                    <span className="px-2.5 py-1 bg-[hsl(var(--gov-blue)/0.1)] text-[hsl(var(--gov-blue))] text-[10px] uppercase tracking-wider rounded-full font-bold border border-[hsl(var(--gov-blue)/0.2)]">
                      {session?.user?.role || 'Admin'}
                    </span>
                  </div>
                </div>
                <div className="py-1">
                  <Link
                    href="/admin/profil"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-[hsl(var(--gov-blue)/0.05)] hover:text-[hsl(var(--gov-blue))] transition-colors font-medium"
                  >
                    <User size={18} className="text-muted-foreground" />
                    {t('my_profile')}
                  </Link>
                  <Link
                    href="/admin/settings"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-[hsl(var(--gov-blue)/0.05)] hover:text-[hsl(var(--gov-blue))] transition-colors font-medium"
                  >
                    <Settings size={18} className="text-muted-foreground" />
                    {t('settings')}
                  </Link>
                </div>
                <div className="p-1 border-t border-border bg-muted/10">
                  <button
                    onClick={() => signOut({ callbackUrl: window.location.origin + '/' })}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[hsl(var(--gov-red))] hover:bg-[hsl(var(--gov-red)/0.05)] w-full rounded-lg transition-colors font-bold"
                  >
                    <LogOut size={18} />
                    {t('logout')}
                  </button>
                </div>
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
