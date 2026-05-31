import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | Portail Médiouna',
  description: 'Tableau de bord de la province de Médiouna',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
