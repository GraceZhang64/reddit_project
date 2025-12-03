import { Request, Response, NextFunction } from 'express';
import { getSupabaseClient } from '../config/supabase';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email?: string;
        username?: string;
      };
    }
  }
}

export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supabase = getSupabaseClient();

    // Use Supabase's getUser which validates the token
    // Supabase handles token validation internally
    const { data: { user }, error } = await supabase.auth.getUser(token);

    // If token is expired or invalid, return specific error for client to handle refresh
    if (error || !user) {
      // Don't log as error - this is normal when tokens expire
      return res.status(401).json({
        error: 'Token expired or invalid',
        code: 'TOKEN_EXPIRED'
      });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
}

export async function optionalAuth(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const supabase = getSupabaseClient();
        // Use getUser which handles token validation
        // If token is expired, it will return error but we continue without auth
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (user && !error) {
          req.user = {
            id: user.id,
            email: user.email,
          };
        }
        // If error (expired/invalid token), just continue without setting req.user
        // This allows public access to posts even with expired tokens
      } catch (authError) {
        // Silently ignore auth errors - allow public access
        // This ensures posts can be viewed even with invalid/expired tokens
      }
    }

    next();
  } catch (error) {
    // Always continue without auth if there's any error
    // This ensures posts are always accessible
    next();
  }
}

