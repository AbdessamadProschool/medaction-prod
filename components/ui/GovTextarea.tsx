'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export interface GovTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

const GovTextarea = forwardRef<HTMLTextAreaElement, GovTextareaProps>(
  ({ label, error, containerClassName, className, ...props }, ref) => {
    return (
      <div className={cn('w-full space-y-1.5', containerClassName)}>
        {label && (
          <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">
            {label}
          </label>
        )}
        <div className="relative group">
          <textarea
            ref={ref}
            className={cn(
              "w-full bg-muted/30 border border-border rounded-xl px-4 py-3 text-sm font-medium transition-all placeholder:text-muted-foreground/50 min-h-[120px] resize-y",
              "focus:outline-none focus:ring-4 focus:ring-[hsl(var(--gov-blue))/0.1] focus:border-[hsl(var(--gov-blue))]",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error && "border-red-500 focus:ring-red-500/10 focus:border-red-500",
              className
            )}
            {...props}
          />
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

GovTextarea.displayName = 'GovTextarea';

export { GovTextarea };
