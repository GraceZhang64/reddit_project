import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/communities
 * Get all communities
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [communities, total] = await Promise.all([
      prisma.community.findMany({
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
      prisma.community.count()
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

  } catch (error) {
    console.error('Error fetching communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

/**
 * GET /api/communities/:slug
 * Get a specific community by slug
 */
router.get('/:slug', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    const community = await prisma.community.findUnique({
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

  } catch (error) {
    console.error('Error fetching community:', error);
    res.status(500).json({ error: 'Failed to fetch community' });
  }
});

/**
 * POST /api/communities
 * Create a new community (requires authentication)
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
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
    const existing = await prisma.community.findUnique({
      where: { slug }
    });

    if (existing) {
      return res.status(400).json({ 
        error: 'A community with this slug already exists' 
      });
    }

    // Create community
    const community = await prisma.community.create({
      data: {
        name,
        slug,
        description: description || null,
        creator_id: req.user!.id
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

  } catch (error) {
    console.error('Error creating community:', error);
    res.status(500).json({ error: 'Failed to create community' });
  }
});

/**
 * PUT /api/communities/:slug
 * Update a community (requires authentication and ownership)
 */
router.put('/:slug', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const { name, description } = req.body;

    // Find community
    const community = await prisma.community.findUnique({
      where: { slug }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is the creator
    if (community.creator_id !== req.user!.id) {
      return res.status(403).json({ 
        error: 'Only the community creator can update it' 
      });
    }

    // Update community
    const updated = await prisma.community.update({
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

  } catch (error) {
    console.error('Error updating community:', error);
    res.status(500).json({ error: 'Failed to update community' });
  }
});

/**
 * DELETE /api/communities/:slug
 * Delete a community (requires authentication and ownership)
 */
router.delete('/:slug', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Find community
    const community = await prisma.community.findUnique({
      where: { slug }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Check if user is the creator
    if (community.creator_id !== req.user!.id) {
      return res.status(403).json({ 
        error: 'Only the community creator can delete it' 
      });
    }

    // Delete community
    await prisma.community.delete({
      where: { slug }
    });

    res.json({ 
      success: true, 
      message: 'Community deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting community:', error);
    res.status(500).json({ error: 'Failed to delete community' });
  }
});

/**
 * GET /api/communities/:slug/posts
 * Get all posts in a community
 */
router.get('/:slug/posts', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Find community
    const community = await prisma.community.findUnique({
      where: { slug }
    });

    if (!community) {
      return res.status(404).json({ error: 'Community not found' });
    }

    // Get posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
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
      prisma.post.count({
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

  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

export default router;

