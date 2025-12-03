import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';
import { getSupabaseClient } from '../config/supabase';

const router = Router();

/**
 * GET /api/users/check-username/:username
 * Public endpoint to check if a username is available
 */
router.get('/check-username/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    if (!username || username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Only letters, numbers, and underscores allowed' });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    return res.json({ available: !existing });
  } catch (error) {
    console.error('Error checking username:', error);
    res.status(500).json({ error: 'Failed to check username' });
  }
});

/**
 * GET /api/users/:username
 * Get user profile by username
 */
router.get('/:username', authenticateToken, async (req: Request, res: Response) => {
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
        karma: true,
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
router.get('/:username/posts', authenticateToken, async (req: Request, res: Response) => {
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

    // Get posts with optimized vote fetching
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
          }
        }
      }),
      prisma.post.count({
        where: { authorId: user.id }
      })
    ]);

    // Batch fetch vote counts and comment counts for all posts
    const postIds = posts.map(p => p.id);
    
    const [voteCounts, commentCounts] = await Promise.all([
      // Batch vote counts
      postIds.length > 0 ? prisma.vote.groupBy({
        by: ['target_id'],
        where: {
          target_type: 'post',
          target_id: { in: postIds }
        },
        _sum: {
          value: true
        }
      }) : Promise.resolve([]),
      // Batch comment counts
      postIds.length > 0 ? prisma.comment.groupBy({
        by: ['postId'],
        where: {
          postId: { in: postIds }
        },
        _count: {
          id: true
        }
      }) : Promise.resolve([])
    ]);

    // Create maps for quick lookup
    const voteCountMap = new Map(voteCounts.map(v => [v.target_id, v._sum.value || 0]));
    const commentCountMap = new Map(commentCounts.map(c => [c.postId, c._count.id]));

    // Enrich posts with counts
    const postsWithCounts = posts.map(post => ({
      ...post,
      vote_count: voteCountMap.get(post.id) || 0,
      comment_count: commentCountMap.get(post.id) || 0
    }));

    res.json({
      posts: postsWithCounts,
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
router.get('/:username/comments', authenticateToken, async (req: Request, res: Response) => {
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

    // Get comments with optimized vote fetching
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

    // Batch fetch vote counts for all comments
    const commentIds = comments.map(c => c.id);
    
    const voteCounts = commentIds.length > 0 ? await prisma.vote.groupBy({
      by: ['target_id'],
      where: {
        target_type: 'comment',
        target_id: { in: commentIds }
      },
      _sum: {
        value: true
      }
    }) : [];

    // Create map for quick lookup
    const voteCountMap = new Map(voteCounts.map(v => [v.target_id, v._sum.value || 0]));

    // Enrich comments with vote counts
    const commentsWithCounts = comments.map(comment => ({
      ...comment,
      vote_count: voteCountMap.get(comment.id) || 0
    }));

    res.json({
      comments: commentsWithCounts,
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
    const { bio, avatar_url } = req.body as { bio?: string; avatar_url?: string };
    const userId = req.user!.id;

    if (bio && bio.length > 500) {
      return res.status(400).json({ error: 'Bio must be 500 characters or less' });
    }

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
 * PUT /api/users/username
 * Update current user's username (authenticated)
 */
router.put('/username', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { username } = req.body as { username?: string };
    const userId = req.user!.id;

    if (!username) {
      return res.status(400).json({ error: 'Username is required' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ error: 'Username must be 3-20 characters' });
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return res.status(400).json({ error: 'Only letters, numbers, and underscores allowed' });
    }

    // Check uniqueness
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing && existing.id !== userId) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { username, updated_at: new Date() },
      select: {
        id: true,
        email: true,
        username: true,
        avatar_url: true,
        bio: true,
        createdAt: true,
        updated_at: true
      }
    });

    res.json({ message: 'Username updated', user: updated });
  } catch (error) {
    console.error('Error updating username:', error);
    res.status(500).json({ error: 'Failed to update username' });
  }
});

/**
 * DELETE /api/users/me
 * Delete current user's account (authenticated)
 */
router.delete('/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { confirm } = req.body as { confirm?: string };
    const userId = req.user!.id;

    if (confirm !== 'DELETE') {
      return res.status(400).json({ error: 'Confirmation phrase required' });
    }

    // Best-effort delete in Supabase Auth as well (may require service key)
    try {
      const supabase = getSupabaseClient();
      // @ts-ignore - admin API may not be available with anon key; ignore failure
      if (supabase?.auth?.admin?.deleteUser) {
        // @ts-ignore
        await supabase.auth.admin.deleteUser(userId);
      }
    } catch (e) {
      // ignore
    }

    // Delete from our DB (cascades to posts, comments, votes)
    await prisma.user.delete({ where: { id: userId } });

    res.json({ message: 'Account deleted' });
  } catch (error) {
    console.error('Error deleting account:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

/**
 * GET /api/users/:username/communities
 * Get communities created by a user
 */
router.get('/:username/communities', authenticateToken, async (req: Request, res: Response) => {
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

