import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { RegisterInput, LoginInput, UpdateProfileInput } from '../lib/validations';

export interface UserSessionData {
  id: string;
  name: string;
  username: string;
  email: string;
  role: 'USER' | 'PREMIUM' | 'ADMIN';
  profile?: {
    avatarUrl?: string | null;
    bio?: string | null;
    readingGoalYear: number;
    dailyMinutesGoal: number;
    dailyPagesGoal: number;
    themePreference: 'light' | 'dark' | 'sepia';
    isPublic: boolean;
  };
  settings?: {
    profileVisibility: string;
    libraryVisibility: string;
    activityVisibility: string;
  };
  streak?: {
    currentStreak: number;
    longestStreak: number;
    activeDates: string[];
  };
  counts?: {
    library: number;
    quotes: number;
    notes: number;
    followers: number;
    following: number;
    achievements: number;
  };
}

interface AuthContextType {
  user: UserSessionData | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginInput) => Promise<{ success: boolean; error?: string }>;
  register: (data: RegisterInput) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserSession: (data: Partial<UserSessionData>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'concha_auth_token';
const USER_CACHE_KEY = 'concha_user_cache';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
  });

  const [user, setUser] = useState<UserSessionData | null>(() => {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem(USER_CACHE_KEY);
      if (cached) {
        try {
          return JSON.parse(cached);
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validação da sessão ativa ao carregar
  const refreshUser = useCallback(async (authToken: string) => {
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
      } else if (response.status === 401) {
        // Token inválido ou expirado
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_CACHE_KEY);
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.warn('[AuthContext] Modo offline ou servidor indisponível. Mantendo dados em cache.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      refreshUser(token);
    } else {
      setIsLoading(false);
    }
  }, [token, refreshUser]);

  // Login
  const login = async (credentials: LoginInput): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      const data = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: data.error || 'Falha no login' };
      }

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(data.user));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
  };

  // Cadastro
  const register = async (data: RegisterInput): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (!res.ok) {
        setIsLoading(false);
        return { success: false, error: resData.error || 'Falha no cadastro' };
      }

      setToken(resData.token);
      setUser(resData.user);
      localStorage.setItem(TOKEN_KEY, resData.token);
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(resData.user));
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: 'Não foi possível conectar ao servidor. Tente novamente mais tarde.' };
    }
  };

  // Logout
  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_CACHE_KEY);
    setToken(null);
    setUser(null);
  };

  // Atualização local do usuário
  const updateUserSession = (data: Partial<UserSessionData>) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: Boolean(token && user),
        login,
        register,
        logout,
        updateUserSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de AuthProvider');
  }
  return context;
};
