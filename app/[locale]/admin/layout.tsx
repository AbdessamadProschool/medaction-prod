'use client';

import { useState, useEffect } from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { MaintenanceBanner } from '@/components/admin/MaintenanceBanner';
import { useLocale } from 'next-intl';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const locale = useLocale();
  const isRTL = locale === 'ar';

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
          ? 'ltr:lg:pl-20 rtl:lg:pr-20' 
          : 'ltr:lg:pl-64 rtl:lg:pr-64'
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
