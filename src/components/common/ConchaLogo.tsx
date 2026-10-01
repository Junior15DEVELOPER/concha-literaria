import React from 'react';

interface ConchaLogoProps {
  variant?: 'symbol' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  theme?: 'auto' | 'light' | 'dark' | 'mono';
  className?: string;
}

export const ConchaLogo: React.FC<ConchaLogoProps> = ({
  variant = 'full',
  size = 'md',
  theme = 'auto',
  className = ''
}) => {
  const sizeMap = {
    sm: { symbol: 28, text: 'text-base', sub: 'text-[9px]' },
    md: { symbol: 38, text: 'text-xl', sub: 'text-[11px]' },
    lg: { symbol: 52, text: 'text-2xl', sub: 'text-xs' },
    xl: { symbol: 72, text: 'text-3xl', sub: 'text-sm' }
  };

  const currentSize = sizeMap[size];

  // Colors based on theme
  const getGradients = () => {
    if (theme === 'mono') {
      return {
        shell1: '#4A4A4A',
        shell2: '#222222',
        page: '#FFFFFF',
        stroke: '#000000',
        pearl: '#DDDDDD'
      };
    }
    return {
      shell1: '#8B3224',
      shell2: '#BA4E36',
      shell3: '#D97757',
      page: '#FDFBF7',
      stroke: '#BA4E36',
      gold: '#F3C363'
    };
  };

  const g = getGradients();

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* SVG Shell + Book Symbol */}
      <svg
        width={currentSize.symbol}
        height={currentSize.symbol}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 transition-transform duration-300 hover:scale-105"
      >
        <defs>
          <linearGradient id="logoShellGrad" x1="10" y1="90" x2="90" y2="10" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={g.shell1} />
            <stop offset="50%" stopColor={g.shell2} />
            <stop offset="100%" stopColor={g.shell3 || g.shell2} />
          </linearGradient>
          <linearGradient id="logoGoldGrad" x1="20" y1="20" x2="80" y2="80" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#F3C363" />
            <stop offset="100%" stopColor="#D49438" />
          </linearGradient>
        </defs>

        {/* Shell Base */}
        <path
          d="M50 88 C32 88 14 74 12 50 C10 32 24 16 38 12 C44 10 50 16 50 22 C50 16 56 10 62 12 C76 16 90 32 88 50 C86 74 68 88 50 88 Z"
          fill="url(#logoShellGrad)"
        />

        {/* Shell Flutes / Outer Wings */}
        <path
          d="M50 82 C38 80 22 68 20 48 C18 36 28 24 38 20 C42 18 48 24 48 34"
          stroke="#FFF0E5"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.65"
        />
        <path
          d="M50 82 C62 80 78 68 80 48 C82 36 72 24 62 20 C58 18 52 24 52 34"
          stroke="#FFF0E5"
          strokeWidth="2.5"
          strokeLinecap="round"
          opacity="0.65"
        />

        {/* Left Book Page */}
        <path
          d="M50 76 C42 70 30 72 24 68 C22 56 25 40 28 32 C35 34 44 38 50 44 Z"
          fill={g.page}
          stroke={g.stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M47 48 C41 44 34 42 29 40" stroke="#D9A87D" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M47 56 C41 52 34 50 28 48" stroke="#D9A87D" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M47 64 C42 60 36 58 30 56" stroke="#D9A87D" strokeWidth="1.5" strokeLinecap="round" />

        {/* Right Book Page */}
        <path
          d="M50 76 C58 70 70 72 76 68 C78 56 75 40 72 32 C65 34 56 38 50 44 Z"
          fill={g.page}
          stroke={g.stroke}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M53 48 C59 44 66 42 71 40" stroke="#D9A87D" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 56 C59 52 66 50 72 48" stroke="#D9A87D" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M53 64 C58 60 64 58 70 56" stroke="#D9A87D" strokeWidth="1.5" strokeLinecap="round" />

        {/* Book Spine Center & Pearl */}
        <line x1="50" y1="42" x2="50" y2="77" stroke={g.stroke} strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="50" cy="30" r="4.5" fill="url(#logoGoldGrad)" />
        <circle cx="51.5" cy="28.5" r="1.5" fill="#FFFFFF" />
      </svg>

      {/* Typography variant */}
      {variant === 'full' && (
        <div className="flex flex-col text-left leading-none">
          <span className={`font-serif font-bold tracking-tight text-ink ${currentSize.text}`}>
            Concha Literária
          </span>
          <span className={`tracking-widest uppercase text-ink-muted/80 font-sans font-medium mt-0.5 ${currentSize.sub}`}>
            Sua biblioteca &middot; Seu diário
          </span>
        </div>
      )}
    </div>
  );
};
