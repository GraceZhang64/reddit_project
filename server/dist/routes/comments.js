"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const cache_1 = require("../lib/cache");
const rateLimiter_1 = require("../middleware/rateLimiter");
const requestValidator_1 = require("../middleware/requestValidator");
const contentSanitizer_1 = require("../utils/contentSanitizer");
const router = (0, express_1.Router)();
/**
 * GET /api/comments/search
 * Search comments by keyword
 */
router.get('/search', auth_1.authenticateToken, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        // Search comments using ILIKE for case-insensitive search
        const comments = await prisma_1.prisma.comment.findMany({
            where: {
                body: {
                    contains: query,
                    mode: 'insensitive'
                }
            },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                },
                post: {
                    select: {
                        id: true,
                        slug: true,
                        title: true,
                        community: {
                            select: {
                                id: true,
                                name: true,
                                slug: true
                            }
                        }
                    }
                }
            }
        });
        // Get vote counts for each comment
        const commentsWithVotes = await Promise.all(comments.map(async (comment) => {
            const voteCount = await prisma_1.prisma.vote.aggregate({
                where: {
                    target_type: 'comment',
                    target_id: comment.id
                },
                _sum: {
                    value: true
                }
            });
            let userVote = null;
            if (req.user) {
                const vote = await prisma_1.prisma.vote.findUnique({
                    where: {
                        userId_target_type_target_id: {
                            userId: req.user.id,
                            target_type: 'comment',
                            target_id: comment.id
                        }
                    }
                });
                userVote = vote ? vote.value : null;
            }
            return {
                ...comment,
                vote_count: voteCount._sum.value || 0,
                user_vote: userVote
            };
        }));
        // Get total count for pagination
        const total = await prisma_1.prisma.comment.count({
            where: {
                body: {
                    contains: query,
                    mode: 'insensitive'
                }
            }
        });
        res.json({
            comments: commentsWithVotes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error searching comments:', error);
        res.status(500).json({ error: 'Failed to search comments' });
    }
});
/**
 * GET /api/comments/post/:postId
 * Get all comments for a post (cached for performance)
 */
