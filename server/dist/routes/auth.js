"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const supabase_1 = require("../config/supabase");
const auth_1 = require("../middleware/auth");
const rateLimiter_1 = require("../middleware/rateLimiter");
const router = (0, express_1.Router)();
/**
 * POST /api/auth/register
 * Register a new user with Supabase Auth and create user profile
 */
router.post('/register', rateLimiter_1.loginLimiter.middleware(), async (req, res) => {
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
        const existingUser = await prisma_1.prisma.user.findUnique({
            where: { username }
        });
        if (existingUser) {
            return res.status(400).json({
                error: 'Username already taken'
            });
        }
        // Register with Supabase Auth
        const supabase = (0, supabase_1.getSupabaseClient)();
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
            // Handle specific case where user exists in Supabase but not in local DB
            if (authError?.message?.includes('User already registered') ||
                authError?.code === 'user_already_exists') {
                return res.status(400).json({
                    error: 'An account with this email already exists. Please try logging in instead.'
                });
            }
            return res.status(400).json({
                error: authError?.message || 'Registration failed'
            });
        }
        // Create user profile in database
        try {
            const user = await prisma_1.prisma.user.create({
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
        }
        catch (dbError) {
            // Rollback Supabase user if database creation fails
            console.error('Database user creation error:', dbError);
            // Try to delete the auth user (cleanup)
            await supabase.auth.admin.deleteUser(authData.user.id).catch(console.error);
            return res.status(500).json({
                error: 'Failed to create user profile'
            });
        }
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/auth/login
 * Login with email and password
 */
router.post('/login', rateLimiter_1.loginLimiter.middleware(), async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) {
            return res.status(400).json({
                error: 'Username and password are required'
            });
        }
        // Validate username format
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
        // Find user by username to get their email
        const userByUsername = await prisma_1.prisma.user.findUnique({
            where: { username },
            select: { id: true, email: true, username: true }
        });
        if (!userByUsername) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }
        // Use the email associated with the username for Supabase authentication
        const supabase = (0, supabase_1.getSupabaseClient)();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: userByUsername.email,
            password
        });
        if (error || !data.user) {
            return res.status(401).json({
                error: 'Invalid username or password'
            });
        }
        // Get user profile from database
        let userProfile = await prisma_1.prisma.user.findUnique({
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
        if (!userProfile) {
            const fallbackUsername = (data.user.user_metadata && data.user.user_metadata.username) ||
                (data.user.email ? data.user.email.split('@')[0] : `user_${data.user.id.substring(0, 8)}`);
            const created = await prisma_1.prisma.user.create({
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
            userProfile = created;
        }
        res.json({
            message: 'Login successful',
            user: userProfile,
            session: data.session
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', async (req, res) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(400).json({ error: 'Refresh token required' });
        }
        const supabase = (0, supabase_1.getSupabaseClient)();
        const { data, error } = await supabase.auth.refreshSession({
            refresh_token: refreshToken
        });
        if (error || !data.session || !data.user) {
            return res.status(401).json({ error: 'Invalid refresh token' });
        }
        // Get user profile from database
        const userProfile = await prisma_1.prisma.user.findUnique({
            where: { id: data.user.id },
            select: {
                id: true,
                email: true,
                username: true,
                avatar_url: true,
                bio: true
            }
        });
        if (!userProfile) {
            return res.status(404).json({ error: 'User profile not found' });
        }
        res.json({
            message: 'Token refreshed',
            user: userProfile,
            session: {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_in: data.session.expires_in
            }
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Token refresh failed' });
    }
});
/**
 * POST /api/auth/logout
 * Logout current user
 */
router.post('/logout', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(200).json({ message: 'Logged out' });
        }
        const supabase = (0, supabase_1.getSupabaseClient)();
        await supabase.auth.signOut();
        res.json({ message: 'Logged out successfully' });
    }
    catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * GET /api/auth/me
 * Get current user profile
 */
router.get('/me', async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const supabase = (0, supabase_1.getSupabaseClient)();
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }
        // Get full user profile from database
        const userProfile = await prisma_1.prisma.user.findUnique({
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
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
/**
 * POST /api/auth/update-email
 * Update current user's email (requires SUPABASE_SERVICE_ROLE_KEY)
 */
router.post('/update-email', auth_1.authenticateToken, async (req, res) => {
    try {
        const { newEmail } = req.body;
        const userId = req.user.id;
        if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
            return res.status(400).json({ error: 'Valid newEmail is required' });
        }
        // Validate uniqueness in local DB to provide clearer error
        const existing = await prisma_1.prisma.user.findUnique({ where: { email: newEmail } });
        if (existing && existing.id !== userId) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        // Admin client required
        let admin;
        try {
            admin = (0, supabase_1.getSupabaseAdminClient)();
        }
        catch (e) {
            return res.status(500).json({ error: 'Server not configured for credential updates' });
        }
        const { error } = await admin.auth.admin.updateUserById(userId, { email: newEmail });
        if (error) {
            return res.status(400).json({ error: error.message || 'Failed to update email' });
        }
        // Reflect in our DB
        const updated = await prisma_1.prisma.user.update({ where: { id: userId }, data: { email: newEmail } });
        res.json({ message: 'Email updated', user: { id: updated.id, email: updated.email } });
    }
    catch (error) {
        console.error('Update email error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
/**
 * POST /api/auth/update-password
 * Update current user's password (requires SUPABASE_SERVICE_ROLE_KEY)
 */
router.post('/update-password', auth_1.authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'currentPassword and newPassword are required' });
        }
        // Basic strength check
        if (newPassword.length < 8 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            return res.status(400).json({ error: 'Password must be 8+ chars with upper, lower, and number' });
        }
        const user = await prisma_1.prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        // Verify current password by attempting sign-in
        const supabase = (0, supabase_1.getSupabaseClient)();
        const { error: signInError } = await supabase.auth.signInWithPassword({ email: user.email, password: currentPassword });
        if (signInError) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }
        // Update via admin
        let admin;
        try {
            admin = (0, supabase_1.getSupabaseAdminClient)();
        }
        catch (e) {
            return res.status(500).json({ error: 'Server not configured for credential updates' });
        }
        const { error } = await admin.auth.admin.updateUserById(userId, { password: newPassword });
        if (error) {
            return res.status(400).json({ error: error.message || 'Failed to update password' });
        }
        res.json({ message: 'Password updated' });
    }
    catch (error) {
        console.error('Update password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
