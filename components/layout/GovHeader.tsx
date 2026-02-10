'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Building2,
  Calendar,
  Newspaper,
  MapPin,
  MessageSquare,
  Menu,
  X,
  ChevronDown,
  Search,
  User,
  LogIn,
  Bell,
  Shield,
  Settings,
  LayoutDashboard,
  LogOut,
  Clock,
  Megaphone,
  BookOpen,
  Layout
} from 'lucide-react';
import { useSession, signOut } from 'next-auth/react';
import { LanguageSwitcher } from '@/components/LanguageSwitcher/LanguageSwitcher';
import { useTranslations, useLocale } from 'next-intl';

export default function GovHeader() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const t = useTranslations();
  const locale = useLocale();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [kiosqueOpen, setKiosqueOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Navigation items with translations
  const primaryNavItems = [
    { href: '/', label: t('nav.home'), icon: Home },
    { href: '/etablissements', label: t('nav.etablissements'), icon: Building2 },
    { href: '/evenements', label: t('nav.evenements'), icon: Calendar },
    { href: '/carte', label: t('nav.carte'), icon: MapPin },
  ];

  // Dropdown: Kiosque (Content)
  const kiosqueItems = [
    { href: '/actualites', label: t('footer.actualites'), icon: Newspaper },
    { href: '/campagnes', label: t('nav.campagnes'), icon: Megaphone },
    { href: '/articles', label: t('nav.articles'), icon: BookOpen },
  ];

  // Dropdown: Services
  const serviceItems = [
    { href: '/reclamations/nouvelle', label: t('actions.soumettre_reclamation') },
    { href: '/mes-reclamations', label: t('nav.reclamations') },
    { href: '/suggestions', label: t('footer.suggestions') },
  ];
  
  // Notifications
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!session) return;
    try {
      const res = await fetch('/api/notifications?limit=5');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.unreadCount);
        setNotifications(data.notifications);
      }
    } catch (error) {
      console.error('Erreur notifications:', error);
    }
  };

  useEffect(() => {
    if (session) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [session]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClick = () => {
      setServicesOpen(false);
      setKiosqueOpen(false);
      setUserMenuOpen(false);
      setNotificationsOpen(false);
    };
    if (servicesOpen || kiosqueOpen || userMenuOpen || notificationsOpen) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [servicesOpen, kiosqueOpen, userMenuOpen, notificationsOpen]);

  // Déterminer le lien du dashboard selon le rôle
  const getDashboardLink = () => {
    const role = session?.user?.role;
    if (!role) return null;
    
    switch (role) {
      case 'ADMIN':
      case 'SUPER_ADMIN':
        return '/admin';
      case 'DELEGATION':
        return '/delegation';
      case 'AUTORITE_LOCALE':
        return '/autorite';
      case 'GOUVERNEUR':
        return '/gouverneur';
      default:
        return null;
    }
  };

  const dashboardLink = getDashboardLink();
  const isPro = !!dashboardLink;

  return (
    <header className={`gov-header-container sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-lg bg-[hsl(213,80%,15%)]/95 backdrop-blur-md' : 'bg-[hsl(213,80%,15%)]'}`}>
      {/* Bande tricolore */}
      <div className="gov-tricolor-strip" />
      
      {/* Barre d'infos */}
      <div className="bg-slate-900/50 text-slate-300 py-1.5 border-b border-white/5">
        <div className="w-full px-4 sm:px-6 lg:px-8 flex items-center justify-between text-[11px] font-medium tracking-wide">
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <span>📞</span> 05 22 51 00 51
            </span>
            <span className="hidden sm:flex items-center gap-2 hover:text-white transition-colors cursor-pointer">
              <span>✉️</span> contact@provincemediouna.ma
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/accessibilite" className="hover:text-white transition-colors">{t('nav.accessibilite')}</Link>
            <span className="text-slate-700">|</span>
            <Link href="/contact" className="hover:text-white transition-colors">{t('nav.contact')}</Link>
          </div>
        </div>
      </div>

      {/* En-tête principal */}
      <div className="gov-header relative">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo et titre - Fixed width to prevent shrinking */}
            <Link href="/" className="gov-emblem group flex-shrink-0 flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-lg p-1 shadow-lg group-hover:shadow-xl transition-all flex items-center justify-center overflow-hidden flex-shrink-0">
                <img
                  src="/images/logo-portal-mediouna.png"
                  alt="Portail Mediouna"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-white hidden xl:block flex-shrink-0">
                <div className={`${locale === 'ar' ? '' : 'font-outfit'} text-lg leading-none`}>
                  <span className={`font-bold ${locale === 'ar' ? '' : 'tracking-tight'}`}>{t('app.portail')}</span>
                </div>
                <div className="text-[10px] uppercase tracking-widest opacity-80 mt-0.5">{t('app.province')}</div>
              </div>
            </Link>

            {/* Navigation principale (Desktop) */}
            <nav className="hidden xl:flex items-center justify-center flex-1 gap-1 px-4">
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                      isActive
                        ? 'bg-white/10 text-white shadow-sm ring-1 ring-white/20'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={16} className={isActive ? 'text-[hsl(45,93%,47%)]' : ''} />
                    {item.label}
                  </Link>
                );
              })}

              {/* Dropdown Kiosque (Contenu) */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setKiosqueOpen(!kiosqueOpen);
                    setServicesOpen(false);
                  }}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                     kiosqueOpen ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Layout size={16} />
                  {t('nav.mediatheque')}
                  <ChevronDown size={14} className={`transition-transform duration-200 ${kiosqueOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {kiosqueOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.1 }}
                      className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 ring-1 ring-black/5"
                    >
                      <div className="p-2">
                        {kiosqueItems.map((item) => (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-[hsl(213,80%,48%)]/5 hover:text-[hsl(213,80%,28%)] transition-colors group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[hsl(213,80%,28%)]/5 flex items-center justify-center text-[hsl(213,80%,28%)] group-hover:bg-[hsl(213,80%,28%)] group-hover:text-white transition-colors">
                              <item.icon size={16} />
                            </div>
                            <span className="font-medium">{item.label}</span>
                          </Link>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Dropdown Services (Masqué pour Gouverneur) */}
              {session?.user?.role !== 'GOUVERNEUR' && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setServicesOpen(!servicesOpen);
                      setKiosqueOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                       servicesOpen ? 'bg-white/10 text-white' : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <MessageSquare size={16} />
                    {t('nav.services')}
                    <ChevronDown size={14} className={`transition-transform duration-200 ${servicesOpen ? 'rotate-180' : ''}`} />
                  </button>
                  
                  <AnimatePresence>
                    {servicesOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 ring-1 ring-black/5"
                      >
                         <div className="p-2">
                          {serviceItems
                            .filter(item => {
                              if (item.label === 'Mes réclamations') {
                                 return session?.user?.role === 'CITOYEN';
                              }
                              return true;
                            })
                            .map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-[hsl(213,80%,48%)]/5 hover:text-[hsl(213,80%,28%)] transition-colors group"
                            >
                               <div className="w-8 h-8 rounded-lg bg-[hsl(45,93%,47%)]/10 flex items-center justify-center text-[hsl(213,80%,28%)] group-hover:bg-[hsl(45,93%,47%)] group-hover:text-[hsl(213,80%,28%)] transition-colors">
                                  {item.label.includes('reclamation') ? <Shield size={16} /> : <MessageSquare size={16} />}
                               </div>
                              <span className="font-medium">{item.label}</span>
                            </Link>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </nav>

            {/* Actions droite */}
            <div className="flex items-center gap-4 flex-shrink-0">
              
              {/* Language Switcher */}
              <div className="me-2 hidden sm:block">
                <LanguageSwitcher />
              </div>

              {/* Recherche */}
              <Link
                href="/recherche"
                className="p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
              >
                <Search size={20} />
              </Link>

              {/* Notifications */}
              {session && (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setNotificationsOpen(!notificationsOpen);
                    }}
                    className="relative p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
                  >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-[hsl(213,80%,15%)] animate-pulse" />
                    )}
                  </button>

                  <AnimatePresence>
                      {notificationsOpen && (
                        <>
                          {/* Overlay mobile pour fermer en cliquant à côté */}
                          <div 
                            className="fixed inset-0 z-40 md:hidden bg-black/20 backdrop-blur-sm"
                            onClick={() => setNotificationsOpen(false)}
                          />
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.1 }}
                            className={`fixed left-4 right-4 top-20 md:absolute md:top-full ${locale === 'ar' ? 'md:left-0 md:right-auto' : 'md:right-0 md:left-auto'} md:mt-3 md:w-96 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-slate-800 overflow-hidden z-50 ring-1 ring-black/5`}
                          >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-amber-600" />
                            <div className="p-4 border-b border-gray-100 dark:border-slate-800 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/50">
                              <h3 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Bell className="w-4 h-4 text-amber-500 fill-amber-500" />
                                {t('notifications.title')}
                              </h3>
                              {unreadCount > 0 && (
                                <span className="text-[10px] font-bold bg-red-500 text-white px-2 py-0.5 rounded-full shadow-sm shadow-red-500/20">
                                  {unreadCount} {t('notifications.new', { count: unreadCount })}
                                </span>
                              )}
                            </div>
                        
                            <div className="max-h-[380px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900">
                              {loadingNotifs ? (
                                <div className="p-8 text-center">
                                   <div className="w-8 h-8 create-spin mx-auto mb-3 border-2 border-amber-500 border-t-transparent rounded-full" />
                                   <p className="text-xs font-medium text-gray-400">{t('common.chargement')}</p>
                                </div>
                              ) : notifications.length > 0 ? (
                                notifications.map((notif: any) => (
                                  <Link 
                                    key={notif.id} 
                                    href={notif.lien || '/notifications'}
                                    onClick={() => setNotificationsOpen(false)}
                                    className={`group flex gap-4 p-4 border-b border-gray-50 dark:border-slate-800 hover:bg-amber-50/30 dark:hover:bg-amber-900/10 transition-colors ${!notif.isLue ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                                  >
                                    <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${!notif.isLue ? 'bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-900' : 'bg-gray-200 dark:bg-slate-700'}`} />
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-sm mb-1 text-gray-900 dark:text-gray-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors ${!notif.isLue ? 'font-bold' : 'font-medium'}`}>
                                        {notif.titre}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 leading-relaxed mb-2">
                                        {notif.message}
                                      </p>
                                      <div className="flex items-center gap-2 text-[10px] text-gray-400 font-medium">
                                        <Clock size={10} />
                                        <span>
                                          {new Date(notif.createdAt).toLocaleDateString(locale === 'ar' ? 'ar-MA' : 'fr-FR', { 
                                            day: 'numeric', 
                                            month: 'short', 
                                            hour: '2-digit', 
                                            minute: '2-digit' 
                                          })}
                                        </span>
                                      </div>
                                    </div>
                                  </Link>
                                ))
                              ) : (
                                <div className="p-12 text-center text-gray-400">
                                  <div className="w-12 h-12 bg-gray-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell size={20} className="opacity-40" />
                                  </div>
                                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t('notifications.empty')}</p>
                                </div>
                              )}
                            </div>

                            <div className="p-2 bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-800">
                              <Link 
                                href="/notifications" 
                                onClick={() => setNotificationsOpen(false)}
                                className="flex items-center justify-center gap-2 w-full py-2.5 text-xs font-bold text-amber-600 dark:text-amber-400 hover:bg-white dark:hover:bg-slate-800 hover:shadow-sm rounded-lg transition-all"
                              >
                                {t('notifications.view_all')}
                                <span className="transform group-hover:translate-x-1 duration-200">→</span>
                              </Link>
                            </div>
                          </motion.div>
                    </>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Utilisateur */}
              {status === 'loading' ? (
                <div className="w-8 h-8 rounded-full bg-white/20 animate-pulse" />
              ) : session ? (
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 transition-all text-white ring-1 ring-white/10"
                  >
                    {/* Photo utilisateur ou initiales */}
                    {session.user?.photo ? (
                      <img 
                        src={session.user.photo} 
                        alt="Photo profil"
                        className="w-8 h-8 rounded-full object-cover border-2 border-[hsl(45,93%,47%)]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-[hsl(45,93%,47%)] flex items-center justify-center text-[hsl(213,80%,28%)] font-bold text-sm shadow-sm">
                        {session.user?.prenom?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="hidden md:block text-sm font-medium max-w-[100px] truncate">
                      {session.user?.prenom || 'Utilisateur'}
                    </span>
                    <ChevronDown size={14} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.1 }}
                        className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50 ring-1 ring-black/5"
                      >
                        {/* En-tête avec photo */}
                        <div className="px-5 py-5 border-b border-gray-100 bg-gradient-to-r from-[hsl(213,80%,28%)]/5 to-transparent">
                          <div className="flex items-center gap-4">
                            {session.user?.photo ? (
                              <img 
                                src={session.user.photo} 
                                alt="Photo profil"
                                className="w-12 h-12 rounded-full object-cover border-2 border-[hsl(213,80%,28%)]"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-[hsl(45,93%,47%)] flex items-center justify-center text-[hsl(213,80%,28%)] font-bold text-xl shadow-sm">
                                {session.user?.prenom?.[0]?.toUpperCase() || 'U'}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate text-base">{session.user?.prenom} {session.user?.nom}</p>
                              <p className="text-xs text-gray-500 truncate">{session.user?.email}</p>
                              <span className="inline-block mt-1.5 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide bg-[hsl(213,80%,28%)]/10 text-[hsl(213,80%,28%)] rounded-full">
                                {session.user?.role}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-2 space-y-1">
                          {isPro && (
                             <Link href={dashboardLink} className="flex items-center gap-3 px-3 py-2.5 text-sm font-semibold text-[hsl(213,80%,28%)] bg-[hsl(213,80%,28%)]/5 rounded-lg hover:bg-[hsl(213,80%,28%)]/10 transition-colors">
                                <LayoutDashboard size={18} />
                                {session?.user?.role === 'DELEGATION' ? t('nav.user_menu.delegation_space') : t('nav.user_menu.pro_space')}
                             </Link>
                          )}
                          <Link
                            href="/profil"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <User size={18} className="text-gray-400" />
                            {t('nav.user_menu.my_profile')}
                          </Link>
                          {session?.user?.role === 'CITOYEN' && (
                            <Link
                              href="/mes-reclamations"
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <MessageSquare size={18} className="text-gray-400" />
                              {t('nav.mes_reclamations')}
                            </Link>
                          )}
                          
                          {/* Sécurité / 2FA */}
                          <Link
                            href="/profil/securite"
                            className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <Shield size={18} className="text-[hsl(var(--gov-green))]" />
                            <span>{t('nav.user_menu.security')}</span>
                            {!session.user?.isEmailVerifie && (
                              <span className="ml-auto px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-700 rounded-full font-bold">!</span>
                            )}
                          </Link>

                          {session.user?.role !== 'CITOYEN' && (
                            <Link
                              href="/profil/parametres"
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <Settings size={18} className="text-gray-400" />
                              {t('nav.user_menu.settings')}
                            </Link>
                          )}
                        </div>

                        {/* Admin link */}
                        {(session.user?.role === 'ADMIN' || session.user?.role === 'SUPER_ADMIN') && (
                          <div className="border-t border-gray-100 p-2">
                            <Link
                              href="/admin"
                              className="flex items-center gap-3 px-3 py-2.5 text-sm text-[hsl(213,80%,28%)] font-medium hover:bg-[hsl(213,80%,28%)]/5 rounded-lg transition-colors"
                            >
                              <Shield size={18} />
                              {t('nav.user_menu.admin')}
                            </Link>
                          </div>
                        )}

                        {/* Déconnexion */}
                        <div className="border-t border-gray-100 p-2">
                          <button
                            onClick={() => signOut({ callbackUrl: '/' })}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                          >
                            <LogOut size={18} />
                            {t('nav.user_menu.logout')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="gov-btn gov-btn-gold text-sm py-2 px-4 shadow-lg hover:shadow-xl hover:scale-105 transition-all"
                >
                  <LogIn size={16} />
                  <span className="hidden sm:inline">{t('nav.connexion')}</span>
                </Link>
              )}

              {/* Menu mobile */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="xl:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 hover:text-white transition-all"
              >
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="xl:hidden bg-[hsl(213,80%,15%)] border-t border-white/10 overflow-hidden"
          >
            <nav className="px-4 py-4 space-y-1">
              {dashboardLink && (
                 <Link
                  href={dashboardLink}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-[hsl(45,93%,47%)] text-[hsl(213,80%,28%)] rounded-xl font-bold shadow-md mb-4"
                >
                  <LayoutDashboard size={20} />
                  {session?.user?.role === 'DELEGATION' ? t('nav.user_menu.delegation_space') : t('nav.user_menu.pro_space')}
                </Link>
              )}
              
              {/* Language Switcher Mobile */}
              <div className="px-4 py-2 border-b border-white/10 mb-2">
                 <LanguageSwitcher />
              </div>

              {/* Primary Mobile Items */}
              {primaryNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-white/10 text-white'
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <Icon size={18} className={isActive ? 'text-[hsl(45,93%,47%)]' : ''} />
                    {item.label}
                  </Link>
                );
              })}

              {/* Kiosque Mobile Items */}
              <div className="pt-2 pb-1">
                 <p className="px-4 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 mt-2">Médiathèque</p>
                 {kiosqueItems.map((item) => (
                    <Link
                       key={item.href}
                       href={item.href}
                       onClick={() => setMobileMenuOpen(false)}
                       className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white transition-all"
                    >
                       <item.icon size={18} />
                       {item.label}
                    </Link>
                 ))}
              </div>
              
              {/* Services Mobile Items */}
              <div className="pt-1">
                <p className="px-4 text-xs font-bold text-white/40 uppercase tracking-widest mb-2 mt-2">Services</p>
                {serviceItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-all"
                  >
                     <div className="w-5 flex justify-center">
                        {item.label.includes('reclamation') ? <Shield size={16} /> : <MessageSquare size={16} />}
                     </div>
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
