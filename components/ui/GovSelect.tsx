'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, AlertCircle } from 'lucide-react';

export interface GovSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  containerClassName?: string;
  options: { label: string; value: string | number }[];
}

const GovSelect = forwardRef<HTMLSelectElement, GovSelectProps>(
  ({ label, error, leftIcon, containerClassName, className, options, ...props }, ref) => {
    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors pointer-events-none">
              {leftIcon}
            </div>
          )}
          <select
            ref={ref}
            className={cn(
              "w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-medium transition-all appearance-none",
              "focus:outline-none focus:ring-4 focus:ring-[hsl(var(--gov-blue))/0.1] focus:border-[hsl(var(--gov-blue))]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error ? "border-red-500 focus:ring-red-500/10 focus:border-red-500" : "",
              leftIcon ? "pl-11" : "",
              "pr-11",
              className
            )}
            {...props}
          >
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-[hsl(var(--gov-blue))] transition-colors pointer-events-none">
            <ChevronDown size={18} />
          </div>
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

GovSelect.displayName = 'GovSelect';

export { GovSelect };
