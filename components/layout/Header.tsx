'use client';

import { Link } from '@/i18n/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import UserMenu from '@/components/auth/UserMenu';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';
import { LayoutDashboard } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/explorer', label: 'Explorer' },
  { href: '/etablissements', label: 'Établissements' },
  { href: '/evenements', label: 'Événements' },
  { href: '/suggestions', label: 'Suggestions' },
  { href: '/carte', label: 'Carte' },
];


export default function Header() {
  const { data: session } = useSession();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  return (
    <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 relative flex-shrink-0">
              <Image 
                src="/images/logo-portal-mediouna.png" 
                alt="Portail Mediouna"
                fill
                className="object-contain"
                priority
              />
            </div>
            <div className="hidden sm:block font-outfit">
              <span className="text-xl font-bold tracking-wide">
                <span className="text-gov-blue">PORTAIL </span>
                <span className="text-gov-gold">MEDIOUNA</span>
              </span>
              <span className="block text-xs text-gray-500 -mt-0.5 font-sans">Province de Médiouna</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors duration-200"
              >
                {link.label}
              </Link>
            ))}
            
            {/* Bouton Dashboard pour les Pros */}
            {dashboardLink && (
              <Link
                href={dashboardLink}
                className="ml-2 flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-gov-blue hover:bg-gov-blue-dark rounded-lg shadow-sm transition-all transform hover:scale-105"
              >
                <LayoutDashboard size={16} />
                Mon Espace Pro
              </Link>
            )}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Notifications */}
            <NotificationsDropdown />
            
            {/* User Menu */}
            <UserMenu />

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="flex flex-col p-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-medium text-gray-600 hover:text-gov-blue hover:bg-gov-blue/5 rounded-lg transition-colors"
              >
                {link.label}
              </Link>
            ))}
            
            {dashboardLink && (
               <Link
                href={dashboardLink}
                onClick={() => setIsMobileMenuOpen(false)}
                className="px-4 py-3 text-sm font-bold text-gov-blue bg-gov-blue/5 rounded-lg mt-2 border border-gov-blue/20"
              >
                Accéder à mon Espace Pro
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
