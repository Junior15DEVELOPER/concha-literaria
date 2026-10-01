import React from 'react';
import { Flame, Plus, Moon, Sun, BookOpen, LogIn, User as UserIcon } from 'lucide-react';
import { ConchaLogo } from '../common/ConchaLogo';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface HeaderProps {
  onOpenAddBook: () => void;
  onOpenStreakInfo: () => void;
  onOpenAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenAddBook, onOpenStreakInfo, onOpenAuth }) => {
  const { user, currentStreak, updateUserProfile } = useApp();
  const { user: authUser, isAuthenticated } = useAuth();

  const toggleTheme = () => {
    const nextTheme =
      user.themePreference === 'light'
        ? 'dark'
        : user.themePreference === 'dark'
        ? 'sepia'
        : 'light';

    updateUserProfile({ themePreference: nextTheme });
    document.documentElement.classList.remove('dark', 'theme-sepia');
    if (nextTheme === 'dark') document.documentElement.classList.add('dark');
    if (nextTheme === 'sepia') document.documentElement.classList.add('theme-sepia');
  };

  return (
    <header className="sticky top-0 z-30 bg-bg/90 backdrop-blur-md border-b border-border/40 px-4 py-3">
      <div className="max-w-md mx-auto flex items-center justify-between">
        {/* Logo */}
        <ConchaLogo variant="full" size="md" />

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Streak Counter Pill */}
          <button
            onClick={onOpenStreakInfo}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-surface border border-border text-ink font-semibold text-xs shadow-xs hover:border-accent transition-all active:scale-95"
            title="Sua sequência de leitura"
          >
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-accent fill-accent animate-pulse' : 'text-ink-faint'}`} />
            <span>{currentStreak} <span className="font-normal text-[11px] text-ink-muted">dias</span></span>
          </button>

          {/* Quick Theme Switcher */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-surface border border-border text-ink-muted hover:text-ink transition-all active:scale-95 shadow-xs"
            title="Alternar tema"
          >
            {user.themePreference === 'dark' ? (
              <Sun className="w-4 h-4 text-gold" />
            ) : user.themePreference === 'sepia' ? (
              <BookOpen className="w-4 h-4 text-[#87361E]" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          {/* Auth Button or User Avatar */}
          {isAuthenticated && authUser ? (
            <button
              onClick={onOpenAuth}
              className="w-8 h-8 rounded-full border border-border overflow-hidden bg-primary/10 flex items-center justify-center shrink-0 active:scale-95 shadow-xs"
              title={`Logado como @${authUser.username}`}
            >
              {authUser.profile?.avatarUrl ? (
                <img src={authUser.profile.avatarUrl} alt={authUser.name} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-4 h-4 text-primary" />
              )}
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-surface hover:bg-surface-hover border border-border text-ink font-semibold text-xs transition-all active:scale-95 shadow-xs"
              title="Entrar ou criar conta"
            >
              <LogIn className="w-3.5 h-3.5 text-primary" />
              <span>Entrar</span>
            </button>
          )}

          {/* Quick Add Book Action */}
          <button
            onClick={onOpenAddBook}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary hover:bg-primary-hover text-white text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden xs:inline">Adicionar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
