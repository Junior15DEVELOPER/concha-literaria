import React from 'react';
import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="bg-amber-600/95 text-white px-4 py-2 text-xs md:text-sm font-medium flex items-center justify-center gap-2 shadow-sm transition-all sticky top-0 z-50 backdrop-blur-sm"
    >
      <WifiOff className="w-4 h-4 animate-pulse" />
      <span>
        Você está offline. Visualizando dados em cache. Novas gravações remotas serão pausadas até a conexão retornar.
      </span>
    </div>
  );
};
