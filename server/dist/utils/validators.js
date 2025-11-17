"use strict";
/**
 * Input validation utilities
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmail = validateEmail;
exports.validatePassword = validatePassword;
exports.validateUsername = validateUsername;
exports.sanitizeHtml = sanitizeHtml;
exports.validateBio = validateBio;
/**
 * Validate email format
 */
function validateEmail(email) {
    if (!email) {
        return { valid: false, error: 'Email is required' };
    }
    // More strict email validation
    const emailRegex = /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }
    // Check for consecutive dots
    if (/\.\./.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }
    // Additional checks
    if (email.length > 254) {
        return { valid: false, error: 'Email is too long' };
    }
    return { valid: true };
}
/**
 * Validate password strength
 */
function validatePassword(password) {
    if (!password) {
        return { valid: false, error: 'Password is required' };
    }
    if (password.length < 8) {
        return { valid: false, error: 'Password must be at least 8 characters long' };
    }
    if (password.length > 128) {
        return { valid: false, error: 'Password is too long' };
    }
    // Check for at least one uppercase letter
    if (!/[A-Z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one uppercase letter' };
    }
    // Check for at least one lowercase letter
    if (!/[a-z]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one lowercase letter' };
    }
    // Check for at least one number
    if (!/\d/.test(password)) {
        return { valid: false, error: 'Password must contain at least one number' };
    }
    // Check for at least one special character (expanded set)
    if (!/[@$!%*?&#^()_\-+=[\]{}|;:'",.<>\/\\]/.test(password)) {
        return { valid: false, error: 'Password must contain at least one special character' };
    }
    // Check for common weak passwords (case-insensitive)
    const weakPasswords = [
        'password123',
        'password',
        'qwerty123',
        'abc12345',
        '12345678',
    ];
    const lowerPassword = password.toLowerCase();
    if (weakPasswords.some(weak => lowerPassword.includes(weak))) {
        return { valid: false, error: 'Password is too common. Please choose a stronger password' };
    }
    return { valid: true };
}
/**
 * Validate username
 */
function validateUsername(username) {
    if (!username) {
        return { valid: false, error: 'Username is required' };
    }
    if (username.length < 3) {
        return { valid: false, error: 'Username must be at least 3 characters long' };
    }
    if (username.length > 20) {
        return { valid: false, error: 'Username must be no more than 20 characters' };
    }
    // Only alphanumeric and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
    }
    // Must start with a letter
    if (!/^[a-zA-Z]/.test(username)) {
        return { valid: false, error: 'Username must start with a letter' };
    }
    // Check for reserved usernames
    const reserved = [
        'admin',
        'root',
        'moderator',
        'system',
        'api',
        'test',
        'guest',
        'user',
        'null',
        'undefined'
    ];
    if (reserved.includes(username.toLowerCase())) {
        return { valid: false, error: 'This username is reserved' };
    }
    return { valid: true };
}
/**
 * Sanitize HTML to prevent XSS
 */
function sanitizeHtml(input) {
    if (!input)
        return '';
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}
/**
 * Validate bio field
 */
function validateBio(bio) {
    if (!bio) {
        return { valid: true }; // Bio is optional
    }
    if (bio.length > 500) {
        return { valid: false, error: 'Bio must be no more than 500 characters' };
    }
    return { valid: true };
}
