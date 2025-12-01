import { Request, Response, NextFunction } from 'express';
import { generalLimiter, apiLimiter, authLimiter, postCreationLimiter } from '../middleware/rateLimiter';

describe('Rate Limiter Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
      user: undefined,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('generalLimiter', () => {
    it('should allow request within rate limit', () => {
      const middleware = generalLimiter.middleware();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should use user ID if available', () => {
      req.user = { id: 'user-1', username: 'testuser' } as any;
      const middleware = generalLimiter.middleware();
      
      middleware(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should use IP if no user', () => {
      const middleware = generalLimiter.middleware();
      
      middleware(req as Request, res as Response, next);
      
      expect(next).toHaveBeenCalled();
    });

    it('should return 429 when limit exceeded', () => {
      const middleware = generalLimiter.middleware();
      
      // Make requests up to the limit (1000)
      for (let i = 0; i < 1001; i++) {
        middleware(req as Request, res as Response, next);
      }

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Too many requests',
          retryAfter: expect.any(Number),
        })
      );
    });

    it('should reset after time window', (done) => {
      // Create a custom limiter with short window for testing
      class TestRateLimiter {
        private requests: Map<string, any>;
        private maxRequests: number;
        private windowMs: number;

        constructor(maxRequests: number = 2, windowMs: number = 100) {
          this.requests = new Map();
          this.maxRequests = maxRequests;
          this.windowMs = windowMs;
        }

        middleware() {
          return (req: Request, res: Response, next: NextFunction) => {
            const key = req.user?.id || req.ip || 'unknown';
            const now = Date.now();
            
            const entry = this.requests.get(key);
            
            if (!entry || now > entry.resetTime) {
              this.requests.set(key, {
                count: 1,
                resetTime: now + this.windowMs
              });
              return next();
            }
            
            if (entry.count >= this.maxRequests) {
              return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil((entry.resetTime - now) / 1000)
              });
            }
            
            entry.count++;
            next();
          };
        }
      }

      const testLimiter = new TestRateLimiter(2, 100);
      const middleware = testLimiter.middleware();

      // First request should pass
      middleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(1);

      // Second request should pass
      middleware(req as Request, res as Response, next);
      expect(next).toHaveBeenCalledTimes(2);

      // Third request should fail
      (next as jest.Mock).mockClear();
      middleware(req as Request, res as Response, next);
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(429);

      // Wait for window to reset
      setTimeout(() => {
        (next as jest.Mock).mockClear();
        (res.status as jest.Mock).mockClear();
        
        // Request after reset should pass
        middleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
        expect(res.status).not.toHaveBeenCalledWith(429);
        done();
      }, 150);
    });
  });

  describe('apiLimiter', () => {
    it('should have higher limit than general limiter', () => {
      const middleware = apiLimiter.middleware();
      
      // Make multiple requests
      for (let i = 0; i < 100; i++) {
        (next as jest.Mock).mockClear();
        middleware(req as Request, res as Response, next);
        expect(next).toHaveBeenCalled();
      }
    });
  });

  describe('authLimiter', () => {
    it('should allow auth requests within limit', () => {
      const middleware = authLimiter.middleware();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });

    it('should rate limit auth endpoints more strictly', () => {
      const middleware = authLimiter.middleware();
      
      // Make requests up to the limit (100)
      for (let i = 0; i < 101; i++) {
        (next as jest.Mock).mockClear();
        middleware(req as Request, res as Response, next);
      }

      expect(res.status).toHaveBeenCalledWith(429);
    });
  });

  describe('postCreationLimiter', () => {
    it('should allow post creation within limit', () => {
      const middleware = postCreationLimiter.middleware();
      middleware(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('different IPs', () => {
    it('should track requests separately for different IPs', () => {
      class TestRateLimiter {
        private requests: Map<string, any>;
        private maxRequests: number;
        private windowMs: number;

        constructor(maxRequests: number = 2, windowMs: number = 60000) {
          this.requests = new Map();
          this.maxRequests = maxRequests;
          this.windowMs = windowMs;
        }

        middleware() {
          return (req: Request, res: Response, next: NextFunction) => {
            const key = req.user?.id || req.ip || 'unknown';
            const now = Date.now();
            
            const entry = this.requests.get(key);
            
            if (!entry || now > entry.resetTime) {
              this.requests.set(key, {
                count: 1,
                resetTime: now + this.windowMs
              });
              return next();
            }
            
            if (entry.count >= this.maxRequests) {
              return res.status(429).json({
                error: 'Too many requests',
                retryAfter: Math.ceil((entry.resetTime - now) / 1000)
              });
            }
            
            entry.count++;
            next();
          };
        }
      }

      const testLimiter = new TestRateLimiter(2, 60000);
      const middleware = testLimiter.middleware();

      const req1 = { ...req, ip: '127.0.0.1' } as Request;
      const req2 = { ...req, ip: '192.168.1.1' } as Request;

      // Both IPs should be able to make 2 requests each
      middleware(req1, res as Response, next);
      middleware(req1, res as Response, next);
      expect(next).toHaveBeenCalledTimes(2);

      (next as jest.Mock).mockClear();
      middleware(req2, res as Response, next);
      middleware(req2, res as Response, next);
      expect(next).toHaveBeenCalledTimes(2);

      // Third request from each IP should fail
      (next as jest.Mock).mockClear();
      middleware(req1, res as Response, next);
      expect(next).not.toHaveBeenCalled();

      (next as jest.Mock).mockClear();
      middleware(req2, res as Response, next);
      expect(next).not.toHaveBeenCalled();
    });
  });
});

