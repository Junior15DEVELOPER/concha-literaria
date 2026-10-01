import React from 'react';
import { BookOpen } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <BookOpen className="w-10 h-10 text-primary/60" />,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div className={`flex flex-col items-center justify-center text-center p-8 rounded-3xl border border-dashed border-border/70 bg-surface/50 my-6 ${className || ''}`}>
      <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center mb-4 shadow-inner">
        {icon}
      </div>
      <h3 className="font-serif text-lg font-bold text-ink mb-1.5">{title}</h3>
      <p className="text-xs text-ink-muted max-w-xs leading-relaxed mb-5">{description}</p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
