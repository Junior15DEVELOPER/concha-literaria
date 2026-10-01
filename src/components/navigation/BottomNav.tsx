import React from 'react';
import { Home, BookMarked, Timer, Compass, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export type TabType = 'home' | 'library' | 'reading' | 'discover' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onTabChange }) => {
  const { activeSession } = useApp();

  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'home', label: 'Início', icon: Home },
    { id: 'library', label: 'Biblioteca', icon: BookMarked },
    { id: 'reading', label: 'Leitura', icon: Timer },
    { id: 'discover', label: 'Descobrir', icon: Compass },
    { id: 'profile', label: 'Perfil', icon: User }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-surface/95 backdrop-blur-md border-t border-border/60 pb-[env(safe-area-inset-bottom)] transition-all">
      <div className="max-w-md mx-auto flex items-center justify-around px-2 py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isTimerTab = tab.id === 'reading';

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
                isActive
                  ? 'text-primary font-semibold'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-hover/50'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-6 h-6 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'scale-100 stroke-[1.8]'
                  }`}
                />
                {/* Active Reading Timer Pulse Indicator */}
                {isTimerTab && activeSession && (
                  <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary" />
                  </span>
                )}
              </div>

              <span className={`text-[11px] mt-1 tracking-tight ${isActive ? 'font-bold' : 'font-medium'}`}>
                {tab.label}
              </span>

              {/* Active Indicator Underline Bar */}
              {isActive && (
                <div className="absolute -bottom-1 w-6 h-0.5 bg-primary rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
