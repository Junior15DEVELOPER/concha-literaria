import React, { HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'rectangular' | 'circular' | 'rounded';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rounded',
  className,
  ...props
}) => {
  const variants = {
    rectangular: 'rounded-none',
    rounded: 'rounded-xl',
    circular: 'rounded-full'
  };

  return (
    <div
      aria-hidden="true"
      className={twMerge(
        clsx(
          'animate-pulse bg-border/40',
          variants[variant],
          className
        )
      )}
      {...props}
    />
  );
};

export const BookCardSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-2 p-3 bg-surface rounded-2xl border border-border/40 animate-pulse">
      <Skeleton className="w-full aspect-[2/3] rounded-xl" />
      <Skeleton className="h-4 w-3/4 mt-1" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-2 w-full mt-2" />
    </div>
  );
};
