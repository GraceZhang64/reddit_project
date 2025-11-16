/**
 * Auth guard utility for protecting routes and actions
 */

import { authService } from '../services/auth';

/**
 * Check if user is authenticated before performing an action
 * If not authenticated, redirect to auth page with return URL
 */
export function requireAuth(returnTo?: string): boolean {
  if (!authService.isAuthenticated()) {
    // Store where to return after login
    if (returnTo) {
      sessionStorage.setItem('redirectAfterLogin', returnTo);
    }
    
    // Redirect to auth page
    window.location.href = '/auth';
    return false;
  }
  return true;
}

/**
 * Get and clear the redirect URL after successful login
 */
export function getRedirectAfterLogin(): string {
  const redirect = sessionStorage.getItem('redirectAfterLogin');
  if (redirect) {
    sessionStorage.removeItem('redirectAfterLogin');
    return redirect;
  }
  return '/';
}

/**
 * Check if token exists but might be expired
 * Useful for showing appropriate UI messages
 */
export function hasExpiredToken(): boolean {
  const token = authService.getToken();
  const user = authService.getUser();
  
  // Has token but no user data = likely expired
  return !!(token && !user);
}

