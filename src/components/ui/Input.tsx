import React, { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className,
  id,
  ...props
}, ref) => {
  const generatedId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label htmlFor={generatedId} className="text-xs font-semibold text-ink-muted select-none">
          {label}
        </label>
      )}
      <div className="relative flex items-center">
        {leftIcon && (
          <div className="absolute left-3 text-ink-faint pointer-events-none flex items-center">
            {leftIcon}
          </div>
        )}
        <input
          id={generatedId}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${generatedId}-error` : helperText ? `${generatedId}-helper` : undefined}
          className={twMerge(
            clsx(
              'w-full bg-surface border rounded-xl py-2 text-sm text-ink placeholder:text-ink-faint transition-all duration-200 outline-none',
              leftIcon ? 'pl-9' : 'pl-3.5',
              rightIcon ? 'pr-9' : 'pr-3.5',
              error
                ? 'border-red-500 focus:border-red-600 focus:ring-2 focus:ring-red-500/20'
                : 'border-border/60 focus:border-primary focus:ring-2 focus:ring-primary/20',
              className
            )
          )}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 text-ink-faint flex items-center">
            {rightIcon}
          </div>
        )}
      </div>
      {error ? (
        <span id={`${generatedId}-error`} className="text-xs text-red-500 font-medium">
          {error}
        </span>
      ) : helperText ? (
        <span id={`${generatedId}-helper`} className="text-xs text-ink-faint">
          {helperText}
        </span>
      ) : null}
    </div>
  );
});

Input.displayName = 'Input';
