import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getAIService } from '../services/aiService';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/posts/:id/summary
 * Fetch post with AI-generated summary
 */
router.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Fetch post with comments and author info
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        community: {
          select: {
            name: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            voteCount: 'desc',
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Format data for AI service
    const postData = {
      title: post.title,
      body: post.body || '',
      voteCount: post.voteCount,
      comments: post.comments.map((comment) => ({
        body: comment.body,
        author: comment.author.username,
        voteCount: comment.voteCount,
        createdAt: comment.createdAt,
      })),
    };

    // Generate AI summary
    const aiService = getAIService();
    const summary = await aiService.generatePostSummary(postData);

    // Return post with summary
    res.json({
      post: {
        id: post.id,
        title: post.title,
        body: post.body,
        author: post.author.username,
        communityName: post.community.name,
        voteCount: post.voteCount,
        commentCount: post.comments.length,
        createdAt: post.createdAt,
      },
      comments: post.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        author: comment.author.username,
        voteCount: comment.voteCount,
        createdAt: comment.createdAt,
      })),
      aiSummary: summary,
    });
  } catch (error) {
    console.error('Error fetching post with summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/posts/:id
 * Fetch post without AI summary (faster)
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            username: true,
          },
        },
        community: {
          select: {
            name: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                username: true,
              },
            },
          },
          orderBy: {
            voteCount: 'desc',
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json({
      post: {
        id: post.id,
        title: post.title,
        body: post.body,
        author: post.author.username,
        communityName: post.community.name,
        voteCount: post.voteCount,
        commentCount: post.comments.length,
        createdAt: post.createdAt,
      },
      comments: post.comments.map((comment) => ({
        id: comment.id,
        body: comment.body,
        author: comment.author.username,
        voteCount: comment.voteCount,
        createdAt: comment.createdAt,
      })),
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
