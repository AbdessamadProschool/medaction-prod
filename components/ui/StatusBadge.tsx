'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * StatusBadge — Badge de Statut Universel
 * Design System Gouvernemental Marocain — Province de Médiouna
 *
 * Remplace tous les spans ad-hoc de statut dans les tableaux admin.
 * Supporte une icône optionnelle + animation pulse pour les états urgents.
 *
 * Couleurs : blue | green | gold | red | purple | muted
 * Tailles  : sm | md | lg
 */

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

export interface StatusBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'color'>,
    VariantProps<typeof statusBadgeVariants> {
  /** Icône lucide-react */
  icon?: React.ElementType;
  /** Ajoute animation pulse (pour statuts urgents/en attente) */
  pulse?: boolean;
}

export function StatusBadge({
  children,
  icon: Icon,
  color,
  size,
  pulse = false,
  className,
  ...props
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        statusBadgeVariants({ color, size }),
        pulse && 'animate-pulse',
        className
      )}
      {...props}
    >
      {Icon && <Icon aria-hidden="true" />}
      {children}
    </span>
  );
}

// ─────────────────────────────────────────────
// Helpers pré-configurés pour les statuts métier
// ─────────────────────────────────────────────

/**
 * Mappe un statut Prisma → props StatusBadge
 * Usage : <StatusBadge {...resolveReclamationStatus(reclamation.statut)} />
 */
export type ReclamationStatut =
  | 'SOUMISE'
  | 'EN_COURS_TRAITEMENT'
  | 'RESOLUE'
  | 'REJETEE'
  | 'FERMEE';

import {
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  Archive,
} from 'lucide-react';

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

import {
  FileText,
  ShieldCheck,
  PlayCircle,
  FlagOff,
  AlertTriangle,
} from 'lucide-react';

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
