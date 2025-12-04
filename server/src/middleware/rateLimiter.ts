/**
 * Rate limiting middleware to prevent abuse and improve stability
 */
import { Request, Response, NextFunction } from 'express';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitEntry>;
  private maxRequests: number;
  private windowMs: number;
  private name: string;

  constructor(maxRequests: number = 100, windowMs: number = 60000, name: string = 'default') {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.name = name;
    
    // Clean up old entries every minute
    setInterval(() => this.cleanup(), 60000);
  }

  middleware() {
    return (req: Request, res: Response, next: NextFunction) => {
      // Use IP address or user ID as key
      const key = req.user?.id || req.ip || 'unknown';
      const now = Date.now();
      
      const entry = this.requests.get(key);
      
      // If no entry or window has passed, create new entry
      if (!entry || now > entry.resetTime) {
        this.requests.set(key, {
          count: 1,
          resetTime: now + this.windowMs
        });
        // Add rate limit headers
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', this.maxRequests - 1);
        res.setHeader('X-RateLimit-Reset', Math.ceil((now + this.windowMs) / 1000));
        return next();
      }
      
      // Check if limit exceeded
      if (entry.count >= this.maxRequests) {
        const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
        res.setHeader('X-RateLimit-Limit', this.maxRequests);
        res.setHeader('X-RateLimit-Remaining', 0);
        res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
        res.setHeader('Retry-After', retryAfter);
        return res.status(429).json({
          error: 'Too many requests',
          message: `Rate limit exceeded for ${this.name}. Please try again later.`,
          retryAfter
        });
      }
      
      // Increment count and add headers
      entry.count++;
      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.maxRequests - entry.count);
      res.setHeader('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
      next();
    };
  }

  private cleanup() {
    const now = Date.now();
    const keysToDelete: string[] = [];
    
    for (const [key, entry] of this.requests.entries()) {
      if (now > entry.resetTime) {
        keysToDelete.push(key);
      }
    }
    
    keysToDelete.forEach(key => this.requests.delete(key));
  }
}

// Export rate limiters for different endpoints with specific limits
// Login: 10 requests per minute
export const loginLimiter = new RateLimiter(10, 60000, 'login');

// Create posts/comments: 10 requests per minute
export const contentCreationLimiter = new RateLimiter(10, 60000, 'content-creation');

// Votes: 20 requests per 30 seconds
export const voteLimiter = new RateLimiter(20, 30000, 'votes');

// Global: 300 requests per 5 minutes
export const globalLimiter = new RateLimiter(300, 300000, 'global');

// Legacy exports for backward compatibility
export const generalLimiter = globalLimiter;
export const apiLimiter = globalLimiter;
export const authLimiter = loginLimiter;
export const postCreationLimiter = contentCreationLimiter;

