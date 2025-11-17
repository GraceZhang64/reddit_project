import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * POST /api/follows/:username
 * Follow a user
 */
router.post('/:username', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const followerId = req.user!.id;

    // Get user to follow
    const userToFollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userToFollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (userToFollow.id === followerId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    // Check if already following
    const existing = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userToFollow.id,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Create follow
    await prisma.userFollow.create({
      data: {
        followerId,
        followingId: userToFollow.id,
      },
    });

    res.json({ message: 'Successfully followed user' });
  } catch (error) {
    console.error('Error following user:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

/**
 * DELETE /api/follows/:username
 * Unfollow a user
 */
router.delete('/:username', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const followerId = req.user!.id;

    const userToUnfollow = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userToUnfollow) {
      return res.status(404).json({ error: 'User not found' });
    }

    await prisma.userFollow.deleteMany({
      where: {
        followerId,
        followingId: userToUnfollow.id,
      },
    });

    res.json({ message: 'Successfully unfollowed user' });
  } catch (error) {
    console.error('Error unfollowing user:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

/**
 * GET /api/follows/check/:username
 * Check if current user follows a specific user
 */
router.get('/check/:username', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const followerId = req.user!.id;

    const userToCheck = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!userToCheck) {
      return res.status(404).json({ error: 'User not found' });
    }

    const follow = await prisma.userFollow.findUnique({
      where: {
        followerId_followingId: {
          followerId,
          followingId: userToCheck.id,
        },
      },
    });

    res.json({ isFollowing: !!follow });
  } catch (error) {
    console.error('Error checking follow status:', error);
    res.status(500).json({ error: 'Failed to check follow status' });
  }
});

/**
 * GET /api/follows/followers/:username
 * Get list of followers for a user
 */
router.get('/followers/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [followers, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: { followingId: user.id },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              karma: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userFollow.count({ where: { followingId: user.id } }),
    ]);

    res.json({
      followers: followers.map((f) => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

/**
 * GET /api/follows/following/:username
 * Get list of users that a user follows
 */
router.get('/following/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [following, total] = await Promise.all([
      prisma.userFollow.findMany({
        where: { followerId: user.id },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
              karma: true,
              createdAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.userFollow.count({ where: { followerId: user.id } }),
    ]);

    res.json({
      following: following.map((f) => f.following),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching following:', error);
    res.status(500).json({ error: 'Failed to fetch following' });
  }
});

/**
 * GET /api/follows/feed
 * Get posts from followed users
 */
router.get('/feed', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Get followed user IDs
    const following = await prisma.userFollow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followedUserIds = following.map((f) => f.followingId);

    if (followedUserIds.length === 0) {
      return res.json({
        posts: [],
        pagination: { page, limit, total: 0, totalPages: 0 },
      });
    }

    // Get posts from followed users
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: { authorId: { in: followedUserIds } },
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar_url: true,
            },
          },
          community: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          flair: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.post.count({ where: { authorId: { in: followedUserIds } } }),
    ]);

    // Get vote counts and comment counts
    const postsWithCounts = await Promise.all(
      posts.map(async (post) => {
        const [voteCount, commentCount, userVote] = await Promise.all([
          prisma.vote.aggregate({
            where: { target_type: 'post', target_id: post.id },
            _sum: { value: true },
          }),
          prisma.comment.count({ where: { postId: post.id } }),
          // Get current user's vote if authenticated
          prisma.vote.findFirst({
            where: {
              userId,
              target_type: 'post',
              target_id: post.id,
            },
            select: { value: true },
          }),
        ]);

        return {
          ...post,
          voteCount: voteCount._sum.value || 0,
          commentCount: commentCount,
          userVote: userVote?.value || null,
        };
      })
    );

    res.json({
      posts: postsWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching following feed:', error);
    res.status(500).json({ error: 'Failed to fetch following feed' });
  }
});

export default router;

