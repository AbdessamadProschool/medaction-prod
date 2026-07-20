'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  const t = useTranslations('pagination');

  if (totalPages <= 1) return null;

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages, start + maxVisible - 1);
    
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }

    if (start > 1) {
      pages.push(
        <button
          key={1}
          onClick={() => onPageChange(1)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all hover:bg-muted text-foreground border border-transparent hover:border-border"
        >
          1
        </button>
      );
      if (start > 2) {
        pages.push(<span key="dots-start" className="px-1 text-muted-foreground">...</span>);
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => onPageChange(i)}
          className={`w-10 h-10 flex items-center justify-center rounded-xl text-sm font-bold transition-all ${
            currentPage === i
              ? 'bg-[hsl(var(--gov-blue))] text-white shadow-lg shadow-[hsl(var(--gov-blue))]/20 active:scale-95'
              : 'text-foreground hover:bg-muted border border-transparent hover:border-border active:scale-95'
          }`}
        >
          {i}
        </button>
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(<span key="dots-end" className="px-1 text-muted-foreground">...</span>);
      }
      pages.push(
        <button
          key={totalPages}
          onClick={() => onPageChange(totalPages)}
          className="w-10 h-10 flex items-center justify-center rounded-xl text-sm font-medium transition-all hover:bg-muted text-foreground border border-transparent hover:border-border"
        >
          {totalPages}
        </button>
      );
    }

    return pages;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-12 bg-card p-4 rounded-2xl border border-border shadow-sm"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage <= 1}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 group"
      >
        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform rtl:rotate-180" />
        <span className="hidden sm:inline">{t('prev')}</span>
      </button>

      <div className="flex items-center gap-1">
        {renderPageNumbers()}
      </div>

      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage >= totalPages}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-foreground bg-card border border-border rounded-xl hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95 group"
      >
        <span className="hidden sm:inline">{t('next')}</span>
        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform rtl:rotate-180" />
      </button>
    </motion.div>
  );
}
