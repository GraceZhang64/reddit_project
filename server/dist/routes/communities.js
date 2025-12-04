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
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    memberCount: true,
                    createdAt: true,
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
 * GET /api/communities/search
 * Search communities by name or description
 */
router.get('/search', auth_1.authenticateToken, async (req, res) => {
    try {
        const query = req.query.q?.trim();
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        const [communities, total] = await Promise.all([
            prisma_1.prisma.community.findMany({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                select: {
                    id: true,
                    name: true,
                    slug: true,
                    description: true,
                    memberCount: true,
                    createdAt: true,
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
            prisma_1.prisma.community.count({
                where: {
                    OR: [
                        { name: { contains: query, mode: 'insensitive' } },
                        { description: { contains: query, mode: 'insensitive' } }
                    ]
                }
            })
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
        console.error('Error searching communities:', error);
        res.status(500).json({ error: 'Failed to search communities' });
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
            select: {
                id: true,
                name: true,
                slug: true,
                description: true,
                memberCount: true,
                createdAt: true,
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
 * POST /api/communities/:slug/join
 * Join a community (creates membership and increments member count)
 */
router.post('/:slug/join', auth_1.authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user.id;
        // Find community
        const community = await prisma_1.prisma.community.findUnique({
            where: { slug }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        // Check if already a member
        const existingMembership = await prisma_1.prisma.communityMembership.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId: community.id
                }
            }
        });
        if (existingMembership) {
            // Already have membership record, just return success
            const updatedCommunity = await prisma_1.prisma.community.findUnique({
                where: { id: community.id },
                select: { memberCount: true }
            });
            return res.json({
                success: true,
                message: 'Already a member of this community',
                memberCount: updatedCommunity?.memberCount || community.memberCount
            });
        }
        // Create membership and increment member count in a transaction
        try {
            await prisma_1.prisma.$transaction([
                prisma_1.prisma.communityMembership.create({
                    data: {
                        userId,
                        communityId: community.id
                    }
                }),
                prisma_1.prisma.community.update({
                    where: { id: community.id },
                    data: {
                        memberCount: { increment: 1 }
                    }
                })
            ]);
            console.log(`[Community Join] Created membership for user ${userId} in community ${community.id} (${community.slug})`);
        }
        catch (error) {
            console.error(`[Community Join] Error creating membership:`, error);
            // If membership creation fails (e.g., duplicate key), check if it exists now
            const checkMembership = await prisma_1.prisma.communityMembership.findUnique({
                where: {
                    userId_communityId: {
                        userId,
                        communityId: community.id
                    }
                }
            });
            if (checkMembership) {
                // Membership was created, just return success
                const updatedCommunity = await prisma_1.prisma.community.findUnique({
                    where: { id: community.id },
                    select: { memberCount: true }
                });
                return res.json({
                    success: true,
                    message: 'Successfully joined community',
                    memberCount: updatedCommunity?.memberCount || community.memberCount
                });
            }
            throw error;
        }
        // Get updated community with new member count
        const updatedCommunity = await prisma_1.prisma.community.findUnique({
            where: { id: community.id },
            select: { memberCount: true }
        });
        res.json({
            success: true,
            message: 'Successfully joined community',
            memberCount: updatedCommunity?.memberCount || community.memberCount + 1
        });
    }
    catch (error) {
        console.error('Error joining community:', error);
        res.status(500).json({ error: 'Failed to join community' });
    }
});
/**
 * POST /api/communities/:slug/leave
 * Leave a community (removes membership and decrements member count)
 */
router.post('/:slug/leave', auth_1.authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user.id;
        // Find community
        const community = await prisma_1.prisma.community.findUnique({
            where: { slug }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        // Check if a member
        const existingMembership = await prisma_1.prisma.communityMembership.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId: community.id
                }
            }
        });
        if (!existingMembership) {
            // Not in membership table, just decrement the count if needed
            const updatedCommunity = await prisma_1.prisma.community.update({
                where: { id: community.id },
                data: {
                    memberCount: community.memberCount > 0 ? { decrement: 1 } : { set: 0 }
                },
                select: { memberCount: true }
            });
            return res.json({
                success: true,
                message: 'Successfully left community',
                memberCount: Math.max(0, updatedCommunity.memberCount)
            });
        }
        // Delete membership and decrement member count in a transaction
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.communityMembership.delete({
                where: {
                    userId_communityId: {
                        userId,
                        communityId: community.id
                    }
                }
            }),
            prisma_1.prisma.community.update({
                where: { id: community.id },
                data: {
                    memberCount: community.memberCount > 0 ? { decrement: 1 } : { set: 0 }
                }
            })
        ]);
        // Get updated community with new member count
        const updatedCommunity = await prisma_1.prisma.community.findUnique({
            where: { id: community.id },
            select: { memberCount: true }
        });
        res.json({
            success: true,
            message: 'Successfully left community',
            memberCount: Math.max(0, updatedCommunity?.memberCount || community.memberCount - 1)
        });
    }
    catch (error) {
        console.error('Error leaving community:', error);
        res.status(500).json({ error: 'Failed to leave community' });
    }
});
/**
 * GET /api/communities/:slug/membership
 * Check if current user is a member of the community
 */
