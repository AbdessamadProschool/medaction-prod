'use client';

import { useEffect, useState } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { MaintenanceBanner } from '@/components/admin/MaintenanceBanner';
import { useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccessLogger } from '@/hooks/use-access-logger';
import { useSidebar } from './SidebarContext';

export default function ClientAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { collapsed: sidebarCollapsed } = useSidebar();
  const locale = useLocale();
  const isRTL = locale === 'ar';
  
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { logAccessDenied } = useAccessLogger();
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated') {
       router.push(`/${locale}/login`);
       return;
    }

    if (status === 'authenticated' && session?.user) {
       const role = session.user.role;
       if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
          logAccessDenied(pathname, `Unauthorized access to admin area by ${session.user.email} (Role: ${role})`);
          router.push(`/${locale}/`);
       } else {
          setAccessChecked(true);
       }
    }
  }, [status, session, router, locale, pathname, logAccessDenied]);

  if (status === 'loading' || !accessChecked) {
    return <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main content area - dynamique selon l'état de la sidebar */}
      <div className={`min-h-screen transition-all duration-300 ${
        sidebarCollapsed ? 'lg:ps-20' : 'lg:ps-64'
      }`}>
        {/* Maintenance Banner (visible only for admins when maintenance is active) */}
        <MaintenanceBanner />
        
        {/* Header */}
        <AdminHeader />
        
        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
}
