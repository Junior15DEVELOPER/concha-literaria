import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: 'bottom-sheet' | 'dialog';
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  variant = 'bottom-sheet',
  maxWidth = 'max-w-lg'
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Content Container */}
      <div
        className={`relative w-full ${maxWidth} bg-surface text-ink z-10 shadow-2xl transition-all ${
          variant === 'bottom-sheet'
            ? 'rounded-t-3xl sm:rounded-2xl max-h-[90vh] overflow-y-auto animate-slide-up pb-6 sm:pb-4'
            : 'rounded-2xl max-h-[85vh] overflow-y-auto animate-fade-in p-6'
        }`}
      >
        {/* Mobile drag handle for bottom sheet */}
        {variant === 'bottom-sheet' && (
          <div className="w-full flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 bg-border rounded-full" />
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2 border-b border-border/40">
          {title ? (
            <h3 className="font-serif text-lg font-bold text-ink tracking-tight">
              {title}
            </h3>
          ) : (
            <div />
          )}
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-ink-muted hover:text-ink rounded-full hover:bg-surface-hover transition-colors"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4">{children}</div>
      </div>
    </div>
  );
};
