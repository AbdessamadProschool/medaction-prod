import React from 'react';

interface GovPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
}

export function GovPageHeader({ title, subtitle, icon, badge, actions }: GovPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
      <div className="flex items-center gap-5">
        {icon && (
          <div className="shrink-0 w-14 h-14 bg-gradient-to-br from-[hsl(var(--gov-gold))/0.8] to-[hsl(var(--gov-gold))] rounded-2xl flex items-center justify-center text-[hsl(var(--gov-blue))] shadow-lg shadow-[hsl(var(--gov-gold))/0.3] ring-2 ring-white dark:ring-gray-900 group">
            <div className="group-hover:scale-110 transition-transform duration-500 text-white">
              {icon}
            </div>
          </div>
        )}
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              {title}
            </h1>
            {badge && (
              <span className="px-3 py-1 bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] text-[10px] font-black rounded-full uppercase tracking-widest border border-[hsl(var(--gov-blue))/0.2] whitespace-nowrap">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-muted-foreground text-sm font-medium max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
