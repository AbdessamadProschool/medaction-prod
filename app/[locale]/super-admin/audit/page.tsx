import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuditClient from './AuditClient';

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'audit_page' });
  
  return {
    title: t('title'),
    description: t('subtitle'),
  };
}

export default async function AuditPage({ params }: { params: { locale: string } }) {
  const { locale } = await params;
  
  // Activer le rendu statique pour cette route localisée
  setRequestLocale(locale);

  return <AuditClient />;
}
