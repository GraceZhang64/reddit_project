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

  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.requests = new Map();
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    
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
        return next();
      }
      
      // Check if limit exceeded
      if (entry.count >= this.maxRequests) {
        return res.status(429).json({
          error: 'Too many requests',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        });
      }
      
      // Increment count
      entry.count++;
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

// Export rate limiters for different endpoints
// Note: Increased limits for better performance under load
export const generalLimiter = new RateLimiter(1000, 60000);    // 1000 req/min
export const apiLimiter = new RateLimiter(5000, 60000);        // 5000 req/min for API (high throughput)
export const authLimiter = new RateLimiter(100, 60000);        // 100 req/min for auth
export const postCreationLimiter = new RateLimiter(100, 60000); // 100 posts/min

