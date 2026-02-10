import { Metadata } from 'next';
import { MaintenanceBanner } from '@/components/admin/MaintenanceBanner';

export const metadata: Metadata = {
  title: 'Super Administration | MedAction',
  description: 'Panneau de contrôle Super Administrateur MedAction',
};

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <MaintenanceBanner />
      {children}
    </div>
  );
}

