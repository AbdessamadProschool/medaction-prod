import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Portail Province Médiouna',
  description: 'Portail citoyen de la Province de Médiouna',
};

/**
 * Layout racine minimal - Next.js App Router avec next-intl
 * Ce layout est un pass-through car le vrai layout est dans app/[locale]/layout.tsx
 * IMPORTANT: Ne pas inclure <html> ou <body> ici car ils sont dans le layout locale
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Pass-through direct - les balises html/body sont gérées par app/[locale]/layout.tsx
  return children;
}

