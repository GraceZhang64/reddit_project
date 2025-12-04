"use strict";
/**
 * Content sanitization utilities to prevent XSS, prompt injection, and other attacks
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeContentForStorage = sanitizeContentForStorage;
exports.sanitizeTitle = sanitizeTitle;
exports.sanitizePollOption = sanitizePollOption;
exports.sanitizeUrl = sanitizeUrl;
exports.detectSuspiciousContent = detectSuspiciousContent;
/**
 * Sanitize content for storage (preserves markdown but removes dangerous HTML/scripts)
 * This is for backend storage - frontend will handle markdown rendering with rehypeSanitize
 */
function sanitizeContentForStorage(content) {
    if (!content || typeof content !== 'string') {
        return '';
    }
    // Remove null bytes and control characters (except newlines and tabs)
    let sanitized = content
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, ''); // Remove control chars except \n, \t, \r
    // Remove potential prompt injection patterns
    sanitized = removePromptInjectionPatterns(sanitized);
    // Remove dangerous HTML/script patterns while preserving markdown
    sanitized = removeDangerousPatterns(sanitized);
    // Normalize whitespace (prevent excessive whitespace attacks)
    sanitized = sanitized.replace(/\s{3,}/g, '  '); // Max 2 consecutive spaces
    return sanitized.trim();
}
/**
 * Remove prompt injection patterns that could be used to manipulate AI systems
 */
function removePromptInjectionPatterns(content) {
    // Patterns that attempt to override AI instructions
    const injectionPatterns = [
        /ignore\s+(previous|all|above)\s+instructions?/gi,
        /forget\s+(previous|all|above)\s+instructions?/gi,
        /system\s*:\s*override/gi,
        /\[INST\]|\[\/INST\]/gi, // Llama instruction markers
        /<\|im_start\|>|<\|im_end\|>/gi, // ChatML markers
        /you\s+are\s+now\s+(a|an)\s+/gi,
        /act\s+as\s+(if\s+)?you\s+are/gi,
        /pretend\s+to\s+be/gi,
        /roleplay\s+as/gi,
    ];
    let sanitized = content;
    for (const pattern of injectionPatterns) {
        sanitized = sanitized.replace(pattern, '[removed]');
    }
    return sanitized;
}
/**
 * Remove dangerous HTML/script patterns
 */
function removeDangerousPatterns(content) {
    // Remove script tags and event handlers
    const dangerousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
        /on\w+\s*=\s*["'][^"']*["']/gi, // Event handlers like onclick="..."
        /javascript\s*:/gi, // javascript: URLs
        /data\s*:\s*text\/html/gi, // data: URLs with HTML
        /vbscript\s*:/gi, // VBScript URLs
        /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
        /<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi,
        /<link\b[^<]*(?:(?!<\/link>)<[^<]*)*<\/link>/gi,
        /<meta\b[^<]*(?:(?!<\/meta>)<[^<]*)*>/gi,
    ];
    let sanitized = content;
    for (const pattern of dangerousPatterns) {
        sanitized = sanitized.replace(pattern, '');
    }
    return sanitized;
}
/**
 * Sanitize title (more strict - no markdown, no HTML)
 */
function sanitizeTitle(title) {
    if (!title || typeof title !== 'string') {
        return '';
    }
    // Remove HTML tags
    let sanitized = title.replace(/<[^>]*>/g, '');
    // Remove dangerous patterns
    sanitized = removeDangerousPatterns(sanitized);
    sanitized = removePromptInjectionPatterns(sanitized);
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    return sanitized;
}
/**
 * Sanitize poll options
 */
function sanitizePollOption(option) {
    if (!option || typeof option !== 'string') {
        return '';
    }
    // Remove HTML tags
    let sanitized = option.replace(/<[^>]*>/g, '');
    // Remove dangerous patterns
    sanitized = removeDangerousPatterns(sanitized);
    sanitized = removePromptInjectionPatterns(sanitized);
    // Remove control characters
    sanitized = sanitized.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');
    // Normalize whitespace
    sanitized = sanitized.replace(/\s+/g, ' ').trim();
    return sanitized;
}
/**
 * Validate and sanitize URL
 */
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') {
        return null;
    }
    try {
        const parsed = new URL(url);
        // Only allow http and https protocols
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return null;
        }
        // Check for javascript: or data: in the URL
        if (url.toLowerCase().includes('javascript:') || url.toLowerCase().includes('data:text/html')) {
            return null;
        }
        return parsed.toString();
    }
    catch {
        return null;
    }
}
/**
 * Check for suspicious content patterns
 */
function detectSuspiciousContent(content) {
    const reasons = [];
    if (!content || typeof content !== 'string') {
        return { isSuspicious: false, reasons: [] };
    }
    // Check for excessive special characters (potential obfuscation)
    const specialCharRatio = (content.match(/[^\w\s]/g) || []).length / content.length;
    if (specialCharRatio > 0.3) {
        reasons.push('High ratio of special characters');
    }
    // Check for encoded content
    if (content.includes('%3C') || content.includes('&lt;') || content.includes('&#x')) {
        reasons.push('Contains encoded HTML');
    }
    // Check for SQL injection patterns
    const sqlPatterns = [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
        /('|(\\')|(;)|(--)|(\/\*)|(\*\/))/g,
    ];
    for (const pattern of sqlPatterns) {
        if (pattern.test(content)) {
            reasons.push('Contains SQL-like patterns');
            break;
        }
    }
    // Check for excessive line breaks (potential DoS)
    const lineBreakCount = (content.match(/\n/g) || []).length;
    if (lineBreakCount > 1000) {
        reasons.push('Excessive line breaks');
    }
    return {
        isSuspicious: reasons.length > 0,
        reasons
    };
}
