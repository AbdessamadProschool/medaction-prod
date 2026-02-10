'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Building2,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Globe,
} from 'lucide-react';
import { useState } from 'react';
import { signOut } from 'next-auth/react';

const navItems = [
  { href: '/autorite', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/autorite/reclamations', label: 'Réclamations', icon: FileText },
  { href: '/autorite/etablissement', label: 'Mon établissement', icon: Building2 },
  { href: '/autorite/statistiques', label: 'Statistiques', icon: BarChart3 },
];

export default function AutoriteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const t = useTranslations('authority_space');
  const locale = useLocale();
  const isRtl = locale === 'ar';
  
  // Get current path without locale prefix for language switching
  const currentPath = pathname.replace(/^\/(ar|fr)/, '');

  const navItems = [
    { href: '/autorite', label: t('dashboard'), icon: LayoutDashboard },
    { href: '/autorite/reclamations', label: t('reclamations'), icon: FileText },
    { href: '/autorite/etablissement', label: t('my_establishment'), icon: Building2 },
    { href: '/autorite/statistiques', label: t('statistics'), icon: BarChart3 },
  ];

  // Rediriger si non autorisé
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/autorite');
    } else if (status === 'authenticated' && session?.user?.role !== 'AUTORITE_LOCALE') {
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

  if (session?.user?.role !== 'AUTORITE_LOCALE') {
    return null;
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isRtl ? 'font-cairo' : ''}`}>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col lg:ltr:left-0 lg:rtl:right-0">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-[hsl(213,80%,20%)] to-[hsl(213,80%,28%)] px-6">
          {/* Bande tricolore */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
          
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b border-white/10 mt-1">
            <Link href="/autorite" className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-[hsl(213,80%,28%)]" />
              </div>
              <div className="text-white">
                <p className="font-bold text-sm">{t('title')}</p>
                <p className="text-xs text-white/60">{t('portal_name')}</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul className="flex flex-1 flex-col gap-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="group flex gap-x-3 rounded-lg p-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <Icon className="w-5 h-5 rtl:mirror" />
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Language Switcher & User Info */}
            <div className="border-t border-white/10 pt-4 pb-4">
              {/* Language Switcher */}
              <Link
                href={`/${locale === 'ar' ? 'fr' : 'ar'}${currentPath}`}
                className="flex items-center gap-3 px-2 py-2 mb-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {locale === 'ar' ? 'Français' : 'العربية'}
                </span>
              </Link>
              
              <div className="flex items-center gap-3 px-2">
                <div className="w-10 h-10 rounded-full bg-[hsl(45,93%,47%)] flex items-center justify-center text-gray-900 font-bold">
                  {session?.user?.prenom?.charAt(0) || 'A'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">
                    {session?.user?.prenom} {session?.user?.nom}
                  </p>
                  <p className="text-xs text-white/60 truncate">
                    {t('role_label')}
                  </p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="p-2 text-white/60 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                  title={t('logout')}
                >
                  <LogOut className="w-5 h-5 rtl:rotate-180" />
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
        <div className="flex-1 text-sm font-semibold text-white">{t('mobile_title')}</div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="relative z-50 lg:hidden">
          <div 
            className="fixed inset-0 bg-gray-900/80"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="fixed inset-0 flex">
            <div className="relative flex w-full max-w-xs flex-1 lg:ltr:mr-16 lg:rtl:ml-16">
              
              <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-gradient-to-b from-[hsl(213,80%,20%)] to-[hsl(213,80%,28%)] px-6 pb-4">
                <div className="flex justify-end pt-4">
                     <button
                        type="button"
                        className="-m-2.5 p-2.5"
                        onClick={() => setSidebarOpen(false)}
                        >
                        <X className="w-6 h-6 text-white" />
                        </button>
                </div>
                
                <div className="flex h-16 shrink-0 items-center">
                  <Building2 className="w-8 h-8 text-white" />
                  <span className="ml-3 text-white font-bold">{t('mobile_title')}</span>
                </div>
                <nav className="flex flex-1 flex-col">
                  <ul className="flex flex-1 flex-col gap-y-1">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.href}>
                          <Link
                            href={item.href}
                            onClick={() => setSidebarOpen(false)}
                            className="group flex gap-x-3 rounded-lg p-3 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
                          >
                            <Icon className="w-5 h-5 rtl:mirror" />
                            {item.label}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Language Switcher Mobile */}
                  <div className="border-t border-white/10 pt-4 pb-4 mt-auto">
                    <Link
                      href={`/${locale === 'ar' ? 'fr' : 'ar'}${currentPath}`}
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-3 px-3 py-2 mb-3 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <Globe className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {locale === 'ar' ? 'Français' : 'العربية'}
                      </span>
                    </Link>
                    
                    <div className="flex items-center gap-3 px-2">
                      <div className="w-10 h-10 rounded-full bg-[hsl(45,93%,47%)] flex items-center justify-center text-gray-900 font-bold">
                        {session?.user?.prenom?.charAt(0) || 'A'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">
                          {session?.user?.prenom} {session?.user?.nom}
                        </p>
                        <p className="text-xs text-white/60 truncate">
                          {t('role_label')}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/login' })}
                      className="w-full mt-3 flex items-center gap-3 p-3 text-red-300 hover:bg-white/10 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5 rtl:rotate-180" />
                      <span>{t('logout')}</span>
                    </button>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="lg:ltr:pl-64 lg:rtl:pr-64 transition-all duration-300">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
