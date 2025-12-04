import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

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
 * Get posts from followed users and/or communities
 * Query params: filter ('all' | 'users' | 'communities')
 */
router.get('/feed', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;
    const filter = (req.query.filter as string) || 'all'; // 'all', 'users', or 'communities'

    // Build where conditions based on filter
    let whereCondition: any = {};

    if (filter === 'users') {
      // Only posts from followed users
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
      
      whereCondition = { authorId: { in: followedUserIds } };
     } else if (filter === 'communities') {
       // Only posts from communities user is a member of
       try {
         const memberships = await prisma.communityMembership.findMany({
           where: { userId },
           select: { communityId: true },
         });
         const communityIds = memberships.map((m) => m.communityId);
         
         console.log(`[Follows Feed] Filter: communities, User: ${userId}, Found ${memberships.length} memberships, Community IDs:`, communityIds);
         
         if (communityIds.length === 0) {
           console.log(`[Follows Feed] No community memberships found for user ${userId}`);
           return res.json({
             posts: [],
             pagination: { page, limit, total: 0, totalPages: 0 },
           });
         }
         
         whereCondition = { communityId: { in: communityIds } };
       } catch (error: any) {
         // If membership table doesn't exist or query fails, return empty
         console.error('Error fetching community memberships:', error);
         return res.json({
           posts: [],
           pagination: { page, limit, total: 0, totalPages: 0 },
         });
       }
    } else {
      // 'all' - posts from followed users OR communities user is a member of
      const [following, membershipsResult] = await Promise.all([
        prisma.userFollow.findMany({
          where: { followerId: userId },
          select: { followingId: true },
        }),
        prisma.communityMembership.findMany({
          where: { userId },
          select: { communityId: true },
        }).catch((error: any) => {
          // If membership table doesn't exist or query fails, return empty array
          console.error('Error fetching community memberships:', error);
          return [];
        }),
      ]);
      
      const followedUserIds = following.map((f) => f.followingId);
      const communityIds = membershipsResult.map((m) => m.communityId);
      
      if (followedUserIds.length === 0 && communityIds.length === 0) {
        return res.json({
          posts: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
        });
      }
      
      // Build OR condition for posts from followed users OR communities
      const orConditions: any[] = [];
      if (followedUserIds.length > 0) {
        orConditions.push({ authorId: { in: followedUserIds } });
      }
      if (communityIds.length > 0) {
        orConditions.push({ communityId: { in: communityIds } });
      }
      
      whereCondition = { OR: orConditions };
    }

    console.log(`[Follows Feed] Filter: ${filter}, Where condition:`, JSON.stringify(whereCondition, null, 2));

    // Get posts based on filter
    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        where: whereCondition,
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
       prisma.post.count({ where: whereCondition }),
     ]);

     console.log(`[Follows Feed] Found ${posts.length} posts (total: ${total})`);

     // Batch fetch vote counts, user votes, and comment counts for all posts
    const postIds = posts.map(p => p.id);
    
    const [voteCounts, userVotes, commentCounts] = await Promise.all([
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
      // Batch user votes
      userId && postIds.length > 0 ? prisma.vote.findMany({
        where: {
          userId,
          target_type: 'post',
          target_id: { in: postIds }
        },
        select: {
          target_id: true,
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
    const userVoteMap = new Map(userVotes.map(v => [v.target_id, v.value]));
    const commentCountMap = new Map(commentCounts.map(c => [c.postId, c._count.id]));

    // Enrich posts with vote counts, comment counts, and user votes
    const postsWithCounts = posts.map(post => ({
      ...post,
      voteCount: voteCountMap.get(post.id) || 0,
      commentCount: commentCountMap.get(post.id) || 0,
      userVote: userVoteMap.get(post.id) ?? null,
    }));

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

