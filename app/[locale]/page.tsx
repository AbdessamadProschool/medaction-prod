import { setRequestLocale } from 'next-intl/server';
import { locales } from '@/i18n/routing';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata = {
  title: 'Test Page',
};

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>✅ Home Page Works!</h1>
      <p>Locale: {locale}</p>
      <p>If you see this, the framework is fine. The issue is in a component.</p>
    </div>
  );
}
