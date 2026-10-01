import React from 'react';
import { Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui';

interface ProtectedRouteProps {
  children: React.ReactNode;
  onOpenAuth: () => void;
  title?: string;
  description?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  onOpenAuth,
  title = 'Acesso Reservado',
  description = 'Faça login ou crie sua conta para acessar esta área e sincronizar sua jornada literária.'
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-8 my-8 bg-surface rounded-3xl border border-border/50">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h3 className="font-serif text-xl font-bold text-ink mb-2">{title}</h3>
        <p className="text-xs text-ink-muted max-w-sm leading-relaxed mb-6">
          {description}
        </p>
        <Button variant="primary" size="md" onClick={onOpenAuth}>
          Entrar ou Criar Conta
        </Button>
      </div>
    );
  }

  return <>{children}</>;
};
