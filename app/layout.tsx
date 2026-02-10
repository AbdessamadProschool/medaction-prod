import { ReactNode } from 'react';

export const metadata = {
    title: 'Medaction',
    description: 'Portail Province Médiouna',
};

// Layout racine OBLIGATOIRE pour Next.js App Router
// Il doit contenir html et body.
export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html>
            <body>{children}</body>
        </html>
    );
}
