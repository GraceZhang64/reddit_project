"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.optionalAuth = optionalAuth;
const supabase_1 = require("../config/supabase");
async function authenticateToken(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        if (!token) {
            return res.status(401).json({ error: 'Authentication required' });
        }
        const supabase = (0, supabase_1.getSupabaseClient)();
        // First try to validate the current token
        let { data: { user }, error } = await supabase.auth.getUser(token);
        // If token is expired or invalid, return specific error for client to handle refresh
        if (error || !user) {
            console.log('Access token expired or invalid');
            return res.status(401).json({
                error: 'Token expired',
                code: 'TOKEN_EXPIRED'
            });
        }
        req.user = {
            id: user.id,
            email: user.email,
        };
        next();
    }
    catch (error) {
        console.error('Auth middleware error:', error);
        res.status(401).json({ error: 'Authentication failed' });
    }
}
async function optionalAuth(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];
        if (token) {
            const supabase = (0, supabase_1.getSupabaseClient)();
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user) {
                req.user = {
                    id: user.id,
                    email: user.email,
                };
            }
        }
        next();
    }
    catch (error) {
        // Continue without auth if there's an error
        next();
    }
}
