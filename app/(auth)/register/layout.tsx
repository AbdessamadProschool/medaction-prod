import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription - MedAction',
  description: 'Créez votre compte MedAction',
};

export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
