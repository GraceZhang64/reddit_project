"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
/**
 * GET /api/communities
 * Get all communities
 */
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const [communities, total] = await Promise.all([
            prisma_1.prisma.community.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    users: {
                        select: {
                            id: true,
                            username: true
                        }
                    },
                    _count: {
                        select: {
                            posts: true
                        }
                    }
                }
            }),
            prisma_1.prisma.community.count()
        ]);
        res.json({
            communities,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching communities:', error);
        res.status(500).json({ error: 'Failed to fetch communities' });
    }
});
/**
 * GET /api/communities/:slug
 * Get a specific community by slug
 */
router.get('/:slug', auth_1.authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const community = await prisma_1.prisma.community.findUnique({
            where: { slug },
            include: {
                users: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true
                    }
                },
                _count: {
                    select: {
                        posts: true
                    }
                }
            }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        res.json(community);
    }
    catch (error) {
        console.error('Error fetching community:', error);
        res.status(500).json({ error: 'Failed to fetch community' });
    }
});
/**
 * POST /api/communities
 * Create a new community (requires authentication)
 */
router.post('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const { name, slug, description } = req.body;
        if (!name || !slug) {
            return res.status(400).json({
                error: 'Name and slug are required'
            });
        }
        // Validate slug format
        if (!/^[a-z0-9_-]+$/.test(slug)) {
            return res.status(400).json({
                error: 'Slug can only contain lowercase letters, numbers, hyphens, and underscores'
            });
        }
        // Check if slug already exists
        const existing = await prisma_1.prisma.community.findUnique({
            where: { slug }
        });
        if (existing) {
            return res.status(400).json({
                error: 'A community with this slug already exists'
            });
        }
        // Create community
        const community = await prisma_1.prisma.community.create({
            data: {
                name,
                slug,
                description: description || null,
                creator_id: req.user.id
            },
            include: {
                users: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
        res.status(201).json(community);
    }
    catch (error) {
        console.error('Error creating community:', error);
        res.status(500).json({ error: 'Failed to create community' });
    }
});
/**
 * PUT /api/communities/:slug
 * Update a community (requires authentication and ownership)
 */
router.put('/:slug', auth_1.authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const { name, description } = req.body;
        // Find community
        const community = await prisma_1.prisma.community.findUnique({
            where: { slug }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        // Check if user is the creator
        if (community.creator_id !== req.user.id) {
            return res.status(403).json({
                error: 'Only the community creator can update it'
            });
        }
        // Update community
        const updated = await prisma_1.prisma.community.update({
            where: { slug },
            data: {
                ...(name && { name }),
                ...(description !== undefined && { description })
            },
            include: {
                users: {
                    select: {
                        id: true,
                        username: true
                    }
                }
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error updating community:', error);
        res.status(500).json({ error: 'Failed to update community' });
    }
});
/**
 * DELETE /api/communities/:slug
 * Delete a community (requires authentication and ownership)
 */
router.delete('/:slug', auth_1.authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        // Find community
        const community = await prisma_1.prisma.community.findUnique({
            where: { slug }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        // Check if user is the creator
        if (community.creator_id !== req.user.id) {
            return res.status(403).json({
                error: 'Only the community creator can delete it'
            });
        }
        // Delete community
        await prisma_1.prisma.community.delete({
            where: { slug }
        });
        res.json({
            success: true,
            message: 'Community deleted successfully'
        });
    }
    catch (error) {
        console.error('Error deleting community:', error);
        res.status(500).json({ error: 'Failed to delete community' });
    }
});
/**
 * GET /api/communities/:slug/posts
 * Get all posts in a community
 */
router.get('/:slug/posts', auth_1.authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        // Find community
        const community = await prisma_1.prisma.community.findUnique({
            where: { slug }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        // Get posts
        const [posts, total] = await Promise.all([
            prisma_1.prisma.post.findMany({
                where: { communityId: community.id },
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
                    community: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    _count: {
                        select: {
                            comments: true
                        }
                    }
                }
            }),
            prisma_1.prisma.post.count({
                where: { communityId: community.id }
            })
        ]);
        res.json({
            posts,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
    }
    catch (error) {
        console.error('Error fetching community posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});
exports.default = router;
