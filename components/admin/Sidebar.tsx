'use client';

import { useState } from 'react';
import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Building2,
  Calendar,
  MessageSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Menu,
  X,
  Shield,
  BarChart3,
} from 'lucide-react';
import { useTranslations } from 'next-intl';

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  roles?: string[];
}

const sidebarItems: SidebarItem[] = [
  { name: 'dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'users', href: '/admin/utilisateurs', icon: Users, roles: ['ADMIN', 'SUPER_ADMIN'] },
  { name: 'validation', href: '/admin/validation', icon: FileCheck },
  { name: 'etablissements', href: '/admin/etablissements', icon: Building2 },
  { name: 'events', href: '/admin/evenements', icon: Calendar },
  { name: 'reclamations', href: '/admin/reclamations', icon: MessageSquare },
  { name: 'statistics', href: '/admin/statistiques', icon: BarChart3 },
  { name: 'settings', href: '/admin/parametres', icon: Settings, roles: ['SUPER_ADMIN'] },
];

export default function AdminSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();
  const t = useTranslations('admin.sidebar');

  const userRole = session?.user?.role || 'CITOYEN';

  const filteredItems = sidebarItems.filter(item => {
    if (!item.roles) return true;
    return item.roles.includes(userRole);
  });

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-card text-foreground rounded-lg shadow-md border border-border lg:hidden"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
      >
        {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-[hsl(var(--gov-blue-dark)/0.72)] z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-gradient-to-b from-[hsl(var(--gov-blue-dark))] to-[hsl(220,25%,15%)]
          text-white shadow-lg z-50 transition-all duration-300 flex flex-col
          ${isCollapsed ? 'w-20' : 'w-72'}
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[hsl(var(--gov-gold))] flex items-center justify-center shadow-sm">
              <Shield className="w-6 h-6 text-[hsl(var(--gov-blue-dark))]" />
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg text-white">
                  {t('portal_name')}
                </h1>
                <p className="text-xs text-[hsl(var(--gov-gold-light))]">{t('administration')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsMobileOpen(false)}
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                  ${active
                    ? 'bg-white/15 text-white ring-1 ring-[hsl(var(--gov-gold)/0.45)]'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                  }
                  ${isCollapsed ? 'justify-center px-3' : ''}
                `}
              >
                <Icon
                  size={22}
                  className={`${active ? 'text-[hsl(var(--gov-gold))]' : 'text-white/70 group-hover:text-white'} transition-colors`}
                />
                {!isCollapsed && (
                  <>
                    <span className="font-medium">{t(item.name)}</span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-white/10">
          {session?.user && (
            <div className={`flex items-center gap-3 mb-4 ${isCollapsed ? 'justify-center' : ''}`}>
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--gov-gold))] flex items-center justify-center text-[hsl(var(--gov-blue-dark))] font-bold">
                {session.user.prenom?.[0]?.toUpperCase() || 'U'}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{session.user.prenom} {session.user.nom}</p>
                  <p className="text-xs text-white/60 truncate">{session.user.role}</p>
                </div>
              )}
            </div>
          )}

          <button
            onClick={() => signOut({ callbackUrl: window.location.origin + '/login' })}
            className={`
              flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-white/70
              hover:bg-[hsl(var(--gov-red)/0.16)] hover:text-white transition-colors duration-200
              ${isCollapsed ? 'justify-center px-3' : ''}
            `}
          >
            <LogOut size={20} />
            {!isCollapsed && <span>{t('logout')}</span>}
          </button>
        </div>

        {/* Collapse Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-card rounded-full items-center justify-center text-[hsl(var(--gov-blue))] hover:bg-[hsl(var(--gov-gold))] transition-colors shadow-md border border-border"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
}
