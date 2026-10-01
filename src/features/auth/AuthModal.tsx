import React, { useState } from 'react';
import { Mail, Lock, User, AtSign, ArrowRight, BookOpen, AlertCircle } from 'lucide-react';
import { Modal, Button, Input } from '../../components/ui';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/ui/Toast';
import { registerSchema, loginSchema } from '../../lib/validations';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(defaultMode);
  const { login, register, isLoading } = useAuth();
  const { toast } = useToast();

  // Estados dos campos
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Estados de erro
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setUsername('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setErrors({});
    setServerError(null);
  };

  const handleSwitchMode = (newMode: 'login' | 'register') => {
    resetForm();
    setMode(newMode);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError(null);

    if (mode === 'login') {
      const validation = loginSchema.safeParse({ email, password });
      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.issues.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(fieldErrors);
        return;
      }

      const res = await login({ email, password });
      if (res.success) {
        toast('Bem-vindo(a) de volta ao Concha Literária!', 'success');
        resetForm();
        onClose();
      } else {
        setServerError(res.error || 'Credenciais inválidas');
      }
    } else {
      const validation = registerSchema.safeParse({
        name,
        username,
        email,
        password,
        confirmPassword
      });

      if (!validation.success) {
        const fieldErrors: Record<string, string> = {};
        validation.error.issues.forEach((issue) => {
          if (issue.path[0]) fieldErrors[issue.path[0].toString()] = issue.message;
        });
        setErrors(fieldErrors);
        return;
      }

      const res = await register({
        name,
        username,
        email,
        password,
        confirmPassword
      });

      if (res.success) {
        toast('Conta criada com sucesso! Boas leituras.', 'success');
        resetForm();
        onClose();
      } else {
        setServerError(res.error || 'Não foi possível cadastrar');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="sm"
    >
      <div className="flex flex-col items-center text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-primary-light flex items-center justify-center text-primary mb-3 shadow-inner">
          <BookOpen className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-2xl font-bold text-ink">
          {mode === 'login' ? 'Acesse sua Concha' : 'Crie sua Biblioteca'}
        </h2>
        <p className="text-xs text-ink-muted mt-1 max-w-xs">
          {mode === 'login'
            ? 'Entre para continuar suas leituras e acompanhar seu ritmo literário.'
            : 'Junte-se à comunidade de leitores e organize sua jornada.'}
        </p>
      </div>

      {serverError && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
        {mode === 'register' && (
          <>
            <Input
              label="Nome Completo"
              placeholder="Ex: Machado de Assis"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={errors.name}
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
              required
            />

            <Input
              label="Nome de Usuário (@)"
              placeholder="Ex: machado_leitor"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              error={errors.username}
              leftIcon={<AtSign className="w-4 h-4" />}
              autoComplete="username"
              required
            />
          </>
        )}

        <Input
          label="E-mail"
          type="email"
          placeholder="seu.email@exemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          leftIcon={<Mail className="w-4 h-4" />}
          autoComplete="email"
          required
        />

        <Input
          label="Senha"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          leftIcon={<Lock className="w-4 h-4" />}
          autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          required
        />

        {mode === 'register' && (
          <Input
            label="Confirmar Senha"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
            leftIcon={<Lock className="w-4 h-4" />}
            autoComplete="new-password"
            required
          />
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full mt-2"
          isLoading={isLoading}
          rightIcon={<ArrowRight className="w-4 h-4" />}
        >
          {mode === 'login' ? 'Entrar' : 'Concluir Cadastro'}
        </Button>
      </form>

      <div className="mt-6 pt-4 border-t border-border/40 text-center text-xs text-ink-muted">
        {mode === 'login' ? (
          <p>
            Não tem uma conta ainda?{' '}
            <button
              type="button"
              onClick={() => handleSwitchMode('register')}
              className="text-primary font-semibold hover:underline"
            >
              Criar conta gratuita
            </button>
          </p>
        ) : (
          <p>
            Já possui uma conta?{' '}
            <button
              type="button"
              onClick={() => handleSwitchMode('login')}
              className="text-primary font-semibold hover:underline"
            >
              Fazer login
            </button>
          </p>
        )}
      </div>
    </Modal>
  );
};
