import axios from 'axios';

const API_URL = '/api/auth';

export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  createdAt?: string;
}

export interface AuthResponse {
  user: User;
  session: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username: string;
}

class AuthService {
  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('access_token') || sessionStorage.getItem('access_token');
  }

  // Get stored user
  getUser(): User | null {
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }

  // Check if authenticated (basic check)
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Validate authentication with server
  async validateAuth(): Promise<boolean> {
    try {
      const token = this.getToken();
      if (!token) return false;

      await this.getCurrentUser();
      return true;
    } catch (error: any) {
      // If token is expired, try to refresh it
      if (error.message?.includes('Token expired') ||
          error.message?.includes('Invalid or expired token')) {
        return await this.attemptTokenRefresh();
      }
      return false;
    }
  }

  // Attempt to refresh expired tokens
  private async attemptTokenRefresh(): Promise<boolean> {
    try {
      const refreshToken = localStorage.getItem('refresh_token') || sessionStorage.getItem('refresh_token');
      if (!refreshToken) return false;

      // Call server endpoint to refresh token
      const response = await axios.post<AuthResponse>(`${API_URL}/refresh`, { refreshToken });
      this.storeAuthData(response.data, localStorage.getItem('refresh_token') ? true : false);
      return true;
    } catch {
      // Refresh failed, user needs to login again
      this.clearAuthData();
      return false;
    }
  }

  // Store auth data
  private storeAuthData(authResponse: AuthResponse, rememberMe: boolean = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('access_token', authResponse.session.access_token);
    storage.setItem('refresh_token', authResponse.session.refresh_token);
    storage.setItem('user', JSON.stringify(authResponse.user));
    storage.setItem('username', authResponse.user.username);
    storage.setItem('isAuthenticated', 'true');
  }

  // Clear auth data
  clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('username');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('username');
    sessionStorage.removeItem('isAuthenticated');
  }

  // Register new user
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/register`, data);
      this.storeAuthData(response.data, true); // Remember by default for registration
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Registration failed';
      throw new Error(message);
    }
  }

  // Login user
  async login(credentials: LoginCredentials, rememberMe: boolean = false): Promise<AuthResponse> {
    try {
      const response = await axios.post<AuthResponse>(`${API_URL}/login`, credentials);
      this.storeAuthData(response.data, rememberMe);
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error || 'Login failed';
      throw new Error(message);
    }
  }

  // Logout user
  async logout(): Promise<void> {
    try {
      const token = this.getToken();
      if (token) {
        await axios.post(
          `${API_URL}/logout`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      this.clearAuthData();
    }
  }

  // Get current user from API
  async getCurrentUser(): Promise<User> {
    try {
      const token = this.getToken();
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get<{ user: User }>(`${API_URL}/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Update stored user data
      const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(response.data.user));
      storage.setItem('username', response.data.user.username);

      return response.data.user;
    } catch (error: any) {
      // If token expired, try to refresh before clearing
      if (error.response?.status === 401) {
        const refreshed = await this.attemptTokenRefresh();
        if (refreshed) {
          // Retry the request with new token
          return this.getCurrentUser();
        }
      }
      // Only clear auth if refresh failed
      this.clearAuthData();
      const message = error.response?.data?.error || 'Failed to get user';
      throw new Error(message);
    }
  }

  // Manually update cached user object (used after profile / username updates)
  setUser(user: Partial<User> | null) {
    const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
    if (!user) {
      storage.removeItem('user');
      storage.removeItem('username');
      return;
    }
    const existing = this.getUser() || ({} as User);
    const merged = { ...existing, ...user };
    storage.setItem('user', JSON.stringify(merged));
    if (merged.username) {
      storage.setItem('username', merged.username);
    }
  }

  // Setup axios interceptor to add auth header
  setupAxiosInterceptor() {
    axios.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Handle 401 responses
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          const url = error.config?.url || '';
          const isPublicEndpoint = (url.includes('/posts/') || url.includes('/posts?') || url === '/posts') && 
                                   !url.includes('/vote') &&
                                   !url.includes('/create') &&
                                   !url.includes('/update') &&
                                   !url.includes('/delete');
          
          // For public endpoints, don't try to refresh - just let the request proceed
          // The server's optionalAuth will handle it
          if (isPublicEndpoint) {
            // Remove the Authorization header and retry without token
            const originalRequest = error.config;
            if (originalRequest) {
              delete originalRequest.headers.Authorization;
              return axios(originalRequest);
            }
          }

          // Check if this is a token expired error that we can refresh
          const isTokenExpired = error.response?.data?.code === 'TOKEN_EXPIRED' ||
                                 error.response?.data?.error?.includes('Token expired') ||
                                 error.response?.data?.error?.includes('Token expired or invalid');

          if (isTokenExpired) {
            // Try to refresh the token
            const refreshSuccess = await this.attemptTokenRefresh();
            if (refreshSuccess) {
              // Retry the original request with new token
              const originalRequest = error.config;
              const newToken = this.getToken();
              if (newToken && originalRequest) {
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                return axios(originalRequest);
              }
            }
          }

          // Only clear auth and redirect if refresh failed AND we're not already on auth page
          // Don't redirect for optional auth endpoints (like viewing posts)
          const currentPath = window.location.pathname;
          const isAuthEndpoint = currentPath.includes('/auth') || currentPath.includes('/login');
          
          // Only redirect to login for authenticated endpoints, not public content
          if (!isAuthEndpoint && !isPublicEndpoint) {
            this.clearAuthData();
            // Store the attempted URL to redirect after login
            sessionStorage.setItem('redirectAfterLogin', currentPath);
            window.location.href = '/auth';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // Update email (server-driven)
  async updateEmail(newEmail: string): Promise<{ message: string; user: Partial<User> }> {
    const response = await axios.post<{ message: string; user: Partial<User> }>(`${API_URL}/update-email`, { newEmail });
    // Update cached user
    const stored = this.getUser();
    if (stored) {
      const updated = { ...stored, email: response.data.user.email as string };
      const storage = localStorage.getItem('access_token') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(updated));
    }
    return response.data;
  }

  // Update password (server-driven)
  async updatePassword(currentPassword: string, newPassword: string): Promise<{ message: string }> {
    const response = await axios.post<{ message: string }>(`${API_URL}/update-password`, { currentPassword, newPassword });
    return response.data;
  }
}

export const authService = new AuthService();

// Setup interceptor on import
authService.setupAxiosInterceptor();

// Periodic token validation (every 15 minutes)
setInterval(async () => {
  if (authService.isAuthenticated()) {
    try {
      await authService.validateAuth();
    } catch (error) {
      console.log('Periodic auth validation failed:', error);
    }
  }
}, 15 * 60 * 1000); // 15 minutes

