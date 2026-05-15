'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * GovTable — Système de Table Administrative
 * Design System Gouvernemental Marocain — Province de Médiouna
 */

interface GovTableProps extends React.HTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
}

const GovTable = React.forwardRef<HTMLTableElement, GovTableProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => {
    return (
      <div className={cn('gov-table-wrapper bg-card/50 backdrop-blur-sm shadow-xl rounded-xl overflow-hidden border border-border', wrapperClassName)}>
        <table
          ref={ref}
          className={cn('gov-table w-full border-collapse font-sans', className)}
          {...props}
        >
          {children}
        </table>
      </div>
    );
  }
);
GovTable.displayName = 'GovTable';

const GovTh = React.forwardRef<HTMLTableCellElement, React.ThHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <th
      ref={ref}
      className={cn(
        'px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider bg-[#1E3A5F] border-b border-[#1E3A5F]/10',
        className
      )}
      {...props}
    />
  )
);
GovTh.displayName = 'GovTh';

const GovTd = React.forwardRef<HTMLTableCellElement, React.TdHTMLAttributes<HTMLTableCellElement>>(
  ({ className, ...props }, ref) => (
    <td
      ref={ref}
      className={cn('px-6 py-4 text-[13px] text-foreground border-b border-border/50 font-medium', className)}
      {...props}
    />
  )
);
GovTd.displayName = 'GovTd';

const GovTr = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        'transition-all group cursor-pointer border-b border-border/50 last:border-0',
        'even:bg-[#F9FAFB] dark:even:bg-white/5',
        'hover:bg-[#FFFBEB] dark:hover:bg-[#FFFBEB]/10 hover:shadow-sm hover:z-10 relative',
        className
      )}
      {...props}
    />
  )
);
GovTr.displayName = 'GovTr';

export { GovTable, GovTh, GovTd, GovTr };
