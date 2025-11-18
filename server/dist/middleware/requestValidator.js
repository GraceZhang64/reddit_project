"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MAX_SIZES = exports.validateProfileUpdate = exports.validateCommunityCreation = exports.validateCommentCreation = exports.validatePostCreation = void 0;
// Maximum sizes for different content types
const MAX_SIZES = {
    TITLE: 300, // Max title length
    BODY: 40000, // Max body length (~40KB)
    COMMENT: 10000, // Max comment length
    BIO: 500, // Max bio length
    USERNAME: 50, // Max username length
    URL: 2000, // Max URL length
    POLL_OPTION: 100, // Max poll option length
    POLL_OPTIONS: 10, // Max number of poll options
};
exports.MAX_SIZES = MAX_SIZES;
/**
 * Validate post creation data
 */
const validatePostCreation = (req, res, next) => {
    const { title, body, link_url, poll_options } = req.body;
    // Validate title
    if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required' });
    }
    if (title.length > MAX_SIZES.TITLE) {
        return res.status(400).json({
            error: `Title must be less than ${MAX_SIZES.TITLE} characters`
        });
    }
    // Validate body if present
    if (body && typeof body === 'string' && body.length > MAX_SIZES.BODY) {
        return res.status(400).json({
            error: `Post body must be less than ${MAX_SIZES.BODY} characters`
        });
    }
    // Validate link URL if present
    if (link_url && typeof link_url === 'string' && link_url.length > MAX_SIZES.URL) {
        return res.status(400).json({
            error: `URL must be less than ${MAX_SIZES.URL} characters`
        });
    }
    // Validate poll options if present
    if (poll_options && Array.isArray(poll_options)) {
        if (poll_options.length > MAX_SIZES.POLL_OPTIONS) {
            return res.status(400).json({
                error: `Maximum ${MAX_SIZES.POLL_OPTIONS} poll options allowed`
            });
        }
        for (const option of poll_options) {
            if (typeof option !== 'string' || option.length > MAX_SIZES.POLL_OPTION) {
                return res.status(400).json({
                    error: `Poll options must be strings less than ${MAX_SIZES.POLL_OPTION} characters`
                });
            }
        }
    }
    next();
};
exports.validatePostCreation = validatePostCreation;
/**
 * Validate comment creation data
 */
const validateCommentCreation = (req, res, next) => {
    const { body } = req.body;
    if (!body || typeof body !== 'string') {
        return res.status(400).json({ error: 'Comment body is required' });
    }
    if (body.length > MAX_SIZES.COMMENT) {
        return res.status(400).json({
            error: `Comment must be less than ${MAX_SIZES.COMMENT} characters`
        });
    }
    next();
};
exports.validateCommentCreation = validateCommentCreation;
/**
 * Validate community creation data
 */
const validateCommunityCreation = (req, res, next) => {
    const { name, description } = req.body;
    if (!name || typeof name !== 'string') {
        return res.status(400).json({ error: 'Community name is required' });
    }
    if (name.length > MAX_SIZES.USERNAME) {
        return res.status(400).json({
            error: `Community name must be less than ${MAX_SIZES.USERNAME} characters`
        });
    }
    if (description && typeof description === 'string' && description.length > MAX_SIZES.BODY) {
        return res.status(400).json({
            error: `Description must be less than ${MAX_SIZES.BODY} characters`
        });
    }
    next();
};
exports.validateCommunityCreation = validateCommunityCreation;
/**
 * Validate profile update data
 */
const validateProfileUpdate = (req, res, next) => {
    const { bio, username } = req.body;
    if (username && typeof username === 'string' && username.length > MAX_SIZES.USERNAME) {
        return res.status(400).json({
            error: `Username must be less than ${MAX_SIZES.USERNAME} characters`
        });
    }
    if (bio && typeof bio === 'string' && bio.length > MAX_SIZES.BIO) {
        return res.status(400).json({
            error: `Bio must be less than ${MAX_SIZES.BIO} characters`
        });
    }
    next();
};
exports.validateProfileUpdate = validateProfileUpdate;
