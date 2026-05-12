import React from 'react';
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
};

export default function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center py-16 px-4 rounded-lg border border-dashed border-border bg-background/50", className)}>
      {icon && (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted/50 mb-4 text-muted-foreground">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6 leading-relaxed">
        {description}
      </p>
      {action && (
        <div>{action}</div>
      )}
    </div>
  );
}

//--------------------------------------------------------
//     EXEMPLE D'UTILISATION (MedAction)
//--------------------------------------------------------
// import { Search } from 'lucide-react';
// import { Button } from '@/components/ui/button';
//
// if (!reclamations.length) {
//   return (
//     <EmptyState
//       icon={<Search className="w-8 h-8" />}
//       title="Aucune réclamation trouvée"
//       description="Nous n'avons trouvé aucune réclamation correspondant à vos critères de recherche. Essayez de modifier vos filtres."
//       action={<Button variant="outline">Effacer les filtres</Button>}
//     />
//   );
// }