router.get('/:slug/membership', auth_1.authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user.id;
        // Find community
        const community = await prisma_1.prisma.community.findUnique({
            where: { slug }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        // Check membership
        const membership = await prisma_1.prisma.communityMembership.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId: community.id
                }
            }
        });
        res.json({
            isMember: !!membership,
            joinedAt: membership?.joinedAt || null
        });
    }
    catch (error) {
        console.error('Error checking membership:', error);
        res.status(500).json({ error: 'Failed to check membership' });
    }
});
/**
 * POST /api/communities/:slug/sync-membership
 * Sync/create membership record for users who joined before the fix
 * This is a one-time helper endpoint
 */
router.post('/:slug/sync-membership', auth_1.authenticateToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const userId = req.user.id;
        // Find community
        const community = await prisma_1.prisma.community.findUnique({
            where: { slug }
        });
        if (!community) {
            return res.status(404).json({ error: 'Community not found' });
        }
        // Check if membership already exists
        const existingMembership = await prisma_1.prisma.communityMembership.findUnique({
            where: {
                userId_communityId: {
                    userId,
                    communityId: community.id
                }
            }
        });
        if (existingMembership) {
            return res.json({
                success: true,
                message: 'Membership record already exists',
                created: false
            });
        }
        // Create membership record without incrementing count
        // (assuming they already joined before, so count is already correct)
        await prisma_1.prisma.communityMembership.create({
            data: {
                userId,
                communityId: community.id
            }
        });
        console.log(`[Sync Membership] Created membership for user ${userId} in community ${community.id} (${community.slug})`);
        res.json({
            success: true,
            message: 'Membership record created successfully',
            created: true
        });
    }
    catch (error) {
        console.error('Error syncing membership:', error);
        res.status(500).json({ error: 'Failed to sync membership' });
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
        // Get posts (basic data)
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
        // Aggregate vote counts for posts in this page
        const postIds = posts.map(p => p.id);
        const voteGroups = postIds.length > 0 ? await prisma_1.prisma.vote.groupBy({
            by: ['target_id'],
            where: {
                target_type: 'post',
                target_id: { in: postIds }
            },
            _sum: { value: true }
        }) : [];
        const voteMap = new Map();
        voteGroups.forEach(g => voteMap.set(g.target_id, g._sum.value || 0));
        // Fetch current user's votes for these posts (if authenticated)
        let userVoteMap = new Map();
        if (req.user && postIds.length > 0) {
            const userVotes = await prisma_1.prisma.vote.findMany({
                where: {
                    userId: req.user.id,
                    target_type: 'post',
                    target_id: { in: postIds }
                },
                select: { target_id: true, value: true }
            });
            userVotes.forEach(v => userVoteMap.set(v.target_id, v.value));
        }
        // Enrich posts with vote_count, comment_count, and user_vote
        const enriched = posts.map(p => ({
            ...p,
            vote_count: voteMap.get(p.id) || 0,
            comment_count: p._count?.comments || 0,
            user_vote: userVoteMap.get(p.id) ?? null
        }));
        res.json({
            posts: enriched,
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
