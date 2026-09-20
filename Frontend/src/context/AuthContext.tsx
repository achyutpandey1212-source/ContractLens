import React, { createContext, useContext, useState, useEffect } from 'react';
import { api, AuthUser } from '../services/api';

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, confirmPassword?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'contractlens_token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate existing session on mount
  useEffect(() => {
    let isMounted = true;
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      try {
        // Calls GET /api/auth/me with both cookie and Bearer header (if present)
        const res = await api.getMe(storedToken);
        if (isMounted && res && res.user) {
          setUser(res.user);
          if (storedToken) setToken(storedToken);
        }
      } catch {
        if (isMounted) {
          localStorage.removeItem(TOKEN_KEY);
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    setUser(res.user);
    if (res.token) {
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
    }
  };

  const register = async (email: string, password: string, confirmPassword?: string) => {
    const res = await api.register(email, password, confirmPassword);
    setUser(res.user);
    if (res.token) {
      setToken(res.token);
      localStorage.setItem(TOKEN_KEY, res.token);
    }
  };

  const logout = async () => {
    try {
      await api.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
