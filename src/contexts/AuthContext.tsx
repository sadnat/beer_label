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

  // Check authentication status on mount via cookie-based session
  useEffect(() => {
    const checkAuth = async () => {
      // Try to get the current user - cookies are sent automatically
      const { data } = await api.getMe();
      if (data?.user) {
        setUser(data.user);
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
      // Cookies are set automatically by the server response
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
      // No verification required - cookies set by server, user returned
      if (data.user) {
        setUser(data.user);
      }
    }
    return {};
  };

  const logout = async () => {
    await api.logout();
    // Cookies are cleared by the server
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
