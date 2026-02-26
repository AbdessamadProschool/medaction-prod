import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - Portail Mediouna',
  description: 'Connectez-vous à votre compte Portail Mediouna',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
