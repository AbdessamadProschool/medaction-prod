'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface GovModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  align?: 'center' | 'top';
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '3xl': 'max-w-3xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  full: 'max-w-[95vw]',
};

export function GovModal({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  children,
  footer,
  maxWidth = '2xl',
  align = 'center',
}: GovModalProps) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex justify-center overflow-y-auto overflow-x-hidden"
             style={{ 
               alignItems: align === 'center' ? 'center' : 'flex-start',
               paddingTop: align === 'top' ? '2.5rem' : '0' 
             }}>
          
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-[100]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative z-[101] w-full ${maxWidthClasses[maxWidth]} m-4 sm:m-8 bg-card rounded-[2rem] shadow-2xl border border-border/60 overflow-hidden flex flex-col max-h-[calc(100vh-2rem)] sm:max-h-[calc(100vh-4rem)]`}
          >
            {/* Header */}
            {(title || icon) && (
              <div className="flex-none px-6 py-5 sm:px-8 sm:py-6 border-b border-border/50 bg-muted/20 flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  {icon && (
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-[hsl(var(--gov-blue))/0.1] text-[hsl(var(--gov-blue))] flex items-center justify-center border border-[hsl(var(--gov-blue))/0.2]">
                      {icon}
                    </div>
                  )}
                  <div>
                    {title && (
                      <h2 dir="auto" className="text-xl sm:text-2xl font-extrabold tracking-tight text-foreground">
                        {title}
                      </h2>
                    )}
                    {subtitle && (
                      <div dir="auto" className="text-sm font-medium text-muted-foreground mt-1">
                        {subtitle}
                      </div>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="shrink-0 p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
            
            {/* Close button if no header */}
            {!title && !icon && (
               <button
                 onClick={onClose}
                 className="absolute top-4 right-4 z-10 p-2 bg-background/80 backdrop-blur-md border border-border text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors shadow-sm"
               >
                 <X size={20} />
               </button>
            )}

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-6 sm:p-8">
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div className="flex-none px-6 py-5 sm:px-8 sm:py-5 border-t border-border/50 bg-muted/20">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
