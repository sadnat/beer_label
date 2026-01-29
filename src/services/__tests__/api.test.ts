import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockFetch, mockFetchError, clearFetchMock } from '../../test/setup';

// We need to re-import the api module fresh for each test
// to reset the token state
let api: typeof import('../api').api;

describe('ApiClient', () => {
  beforeEach(async () => {
    // Clear localStorage and fetch mocks
    localStorage.clear();
    clearFetchMock();
    vi.clearAllMocks();

    // Dynamically re-import to get fresh instance
    vi.resetModules();
    const module = await import('../api');
    api = module.api;
  });

  afterEach(() => {
    vi.resetModules();
  });

  describe('Token Management', () => {
    it('should initialize with null token when localStorage is empty', () => {
      expect(api.getToken()).toBeNull();
    });

    it('should load token from localStorage on init', async () => {
      localStorage.setItem('auth_token', 'existing-token');
      vi.resetModules();
      const module = await import('../api');
      expect(module.api.getToken()).toBe('existing-token');
    });

    it('should set token and save to localStorage', () => {
      api.setToken('new-token');
      expect(api.getToken()).toBe('new-token');
      expect(localStorage.getItem('auth_token')).toBe('new-token');
    });

    it('should clear token and remove from localStorage', () => {
      api.setToken('token-to-remove');
      api.setToken(null);
      expect(api.getToken()).toBeNull();
      expect(localStorage.getItem('auth_token')).toBeNull();
    });
  });

  describe('Auth Endpoints', () => {
    describe('register', () => {
      it('should send registration request with email and password', async () => {
        mockFetch({ user: { id: '1', email: 'test@example.com' }, token: 'new-token' });

        const result = await api.register('test@example.com', 'password123');

        expect(result.data).toBeDefined();
        expect(result.error).toBeUndefined();
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/register',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
          })
        );
      });

      it('should return error on registration failure', async () => {
        mockFetch({ error: 'Email déjà utilisé' }, { status: 400, ok: false });

        const result = await api.register('existing@example.com', 'password123');

        expect(result.error).toBe('Email déjà utilisé');
        expect(result.data).toBeUndefined();
      });

      it('should handle requiresVerification response', async () => {
        mockFetch({
          user: { id: '1', email: 'test@example.com' },
          message: 'Vérifiez votre email',
          requiresVerification: true,
        });

        const result = await api.register('test@example.com', 'password123');

        expect(result.data?.requiresVerification).toBe(true);
        expect(result.data?.message).toBe('Vérifiez votre email');
      });
    });

    describe('login', () => {
      it('should send login request with email and password', async () => {
        mockFetch({ user: { id: '1', email: 'test@example.com' }, token: 'login-token' });

        const result = await api.login('test@example.com', 'password123');

        expect(result.data).toBeDefined();
        expect(result.data?.token).toBe('login-token');
      });

      it('should return error on invalid credentials', async () => {
        mockFetch({ error: 'Email ou mot de passe incorrect' }, { status: 401, ok: false });

        const result = await api.login('wrong@example.com', 'wrongpass');

        expect(result.error).toBe('Email ou mot de passe incorrect');
      });

      it('should return requiresVerification when email not verified', async () => {
        mockFetch(
          { error: 'Veuillez vérifier votre email', requiresVerification: true, email: 'test@example.com' },
          { status: 401, ok: false }
        );

        const result = await api.login('test@example.com', 'password123');

        expect(result.error).toBeDefined();
      });
    });

    describe('getMe', () => {
      it('should get current user when authenticated', async () => {
        api.setToken('valid-token');
        mockFetch({ user: { id: '1', email: 'test@example.com' } });

        const result = await api.getMe();

        expect(result.data?.user).toBeDefined();
        expect(result.data?.user.email).toBe('test@example.com');

        // Check that auth header was sent
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/me',
          expect.objectContaining({
            headers: expect.objectContaining({
              Authorization: 'Bearer valid-token',
            }),
          })
        );
      });

      it('should clear token on 401 response', async () => {
        api.setToken('invalid-token');
        mockFetch({ error: 'Token invalide' }, { status: 401, ok: false });

        await api.getMe();

        expect(api.getToken()).toBeNull();
      });
    });

    describe('logout', () => {
      it('should send logout request', async () => {
        api.setToken('session-token');
        mockFetch({ message: 'Déconnecté' });

        const result = await api.logout();

        expect(result.data?.message).toBe('Déconnecté');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/logout',
          expect.objectContaining({ method: 'POST' })
        );
      });
    });

    describe('verifyEmail', () => {
      it('should send verification token', async () => {
        mockFetch({ message: 'Email vérifié', user: { id: '1', email: 'test@example.com' } });

        const result = await api.verifyEmail('verification-token-123');

        expect(result.data?.message).toBe('Email vérifié');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/verify-email',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ token: 'verification-token-123' }),
          })
        );
      });
    });

    describe('resendVerification', () => {
      it('should request resend of verification email', async () => {
        mockFetch({ message: 'Email envoyé' });

        const result = await api.resendVerification('test@example.com');

        expect(result.data?.message).toBe('Email envoyé');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/resend-verification',
          expect.objectContaining({
            body: JSON.stringify({ email: 'test@example.com' }),
          })
        );
      });
    });

    describe('deleteAccount', () => {
      it('should send delete account request', async () => {
        api.setToken('user-token');
        mockFetch({ message: 'Compte supprimé' });

        const result = await api.deleteAccount();

        expect(result.data?.message).toBe('Compte supprimé');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/account',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    describe('changePassword', () => {
      it('should send password change request', async () => {
        api.setToken('user-token');
        mockFetch({ message: 'Mot de passe modifié' });

        const result = await api.changePassword('oldPassword123', 'newPassword456');

        expect(result.data?.message).toBe('Mot de passe modifié');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/auth/password',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ currentPassword: 'oldPassword123', newPassword: 'newPassword456' }),
          })
        );
      });
    });
  });

  describe('Project Endpoints', () => {
    beforeEach(() => {
      api.setToken('auth-token');
    });

    describe('getProjects', () => {
      it('should fetch user projects', async () => {
        mockFetch({ projects: [{ id: '1', name: 'Project 1' }] });

        const result = await api.getProjects();

        expect(result.data?.projects).toHaveLength(1);
        expect(global.fetch).toHaveBeenCalledWith('/api/projects', expect.anything());
      });
    });

    describe('getProject', () => {
      it('should fetch single project by id', async () => {
        mockFetch({ project: { id: 'proj-123', name: 'My Label' } });

        const result = await api.getProject('proj-123');

        expect(result.data?.project.name).toBe('My Label');
        expect(global.fetch).toHaveBeenCalledWith('/api/projects/proj-123', expect.anything());
      });
    });

    describe('createProject', () => {
      it('should create new project', async () => {
        mockFetch({ project: { id: 'new-proj', name: 'New Label' } });

        const projectData = {
          name: 'New Label',
          format_id: 'standard-33cl',
          format_width: 90,
          format_height: 120,
          canvas_json: '{}',
          beer_data: { name: 'IPA' },
        };

        const result = await api.createProject(projectData);

        expect(result.data?.project.id).toBe('new-proj');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(projectData),
          })
        );
      });
    });

    describe('updateProject', () => {
      it('should update existing project', async () => {
        mockFetch({ project: { id: 'proj-123', name: 'Updated Label' } });

        const result = await api.updateProject('proj-123', { name: 'Updated Label' });

        expect(result.data?.project.name).toBe('Updated Label');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/proj-123',
          expect.objectContaining({ method: 'PUT' })
        );
      });
    });

    describe('deleteProject', () => {
      it('should delete project', async () => {
        mockFetch({ message: 'Projet supprimé' });

        const result = await api.deleteProject('proj-123');

        expect(result.data?.message).toBe('Projet supprimé');
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/projects/proj-123',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });
  });

  describe('Admin Endpoints', () => {
    beforeEach(() => {
      api.setToken('admin-token');
    });

    describe('getAdminStats', () => {
      it('should fetch admin statistics', async () => {
        mockFetch({
          stats: {
            totalUsers: 100,
            activeUsers: 90,
            bannedUsers: 5,
            totalProjects: 500,
          },
        });

        const result = await api.getAdminStats();

        expect(result.data?.stats.totalUsers).toBe(100);
      });
    });

    describe('getAdminUsers', () => {
      it('should fetch paginated users list', async () => {
        mockFetch({ users: [], total: 50, pages: 3 });

        const result = await api.getAdminUsers(1, 20);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/users?page=1&limit=20'),
          expect.anything()
        );
      });

      it('should include search and filters in query', async () => {
        mockFetch({ users: [], total: 0, pages: 0 });

        await api.getAdminUsers(1, 20, 'test', { role: 'admin', is_banned: false });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('search=test'),
          expect.anything()
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('role=admin'),
          expect.anything()
        );
      });
    });

    describe('getAdminUserDetails', () => {
      it('should fetch detailed user information', async () => {
        mockFetch({
          user: {
            id: 'user-123',
            email: 'test@example.com',
            projects: [],
            subscription: null,
          },
        });

        const result = await api.getAdminUserDetails('user-123');

        expect(result.data?.user.email).toBe('test@example.com');
      });
    });

    describe('changeUserRole', () => {
      it('should change user role', async () => {
        mockFetch({ message: 'Rôle modifié' });

        const result = await api.changeUserRole('user-123', 'admin');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-123/role',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ role: 'admin' }),
          })
        );
      });
    });

    describe('banUser', () => {
      it('should ban user with reason', async () => {
        mockFetch({ message: 'Utilisateur banni' });

        await api.banUser('user-123', 'Violation des règles');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-123/ban',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ reason: 'Violation des règles' }),
          })
        );
      });
    });

    describe('unbanUser', () => {
      it('should unban user', async () => {
        mockFetch({ message: 'Utilisateur débanni' });

        await api.unbanUser('user-123');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-123/ban',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    describe('deleteUserAsAdmin', () => {
      it('should delete user as admin', async () => {
        mockFetch({ message: 'Utilisateur supprimé' });

        await api.deleteUserAsAdmin('user-123');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-123',
          expect.objectContaining({ method: 'DELETE' })
        );
      });
    });

    describe('changeUserPlan', () => {
      it('should change user subscription plan', async () => {
        mockFetch({ message: 'Plan modifié' });

        await api.changeUserPlan('user-123', 'plan-456');

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/users/user-123/plan',
          expect.objectContaining({
            method: 'PUT',
            body: JSON.stringify({ planId: 'plan-456' }),
          })
        );
      });
    });

    describe('getAdminPlans', () => {
      it('should fetch all plans', async () => {
        mockFetch({ plans: [{ id: '1', name: 'Free' }, { id: '2', name: 'Pro' }] });

        const result = await api.getAdminPlans();

        expect(result.data?.plans).toHaveLength(2);
      });
    });

    describe('createPlan', () => {
      it('should create new plan', async () => {
        mockFetch({ plan: { id: 'new-plan', name: 'Enterprise' } });

        const planData = {
          name: 'Enterprise',
          slug: 'enterprise',
          price_monthly: 99.99,
          max_projects: 100,
          max_exports_per_month: 500,
          features: ['All features'],
        };

        await api.createPlan(planData);

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/plans',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(planData),
          })
        );
      });
    });

    describe('updatePlan', () => {
      it('should update existing plan', async () => {
        mockFetch({ plan: { id: 'plan-123', name: 'Pro Plus' } });

        await api.updatePlan('plan-123', { name: 'Pro Plus' });

        expect(global.fetch).toHaveBeenCalledWith(
          '/api/admin/plans/plan-123',
          expect.objectContaining({ method: 'PUT' })
        );
      });
    });

    describe('getAuditLog', () => {
      it('should fetch audit log with pagination', async () => {
        mockFetch({ entries: [], total: 100, pages: 2 });

        await api.getAuditLog(1, 50);

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/admin/audit-log?page=1&limit=50'),
          expect.anything()
        );
      });

      it('should include filters in query', async () => {
        mockFetch({ entries: [], total: 0, pages: 0 });

        await api.getAuditLog(1, 50, { action: 'ban_user', adminId: 'admin-123' });

        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('action=ban_user'),
          expect.anything()
        );
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('adminId=admin-123'),
          expect.anything()
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetchError('Network error');

      const result = await api.login('test@example.com', 'password');

      expect(result.error).toBe('Erreur de connexion au serveur');
    });

    it('should handle JSON parse errors gracefully', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON')),
      });

      const result = await api.getMe();

      expect(result.error).toBeDefined();
    });

    it('should use default error message when none provided', async () => {
      mockFetch({}, { status: 500, ok: false });

      const result = await api.getMe();

      expect(result.error).toBe('Une erreur est survenue');
    });
  });

  describe('Request Headers', () => {
    it('should include Content-Type header', async () => {
      mockFetch({});

      await api.login('test@example.com', 'password');

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
    });

    it('should include Authorization header when token is set', async () => {
      api.setToken('bearer-token');
      mockFetch({});

      await api.getMe();

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer bearer-token',
          }),
        })
      );
    });

    it('should not include Authorization header when no token', async () => {
      mockFetch({});

      await api.login('test@example.com', 'password');

      const callArgs = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      const headers = callArgs[1].headers as Record<string, string>;

      expect(headers['Authorization']).toBeUndefined();
    });
  });
});
