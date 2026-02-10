'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Calendar,
  Building2,
  CheckSquare,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Shield,
  ShieldCheck,
  BarChart3,
  Menu,
  X,
  FileText,
  Lightbulb,
  Home,
  ClipboardList,
  Bell,
  Megaphone,
  Globe,
} from 'lucide-react';

import { usePermission } from '@/hooks/use-permission';
import { PermissionCode } from '@/lib/permissions-types';
import { useTranslations, useLocale } from 'next-intl';

// ... existing imports ...

interface NavItem {
  href: string;
  labelKey: string; // Translation key
  icon: React.ElementType;
  badge?: number;
  badgeKey?: string;
  permission?: PermissionCode;
}

// Navigation items with translation keys
const NAV_ITEMS_CONFIG: NavItem[] = [
  { href: '/admin', labelKey: 'dashboard', icon: LayoutDashboard },
  { href: '/admin/reclamations', labelKey: 'reclamations', icon: MessageSquare, badgeKey: 'reclamations', permission: 'reclamations.read' },
  { href: '/admin/suggestions', labelKey: 'suggestions', icon: Lightbulb, badgeKey: 'suggestions', permission: 'suggestions.read.own' },
  { href: '/admin/utilisateurs', labelKey: 'users', icon: Users, badgeKey: 'utilisateurs', permission: 'users.read' },
  { href: '/admin/etablissements', labelKey: 'etablissements', icon: Building2, permission: 'etablissements.read' },
  { href: '/admin/programmes-activites', labelKey: 'activities', icon: ClipboardList, badgeKey: 'activites', permission: 'programmes.read' },
  { href: '/admin/validation', labelKey: 'validation', icon: CheckSquare, badgeKey: 'validation', permission: 'reclamations.validate' },
  { href: '/admin/evenements', labelKey: 'events', icon: Calendar, badgeKey: 'evenements', permission: 'evenements.read' },
  { href: '/admin/actualites', labelKey: 'news', icon: FileText, permission: 'actualites.read' },
  { href: '/admin/articles', labelKey: 'articles', icon: FileText, permission: 'actualites.read' },
  { href: '/admin/campagnes', labelKey: 'campaigns', icon: BarChart3, permission: 'campagnes.read' },
  { href: '/admin/bilans', labelKey: 'reports', icon: FileText, permission: 'stats.view.global' },
  { href: '/admin/stats', labelKey: 'statistics', icon: BarChart3, permission: 'stats.view.global' },
];

const BOTTOM_ITEMS: NavItem[] = [
  { href: '/', labelKey: 'home_page', icon: Home },
  { href: '/admin/settings', labelKey: 'settings', icon: Settings, permission: 'system.settings.read' },
];

// Super Admin items
const SUPER_ADMIN_ITEMS: NavItem[] = [
  { href: '/super-admin', labelKey: 'super_admin', icon: ShieldCheck },
  { href: '/admin/settings/announcement', labelKey: 'popup_announcements', icon: Megaphone },
  { href: '/admin/roles', labelKey: 'roles_permissions', icon: Shield },
];

// Type pour les badges
interface BadgeCounts {
  reclamations: number;
  suggestions: number;
  activites: number;
  validation: number;
  evenements: number;
  utilisateurs: number;
}

