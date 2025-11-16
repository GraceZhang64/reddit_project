import { Router, Request, Response } from 'express';
import { postService } from '../services/postService';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { getAIService } from '../services/aiService';
import { getSupabaseClient } from '../config/supabase';

const router = Router();

/**
 * GET /api/posts
 * Get all posts with pagination
 */
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.user?.id;

    const result = await postService.getPosts({ page, limit }, userId);

    res.json(result);
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

/**
 * GET /api/posts/hot
 * Get hot/trending posts
 */
router.get('/hot', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const userId = req.user?.id;

    const result = await postService.getHotPosts({ page, limit }, userId);

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
router.get('/search', optionalAuth, async (req: Request, res: Response) => {
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
 * GET /api/posts/:id/summary
 * Get a specific post with AI-generated summary
 */
router.get('/:id/summary', optionalAuth, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Get the post first
    const userId = req.user?.id;
    const post = await postService.getPostById(postId, userId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Generate or retrieve AI summary
    const aiService = getAIService();
    let summary = post.ai_summary;

    // If no summary exists or it's old (older than 1 day), regenerate
    if (!summary || !post.ai_summary_generated_at || 
        new Date().getTime() - new Date(post.ai_summary_generated_at).getTime() > 24 * 60 * 60 * 1000) {
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
          .eq('post_id', postId)
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
      } catch (error) {
        console.error('Failed to generate AI summary:', error);
        // Continue without summary rather than failing the whole request
      }
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

router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const userId = req.user?.id;
    const post = await postService.getPostById(postId, userId);

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

/**
 * POST /api/posts
 * Create a new post
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { title, body, image_url, community_id } = req.body;

    if (!title || !community_id) {
      return res.status(400).json({ error: 'Title and community_id are required' });
    }

    const post = await postService.createPost({
      title,
      body: body || null,
      image_url: image_url || null,
      community_id: parseInt(community_id),
      author_id: req.user!.id,
    });

    res.status(201).json(post);
  } catch (error) {
    console.error('Error creating post:', error);
    res.status(500).json({ error: 'Failed to create post' });
  }
});

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
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
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
      return res.status(403).json({ error: 'Not authorized to delete this post' });
    }

    await postService.deletePost(postId);

    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    console.error('Error deleting post:', error);
    res.status(500).json({ error: 'Failed to delete post' });
  }
});

export default router;





