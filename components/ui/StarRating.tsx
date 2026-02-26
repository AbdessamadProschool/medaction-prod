'use client';

import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  size?: number;
  interactive?: boolean;
  onChange?: (value: number) => void;
  showValue?: boolean;
  className?: string;
}

export function StarRating({
  value,
  size = 20,
  interactive = false,
  onChange,
  showValue = false,
  className = '',
}: StarRatingProps) {
  const handleClick = (rating: number) => {
    if (interactive && onChange) {
      onChange(rating);
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => handleClick(i)}
          className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
        >
          <Star
            size={size}
            className={`transition-colors ${
              i <= value
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        </button>
      ))}
      {showValue && (
        <span className="ml-2 text-sm font-medium text-gray-600 dark:text-gray-400">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}

interface RatingDistributionProps {
  distribution: Record<number, number>;
  className?: string;
}

export function RatingDistribution({ distribution, className = '' }: RatingDistributionProps) {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  const getPercentage = (count: number) => {
    return total > 0 ? (count / total) * 100 : 0;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {[5, 4, 3, 2, 1].map((note) => (
        <div key={note} className="flex items-center gap-2">
          <div className="flex items-center gap-0.5 w-12">
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{note}</span>
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
          </div>
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
              style={{ width: `${getPercentage(distribution[note] || 0)}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 w-8 text-right">
            {distribution[note] || 0}
          </span>
        </div>
      ))}
    </div>
  );
}

interface RatingSummaryProps {
  noteMoyenne: number;
  nombreEvaluations: number;
  distribution?: Record<number, number>;
  compact?: boolean;
  className?: string;
}

export function RatingSummary({
  noteMoyenne,
  nombreEvaluations,
  distribution,
  compact = false,
  className = '',
}: RatingSummaryProps) {
  if (compact) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <StarRating value={noteMoyenne} size={14} />
        <span className="text-sm text-gray-500">
          {noteMoyenne.toFixed(1)} ({nombreEvaluations})
        </span>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="text-center mb-4">
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {noteMoyenne.toFixed(1)}
        </div>
        <StarRating value={noteMoyenne} size={20} />
        <p className="text-sm text-gray-500 mt-1">
          {nombreEvaluations} avis
        </p>
      </div>
      {distribution && <RatingDistribution distribution={distribution} />}
    </div>
  );
}

export default StarRating;
