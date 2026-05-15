'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface GovInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

const GovInput = forwardRef<HTMLInputElement, GovInputProps>(
  ({ label, error, leftIcon, rightIcon, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-medium transition-all placeholder:text-muted-foreground/50",
              "focus:outline-none focus:ring-4 focus:ring-[hsl(var(--gov-blue))/0.1] focus:border-[hsl(var(--gov-blue))]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "",
              leftIcon ? "pl-11" : "",
              rightIcon ? "pr-11" : "",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-1.5 px-1 mt-1 text-red-500">
            <AlertCircle size={12} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{error}</span>
          </div>
        )}
      </div>
    );
  }
);

GovInput.displayName = 'GovInput';

export { GovInput };
