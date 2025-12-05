import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - MedAction',
  description: 'Connectez-vous à votre compte MedAction',
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
