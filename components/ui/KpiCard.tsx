'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * KpiCard — Carte de Statistique KPI
 * Design System Gouvernemental Marocain — Province de Médiouna
 *
 * Remplace tous les blocs ad-hoc "gov-stat-card" dans admin/page.tsx et similaires.
 * Supporte : valeur, label, icône colorée, variation (±%), sous-valeur.
 */

export type KpiVariant = 'blue' | 'green' | 'gold' | 'red' | 'muted';

const VARIANT_COLORS: Record<KpiVariant, string> = {
  blue:  'hsl(var(--gov-blue))',
  green: 'hsl(var(--gov-green))',
  gold:  'hsl(var(--gov-gold))',
  red:   'hsl(var(--gov-red))',
  muted: 'hsl(var(--muted-foreground))',
};

export interface KpiCardProps {
  /** Libellé principal */
  label: string;
  /** Valeur affichée en grand */
  value: number | string;
  /** Icône lucide-react ou tout ReactNode */
  icon: React.ElementType;
  /** Couleur thème */
  variant?: KpiVariant;
  /** Variation en % — affiche badge TrendingUp/Down */
  change?: number;
  /** 'up' | 'down' | 'neutral' — direction de la variation */
  changeType?: 'up' | 'down' | 'neutral';
  /** Petite valeur en bas de la carte */
  subValue?: number | string;
  /** Label de la sous-valeur */
  subLabel?: string;
  /** Indice pour le stagger animation */
  index?: number;
  /** Classes CSS additionnelles */
  className?: string;
  /** Rend la carte cliquable */
  onClick?: () => void;
}

export function KpiCard({
  label,
  value,
  icon: Icon,
  variant = 'blue',
  change,
  changeType = 'neutral',
  subValue,
  subLabel,
  index = 0,
  className,
  onClick,
}: KpiCardProps) {
  const color = VARIANT_COLORS[variant];

  const changeColors = {
    up:      'bg-[hsl(var(--gov-green)/0.12)] text-[hsl(var(--gov-green))]',
    down:    'bg-[hsl(var(--gov-red)/0.12)] text-[hsl(var(--gov-red))]',
    neutral: 'bg-muted text-muted-foreground',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={cn(
        'gov-stat-card group relative overflow-hidden',
        onClick && 'cursor-pointer focus-visible:ring-2 focus-visible:ring-[hsl(var(--gov-blue))]',
        className
      )}
    >
      {/* Icône fantôme décorative en arrière-plan */}
      <div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 opacity-[0.03] transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12"
        style={{ color }}
        aria-hidden="true"
      >
        <Icon className="h-full w-full" />
      </div>

      <div className="relative z-10">
        {/* Ligne supérieure : icône + badge variation */}
        <div className="flex items-center justify-between mb-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-current/10"
            style={{ backgroundColor: `${color}0D`, color }}
          >
            <Icon className="h-5 w-5" />
          </div>

          {change !== undefined && (
            <span
              className={cn(
                'flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-wide',
                changeColors[changeType]
              )}
            >
              {changeType === 'up'   && <TrendingUp  size={10} aria-hidden="true" />}
              {changeType === 'down' && <TrendingDown size={10} aria-hidden="true" />}
              {changeType === 'neutral' && <Minus    size={10} aria-hidden="true" />}
              {change > 0 ? '+' : ''}{change}%
            </span>
          )}
        </div>

        {/* Valeur */}
        <p className="mb-1 text-3xl font-black tracking-tight text-foreground">
          {typeof value === 'number' ? value.toLocaleString('fr-MA') : value}
        </p>

        {/* Label */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {label}
        </p>

        {/* Sous-valeur optionnelle */}
        {subValue !== undefined && (
          <div className="mt-3 flex items-center gap-2 border-t border-border/50 pt-3">
            <span className="text-xs font-black text-foreground">
              {typeof subValue === 'number' ? subValue.toLocaleString('fr-MA') : subValue}
            </span>
            {subLabel && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/60">
                {subLabel}
              </span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * KpiGrid — Grille 4 colonnes auto-responsive pour cartes KPI
 */
export function KpiGrid({
  children,
  cols = 4,
  className,
}: {
  children: React.ReactNode;
  cols?: 2 | 3 | 4 | 5;
  className?: string;
}) {
  const colClass = {
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-2 lg:grid-cols-3',
    4: 'sm:grid-cols-2 lg:grid-cols-4',
    5: 'sm:grid-cols-2 lg:grid-cols-5',
  }[cols];

  return (
    <div className={cn('grid grid-cols-1 gap-6', colClass, className)}>
      {children}
    </div>
  );
}
