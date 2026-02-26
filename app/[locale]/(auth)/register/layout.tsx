import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription - Portail Mediouna',
  description: 'Créez votre compte Portail Mediouna',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
