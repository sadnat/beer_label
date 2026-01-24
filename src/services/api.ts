const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

class ApiClient {
  private token: string | null = null;

  constructor() {
    // Load token from localStorage on init
    this.token = localStorage.getItem('auth_token');
  }

  setToken(token: string | null): void {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 - unauthorized
        if (response.status === 401) {
          this.setToken(null);
        }
        return { error: data.error || 'Une erreur est survenue' };
      }

      return { data };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Erreur de connexion au serveur' };
    }
  }

  // Auth endpoints
  async register(email: string, password: string) {
    return this.request<{
      user: User;
      token?: string;
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
      token: string;
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

  async deleteProject(id: string) {
    return this.request<{ message: string }>(`/projects/${id}`, {
      method: 'DELETE',
    });
  }
}

// Types
export interface User {
  id: string;
  email: string;
  email_verified?: boolean;
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

// Export singleton instance
export const api = new ApiClient();