router.get('/post/:postId', auth_1.authenticateToken, async (req, res) => {
    try {
        const postId = parseInt(req.params.postId);
        const userId = req.user?.id;
        if (isNaN(postId)) {
            return res.status(400).json({ error: 'Invalid post ID' });
        }
        // Cache key includes user ID for personalized vote data
        const cacheKey = `comments:${postId}:${userId}`;
        // Check cache first
        const cachedData = cache_1.cache.get(cacheKey);
        if (cachedData) {
            return res.json(cachedData);
        }
        // Check if post exists
        const post = await prisma_1.prisma.post.findUnique({
            where: { id: postId }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        // Get top-level comments first (limit to 5 for faster performance)
        const topLevelCommentsQuery = await prisma_1.prisma.comment.findMany({
            where: {
                postId,
                parentCommentId: null
            },
            take: 5, // Reduced from 10 to 5 for faster loading
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                }
            }
        });
        // Get all comment IDs (top-level + their replies)
        const topLevelCommentIds = topLevelCommentsQuery.map(c => c.id);
        // Get all replies for these top-level comments
        const replies = await prisma_1.prisma.comment.findMany({
            where: {
                postId,
                parentCommentId: { in: topLevelCommentIds }
            },
            orderBy: { createdAt: 'desc' },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                }
            }
        });
        const allComments = [...topLevelCommentsQuery, ...replies];
        const commentIds = allComments.map(c => c.id);
        // Batch fetch all vote counts in a single query (only if there are comments)
        const voteCounts = commentIds.length > 0 ? await prisma_1.prisma.vote.groupBy({
            by: ['target_id'],
            where: {
                target_type: 'comment',
                target_id: { in: commentIds }
            },
            _sum: {
                value: true
            }
        }) : [];
        // Create a map of commentId -> voteCount
        const voteCountMap = new Map();
        voteCounts.forEach(vc => {
            voteCountMap.set(vc.target_id, vc._sum.value || 0);
        });
        // Batch fetch all user votes in a single query (only if there are comments)
        let userVoteMap = new Map();
        if (req.user && commentIds.length > 0) {
            const userVotes = await prisma_1.prisma.vote.findMany({
                where: {
                    userId: req.user.id,
                    target_type: 'comment',
                    target_id: { in: commentIds }
                },
                select: {
                    target_id: true,
                    value: true
                }
            });
            userVotes.forEach(vote => {
                userVoteMap.set(vote.target_id, vote.value);
            });
        }
        // Build nested comment structure
        const commentsMap = new Map();
        const topLevelComments = [];
        // First pass: Create a map of all comments with their vote data
        for (const comment of allComments) {
            commentsMap.set(comment.id, {
                ...comment,
                vote_count: voteCountMap.get(comment.id) || 0,
                user_vote: userVoteMap.get(comment.id) || null,
                post_id: comment.postId,
                parent_comment_id: comment.parentCommentId,
                created_at: comment.createdAt,
                replies: []
            });
        }
        // Second pass: Build the tree structure
        for (const comment of commentsMap.values()) {
            if (comment.parentCommentId === null) {
                // Top-level comment
                topLevelComments.push(comment);
            }
            else {
                // Reply - add to parent's replies array
                const parent = commentsMap.get(comment.parentCommentId);
                if (parent) {
                    parent.replies.push(comment);
                }
            }
        }
        // Sort top-level comments by creation date (newest first)
        topLevelComments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        const result = { comments: topLevelComments };
        // Cache for 30 seconds
        cache_1.cache.set(cacheKey, result, cache_1.CACHE_TTL.COMMENTS);
        res.json(result);
    }
    catch (error) {
        console.error('Error fetching comments:', error);
        res.status(500).json({ error: 'Failed to fetch comments' });
    }
});
/**
 * GET /api/comments/:id
 * Get a specific comment with its replies
 */
router.get('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        if (isNaN(commentId)) {
            return res.status(400).json({ error: 'Invalid comment ID' });
        }
        const comment = await prisma_1.prisma.comment.findUnique({
            where: { id: commentId },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                },
                replies: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                username: true,
                                avatar_url: true
                            }
                        }
                    },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });
        if (!comment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        // Get vote count
        const voteCount = await prisma_1.prisma.vote.aggregate({
            where: {
                target_type: 'comment',
                target_id: commentId
            },
            _sum: {
                value: true
            }
        });
        let userVote = null;
        if (req.user) {
            const vote = await prisma_1.prisma.vote.findUnique({
                where: {
                    userId_target_type_target_id: {
                        userId: req.user.id,
                        target_type: 'comment',
                        target_id: commentId
                    }
                }
            });
            userVote = vote ? vote.value : null;
        }
        res.json({
            ...comment,
            vote_count: voteCount._sum.value || 0,
            user_vote: userVote
        });
    }
    catch (error) {
        console.error('Error fetching comment:', error);
        res.status(500).json({ error: 'Failed to fetch comment' });
    }
});
/**
 * POST /api/comments
 * Create a new comment or reply
 */
