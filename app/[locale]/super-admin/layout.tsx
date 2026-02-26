import { getTranslations } from 'next-intl/server';
import { MaintenanceBanner } from '@/components/admin/MaintenanceBanner';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'super_admin' });
  
  return {
    title: t('title'),
    description: t('subtitle')
  };
}

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

