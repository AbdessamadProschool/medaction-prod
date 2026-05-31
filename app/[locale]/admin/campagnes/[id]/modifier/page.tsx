import { useTranslations } from 'next-intl';
import { Construction } from 'lucide-react';
import Link from 'next/link';
import { GovButton } from '@/components/ui/GovButton';

export default function EditCampagnePage({ params }: { params: { id: string } }) {
  const t = useTranslations();
  
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-background rounded-3xl border border-border shadow-sm">
      <div className="w-24 h-24 bg-[hsl(var(--gov-gold))/0.1] rounded-full flex items-center justify-center mb-6 border-4 border-background shadow-xl">
        <Construction className="w-12 h-12 text-[hsl(var(--gov-gold))]" />
      </div>
      <h1 className="text-3xl font-extrabold text-foreground mb-4">
        Page en cours de développement
      </h1>
      <p className="text-muted-foreground font-medium max-w-lg mb-8">
        La modification de la campagne (ID: {params.id}) sera bientôt disponible dans une prochaine mise à jour du portail.
      </p>
      <GovButton asChild variant="primary">
        <Link href="/admin/campagnes">
          Retour aux campagnes
        </Link>
      </GovButton>
    </div>
  );
}
