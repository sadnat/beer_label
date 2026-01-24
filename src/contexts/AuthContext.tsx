import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '../services/api';

interface RegisterResult {
  error?: string;
  requiresVerification?: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<string | null>;
  register: (email: string, password: string) => Promise<RegisterResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication status on mount
  useEffect(() => {
    const checkAuth = async () => {
      const token = api.getToken();
      if (!token) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await api.getMe();
      if (data?.user) {
        setUser(data.user);
      } else if (error) {
        // Token invalid, clear it
        api.setToken(null);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<string | null> => {
    const { data, error } = await api.login(email, password);
    if (error) {
      return error;
    }
    if (data) {
      api.setToken(data.token);
      setUser(data.user);
    }
    return null;
  };

  const register = async (email: string, password: string): Promise<RegisterResult> => {
    const { data, error } = await api.register(email, password);
    if (error) {
      return { error };
    }
    if (data) {
      // Check if email verification is required
      if (data.requiresVerification) {
        // Don't log in the user, they need to verify email first
        return {
          requiresVerification: true,
          message: data.message,
        };
      }
      // No verification required, log in the user
      if (data.token) {
        api.setToken(data.token);
        setUser(data.user);
      }
    }
    return {};
  };

  const logout = async () => {
    await api.logout();
    api.setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
