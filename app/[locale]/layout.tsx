import type { Metadata } from "next";
import { Inter, Outfit, Cairo } from "next/font/google";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { MaintenanceProvider } from "@/components/providers/MaintenanceProvider";
import { LicenseProvider } from "@/components/providers/LicenseProvider";
import GoogleAnalytics from "@/components/analytics/GoogleAnalytics";
import { Toaster } from "@/components/ui/sonner";

import "../globals.css";
import "../rtl.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-cairo",
});

export const metadata: Metadata = {
  title: {
    default: "Portail Mediouna",
    template: "%s - Portail Mediouna",
  },
  description: "Plateforme de gouvernance et de services citoyens de la Province de Médiouna",
  icons: {
    icon: [
      { url: "/images/logo-portal-mediouna.png?v=3", sizes: "any" },
    ],
    apple: "/images/logo-portal-mediouna.png?v=3",
    shortcut: "/images/logo-portal-mediouna.png?v=3",
  },
  metadataBase: new URL(process.env.NEXTAUTH_URL || "http://localhost:3000"),
  openGraph: {
    title: "Portail Mediouna",
    description: "Plateforme de gouvernance et de services citoyens de la Province de Médiouna",
    siteName: "Portail Mediouna",
    locale: "fr_MA",
    type: "website",
  },
};

// Suppression de generateStaticParams pour éviter les erreurs "Dynamic server usage"
// Le rendu se fera dynamiquement (SSR), ce qui est préférable pour une app authentifiée.

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  // Await params first (Next.js 15+ ready)
  const { locale } = await params;

  // Pas d'appel à unstable_setRequestLocale en v3.19

  // Load messages
  const messages = await getMessages();

  // Determine direction
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction} suppressHydrationWarning>
      <body
        className={`${inter.variable} ${outfit.variable} ${cairo.variable} ${direction === 'rtl' ? 'font-cairo' : 'font-sans'} antialiased`}
        suppressHydrationWarning
      >
        {/* Google Analytics */}
        <GoogleAnalytics measurementId={process.env.NEXT_PUBLIC_GA_ID || ''} />

        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider messages={messages} locale={locale}>
              <LicenseProvider>
                <MaintenanceProvider>
                  {children}
                </MaintenanceProvider>
              </LicenseProvider>
              <Toaster />
            </NextIntlClientProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
