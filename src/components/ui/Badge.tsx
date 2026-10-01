import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'spoiler';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'sm',
  className,
  ...props
}) => {
  const variants = {
    default: 'bg-surface-hover text-ink-muted border border-border/50',
    primary: 'bg-primary-light text-primary border border-primary/20 font-semibold',
    success: 'bg-sage-light text-sage border border-sage/20 font-semibold',
    warning: 'bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-950/40 dark:text-amber-300',
    info: 'bg-sky-100 text-sky-900 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300',
    spoiler: 'bg-rose-100 text-rose-800 border border-rose-300 font-bold tracking-wide uppercase dark:bg-rose-950/40 dark:text-rose-300'
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-full',
    md: 'text-xs px-2.5 py-1 rounded-full'
  };

  return (
    <span
      className={twMerge(
        clsx('inline-flex items-center gap-1 font-sans select-none', variants[variant], sizes[size], className)
      )}
      {...props}
    >
      {children}
    </span>
  );
};
