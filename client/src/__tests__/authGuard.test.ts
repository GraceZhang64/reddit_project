import { requireAuth, getRedirectAfterLogin, hasExpiredToken } from '../utils/authGuard';
import { authService } from '../services/auth';

jest.mock('../services/auth');

describe('Auth Guard Utilities', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    jest.clearAllMocks();
  });

  describe('requireAuth', () => {
    it('should return true if user is authenticated', () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(true);
      
      const result = requireAuth();
      
      expect(result).toBe(true);
    });

    it('should return false if not authenticated', () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
      
      const result = requireAuth();
      
      expect(result).toBe(false);
    });

    it('should store return URL in sessionStorage when not authenticated', () => {
      (authService.isAuthenticated as jest.Mock).mockReturnValue(false);
      
      requireAuth('/posts/123');
      
      expect(sessionStorage.getItem('redirectAfterLogin')).toBe('/posts/123');
    });
  });

  describe('getRedirectAfterLogin', () => {
    it('should return stored redirect URL', () => {
      sessionStorage.setItem('redirectAfterLogin', '/posts/456');
      
      const result = getRedirectAfterLogin();
      
      expect(result).toBe('/posts/456');
    });

    it('should clear redirect URL after retrieval', () => {
      sessionStorage.setItem('redirectAfterLogin', '/posts/456');
      
      getRedirectAfterLogin();
      
      expect(sessionStorage.getItem('redirectAfterLogin')).toBeNull();
    });

    it('should return home if no redirect URL stored', () => {
      const result = getRedirectAfterLogin();
      
      expect(result).toBe('/');
    });
  });

  describe('hasExpiredToken', () => {
    it('should return true if token exists but no user', () => {
      (authService.getToken as jest.Mock).mockReturnValue('some-token');
      (authService.getUser as jest.Mock).mockReturnValue(null);
      
      const result = hasExpiredToken();
      
      expect(result).toBe(true);
    });

    it('should return false if both token and user exist', () => {
      (authService.getToken as jest.Mock).mockReturnValue('some-token');
      (authService.getUser as jest.Mock).mockReturnValue({ id: '1', username: 'test' });
      
      const result = hasExpiredToken();
      
      expect(result).toBe(false);
    });

    it('should return false if no token exists', () => {
      (authService.getToken as jest.Mock).mockReturnValue(null);
      (authService.getUser as jest.Mock).mockReturnValue(null);
      
      const result = hasExpiredToken();
      
      expect(result).toBe(false);
    });
  });
});

