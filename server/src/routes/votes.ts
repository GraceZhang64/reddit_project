import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { authenticateToken } from '../middleware/auth';

const router = Router();

/**
 * POST /api/votes
 * Cast or update a vote
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { target_type, target_id, value } = req.body;
    const userId = req.user!.id;

    // Validation
    if (!target_type || !target_id || value === undefined) {
      return res.status(400).json({ 
        error: 'target_type, target_id, and value are required' 
      });
    }

    if (!['post', 'comment'].includes(target_type)) {
      return res.status(400).json({ 
        error: 'target_type must be either "post" or "comment"' 
      });
    }

    if (![1, -1].includes(value)) {
      return res.status(400).json({ 
        error: 'value must be 1 (upvote) or -1 (downvote)' 
      });
    }

    // Check if target exists
    if (target_type === 'post') {
      const post = await prisma.post.findUnique({
        where: { id: parseInt(target_id) }
      });
      if (!post) {
        return res.status(404).json({ error: 'Post not found' });
      }
    } else {
      const comment = await prisma.comment.findUnique({
        where: { id: parseInt(target_id) }
      });
      if (!comment) {
        return res.status(404).json({ error: 'Comment not found' });
      }
    }

    // Use upsert to create or update the vote
    const vote = await prisma.vote.upsert({
      where: {
        userId_target_type_target_id: {
          userId,
          target_type,
          target_id: parseInt(target_id)
        }
      },
      update: {
        value
      },
      create: {
        userId,
        target_type,
        target_id: parseInt(target_id),
        value
      }
    });

    // Calculate new vote count
    const voteCount = await prisma.vote.aggregate({
      where: {
        target_type,
        target_id: parseInt(target_id)
      },
      _sum: {
        value: true
      }
    });

    res.json({
      vote,
      voteCount: voteCount._sum.value || 0
    });

  } catch (error) {
    console.error('Error casting vote:', error);
    res.status(500).json({ error: 'Failed to cast vote' });
  }
});

/**
 * DELETE /api/votes
 * Remove a vote
 */
router.delete('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { target_type, target_id } = req.body;
    const userId = req.user!.id;

    if (!target_type || !target_id) {
      return res.status(400).json({ 
        error: 'target_type and target_id are required' 
      });
    }

    // Delete the vote
    await prisma.vote.delete({
      where: {
        userId_target_type_target_id: {
          userId,
          target_type,
          target_id: parseInt(target_id)
        }
      }
    }).catch(() => {
      // Vote doesn't exist, that's okay
    });

    // Calculate new vote count
    const voteCount = await prisma.vote.aggregate({
      where: {
        target_type,
        target_id: parseInt(target_id)
      },
      _sum: {
        value: true
      }
    });

    res.json({
      success: true,
      voteCount: voteCount._sum.value || 0
    });

  } catch (error) {
    console.error('Error removing vote:', error);
    res.status(500).json({ error: 'Failed to remove vote' });
  }
});

/**
 * GET /api/votes/:target_type/:target_id
 * Get vote count for a specific target
 */
router.get('/:target_type/:target_id', async (req: Request, res: Response) => {
  try {
    const { target_type, target_id } = req.params;

    const voteCount = await prisma.vote.aggregate({
      where: {
        target_type,
        target_id: parseInt(target_id)
      },
      _sum: {
        value: true
      }
    });

    res.json({
      voteCount: voteCount._sum.value || 0
    });

  } catch (error) {
    console.error('Error fetching vote count:', error);
    res.status(500).json({ error: 'Failed to fetch vote count' });
  }
});

/**
 * GET /api/votes/user/:target_type/:target_id
 * Get current user's vote on a specific target
 */
router.get('/user/:target_type/:target_id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { target_type, target_id } = req.params;
    const userId = req.user!.id;

    const vote = await prisma.vote.findUnique({
      where: {
        userId_target_type_target_id: {
          userId,
          target_type,
          target_id: parseInt(target_id)
        }
      }
    });

    res.json({
      userVote: vote ? vote.value : null
    });

  } catch (error) {
    console.error('Error fetching user vote:', error);
    res.status(500).json({ error: 'Failed to fetch user vote' });
  }
});

export default router;

