import React from 'react';

interface ProgressBarProps {
  current: number;
  total: number;
  showLabels?: boolean;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'gold' | 'sage';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  current,
  total,
  showLabels = true,
  size = 'md',
  color = 'primary',
  className = ''
}) => {
  const percentage = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-3.5'
  };

  const colorClasses = {
    primary: 'bg-gradient-to-r from-[#BA4E36] to-[#E07052]',
    gold: 'bg-gradient-to-r from-[#D49438] to-[#F3C363]',
    sage: 'bg-gradient-to-r from-[#366048] to-[#569B75]'
  };

  return (
    <div className={`w-full ${className}`}>
      {showLabels && (
        <div className="flex justify-between items-center text-xs font-medium text-ink-muted mb-1.5">
          <span>
            {current} <span className="text-ink-faint">/ {total} págs</span>
          </span>
          <span className="font-semibold text-ink">{percentage}%</span>
        </div>
      )}
      <div className={`w-full bg-border-subtle/80 rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`h-full transition-all duration-500 ease-out rounded-full ${colorClasses[color]}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
