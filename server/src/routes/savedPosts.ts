import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { postService } from '../services/postService';

const router = Router();

/**
 * GET /api/saved-posts
 * Get all saved posts for the authenticated user
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;

    // Get saved posts with full post details
    const savedPosts = await prisma.savedPost.findMany({
      where: { userId },
      include: {
        post: {
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
            _count: {
              select: {
                comments: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: limit,
    });

    // Get total count for pagination
    const totalCount = await prisma.savedPost.count({
      where: { userId },
    });

    // Get vote counts and user votes for all posts
    const postIds = savedPosts.map(sp => sp.post.id);
    
    const voteCounts = await prisma.$queryRaw<Array<{ target_id: number; vote_sum: bigint }>>`
      SELECT target_id, COALESCE(SUM(value), 0) as vote_sum
      FROM votes
      WHERE target_type = 'post' AND target_id = ANY(${postIds})
      GROUP BY target_id
    `;

    const userVotes = await prisma.vote.findMany({
      where: {
        userId,
        target_type: 'post',
        target_id: { in: postIds },
      },
      select: {
        target_id: true,
        value: true,
      },
    });

    // Create maps for quick lookup
    const voteCountMap = new Map(voteCounts.map(v => [v.target_id, Number(v.vote_sum)]));
    const userVoteMap = new Map(userVotes.map(v => [v.target_id, v.value]));

    // Format posts
    const formattedPosts = savedPosts.map(savedPost => ({
      id: savedPost.post.id,
      slug: savedPost.post.slug,
      title: savedPost.post.title,
      body: savedPost.post.body,
      post_type: savedPost.post.post_type,
      link_url: savedPost.post.link_url,
      image_url: savedPost.post.image_url,
      video_url: savedPost.post.video_url,
      media_urls: savedPost.post.media_urls,
      crosspost_id: savedPost.post.crosspost_id,
      voteCount: voteCountMap.get(savedPost.post.id) || 0,
      userVote: userVoteMap.get(savedPost.post.id) || null,
      commentCount: savedPost.post._count.comments,
      author: savedPost.post.author.username,
      authorId: savedPost.post.author.id,
      communityId: savedPost.post.community.id,
      communityName: savedPost.post.community.name,
      communitySlug: savedPost.post.community.slug,
      createdAt: savedPost.post.createdAt?.toISOString(),
      aiSummary: savedPost.post.ai_summary,
      savedAt: savedPost.createdAt?.toISOString(),
    }));

    const totalPages = Math.ceil(totalCount / limit);

    res.json({
      posts: formattedPosts,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching saved posts:', error);
    res.status(500).json({ error: 'Failed to fetch saved posts' });
  }
});

/**
 * POST /api/saved-posts/:postId
 * Save a post for the authenticated user
 */
router.post('/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check if already saved
    const existingSave = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (existingSave) {
      return res.status(409).json({ 
        error: 'Post already saved',
        saved: true,
      });
    }

    // Save the post
    const savedPost = await prisma.savedPost.create({
      data: {
        userId,
        postId,
      },
    });

    res.status(201).json({
      message: 'Post saved successfully',
      saved: true,
      savedAt: savedPost.createdAt?.toISOString(),
    });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

/**
 * DELETE /api/saved-posts/:postId
 * Unsave a post for the authenticated user
 */
router.delete('/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if saved post exists
    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    if (!savedPost) {
      return res.status(404).json({ 
        error: 'Saved post not found',
        saved: false,
      });
    }

    // Delete the saved post
    await prisma.savedPost.delete({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    res.json({
      message: 'Post unsaved successfully',
      saved: false,
    });
  } catch (error) {
    console.error('Error unsaving post:', error);
    res.status(500).json({ error: 'Failed to unsave post' });
  }
});

/**
 * GET /api/saved-posts/check/:postId
 * Check if a post is saved by the authenticated user
 */
router.get('/check/:postId', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const postId = parseInt(req.params.postId);
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const savedPost = await prisma.savedPost.findUnique({
      where: {
        userId_postId: {
          userId,
          postId,
        },
      },
    });

    res.json({
      saved: !!savedPost,
      savedAt: savedPost?.createdAt?.toISOString() || null,
    });
  } catch (error) {
    console.error('Error checking saved post:', error);
    res.status(500).json({ error: 'Failed to check saved post status' });
  }
});

/**
 * POST /api/saved-posts/check-multiple
 * Check if multiple posts are saved by the authenticated user
 */
router.post('/check-multiple', async (req: Request, res: Response) => {
  try {
    // Accept both authenticated and unauthenticated; unauthenticated returns all false
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    let userId: string | null = null;
    if (token) {
      try {
        const { getSupabaseClient } = await import('../config/supabase');
        const supabase = getSupabaseClient();
        const { data: { user } } = await supabase.auth.getUser(token);
        if (user) userId = user.id;
      } catch (e) {
        // Ignore auth errors; treat as unauthenticated
        userId = null;
      }
    }

    const { postIds } = req.body;
    if (!postIds) {
      return res.status(400).json({ error: 'postIds is required' });
    }
    
    if (!Array.isArray(postIds)) {
      return res.status(400).json({ error: 'postIds must be an array' });
    }

    // Handle empty array gracefully
    if (postIds.length === 0) {
      return res.json({});
    }

    // Validate all postIds are numbers
    if (!postIds.every(id => typeof id === 'number' && Number.isInteger(id) && id > 0)) {
      return res.status(400).json({ error: 'All postIds must be positive integers' });
    }

    let savedPostIds: Set<number> = new Set();
    if (userId) {
      const savedPosts = await prisma.savedPost.findMany({
        where: {
          userId,
          postId: { in: postIds },
        },
        select: { postId: true },
      });
      savedPostIds = new Set(savedPosts.map(sp => sp.postId));
    }
    const result: Record<number, boolean> = {};
    
    postIds.forEach(postId => {
      result[postId] = savedPostIds.has(postId);
    });

    res.json(result);
  } catch (error) {
    console.error('Error checking multiple saved posts:', error);
    res.status(500).json({ error: 'Failed to check saved posts status' });
  }
});

export default router;
