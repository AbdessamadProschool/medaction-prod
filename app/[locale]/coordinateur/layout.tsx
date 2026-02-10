'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  Calendar, 
  Home, 
  Building2, 
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronLeft,
  User,
  Settings,
  FileText,
  Globe,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import { useTranslations, useLocale } from 'next-intl';

export default function CoordinateurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('coordinator.navigation');
  const tApp = useTranslations('app');
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Get current path without locale prefix for language switching
  const currentPath = pathname.replace(/^\/(ar|fr)/, '');

  // Navigation Items
  const navigation = [
    { name: t('dashboard'), href: '/coordinateur', icon: Home, description: t('dashboard_desc') },
    { name: t('calendar'), href: '/coordinateur/calendrier', icon: Calendar, description: t('calendar_desc') },
    { name: t('establishments'), href: '/coordinateur/etablissements', icon: Building2, description: t('establishments_desc') },
    { name: t('reports'), href: '/coordinateur/rapports', icon: FileText, description: t('reports_desc') },
  ];

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login');
    } else if (status === 'authenticated' && session?.user?.role !== 'COORDINATEUR_ACTIVITES') {
        router.push('/');
    }
  }, [status, session, router]);

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (status !== 'authenticated' || session?.user?.role !== 'COORDINATEUR_ACTIVITES') {
    return null;
  }

  const isActive = (href: string) => {
    if (href === '/coordinateur') {
      return pathname === '/coordinateur';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className="min-h-screen bg-gray-50 text-right" dir="rtl">
      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar - Positioned on Right for RTL */}
      <aside 
        className={`
          fixed top-0 z-50 h-full w-72 bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-900 transform transition-transform duration-300 ease-out shadow-2xl
          lg:translate-x-0
          ${sidebarOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
        style={{ right: 0, left: 'auto' }}
      >
        {/* Decorative top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-blue-500 to-amber-400" />
        
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6 border-b border-white/10">
            <Link href="/coordinateur" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-lg overflow-hidden shrink-0">
                <img
                  src="/images/logo-portal-mediouna.png"
                  alt="Portail Mediouna"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div className="min-w-0">
                <span className="text-white font-bold text-lg block truncate">{tApp('name')}</span>
                <p className="text-amber-400 text-xs font-medium truncate">{t('dashboard')}</p>
              </div>
            </Link>
            <button 
              className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5 backdrop-blur-sm">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold shadow-lg">
                {session.user?.prenom?.[0]}{session.user?.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-bold text-sm truncate">
                  {session.user?.prenom} {session.user?.nom}
                </p>
                <p className="text-blue-200 text-xs truncate opacity-80">{session.user?.email}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-2 space-y-2 overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {navigation.map((item) => {
              const active = isActive(item.href);
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-start gap-4 px-4 py-3 rounded-2xl transition-all duration-200 group relative overflow-hidden ${
                    active
                      ? 'bg-white text-blue-900 shadow-xl shadow-black/10'
                      : 'text-blue-100 hover:bg-white/10'
                  }`}
                >
                  <item.icon className={`w-5 h-5 mt-0.5 shrink-0 ${active ? 'text-amber-500' : 'text-blue-300 group-hover:text-white'}`} />
                  <div className="flex-1 relative z-10">
                    <span className={`font-bold block ${active ? 'text-blue-900' : ''}`}>{item.name}</span>
                    <span className={`text-xs block mt-0.5 ${active ? 'text-blue-600' : 'text-blue-300/70 group-hover:text-blue-200'}`}>
                      {item.description}
                    </span>
                  </div>
                  {active && <ChevronLeft className="w-4 h-4 mt-1 text-amber-500" />}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section */}
          <div className="p-4 mt-auto border-t border-white/10 bg-black/10">
             <div className="space-y-1">
                {/* Language Switcher */}
                <Link
                  href={`/${locale === 'ar' ? 'fr' : 'ar'}${currentPath}`}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
                >
                  <Globe className="w-4 h-4" />
                  <span>{locale === 'ar' ? 'Français' : 'العربية'}</span>
                </Link>
                <Link
                href="/profil"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
                >
                <Settings className="w-4 h-4" />
                <span>{t('profile')}</span>
                </Link>
                <Link
                href="/"
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-blue-200 hover:text-white hover:bg-white/5 transition-all font-medium text-sm"
                >
                <Home className="w-4 h-4" />
                <span>{t('home_access')}</span>
                </Link>
                <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="flex items-center gap-3 w-full px-4 py-3 text-red-300 hover:text-white hover:bg-red-500/20 rounded-xl transition-all font-medium text-sm mt-2"
                >
                <LogOut className="w-4 h-4" />
                <span>{t('logout')}</span>
                </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div 
        className="transition-all duration-300 lg:w-[calc(100%-18rem)] lg:mr-[18rem] mr-0"
        style={{ marginRight: '18rem', paddingRight: 0 }} // Force space on right
      >
        {/* Top header */}
        <header className="sticky top-0 z-30 h-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-4 lg:px-8 shadow-sm">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden text-gray-500 hover:bg-gray-100 p-2.5 rounded-xl transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Breadcrumb - RTL optimized */}
            <div className="hidden sm:flex items-center gap-2 text-sm font-medium">
               <span className="text-gray-400">/</span>
               <span className={`${pathname === '/coordinateur' ? 'text-blue-600 font-bold' : 'text-gray-600'}`}>
                  {t('dashboard')}
               </span>
               {pathname !== '/coordinateur' && (
                 <>
                   <span className="text-gray-400">/</span>
                   <span className="text-blue-600 font-bold">
                    {navigation.find(n => pathname.startsWith(n.href) && n.href !== '/coordinateur')?.name || 'Page'}
                   </span>
                 </>
               )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <NotificationsDropdown />

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-200"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {session.user?.prenom?.[0]}{session.user?.nom?.[0]}
                </div>
                <div className="hidden md:block text-right">
                    <span className="block text-sm font-bold text-gray-900 leading-none mb-1">{session.user?.prenom}</span>
                    <span className="block text-xs text-gray-500">{t('dashboard')}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {userMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40"
                      onClick={() => setUserMenuOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, x: '-50%' }}
                      animate={{ opacity: 1, scale: 1, x: '-50%' }}
                      exit={{ opacity: 0, scale: 0.95, x: '-50%' }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                      className="absolute left-1/2 mt-3 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-visible z-[100]"
                      style={{ zIndex: 100, transformOrigin: 'top center' }}
                    >
                      {/* Arrow/Beak */}
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white dark:bg-gray-800 border-t border-r border-gray-100 dark:border-gray-700 transform -rotate-45 z-[101]" />

                      <div className="relative z-[102] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-700/50">
                          <p className="font-bold text-gray-900 dark:text-white text-right">
                            {session.user?.prenom} {session.user?.nom}
                          </p>
                          <p className="text-xs text-gray-500 font-medium truncate mt-0.5 text-right">{session.user?.email}</p>
                        </div>
                        
                        <div className="p-2">
                          <Link
                              href="/profil"
                              className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-700 dark:hover:text-blue-400 rounded-xl transition-colors text-right"
                              dir="rtl"
                          >
                              <User className="w-4 h-4" />
                              <span className="flex-1">{t('profile')}</span>
                          </Link>
                          <button
                              onClick={() => signOut({ callbackUrl: '/login' })}
                              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors mt-1 text-right"
                              dir="rtl"
                          >
                              <LogOut className="w-4 h-4" />
                              <span className="flex-1">{t('logout')}</span>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-8 max-w-[1600px] mx-auto animate-in fade-in duration-500">
          {children}
        </main>
      </div>
    </div>
  );
}
