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
  email: string;
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

  // Check if authenticated
  isAuthenticated(): boolean {
    const token = this.getToken();
    const user = this.getUser();
    return !!(token && user);
  }

  // Store auth data
  private storeAuthData(authResponse: AuthResponse, rememberMe: boolean = false) {
    const storage = rememberMe ? localStorage : sessionStorage;
    
    storage.setItem('access_token', authResponse.session.access_token);
    storage.setItem('refresh_token', authResponse.session.refresh_token);
    storage.setItem('user', JSON.stringify(authResponse.user));
    storage.setItem('isAuthenticated', 'true');
  }

  // Clear auth data
  private clearAuthData() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
    sessionStorage.removeItem('access_token');
    sessionStorage.removeItem('refresh_token');
    sessionStorage.removeItem('user');
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
      console.error('Logout error:', error);
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

      return response.data.user;
    } catch (error: any) {
      this.clearAuthData();
      const message = error.response?.data?.error || 'Failed to get user';
      throw new Error(message);
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
      (error) => {
        if (error.response?.status === 401) {
          // Only clear auth and redirect if we're not already on auth page
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/auth') && !currentPath.includes('/login')) {
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
}

export const authService = new AuthService();

// Setup interceptor on import
authService.setupAxiosInterceptor();

