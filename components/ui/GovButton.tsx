'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * GovButton — Composant Bouton Universel
 * Design System Gouvernemental Marocain — Province de Médiouna
 *
 * Variantes : primary | secondary | outline | gold | success | danger | ghost | link
 * Tailles    : sm | md | lg | xl | icon
 * Props      : loading, leftIcon, rightIcon, asChild
 */
const govButtonVariants = cva(
  // Base commune
  [
    'inline-flex items-center justify-center gap-2',
    'font-semibold rounded-xl whitespace-nowrap',
    'transition-all duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.97]',
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        /** Bleu administratif — action principale */
        primary: [
          'bg-[hsl(var(--gov-blue))] text-white',
          'hover:bg-[hsl(var(--gov-blue-dark))] hover:shadow-lg hover:shadow-[hsl(var(--gov-blue)/0.25)]',
          'focus-visible:ring-[hsl(var(--gov-blue))]',
        ].join(' '),

        /** Fond blanc + bordure bleue — action secondaire */
        secondary: [
          'bg-background text-[hsl(var(--gov-blue))]',
          'border-2 border-[hsl(var(--gov-blue))]',
          'hover:bg-[hsl(var(--gov-blue)/0.06)] hover:shadow-md',
          'focus-visible:ring-[hsl(var(--gov-blue))]',
        ].join(' '),

        /** Bord léger — actions tertiaires */
        outline: [
          'bg-transparent text-foreground',
          'border border-border',
          'hover:bg-muted hover:border-muted-foreground/30',
          'focus-visible:ring-[hsl(var(--gov-blue))]',
        ].join(' '),

        /** Or Royal — CTA premium / accentuation */
        gold: [
          'bg-gradient-to-r from-[hsl(var(--gov-gold-dark))] to-[hsl(var(--gov-gold))]',
          'text-[hsl(var(--foreground))] font-bold',
          'hover:shadow-lg hover:shadow-[hsl(var(--gov-gold)/0.3)] hover:brightness-110',
          'focus-visible:ring-[hsl(var(--gov-gold))]',
        ].join(' '),

        /** Vert officiel — confirmation / validation */
        success: [
          'bg-[hsl(var(--gov-green))] text-white',
          'hover:bg-[hsl(var(--gov-green-dark))] hover:shadow-lg hover:shadow-[hsl(var(--gov-green)/0.25)]',
          'focus-visible:ring-[hsl(var(--gov-green))]',
        ].join(' '),

        /** Rouge marocain — suppression / danger */
        danger: [
          'bg-[hsl(var(--gov-red))] text-white',
          'hover:bg-[hsl(var(--gov-red-dark))] hover:shadow-lg hover:shadow-[hsl(var(--gov-red)/0.25)]',
          'focus-visible:ring-[hsl(var(--gov-red))]',
        ].join(' '),

        /** Fantôme — action discrète dans un contexte coloré */
        ghost: [
          'bg-transparent text-foreground',
          'hover:bg-muted',
          'focus-visible:ring-[hsl(var(--gov-blue))]',
        ].join(' '),

        /** Lien stylisé */
        link: [
          'bg-transparent text-[hsl(var(--gov-blue))]',
          'underline-offset-4 hover:underline',
          'focus-visible:ring-[hsl(var(--gov-blue))]',
          'h-auto p-0',
        ].join(' '),
      },

      size: {
        sm:   'h-8 px-3 text-xs [&_svg]:size-3.5',
        md:   'h-10 px-5 text-sm [&_svg]:size-4',
        lg:   'h-12 px-7 text-sm [&_svg]:size-4',
        xl:   'h-14 px-10 text-base [&_svg]:size-5',
        icon: 'h-10 w-10 [&_svg]:size-4',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface GovButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof govButtonVariants> {
  /** Affiche un spinner et désactive le bouton */
  loading?: boolean;
  /** Icône à gauche du label */
  leftIcon?: React.ReactNode;
  /** Icône à droite du label */
  rightIcon?: React.ReactNode;
  /** Remplace le rendu par le composant enfant (ex : Link) */
  asChild?: boolean;
}

const GovButton = React.forwardRef<HTMLButtonElement, GovButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      asChild = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        ref={ref}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        className={cn(govButtonVariants({ variant, size }), className)}
        {...props}
      >
        {loading ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          leftIcon && <span aria-hidden="true">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span aria-hidden="true">{rightIcon}</span>
        )}
      </Comp>
    );
  }
);

GovButton.displayName = 'GovButton';

export { GovButton, govButtonVariants };
