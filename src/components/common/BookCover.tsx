import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface BookCoverProps {
  coverUrl?: string;
  title: string;
  author?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showSpine?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({
  coverUrl,
  title,
  author,
  size = 'md',
  className = '',
  showSpine = true
}) => {
  const [imgError, setImgError] = useState(false);

  const sizeClasses = {
    xs: 'w-10 h-14 rounded-sm text-[8px]',
    sm: 'w-16 h-24 rounded text-[10px]',
    md: 'w-24 h-36 rounded-md text-xs',
    lg: 'w-32 h-48 rounded-md text-sm',
    xl: 'w-44 h-64 rounded-lg text-base'
  };

  const hasValidCover = coverUrl && !imgError;

  return (
    <div
      className={`relative shrink-0 overflow-hidden bg-surface shadow-md transition-all duration-300 ${
        showSpine ? 'book-spine-shadow' : ''
      } ${sizeClasses[size]} ${className}`}
    >
      {hasValidCover ? (
        <img
          src={coverUrl}
          alt={title}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover select-none"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-gradient-to-br from-[#8B3224] to-[#451B14] text-[#FDFBF7] relative">
          <BookOpen className="w-5 h-5 mb-1 opacity-70" />
          <p className="font-serif font-semibold line-clamp-2 leading-tight">
            {title}
          </p>
          {author && (
            <p className="text-[10px] opacity-75 line-clamp-1 mt-1 font-sans">
              {author}
            </p>
          )}
          {/* Subtle book bookmark ribbon */}
          <div className="absolute top-0 right-2 w-2 h-4 bg-gold rounded-b-sm shadow-sm" />
        </div>
      )}

      {/* Glossy overlay for realism */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-black/15 mix-blend-overlay" />
    </div>
  );
};
