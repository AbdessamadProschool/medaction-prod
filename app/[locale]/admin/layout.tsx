import { SidebarProvider } from '@/components/admin/SidebarContext';
import ClientAdminLayout from '@/components/admin/ClientAdminLayout';

export const metadata = {
  title: 'Admin Dashboard',
  description: 'Administration Panel',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <ClientAdminLayout>
        {children}
      </ClientAdminLayout>
    </SidebarProvider>
  );
}
