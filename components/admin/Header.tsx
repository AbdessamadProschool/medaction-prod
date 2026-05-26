'use client';

import { useSession } from 'next-auth/react';
import { Search, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import NotificationsDropdown from '@/components/notifications/NotificationsDropdown';

export default function AdminHeader() {
  const { data: session } = useSession();
  const [isDark, setIsDark] = useState(false);

  return (
    <header className="h-16 bg-card border-b border-border px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Search */}
      <div className="flex-1 max-w-xl">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="w-full pl-10 pr-4 py-2.5 bg-background border border-input rounded-lg text-sm focus:ring-2 focus:ring-[hsl(var(--gov-blue))] transition-colors"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setIsDark(!isDark)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Changer le theme"
        >
          {isDark ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-gray-500" />
          )}
        </button>

        {/* Notifications */}
        <NotificationsDropdown />

        {/* User */}
        <div className="flex items-center gap-3 pl-4 border-l border-border">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-foreground">
              {session?.user?.prenom} {session?.user?.nom}
            </p>
            <p className="text-xs text-gray-500">
              {session?.user?.role === 'SUPER_ADMIN' ? 'Super Administrateur' :
               session?.user?.role === 'ADMIN' ? 'Administrateur' : 
               session?.user?.role}
            </p>
          </div>
          <div className="w-10 h-10 rounded-full bg-[hsl(var(--gov-gold))] flex items-center justify-center text-[hsl(var(--gov-blue-dark))] font-bold">
            {session?.user?.prenom?.[0]?.toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
}
