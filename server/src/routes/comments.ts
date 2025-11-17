import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/comments/search
 * Search comments by keyword
 */
router.get('/search', optionalAuth, async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    // Search comments using ILIKE for case-insensitive search
    const comments = await prisma.comment.findMany({
      where: {
        body: {
          contains: query,
          mode: 'insensitive'
        }
      },
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
            slug: true,
            title: true,
            community: {
              select: {
                id: true,
                name: true,
                slug: true
              }
            }
          }
        }
      }
    });

    // Get vote counts for each comment
    const commentsWithVotes = await Promise.all(
      comments.map(async (comment) => {
        const voteCount = await prisma.vote.aggregate({
          where: {
            target_type: 'comment',
            target_id: comment.id
          },
          _sum: {
            value: true
          }
        });

        let userVote = null;
        if (req.user) {
          const vote = await prisma.vote.findUnique({
            where: {
              userId_target_type_target_id: {
                userId: req.user.id,
                target_type: 'comment',
                target_id: comment.id
              }
            }
          });
          userVote = vote ? vote.value : null;
        }

        return {
          ...comment,
          vote_count: voteCount._sum.value || 0,
          user_vote: userVote
        };
      })
    );

    // Get total count for pagination
    const total = await prisma.comment.count({
      where: {
        body: {
          contains: query,
          mode: 'insensitive'
        }
      }
    });

    res.json({
      comments: commentsWithVotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error searching comments:', error);
    res.status(500).json({ error: 'Failed to search comments' });
  }
});

/**
 * GET /api/comments/post/:postId
 * Get all comments for a post
 */
router.get('/post/:postId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Get all comments for the post
    const comments = await prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        },
        _count: {
          select: {
            replies: true
          }
        }
      }
    });

    // Get vote counts for each comment
    const commentsWithVotes = await Promise.all(
      comments.map(async (comment) => {
        const voteCount = await prisma.vote.aggregate({
          where: {
            target_type: 'comment',
            target_id: comment.id
          },
          _sum: {
            value: true
          }
        });

        let userVote = null;
        if (req.user) {
          const vote = await prisma.vote.findUnique({
            where: {
              userId_target_type_target_id: {
                userId: req.user.id,
                target_type: 'comment',
                target_id: comment.id
              }
            }
          });
          userVote = vote ? vote.value : null;
        }

        return {
          ...comment,
          vote_count: voteCount._sum.value || 0,
          user_vote: userVote
        };
      })
    );

    res.json({ comments: commentsWithVotes });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
});

/**
 * GET /api/comments/:id
 * Get a specific comment with its replies
 */
router.get('/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        },
        replies: {
          include: {
            author: {
              select: {
                id: true,
                username: true,
                avatar_url: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Get vote count
    const voteCount = await prisma.vote.aggregate({
      where: {
        target_type: 'comment',
        target_id: commentId
      },
      _sum: {
        value: true
      }
    });

    let userVote = null;
    if (req.user) {
      const vote = await prisma.vote.findUnique({
        where: {
          userId_target_type_target_id: {
            userId: req.user.id,
            target_type: 'comment',
            target_id: commentId
          }
        }
      });
      userVote = vote ? vote.value : null;
    }

    res.json({
      ...comment,
      vote_count: voteCount._sum.value || 0,
      user_vote: userVote
    });

  } catch (error) {
    console.error('Error fetching comment:', error);
    res.status(500).json({ error: 'Failed to fetch comment' });
  }
});

/**
 * POST /api/comments
 * Create a new comment or reply
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { body, postId, parentCommentId } = req.body;
    const authorId = req.user!.id;

    if (!body || !postId) {
      return res.status(400).json({ 
        error: 'Body and postId are required' 
      });
    }

    // Verify the author exists in the database
    const author = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      return res.status(401).json({ 
        error: 'User not found. Please log in again.' 
      });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // If replying to a comment, check if it exists
    if (parentCommentId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: parseInt(parentCommentId) }
      });

      if (!parentComment) {
        return res.status(404).json({ error: 'Parent comment not found' });
      }

      // Ensure parent comment is from the same post
      if (parentComment.postId !== parseInt(postId)) {
        return res.status(400).json({ 
          error: 'Parent comment must be from the same post' 
        });
      }
    }

    // Create comment
    const comment = await prisma.comment.create({
      data: {
        body,
        authorId,
        postId: parseInt(postId),
        parentCommentId: parentCommentId ? parseInt(parentCommentId) : null
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      }
    });

    res.status(201).json({
      ...comment,
      vote_count: 0,
      user_vote: null
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ error: 'Failed to create comment' });
  }
});

/**
 * PUT /api/comments/:id
 * Update a comment
 */
router.put('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);
    const { body } = req.body;

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    if (!body) {
      return res.status(400).json({ error: 'Body is required' });
    }

    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.authorId !== req.user!.id) {
      return res.status(403).json({ 
        error: 'Not authorized to update this comment' 
      });
    }

    // Update comment
    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { 
        body,
        updated_at: new Date()
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar_url: true
          }
        }
      }
    });

    res.json(comment);

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ error: 'Failed to update comment' });
  }
});

/**
 * DELETE /api/comments/:id
 * Delete a comment
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
      return res.status(400).json({ error: 'Invalid comment ID' });
    }

    // Check if comment exists and user owns it
    const existingComment = await prisma.comment.findUnique({
      where: { id: commentId }
    });

    if (!existingComment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (existingComment.authorId !== req.user!.id) {
      return res.status(403).json({ 
        error: 'Not authorized to delete this comment' 
      });
    }

    // Delete comment (cascade will delete replies)
    await prisma.comment.delete({
      where: { id: commentId }
    });

    res.json({ 
      success: true, 
      message: 'Comment deleted successfully' 
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

export default router;

