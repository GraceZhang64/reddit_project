import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { getSupabaseClient, getSupabaseAdminClient } from '../config/supabase';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user with Supabase Auth and create user profile
 */
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    // Validation
    if (!email || !password || !username) {
      return res.status(400).json({ 
        error: 'Email, password, and username are required' 
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Password strength validation
    if (password.length < 8) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long' 
      });
    }

    // Check password complexity
    if (!/[a-z]/.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one lowercase letter' 
      });
    }

    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one uppercase letter' 
      });
    }

    if (!/\d/.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one number' 
      });
    }

    if (!/[@$!%*?&#^()_\-+=[\]{}|;:'",.<>\/\\]/.test(password)) {
      return res.status(400).json({ 
        error: 'Password must contain at least one special character' 
      });
    }

    // Username validation
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ 
        error: 'Username must be between 3 and 20 characters' 
      });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ 
        error: 'Username can only contain letters, numbers, and underscores' 
      });
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ 
        error: 'Username already taken' 
      });
    }

    // Register with Supabase Auth
    const supabase = getSupabaseClient();
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username
        }
      }
    });

    if (authError || !authData.user) {
      console.error('Supabase registration error:', authError);
      return res.status(400).json({ 
        error: authError?.message || 'Registration failed' 
      });
    }

    // Create user profile in database
    try {
      const user = await prisma.user.create({
        data: {
          id: authData.user.id,
          email,
          username,
          avatar_url: null,
          bio: null
        }
      });

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          username: user.username
        },
        session: authData.session
      });
    } catch (dbError: any) {
      // Rollback Supabase user if database creation fails
      console.error('Database user creation error:', dbError);
      
      // Try to delete the auth user (cleanup)
      await supabase.auth.admin.deleteUser(authData.user.id).catch(console.error);
      
      return res.status(500).json({ 
        error: 'Failed to create user profile' 
      });
    }

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error || !data.user) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Get user profile from database
    let user = await prisma.user.findUnique({
      where: { id: data.user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar_url: true,
        bio: true
      }
    });

    // If profile was deleted in our DB but still exists in Supabase Auth, recreate it
    if (!user) {
      const fallbackUsername =
        (data.user.user_metadata && (data.user.user_metadata as any).username) ||
        (data.user.email ? data.user.email.split('@')[0] : `user_${data.user.id.substring(0, 8)}`);

      const created = await prisma.user.create({
        data: {
          id: data.user.id,
          email: data.user.email || '',
          username: fallbackUsername,
          avatar_url: null,
          bio: null
        },
        select: {
          id: true,
          email: true,
          username: true,
          avatar_url: true,
          bio: true
        }
      });
      user = created;
    }

    res.json({
      message: 'Login successful',
      user,
      session: data.session
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/logout', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(200).json({ message: 'Logged out' });
    }

    const supabase = getSupabaseClient();
    await supabase.auth.signOut();

    res.json({ message: 'Logged out successfully' });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const supabase = getSupabaseClient();
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Get full user profile from database
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar_url: true,
        bio: true,
        createdAt: true
      }
    });

    if (!userProfile) {
      return res.status(404).json({ error: 'User profile not found' });
    }

    res.json({ user: userProfile });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

/**
 * POST /api/auth/update-email
 * Update current user's email (requires SUPABASE_SERVICE_ROLE_KEY)
 */
router.post('/update-email', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { newEmail } = req.body as { newEmail?: string };
    const userId = req.user!.id;

    if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      return res.status(400).json({ error: 'Valid newEmail is required' });
    }

    // Validate uniqueness in local DB to provide clearer error
    const existing = await prisma.user.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    // Admin client required
    let admin;
    try {
      admin = getSupabaseAdminClient();
    } catch (e: any) {
      return res.status(500).json({ error: 'Server not configured for credential updates' });
    }

    const { error } = await admin.auth.admin.updateUserById(userId, { email: newEmail });
    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to update email' });
    }

    // Reflect in our DB
    const updated = await prisma.user.update({ where: { id: userId }, data: { email: newEmail } });

    res.json({ message: 'Email updated', user: { id: updated.id, email: updated.email } });
  } catch (error) {
    console.error('Update email error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/auth/update-password
 * Update current user's password (requires SUPABASE_SERVICE_ROLE_KEY)
 */
router.post('/update-password', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
    const userId = req.user!.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'currentPassword and newPassword are required' });
    }

    // Basic strength check
    if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({ error: 'Password must be 8+ chars with upper, lower, and number' });
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password by attempting sign-in
    const supabase = getSupabaseClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
    if (signInError) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update via admin
    let admin;
    try {
      admin = getSupabaseAdminClient();
    } catch (e: any) {
      return res.status(500).json({ error: 'Server not configured for credential updates' });
    }

    const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
    if (error) {
      return res.status(400).json({ error: error.message || 'Failed to update password' });
    }

    res.json({ message: 'Password updated' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

