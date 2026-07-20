import React from 'react';

interface GovCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export function GovCard({ children, className = '', onClick, hoverable = false }: GovCardProps) {
  return (
    <div
      onClick={onClick}
      className={`bg-card rounded-[2rem] border border-border/50 shadow-sm ${
        hoverable ? 'hover:shadow-md hover:border-border transition-all cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}

interface GovCardHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function GovCardHeader({ title, subtitle, icon, action, className = '' }: GovCardHeaderProps) {
  return (
    <div className={`px-6 py-5 sm:px-8 sm:py-6 border-b border-border/50 flex flex-wrap gap-4 justify-between items-start ${className}`}>
      <div className="flex gap-4 items-start">
        {icon && (
          <div className="shrink-0 w-10 h-10 rounded-xl bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-lg font-extrabold tracking-tight text-foreground">{title}</h3>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function GovCardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 sm:p-8 ${className}`}>{children}</div>;
}

export function GovCardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={`px-6 py-4 sm:px-8 sm:py-5 border-t border-border/50 bg-muted/20 ${className}`}>{children}</div>;
}
