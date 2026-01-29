import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthProvider, useAuth } from '../AuthContext';
import { api } from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  api: {
    getToken: vi.fn(),
    setToken: vi.fn(),
    getMe: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
  },
}));

// Test component that uses the auth context
function TestComponent() {
  const { user, isLoading, isAuthenticated, login, register, logout } = useAuth();

  const handleLogin = async () => {
    await login('test@example.com', 'password123');
  };

  const handleRegister = async () => {
    await register('new@example.com', 'password123');
  };

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'not-loading'}</div>
      <div data-testid="authenticated">{isAuthenticated ? 'authenticated' : 'not-authenticated'}</div>
      <div data-testid="user">{user ? user.email : 'no-user'}</div>
      <button onClick={handleLogin}>Login</button>
      <button onClick={handleRegister}>Register</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// Component that throws error when used outside provider
function ComponentWithoutProvider() {
  try {
    useAuth();
    return <div>Should not render</div>;
  } catch (error) {
    return <div data-testid="error">{(error as Error).message}</div>;
  }
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default mock implementations
    vi.mocked(api.getToken).mockReturnValue(null);
    vi.mocked(api.getMe).mockResolvedValue({ data: undefined, error: 'No token' });
  });

  describe('Initial State', () => {
    it('should start in loading state', async () => {
      // Make getMe slow to keep loading state
      vi.mocked(api.getMe).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ data: undefined }), 100))
      );

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      expect(screen.getByTestId('loading')).toHaveTextContent('loading');
    });

    it('should not be authenticated initially when no token exists', async () => {
      vi.mocked(api.getToken).mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
    });

    it('should check auth on mount when token exists', async () => {
      vi.mocked(api.getToken).mockReturnValue('existing-token');
      vi.mocked(api.getMe).mockResolvedValue({
        data: { user: { id: '1', email: 'existing@example.com' } },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      // Wait for user to be loaded and displayed
      await waitFor(() => {
        expect(screen.getByTestId('user')).toHaveTextContent('existing@example.com');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      expect(api.getMe).toHaveBeenCalled();
    });

    it('should clear token if getMe returns error', async () => {
      vi.mocked(api.getToken).mockReturnValue('invalid-token');
      vi.mocked(api.getMe).mockResolvedValue({ error: 'Token invalide' });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(api.setToken).toHaveBeenCalledWith(null);
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });

  describe('login', () => {
    it('should update user state on successful login', async () => {
      const user = userEvent.setup();

      vi.mocked(api.login).mockResolvedValue({
        data: {
          user: { id: '1', email: 'test@example.com' },
          token: 'new-token',
        },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByText('Login'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('test@example.com');
      expect(api.setToken).toHaveBeenCalledWith('new-token');
    });

    it('should return error on failed login', async () => {
      vi.mocked(api.login).mockResolvedValue({
        error: 'Email ou mot de passe incorrect',
      });

      let loginError: string | null = null;

      function LoginTestComponent() {
        const { login } = useAuth();

        const handleLogin = async () => {
          loginError = await login('wrong@example.com', 'wrong');
        };

        return <button onClick={handleLogin}>Login</button>;
      }

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      expect(loginError).toBe('Email ou mot de passe incorrect');
    });

    it('should return null on successful login', async () => {
      vi.mocked(api.login).mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' }, token: 'token' },
      });

      let loginResult: string | null = 'initial';

      function LoginTestComponent() {
        const { login } = useAuth();

        const handleLogin = async () => {
          loginResult = await login('test@example.com', 'password');
        };

        return <button onClick={handleLogin}>Login</button>;
      }

      render(
        <AuthProvider>
          <LoginTestComponent />
        </AuthProvider>
      );

      await act(async () => {
        await userEvent.click(screen.getByText('Login'));
      });

      expect(loginResult).toBeNull();
    });
  });

  describe('register', () => {
    it('should handle successful registration with auto-login', async () => {
      const user = userEvent.setup();

      vi.mocked(api.register).mockResolvedValue({
        data: {
          user: { id: '1', email: 'new@example.com' },
          token: 'registration-token',
          message: 'Compte créé',
        },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      await user.click(screen.getByText('Register'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('new@example.com');
    });

    it('should handle registration requiring email verification', async () => {
      vi.mocked(api.register).mockResolvedValue({
        data: {
          user: { id: '1', email: 'new@example.com' },
          message: 'Vérifiez votre email',
          requiresVerification: true,
        },
      });

      let registerResult = { requiresVerification: false, message: '' };

      function RegisterTestComponent() {
        const { register } = useAuth();

        const handleRegister = async () => {
          registerResult = await register('new@example.com', 'password');
        };

        return <button onClick={handleRegister}>Register</button>;
      }

      render(
        <AuthProvider>
          <RegisterTestComponent />
        </AuthProvider>
      );

      await act(async () => {
        await userEvent.click(screen.getByText('Register'));
      });

      expect(registerResult.requiresVerification).toBe(true);
      expect(registerResult.message).toBe('Vérifiez votre email');
    });

    it('should return error on registration failure', async () => {
      vi.mocked(api.register).mockResolvedValue({
        error: 'Email déjà utilisé',
      });

      let registerError: string | undefined;

      function RegisterTestComponent() {
        const { register } = useAuth();

        const handleRegister = async () => {
          const result = await register('existing@example.com', 'password');
          registerError = result.error;
        };

        return <button onClick={handleRegister}>Register</button>;
      }

      render(
        <AuthProvider>
          <RegisterTestComponent />
        </AuthProvider>
      );

      await act(async () => {
        await userEvent.click(screen.getByText('Register'));
      });

      expect(registerError).toBe('Email déjà utilisé');
    });
  });

  describe('logout', () => {
    it('should clear user state on logout', async () => {
      const user = userEvent.setup();

      // Start with authenticated user
      vi.mocked(api.getToken).mockReturnValue('existing-token');
      vi.mocked(api.getMe).mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' } },
      });
      vi.mocked(api.logout).mockResolvedValue({ data: { message: 'Logged out' } });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });

      await user.click(screen.getByText('Logout'));

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
      });

      expect(screen.getByTestId('user')).toHaveTextContent('no-user');
      expect(api.logout).toHaveBeenCalled();
      expect(api.setToken).toHaveBeenCalledWith(null);
    });
  });

  describe('useAuth Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<ComponentWithoutProvider />);

      expect(screen.getByTestId('error')).toHaveTextContent(
        'useAuth must be used within an AuthProvider'
      );

      consoleSpy.mockRestore();
    });

    it('should provide all expected values and functions', async () => {
      let contextValue: ReturnType<typeof useAuth> | null = null;

      function ContextInspector() {
        contextValue = useAuth();
        return null;
      }

      render(
        <AuthProvider>
          <ContextInspector />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(contextValue).not.toBeNull();
      });

      expect(contextValue).toHaveProperty('user');
      expect(contextValue).toHaveProperty('isLoading');
      expect(contextValue).toHaveProperty('isAuthenticated');
      expect(contextValue).toHaveProperty('login');
      expect(contextValue).toHaveProperty('register');
      expect(contextValue).toHaveProperty('logout');

      expect(typeof contextValue!.login).toBe('function');
      expect(typeof contextValue!.register).toBe('function');
      expect(typeof contextValue!.logout).toBe('function');
    });
  });

  describe('isAuthenticated', () => {
    it('should be true when user is set', async () => {
      vi.mocked(api.getToken).mockReturnValue('token');
      vi.mocked(api.getMe).mockResolvedValue({
        data: { user: { id: '1', email: 'test@example.com' } },
      });

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('authenticated')).toHaveTextContent('authenticated');
      });
    });

    it('should be false when user is null', async () => {
      vi.mocked(api.getToken).mockReturnValue(null);

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('not-loading');
      });

      expect(screen.getByTestId('authenticated')).toHaveTextContent('not-authenticated');
    });
  });
});