router.post('/', auth_1.authenticateToken, rateLimiter_1.contentCreationLimiter.middleware(), requestValidator_1.validateCommentCreation, async (req, res) => {
    try {
        const { body, postId, parentCommentId } = req.body;
        const authorId = req.user.id;
        if (!body || !postId) {
            return res.status(400).json({
                error: 'Body and postId are required'
            });
        }
        // Sanitize comment body to prevent XSS and injection attacks
        const sanitizedBody = (0, contentSanitizer_1.sanitizeContentForStorage)(body);
        // Check for suspicious content
        const contentCheck = (0, contentSanitizer_1.detectSuspiciousContent)(sanitizedBody);
        if (contentCheck.isSuspicious) {
            return res.status(400).json({
                error: 'Comment contains suspicious patterns and cannot be posted.'
            });
        }
        // Verify the author exists in the database
        const author = await prisma_1.prisma.user.findUnique({
            where: { id: authorId }
        });
        if (!author) {
            return res.status(401).json({
                error: 'User not found. Please log in again.'
            });
        }
        // Check if post exists
        const post = await prisma_1.prisma.post.findUnique({
            where: { id: parseInt(postId) }
        });
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        // If replying to a comment, check if it exists
        if (parentCommentId) {
            const parentComment = await prisma_1.prisma.comment.findUnique({
                where: { id: parseInt(parentCommentId) }
            });
            if (!parentComment) {
                return res.status(404).json({ error: 'Parent comment not found' });
            }
            // Ensure parent comment is from the same post
            if (parentComment.postId !== parseInt(postId)) {
                return res.status(400).json({
                    error: 'Parent comment must be from the same post'
                });
            }
        }
        // Create comment
        const comment = await prisma_1.prisma.comment.create({
            data: {
                body: sanitizedBody,
                authorId,
                postId: parseInt(postId),
                parentCommentId: parentCommentId ? parseInt(parentCommentId) : null
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                }
            }
        });
        // Update community member count if this is user's first interaction
        // Exclude the current comment from the check since it was just created
        const { updateCommunityMemberCount } = await Promise.resolve().then(() => __importStar(require('../utils/communityMemberCount')));
        await updateCommunityMemberCount(post.communityId, authorId, undefined, comment.id);
        // Create mention notifications
        const { createMentionNotifications } = await Promise.resolve().then(() => __importStar(require('../utils/mentions')));
        await createMentionNotifications(body, authorId, parseInt(postId), comment.id);
        res.status(201).json({
            ...comment,
            post_id: comment.postId,
            parent_comment_id: comment.parentCommentId,
            vote_count: 0,
            created_at: comment.createdAt,
            user_vote: null
        });
    }
    catch (error) {
        console.error('Error creating comment:', error);
        res.status(500).json({ error: 'Failed to create comment' });
    }
});
/**
 * PUT /api/comments/:id
 * Update a comment
 */
router.put('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        const { body } = req.body;
        if (isNaN(commentId)) {
            return res.status(400).json({ error: 'Invalid comment ID' });
        }
        if (!body) {
            return res.status(400).json({ error: 'Body is required' });
        }
        // Check if comment exists and user owns it
        const existingComment = await prisma_1.prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        if (existingComment.authorId !== req.user.id) {
            return res.status(403).json({
                error: 'Not authorized to update this comment'
            });
        }
        // Update comment
        const comment = await prisma_1.prisma.comment.update({
            where: { id: commentId },
            data: {
                body,
                updated_at: new Date()
            },
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                }
            }
        });
        res.json(comment);
    }
    catch (error) {
        console.error('Error updating comment:', error);
        res.status(500).json({ error: 'Failed to update comment' });
    }
});
/**
 * DELETE /api/comments/:id
 * Delete a comment
 */
router.delete('/:id', auth_1.authenticateToken, async (req, res) => {
    try {
        const commentId = parseInt(req.params.id);
        if (isNaN(commentId)) {
            return res.status(400).json({ error: 'Invalid comment ID' });
        }
        // Check if comment exists and user owns it
        const existingComment = await prisma_1.prisma.comment.findUnique({
            where: { id: commentId }
        });
        if (!existingComment) {
            return res.status(404).json({ error: 'Comment not found' });
        }
        if (existingComment.authorId !== req.user.id) {
            return res.status(403).json({
                error: 'Not authorized to delete this comment'
            });
        }
        // Delete comment (cascade will delete replies)
        await prisma_1.prisma.comment.delete({
            where: { id: commentId }
        });
        res.json({
            success: true,
            message: 'Comment deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting comment:', error);
        res.status(500).json({ error: 'Failed to delete comment' });
    }
});
exports.default = router;
