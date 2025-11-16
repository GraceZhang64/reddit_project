import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/users/:username
 * Get user profile by username
 */
router.get('/:username', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        email: false, // Don't expose email publicly
        avatar_url: true,
        bio: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

/**
 * GET /api/users/:username/posts
 * Get all posts by a user
 */
router.get('/:username/posts', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get posts
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: user.id },
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
        where: { authorId: user.id }
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
    console.error('Error fetching user posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * GET /api/users/:username/comments
 * Get all comments by a user
 */
router.get('/:username/comments', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get comments
    const [comments, total] = await Promise.all([
      prisma.comment.findMany({
        where: { authorId: user.id },
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
              title: true,
              community: {
                select: {
                  slug: true
                }
              }
            }
          }
        }
      }),
      prisma.comment.count({
        where: { authorId: user.id }
      })
    ]);

    res.json({
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * PUT /api/users/profile
 * Update current user's profile (authenticated)
 */
router.put('/profile', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { bio, avatar_url } = req.body;
    const userId = req.user!.id;

    // Update user profile
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(bio !== undefined && { bio }),
        ...(avatar_url !== undefined && { avatar_url }),
        updated_at: new Date()
      },
      select: {
        id: true,
        username: true,
        email: true,
        avatar_url: true,
        bio: true,
        createdAt: true,
        updated_at: true
      }
    });

    res.json(updatedUser);

  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

/**
 * GET /api/users/:username/communities
 * Get communities created by a user
 */
router.get('/:username/communities', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    // Find user
    const user = await prisma.user.findUnique({
      where: { username }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get communities created by user
    const communities = await prisma.community.findMany({
      where: { creator_id: user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    res.json({ communities });

  } catch (error) {
    console.error('Error fetching user communities:', error);
    res.status(500).json({ error: 'Failed to fetch communities' });
  }
});

export default router;

