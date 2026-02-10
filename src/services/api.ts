const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private isRefreshing = false;
  private refreshPromise: Promise<boolean> | null = null;

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    skipRefresh = false
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include', // Send httpOnly cookies automatically
      });

      // On 401, try to refresh the access token (unless we're already refreshing or this is a refresh request)
      if (response.status === 401 && !skipRefresh && !endpoint.includes('/auth/refresh')) {
        const refreshed = await this.tryRefresh();
        if (refreshed) {
          // Retry the original request
          return this.request<T>(endpoint, options, true);
        }
        return { error: 'Session expirée, veuillez vous reconnecter' };
      }

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Une erreur est survenue' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Erreur de connexion au serveur' };
    }
  }

  // Try to refresh the access token using the refresh token cookie
  private async tryRefresh(): Promise<boolean> {
    // If already refreshing, wait for the existing refresh to complete
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = this.doRefresh();

    try {
      return await this.refreshPromise;
    } finally {
      this.isRefreshing = false;
      this.refreshPromise = null;
    }
  }

  private async doRefresh(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async register(email: string, password: string) {
    return this.request<{
      user?: User;
      message: string;
      requiresVerification?: boolean;
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async login(email: string, password: string) {
    return this.request<{
      user: User;
      requiresVerification?: boolean;
      email?: string;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async getMe() {
    return this.request<{ user: User }>('/auth/me');
  }

  async logout() {
    return this.request<{ message: string }>('/auth/logout', {
      method: 'POST',
    });
  }

  async refresh() {
    return this.request<{ user: User }>('/auth/refresh', {
      method: 'POST',
    }, true);
  }

  async verifyEmail(token: string) {
    return this.request<{ message: string; user: User }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email: string) {
    return this.request<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  async deleteAccount() {
    return this.request<{ message: string }>('/auth/account', {
      method: 'DELETE',
    });
  }

  async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{ message: string }>('/auth/password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  }

  // Project endpoints
  async getProjects() {
    return this.request<{ projects: ProjectSummary[] }>('/projects');
  }

  async getProject(id: string) {
    return this.request<{ project: Project }>(`/projects/${id}`);
  }

  async createProject(data: ProjectCreate) {
    return this.request<{ project: Project }>('/projects', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: ProjectUpdate) {
    return this.request<{ project: Project }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async duplicateProject(id: string) {
    return this.request<{ project: Project }>(`/projects/${id}/duplicate`, {
      method: 'POST',
    });
  }

  async deleteProject(id: string) {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }

  // Admin endpoints
  async getAdminStats() {
    return this.request<{ stats: AdminStats }>('/admin/stats');
  }

  async getAdminUsers(
    page: number = 1,
    limit: number = 20,
    search: string = '',
    filters: { role?: string; is_banned?: boolean; plan?: string } = {}
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (search) params.append('search', search);
    if (filters.role) params.append('role', filters.role);
    if (filters.is_banned !== undefined) params.append('is_banned', filters.is_banned.toString());
    if (filters.plan) params.append('plan', filters.plan);

    return this.request<{ users: AdminUser[]; total: number; pages: number }>(
      `/admin/users?${params.toString()}`
    );
  }

  async getAdminUserDetails(id: string) {
    return this.request<{ user: AdminUserDetails }>(`/admin/users/${id}`);
  }

  async changeUserRole(id: string, role: 'admin' | 'user') {
    return this.request<{ message: string }>(`/admin/users/${id}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  }

  async banUser(id: string, reason?: string) {
    return this.request<{ message: string }>(`/admin/users/${id}/ban`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  async unbanUser(id: string) {
    return this.request<{ message: string }>(`/admin/users/${id}/ban`, {
      method: 'DELETE',
    });
  }

  async deleteUserAsAdmin(id: string) {
    return this.request<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  async changeUserPlan(userId: string, planId: string) {
    return this.request<{ message: string }>(`/admin/users/${userId}/plan`, {
      method: 'PUT',
      body: JSON.stringify({ planId }),
    });
  }

  async getAdminPlans() {
    return this.request<{ plans: Plan[] }>('/admin/plans');
  }

  async createPlan(data: Omit<Plan, 'id' | 'created_at' | 'is_active'>) {
    return this.request<{ plan: Plan }>('/admin/plans', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePlan(id: string, data: Partial<Omit<Plan, 'id' | 'slug' | 'created_at'>>) {
    return this.request<{ plan: Plan }>(`/admin/plans/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async getAuditLog(
    page: number = 1,
    limit: number = 50,
    filters: { action?: string; adminId?: string } = {}
  ) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    if (filters.action) params.append('action', filters.action);
    if (filters.adminId) params.append('adminId', filters.adminId);

    return this.request<{ entries: AuditLogEntry[]; total: number; pages: number }>(
      `/admin/audit-log?${params.toString()}`
    );
  }
}

// Types
export type UserRole = 'admin' | 'user';

export interface User {
  id: string;
  email: string;
  email_verified?: boolean;
  role?: UserRole;
  created_at?: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  format_id: string;
  format_width: number;
  format_height: number;
  thumbnail: string | null;
  created_at: string;
  updated_at: string;
}

export interface Project extends ProjectSummary {
  user_id: string;
  canvas_json: string;
  beer_data: Record<string, unknown>;
}

export interface ProjectCreate {
  name: string;
  format_id: string;
  format_width: number;
  format_height: number;
  canvas_json: string;
  beer_data: Record<string, unknown>;
  thumbnail?: string;
}

export interface ProjectUpdate {
  name?: string;
  format_id?: string;
  format_width?: number;
  format_height?: number;
  canvas_json?: string;
  beer_data?: Record<string, unknown>;
  thumbnail?: string;
}

// Admin types
export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  bannedUsers: number;
  totalProjects: number;
  usersByPlan: { plan: string; count: number }[];
  recentSignups: { date: string; count: number }[];
  projectsCreatedThisMonth: number;
}

export interface AdminUser {
  id: string;
  email: string;
  email_verified: boolean;
  role: UserRole;
  is_banned: boolean;
  ban_reason: string | null;
  banned_at: string | null;
  created_at: string;
  updated_at: string;
  projects_count: number;
  plan_name: string | null;
}

export interface AdminUserDetails extends AdminUser {
  projects: {
    id: string;
    name: string;
    format_id: string;
    created_at: string;
    updated_at: string;
  }[];
  subscription: {
    id: string;
    plan_id: string;
    plan_name: string;
    status: string;
    current_period_start: string;
    current_period_end: string | null;
  } | null;
}

export interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_monthly: number;
  max_projects: number;
  max_exports_per_month: number;
  features: string[];
  is_active: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  admin_id: string;
  admin_email: string;
  action: string;
  target_type: string | null;
  target_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

// Export singleton instance
export const api = new ApiClient();