export default function AdminSidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { can } = usePermission();
  const t = useTranslations('admin.sidebar');
  const tRoles = useTranslations('admin_roles.roles');
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  // Get current path without locale prefix for language switching
  const currentPath = pathname.replace(/^\/(ar|fr)/, '');
  
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({
    reclamations: 0,
    suggestions: 0,
    activites: 0,
    validation: 0,
    evenements: 0,
    utilisateurs: 0,
  });

  // Synchroniser l'état collapsed avec le document pour que le layout puisse s'adapter
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-sidebar-collapsed', collapsed ? 'true' : 'false');
    }
  }, [collapsed]);

  // Charger les badges à intervalles réguliers
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await fetch('/api/admin/pending-counts');
        if (res.ok) {
          const data = await res.json();
          setBadges({
            reclamations: data.reclamations || 0,
            suggestions: data.suggestions || 0,
            activites: data.activites || 0,
            validation: data.validation || 0,
            evenements: data.evenements || 0,
            utilisateurs: data.utilisateurs || 0,
          });
        }
      } catch (error) {
        // Silencieux en cas d'erreur
      }
    };

    fetchBadges();
    const interval = setInterval(fetchBadges, 60000); // Rafraîchir toutes les 60 secondes
    return () => clearInterval(interval);
  }, []);

  // Construire NAV_ITEMS avec les badges ET filtrés par permission
  const NAV_ITEMS = NAV_ITEMS_CONFIG
    .filter(item => !item.permission || can(item.permission))
    .map(item => ({
      ...item,
      badge: item.badgeKey ? badges[item.badgeKey as keyof BadgeCounts] : undefined,
    }));
    
  // Filtrer aussi les items du bas
  const FILTERED_BOTTOM_ITEMS = BOTTOM_ITEMS.filter(item => !item.permission || can(item.permission));

  const isActive = (href: string) => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href);
    const Icon = item.icon;

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group relative ${
          active
            ? 'bg-gradient-to-r from-[hsl(213,80%,28%)] to-[hsl(213,80%,35%)] text-white shadow-lg shadow-[hsl(213,80%,28%)]/25'
            : 'text-gray-600 hover:bg-[hsl(213,80%,28%)]/10 hover:text-[hsl(213,80%,28%)]'
        }`}
      >
        <Icon size={20} className={active ? 'text-white' : ''} />
        {!collapsed && (
          <span className="font-medium flex-1">{t(item.labelKey)}</span>
        )}
        {item.badge !== undefined && item.badge > 0 && (
          <span className={`min-w-[20px] h-5 px-1.5 text-xs font-bold rounded-full flex items-center justify-center animate-pulse ${
            active 
              ? 'bg-[hsl(45,93%,47%)] text-gray-900' 
              : 'bg-gradient-to-r from-[hsl(348,83%,47%)] to-[hsl(348,83%,55%)] text-white shadow-sm'
          }`}>
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        
        {collapsed && (
          <div className="absolute px-2 py-1 bg-[hsl(213,80%,20%)] text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 ltr:left-full ltr:ml-2 rtl:right-full rtl:mr-2">
            {t(item.labelKey)}
          </div>
        )}
      </Link>
    );
  };

  const SidebarContent = () => (
    <>
      {/* Logo - Gouvernemental */}
      <div className={`flex items-center gap-3 px-4 py-6 border-b border-[hsl(45,93%,47%)]/30 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg overflow-hidden p-1">
          <img
            src="/images/logo-portal-mediouna.png"
            alt="Portail Mediouna"
            className="w-full h-full object-contain"
          />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0 ltr:text-left rtl:text-right">
            <h1 className="font-bold text-white text-sm truncate">{t('portal_name')}</h1>
            <p className="text-xs text-[hsl(45,93%,65%)]">{t('administration')}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Bottom items */}
      <div className="px-3 py-4 border-t border-white/10 space-y-1.5">
        {FILTERED_BOTTOM_ITEMS.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
        
        {/* Super Admin only items */}
        {session?.user?.role === 'SUPER_ADMIN' && (
          <>
            <div className="my-2 border-t border-purple-500/30" />
            {SUPER_ADMIN_ITEMS.map((item) => (
              <NavLink key={item.href} item={item} />
            ))}
          </>
        )}
      </div>

      {/* Language Switcher */}
      <div className="px-3 py-2">
        <Link
          href={`/${locale === 'ar' ? 'fr' : 'ar'}${currentPath}`}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-gray-400 hover:bg-white/10 hover:text-white ${collapsed ? 'justify-center' : ''}`}
        >
          <Globe size={20} />
          {!collapsed && (
            <span className="font-medium">
              {locale === 'ar' ? 'Français' : 'العربية'}
            </span>
          )}
        </Link>
      </div>

      {/* User section */}
      {session?.user && (
        <div className={`px-3 py-4 border-t border-white/10 ${collapsed ? 'items-center' : ''}`}>
          <div className={`flex items-center gap-3 p-3 rounded-xl bg-white/10 ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-10 h-10 bg-[hsl(45,93%,47%)] rounded-full flex items-center justify-center text-gray-900 font-bold flex-shrink-0">
              {session.user.prenom?.[0] || session.user.nom?.[0] || session.user.email?.[0] || 'A'}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0 ltr:text-left rtl:text-right">
                <p className="font-medium text-white truncate text-sm">
                  {session.user.prenom && session.user.nom ? `${session.user.prenom} ${session.user.nom}` : 'Admin'}
                </p>
                <p className="text-xs text-[hsl(45,93%,65%)] truncate">
                  {tRoles(session.user.role as string) || session.user.role || 'Administrateur'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Collapse toggle (desktop) */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute top-20 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center text-[hsl(213,80%,28%)] hover:bg-[hsl(45,93%,47%)] hover:text-gray-900 shadow-sm transition-colors ltr:-right-3 rtl:-left-3"
      >
        {collapsed 
          ? <div className="ltr:contents rtl:hidden"><ChevronRight size={14} /></div>
          : <div className="ltr:contents rtl:hidden"><ChevronLeft size={14} /></div>
        }
        {collapsed 
          ? <div className="rtl:contents ltr:hidden"><ChevronLeft size={14} /></div>
          : <div className="rtl:contents ltr:hidden"><ChevronRight size={14} /></div>
        }
      </button>
    </>
  );

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 z-50 p-2 bg-[hsl(213,80%,28%)] text-white rounded-lg shadow-lg ltr:left-4 rtl:right-4"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed inset-y-0 z-50 w-72 bg-gradient-to-b from-[hsl(213,80%,20%)] to-[hsl(213,80%,15%)] transform transition-transform duration-300 ltr:left-0 rtl:right-0 ${
          mobileOpen 
            ? 'translate-x-0' 
            : 'ltr:-translate-x-full rtl:translate-x-full'
        }`}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute top-4 p-2 text-white/60 hover:text-white ltr:right-4 rtl:left-4"
        >
          <X size={20} />
        </button>
        <SidebarContent />
      </aside>

      {/* Desktop sidebar - Gouvernemental */}
      <aside
        className={`hidden lg:flex flex-col fixed inset-y-0 z-30 bg-gradient-to-b from-[hsl(213,80%,20%)] to-[hsl(213,80%,15%)] transition-all duration-300 border-[hsl(45,93%,47%)]/20 ltr:left-0 rtl:right-0 ltr:border-r rtl:border-l ${
          collapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Top gold accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[hsl(348,83%,47%)] via-[hsl(45,93%,47%)] to-[hsl(145,63%,32%)]" />
        <SidebarContent />
      </aside>
    </>
  );
}
