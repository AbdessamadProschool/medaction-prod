'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Calendar,
  Newspaper,
  FileText,
  Megaphone,
  BarChart3,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { signOut } from 'next-auth/react';

export default function DelegationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations('delegation');
  const tCommon = useTranslations('nav'); // For generic text like Logout
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Get current path without locale prefix for language switching
  const currentPath = pathname.replace(/^\/(ar|fr)/, '');

  // Configuration des secteurs
  const SECTEUR_CONFIG: Record<string, { label: string; icon: string; color: string }> = {
    SANTE: { label: t('sectors.health'), icon: '🏥', color: 'hsl(348,83%,47%)' },
    EDUCATION: { label: t('sectors.education'), icon: '🎓', color: 'hsl(213,80%,28%)' },
    SPORT: { label: t('sectors.sport'), icon: '⚽', color: 'hsl(145,63%,32%)' },
    CULTURE: { label: t('sectors.culture'), icon: '🎭', color: 'hsl(280,60%,50%)' },
    JEUNESSE: { label: t('sectors.youth'), icon: '👥', color: 'hsl(45,93%,47%)' },
    SOCIAL: { label: t('sectors.social'), icon: '🤝', color: 'hsl(180,60%,40%)' },
    ENVIRONNEMENT: { label: t('sectors.environment'), icon: '🌿', color: 'hsl(120,50%,40%)' },
    ADMINISTRATION: { label: t('sectors.administration'), icon: '🏛️', color: 'hsl(220,20%,40%)' },
  };

  const navItems = [
    { href: '/delegation', label: t('sidebar.dashboard'), icon: LayoutDashboard },
    { href: '/delegation/evenements', label: t('sidebar.my_events'), icon: Calendar },
    { href: '/delegation/actualites', label: t('sidebar.my_news'), icon: Newspaper },
    { href: '/delegation/articles', label: t('sidebar.my_articles'), icon: FileText },
    { href: '/delegation/campagnes', label: t('sidebar.my_campaigns'), icon: Megaphone },
    { href: '/delegation/statistiques', label: t('sidebar.stats'), icon: BarChart3 },
  ];

  // Rediriger si non autorisé
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/delegation');
    } else if (status === 'authenticated' && session?.user?.role !== 'DELEGATION') {
      router.push('/acces-refuse');
    }
  }, [status, session, router]);

  if (status === 'loading' || status === 'unauthenticated') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-[hsl(213,80%,28%)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session?.user?.role !== 'DELEGATION') {
    return null;
  }

  const userSecteur = session?.user?.secteurResponsable || 'ADMINISTRATION';
  const secteurConfig = SECTEUR_CONFIG[userSecteur] || SECTEUR_CONFIG.ADMINISTRATION;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col"> {/* Width increased to 72 (18rem) for better RTL fitting */}
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-[hsl(213,80%,20%)] to-[hsl(213,80%,28%)] px-6">
          {/* Bande tricolore */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
          
          {/* Logo */}
          <div className="flex h-20 shrink-0 items-center border-b border-white/10 mt-1">
            <Link href="/delegation" className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-lg">
                {secteurConfig.icon}
              </div>
              <div className="text-white">
                <p className="font-black text-base">{tCommon('user_menu.delegation_space')}</p>
                <p className="text-xs text-white/70 font-medium">{secteurConfig.label}</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col mt-4">
            <ul className="flex flex-1 flex-col gap-y-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || 
                  (item.href !== '/delegation' && pathname.startsWith(item.href));
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`group flex items-center gap-x-3 rounded-xl p-3.5 text-sm font-bold transition-all ${
                        isActive
                          ? 'bg-white/10 text-white shadow-inner border-[1px] border-white/10'
                          : 'text-white/70 hover:bg-white/10 hover:text-white hover:translate-x-1 rtl:hover:-translate-x-1'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-[hsl(45,93%,47%)]' : ''}`} />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Language Switcher & User Info */}
            <div className="border-t border-white/10 pt-6 pb-6">
              {/* Language Switcher */}
              <Link
                href={`/${locale === 'ar' ? 'fr' : 'ar'}${currentPath}`}
                className="flex items-center gap-3 px-3 py-2.5 mb-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {locale === 'ar' ? 'Français' : 'العربية'}
                </span>
              </Link>
              
              <div className="flex items-center gap-3 px-2 bg-black/20 p-3 rounded-2xl border border-white/5">
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md"
                  style={{ backgroundColor: secteurConfig.color }}
                >
                  {session?.user?.prenom?.charAt(0) || 'D'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-white truncate">
                    {session?.user?.prenom} {session?.user?.nom}
                  </p>
                  <p className="text-[10px] text-white/50 truncate uppercase tracking-wider">
                    {secteurConfig.label}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 text-white/60 hover:text-red-300 hover:bg-white/10 rounded-lg transition-colors"
                  title={tCommon('logout')}
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </nav>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-[hsl(213,80%,28%)] px-4 py-4 shadow-sm lg:hidden">
        <button
          type="button"
          className="-m-2.5 p-2.5 text-white"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 text-sm font-bold text-white">{tCommon('user_menu.delegation_space')}</div>
        <div 
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-md"
          style={{ backgroundColor: secteurConfig.color }}
        >
          {session?.user?.prenom?.charAt(0) || 'D'}
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-0 flex">
            <div className="relative mr-16 flex w-full max-w-xs flex-1">
              <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                <button
                  type="button"
                  className="-m-2.5 p-2.5"
                  onClick={() => setSidebarOpen(false)}
                >
                  <X className="w-6 h-6 text-white" />
                </button>
              </div>
              
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-[hsl(213,80%,20%)] to-[hsl(213,80%,28%)] px-6 pb-4">
                <div className="flex h-20 shrink-0 items-center border-b border-white/10">
                  <span className="text-2xl mr-3">{secteurConfig.icon}</span>
                  <span className="text-white font-bold text-lg">{tCommon('user_menu.delegation_space')}</span>
                </div>
                <nav className="flex flex-1 flex-col mt-4">
                  <ul className="flex flex-1 flex-col gap-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className={`group flex items-center gap-x-3 rounded-lg p-3 text-sm font-bold transition-colors ${
                              isActive
                                ? 'bg-white/15 text-white'
                                : 'text-white/70 hover:bg-white/10 hover:text-white'
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Language Switcher & User Info Mobile */}
                  <div className="border-t border-white/10 pt-4 pb-4 mt-auto">
                    {/* Language Switcher */}
                    <Link
                      href={`/${locale === 'ar' ? 'fr' : 'ar'}${currentPath}`}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 mb-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {locale === 'ar' ? 'Français' : 'العربية'}
                      </span>
                    </Link>
                    
                    <div className="flex items-center gap-3 px-2">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: secteurConfig.color }}
                      >
                        {session?.user?.prenom?.charAt(0) || 'D'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">
                          {session?.user?.prenom} {session?.user?.nom}
                        </p>
                        <p className="text-xs text-white/50 truncate">
                          {secteurConfig.label}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full mt-4 flex items-center justify-center gap-3 p-3 text-red-100 bg-red-900/20 hover:bg-red-900/40 rounded-xl transition-colors font-bold"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>{tCommon('logout')}</span>
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ltr:pl-72 lg:rtl:pr-72 pt-4 lg:pt-0 transition-all duration-300">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
