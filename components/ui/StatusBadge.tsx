'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const statusBadgeVariants = cva(
  [
    'inline-flex items-center gap-1.5 font-black uppercase tracking-widest',
    'rounded-full border shadow-sm',
    'transition-colors duration-200',
  ].join(' '),
  {
    variants: {
      color: {
        blue: [
          'bg-[hsl(var(--gov-blue)/0.08)]',
          'text-[hsl(var(--gov-blue))]',
          'border-[hsl(var(--gov-blue)/0.2)]',
        ].join(' '),

        green: [
          'bg-[hsl(var(--gov-green)/0.08)]',
          'text-[hsl(var(--gov-green))]',
          'border-[hsl(var(--gov-green)/0.2)]',
        ].join(' '),

        gold: [
          'bg-[hsl(var(--gov-gold)/0.12)]',
          'text-[hsl(var(--gov-gold-dark))]',
          'border-[hsl(var(--gov-gold)/0.3)]',
        ].join(' '),

        red: [
          'bg-[hsl(var(--gov-red)/0.08)]',
          'text-[hsl(var(--gov-red))]',
          'border-[hsl(var(--gov-red)/0.2)]',
        ].join(' '),

        purple: [
          'bg-purple-50 dark:bg-purple-950/30',
          'text-purple-700 dark:text-purple-300',
          'border-purple-200 dark:border-purple-800',
        ].join(' '),

        muted: [
          'bg-muted',
          'text-muted-foreground',
          'border-border',
        ].join(' '),
      },

      size: {
        sm: 'text-[9px] px-2 py-0.5 [&_svg]:size-2.5',
        md: 'text-[10px] px-3 py-1 [&_svg]:size-3',
        lg: 'text-xs px-4 py-1.5 [&_svg]:size-3.5',
      },
    },
    defaultVariants: {
      color: 'muted',
      size: 'md',
    },
  }
);

export type StatusType = 
  | 'SOUMISE' 
  | 'ACCEPTEE' 
  | 'EN_COURS' 
  | 'RESOLUE' 
  | 'REJETEE' 
  | 'ANNULEE' 
  | 'EN_ATTENTE_VALIDATION' 
  | 'VALIDEE' 
  | 'PUBLIEE' 
  | 'CLOTUREE'
  | string;

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof statusBadgeVariants> {
  icon?: React.ElementType;
  pulse?: boolean;
  status?: StatusType; // Added for new Etape 6 usage
  animate?: boolean; // Added for new Etape 6 usage
}

import {
  Send,
  Loader2,
  CheckCircle2,
  XCircle,
  Ban,
  Clock,
  ShieldCheck,
  Globe,
  Lock,
  Archive,
  FileText,
  PlayCircle,
  FlagOff,
  AlertTriangle,
  CheckSquare
} from 'lucide-react';

const NEW_STATUS_CONFIG: Record<string, { color: "blue" | "green" | "gold" | "red" | "purple" | "muted", icon: React.ElementType, pulse?: boolean }> = {
  SOUMISE: { color: 'blue', icon: Send },
  ACCEPTEE: { color: 'blue', icon: CheckSquare },
  EN_COURS: { color: 'gold', icon: Loader2, pulse: true },
  RESOLUE: { color: 'green', icon: CheckCircle2 },
  REJETEE: { color: 'red', icon: XCircle },
  ANNULEE: { color: 'muted', icon: Ban },
  EN_ATTENTE_VALIDATION: { color: 'gold', icon: Clock, pulse: true },
  VALIDEE: { color: 'green', icon: ShieldCheck },
  PUBLIEE: { color: 'blue', icon: Globe },
  CLOTUREE: { color: 'muted', icon: Lock },
};

export function StatusBadge({
  children,
  icon: IconProp,
  color: colorProp,
  size,
  pulse: pulseProp,
  status,
  animate,
  className,
  ...props
}: StatusBadgeProps) {
  const t = useTranslations('admin.status');
  
  // If status is provided (New Étape 6 API)
  let finalColor = colorProp;
  let finalIcon = IconProp;
  let finalPulse = pulseProp;
  let finalChildren = children;

  if (status) {
    const normalizedStatus = status.toUpperCase();
    const config = NEW_STATUS_CONFIG[normalizedStatus] || { color: 'muted', icon: Clock };
    
    finalColor = config.color;
    finalIcon = config.icon;
    finalPulse = animate !== undefined ? animate : config.pulse;
    
    const translationKey = status.toLowerCase();
    finalChildren = t.has(translationKey) ? t(translationKey) : status;
  }

  const FinalIcon = finalIcon;

  return (
    <span
      className={cn(
        statusBadgeVariants({ color: finalColor, size }),
        finalPulse && 'animate-pulse opacity-80',
        FinalIcon && FinalIcon === Loader2 && 'animate-spin',
        className
      )}
      {...props}
    >
      {FinalIcon && <FinalIcon aria-hidden="true" />}
      {finalChildren}
    </span>
  );
}

// ─────────────────────────────────────────────
// Helpers pré-configurés pour les statuts métier (BACKWARDS COMPATIBILITY)
// ─────────────────────────────────────────────

export type ReclamationStatut =
  | 'SOUMISE'
  | 'EN_COURS_TRAITEMENT'
  | 'RESOLUE'
  | 'REJETEE'
  | 'FERMEE';

export function resolveReclamationStatus(statut: ReclamationStatut): Pick<StatusBadgeProps, 'color' | 'icon' | 'pulse'> {
  const map: Record<ReclamationStatut, Pick<StatusBadgeProps, 'color' | 'icon' | 'pulse'>> = {
    SOUMISE:              { color: 'gold',   icon: Clock,        pulse: true  },
    EN_COURS_TRAITEMENT:  { color: 'blue',   icon: Loader2,      pulse: false },
    RESOLUE:              { color: 'green',  icon: CheckCircle2, pulse: false },
    REJETEE:              { color: 'red',    icon: XCircle,      pulse: false },
    FERMEE:               { color: 'muted',  icon: Archive,      pulse: false },
  };
  return map[statut] ?? { color: 'muted', pulse: false };
}

export type EvenementStatut =
  | 'BROUILLON'
  | 'EN_ATTENTE_VALIDATION'
  | 'VALIDE'
  | 'EN_COURS'
  | 'TERMINE'
  | 'A_CLOTURER'
  | 'CLOTURE'
  | 'ANNULE';

export function resolveEvenementStatus(statut: EvenementStatut): Pick<StatusBadgeProps, 'color' | 'icon' | 'pulse'> {
  const map: Record<EvenementStatut, Pick<StatusBadgeProps, 'color' | 'icon' | 'pulse'>> = {
    BROUILLON:             { color: 'muted',  icon: FileText,      pulse: false },
    EN_ATTENTE_VALIDATION: { color: 'gold',   icon: Clock,         pulse: true  },
    VALIDE:                { color: 'blue',   icon: ShieldCheck,   pulse: false },
    EN_COURS:              { color: 'green',  icon: PlayCircle,    pulse: false },
    TERMINE:               { color: 'muted',  icon: CheckCircle2,  pulse: false },
    A_CLOTURER:            { color: 'gold',   icon: AlertTriangle, pulse: true  },
    CLOTURE:               { color: 'green',  icon: CheckCircle2,  pulse: false },
    ANNULE:                { color: 'red',    icon: FlagOff,       pulse: false },
  };
  return map[statut] ?? { color: 'muted', pulse: false };
}
