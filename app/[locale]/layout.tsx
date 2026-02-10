import type { Metadata } from "next";
import { Inter, Outfit, Cairo } from "next/font/google";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });
const cairo = Cairo({ subsets: ["arabic", "latin"], variable: "--font-cairo" });

export const metadata: Metadata = {
  title: "Portail Mediouna",
  description: "Plateforme de gouvernance",
};

export default async function RootLayout({
  children,
  params
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  const direction = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <html lang={locale} dir={direction}>
      <body className={`${inter.variable} ${outfit.variable} ${cairo.variable} antialiased`}>
        {/* Minimal Layout for Debugging */}
        <div style={{ padding: 20, border: '5px solid red' }}>
          <h1>MINIMAL LAYOUT ACTIVE</h1>
          {children}
        </div>
      </body>
    </html>
  );
}
