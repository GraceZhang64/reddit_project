import { Router, Request, Response } from 'express';
import { postService } from '../services/postService';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { getAIService } from '../services/aiService';
import { getSupabaseClient } from '../config/supabase';
import { prisma } from '../lib/prisma';
import { cache, CACHE_TTL } from '../lib/cache';
import { apiLimiter, postCreationLimiter } from '../middleware/rateLimiter';
import { validatePostCreation } from '../middleware/requestValidator';

const router = Router();

/**
 * GET /api/posts
 * Get all posts with pagination (with caching)
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.user?.id;

    // Cache key includes page and limit
    const cacheKey = `posts:${page}:${limit}:${userId}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const result = await postService.getPosts({ page, limit }, userId);

    // Cache for 30 seconds
    cache.set(cacheKey, result, CACHE_TTL.POST_LIST);

    res.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * GET /api/posts/hot
 * Get hot/trending posts (with caching)
 */
router.get('/hot', authenticateToken, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.user?.id;

    // Cache key for hot posts
    const cacheKey = `hot:${page}:${limit}:${userId}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    const result = await postService.getHotPosts({ page, limit }, userId);

    // Cache for 1 minute
    cache.set(cacheKey, result, CACHE_TTL.HOT_POSTS);

    res.json(result);
  } catch (error) {
    console.error('Error fetching hot posts:', error);
    res.status(500).json({ error: 'Failed to fetch hot posts' });
  }
});

/**
 * GET /api/posts/search
 * Search posts by keyword
 */
router.get('/search', authenticateToken, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.user?.id;

    const result = await postService.searchPosts(query, { page, limit }, userId);

    res.json(result);
  } catch (error) {
    console.error('Error searching posts:', error);
    res.status(500).json({ error: 'Failed to search posts' });
  }
});

/**
 * GET /api/posts/:id
 * Get a specific post by ID
 */
/**
 * GET /api/posts/:idOrSlug/summary
 * Get a specific post with AI-generated summary
 */
router.get('/:idOrSlug/summary', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const userId = req.user?.id;
    
    // Try to parse as ID first, otherwise treat as slug
    const postId = parseInt(idOrSlug);
    let post;
    
    if (!isNaN(postId)) {
      post = await postService.getPostById(postId, userId);
    } else {
      post = await postService.getPostBySlug(idOrSlug, userId);
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const actualPostId = post.id;

    // Generate or retrieve AI summary
    const aiService = getAIService();
    let summary = post.ai_summary;
    const currentCommentCount = post.comment_count || 0;
    const cachedCommentCount = (post as any).ai_summary_comment_count || 0;
    const newCommentsCount = currentCommentCount - cachedCommentCount;

    // Only generate summaries if there are 4 or more comments
    if (currentCommentCount < 4) {
      return res.json({
        ...post,
        ai_summary: null
      });
    }

    // Smart cache invalidation: Regenerate if:
    // 1. No summary exists
    // 2. Summary is older than 24 hours
    // 3. There are 3 or more new comments since last generation
    const shouldRegenerate = 
      !summary || 
      !post.ai_summary_generated_at || 
      new Date().getTime() - new Date(post.ai_summary_generated_at).getTime() > 24 * 60 * 60 * 1000 ||
      newCommentsCount >= 3;

    if (shouldRegenerate) {
      try {
        // Prepare post data for AI summary
        const postData: {
          title: string;
          body: string;
          voteCount: number;
          comments: Array<{
            body: string;
            author: string;
            voteCount: number;
            createdAt: Date;
          }>;
        } = {
          title: post.title,
          body: post.body || '',
          voteCount: post.vote_count || 0,
          comments: [] // Will fetch below
        };
        
        // Fetch comments for the post
        const supabase = getSupabaseClient();
        const { data: commentsData } = await supabase
          .from('comments')
          .select('body, author_id, vote_count, created_at')
          .eq('post_id', actualPostId)
          .order('vote_count', { ascending: false });
        
        if (commentsData && commentsData.length > 0) {
          postData.comments = commentsData.map((c: any) => ({
            body: c.body,
            author: c.author_id, // Using UUID for now
            voteCount: c.vote_count || 0,
            createdAt: new Date(c.created_at)
          }));
        };
        summary = await aiService.generatePostSummary(postData);
        
        // Update the post with the new summary and current comment count
        const { prisma } = await import('../lib/prisma');
        try {
          // Use raw query since Prisma client may not be regenerated yet
          await prisma.$executeRaw`
            UPDATE posts 
            SET ai_summary = ${summary},
                ai_summary_generated_at = NOW(),
                ai_summary_comment_count = ${currentCommentCount}
            WHERE id = ${actualPostId}
          `;
          console.log(`✅ AI summary cached for post ${actualPostId} (${currentCommentCount} comments)`);
        } catch (updateError) {
          console.error('Failed to cache AI summary:', updateError);
        } finally {
          await prisma.$disconnect();
        }
      } catch (error) {
        console.error('Failed to generate AI summary:', error);
        // Continue without summary rather than failing the whole request
      }
    } else {
      console.log(`📦 Using cached AI summary for post ${actualPostId} (age: ${Math.round((new Date().getTime() - new Date(post.ai_summary_generated_at!).getTime()) / 3600000)}h, new comments: ${newCommentsCount})`);
    }

    res.json({
      ...post,
      ai_summary: summary
    });
  } catch (error) {
    console.error('Error fetching post with summary:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

router.get('/:idOrSlug', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { idOrSlug } = req.params;
    const userId = req.user?.id;
    
    // Cache key for this specific post
    const cacheKey = `post:${idOrSlug}:${userId}`;
    
    // Check cache first
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }
    
    // Try to parse as ID first
    const postId = parseInt(idOrSlug);
    let post;
    
    if (!isNaN(postId)) {
      // It's a numeric ID
      post = await postService.getPostById(postId, userId);
    } else {
      // It's a slug
      post = await postService.getPostBySlug(idOrSlug, userId);
    }

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Include ai_summary if it exists in the database (don't wait for generation)
    const actualPostId = post.id;
    const postWithSummary = await prisma.post.findUnique({
      where: { id: actualPostId },
      select: { ai_summary: true }
    });

    // Trigger async AI summary generation if it doesn't exist and has 4 or more comments (fire and forget)
    if (!postWithSummary?.ai_summary && (post.comment_count || 0) >= 4) {
      // Don't await - let it generate in background
      generateAISummaryAsync(actualPostId, post).catch(err => {
        console.error('Background AI summary generation failed:', err);
      });
    }

    const result = {
      ...post,
      ai_summary: postWithSummary?.ai_summary || null
    };

    // Cache for 1 minute
    cache.set(cacheKey, result, CACHE_TTL.POST_DETAIL);

    res.json(result);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Async function to generate AI summary in background
async function generateAISummaryAsync(postId: number, post: any) {
  try {
    const aiService = getAIService();
    const currentCommentCount = post.comment_count || 0;
    
    // Only generate summaries if there are 4 or more comments
    if (currentCommentCount < 4) {
      return;
    }
    
    // Prepare post data for AI summary
    const postData: {
      title: string;
      body: string;
      voteCount: number;
      comments: Array<{
        body: string;
        author: string;
        voteCount: number;
        createdAt: Date;
      }>;
    } = {
      title: post.title,
      body: post.body || '',
      voteCount: post.vote_count || 0,
      comments: []
    };
    
    // Fetch comments for the post
    const supabase = getSupabaseClient();
    const { data: commentsData } = await supabase
      .from('comments')
      .select('body, author_id, vote_count, created_at')
      .eq('post_id', postId)
      .order('vote_count', { ascending: false })
      .limit(10); // Limit to top 10 comments for summary
    
    if (commentsData && commentsData.length > 0) {
      postData.comments = commentsData.map((c: any) => ({
        body: c.body,
        author: c.author_id,
        voteCount: c.vote_count || 0,
        createdAt: new Date(c.created_at)
      }));
    }
    
    const summary = await aiService.generatePostSummary(postData);
    
    // Update the post with the new summary
    await prisma.$executeRaw`
      UPDATE posts 
      SET ai_summary = ${summary},
          ai_summary_generated_at = NOW(),
          ai_summary_comment_count = ${currentCommentCount}
      WHERE id = ${postId}
    `;
    console.log(`✅ AI summary generated and cached for post ${postId}`);
  } catch (error) {
    console.error('Background AI summary generation failed:', error);
    // Don't throw - this is fire and forget
  }
}

/**
 * POST /api/posts
 * Create a new post (supports text, link, poll)
 */
router.post('/', authenticateToken, postCreationLimiter.middleware(), validatePostCreation, async (req: Request, res: Response) => {
  try {
    const { 
      title, 
      body, 
      post_type = 'text',
      community_id,
      poll_options,
      poll_expires_hours
    } = req.body;

    // Validation
    if (!title || !community_id) {
      return res.status(400).json({ error: 'Title and community_id are required' });
    }

    // Validate post type
    const validTypes = ['text', 'poll'];
    if (!validTypes.includes(post_type)) {
      return res.status(400).json({ error: 'Invalid post_type. Allowed types: text, poll' });
    }

    // Type-specific validation
    if (post_type === 'poll' && (!poll_options || poll_options.length < 2)) {
      return res.status(400).json({ error: 'At least 2 poll options are required for poll posts' });
    }

    const post = await postService.createPost({
      title,
      body: body || null,
      post_type,
      community_id: parseInt(community_id),
      author_id: req.user!.id,
      poll_options: poll_options || null,
      poll_expires_hours: poll_expires_hours || null,
    });

    res.status(201).json(post);
  } catch (error: any) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: error.message || 'Failed to create post' });
  }
});

// URL validation helper
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * PUT /api/posts/:id
 * Update a post
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if post exists and user owns it
    const existingPost = await postService.getPostById(postId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.authorId !== req.user!.id) {
      return res.status(403).json({ error: 'Not authorized to update this post' });
    }

    const { title, body, image_url } = req.body;
    const updatedPost = await postService.updatePost(postId, {
      title,
      body,
      image_url,
    });

    res.json(updatedPost);
  } catch (error) {
    console.error('Error updating post:', error);
    res.status(500).json({ error: 'Failed to update post' });
  }
});

/**
 * DELETE /api/posts/:id
 * Delete a post
 */
router.delete('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if post exists and user owns it
    const existingPost = await postService.getPostById(postId);
    if (!existingPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (existingPost.authorId !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await postService.deletePost(postId);

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;

/**
 * POST /api/posts/:id/vote
 * Upvote, downvote, or remove vote for a post
 * Body: { value: 1 | -1 | 0 }
 */
router.post('/:id/vote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const userId = req.user?.id;
    const { value } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }
    if (![1, -1, 0].includes(value)) {
      return res.status(400).json({ error: 'Vote value must be 1, -1, or 0' });
    }

    // Call service to handle vote
    const result = await postService.voteOnPost({ postId, userId, value });
    res.json(result);
  } catch (error) {
    console.error('Error voting on post:', error);
    res.status(500).json({ error: 'Failed to vote on post' });
  }
});





