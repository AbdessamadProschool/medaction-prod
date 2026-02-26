'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { MaintenanceBanner } from '@/components/admin/MaintenanceBanner';
import { useLocale } from 'next-intl';
import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useAccessLogger } from '@/hooks/use-access-logger';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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

  // Observer les changements de l'attribut data-sidebar-collapsed sur le document
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const collapsed = document.documentElement.getAttribute('data-sidebar-collapsed') === 'true';
      setSidebarCollapsed(collapsed);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-sidebar-collapsed'],
    });

    // État initial
    const isCollapsed = document.documentElement.getAttribute('data-sidebar-collapsed') === 'true';
    setSidebarCollapsed(isCollapsed);

    return () => observer.disconnect();
  }, []);

  // Dynamic padding based on RTL and sidebar state
  const getContentPadding = () => {
    if (isRTL) {
      return sidebarCollapsed ? 'lg:pr-20' : 'lg:pr-64';
    }
    return sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main content area - dynamique selon l'état de la sidebar et RTL */}
      <div className={`min-h-screen transition-all duration-300 ${
        sidebarCollapsed 
          ? 'lg:ps-20' 
          : 'lg:ps-64'
      }`}>
        {/* Maintenance Banner (visible only for admins when maintenance is active) */}
        <MaintenanceBanner />
        
        {/* Header */}
        <AdminHeader />
        
        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
