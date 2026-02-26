import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard | MedAction',
  description: 'Tableau de bord de la province de Médiouna',
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
