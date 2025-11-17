import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /api/polls/post/:postId
 * Get poll data for a post
 */
router.get('/post/:postId', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.postId);

    if (isNaN(postId)) {
      return res.status(400).json({ error: 'Invalid post ID' });
    }

    const poll = await prisma.poll.findFirst({
      where: { postId },
      include: {
        options: {
          include: {
            votes: {
              select: {
                userId: true,
              },
            },
          },
          orderBy: {
            position: 'asc',
          },
        },
      },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Calculate vote counts for each option
    const pollWithCounts = {
      ...poll,
      options: poll.options.map((option) => ({
        id: option.id,
        text: option.text,
        position: option.position,
        vote_count: option.votes.length,
      })),
      total_votes: poll.options.reduce((sum, option) => sum + option.votes.length, 0),
      expires_at: poll.expires_at,
      is_expired: poll.expires_at ? new Date(poll.expires_at) < new Date() : false,
    };

    res.json(pollWithCounts);
  } catch (error) {
    console.error('Error fetching poll:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

/**
 * POST /api/polls/vote
 * Vote on a poll option
 */
router.post('/vote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { option_id } = req.body;
    const userId = req.user!.id;

    if (!option_id) {
      return res.status(400).json({ error: 'option_id is required' });
    }

    const optionId = parseInt(option_id);
    if (isNaN(optionId)) {
      return res.status(400).json({ error: 'Invalid option_id' });
    }

    // Check if option exists and get poll info
    const option = await prisma.pollOption.findUnique({
      where: { id: optionId },
      include: {
        poll: true,
      },
    });

    if (!option) {
      return res.status(404).json({ error: 'Poll option not found' });
    }

    // Check if poll is expired
    if (option.poll.expires_at && new Date(option.poll.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Poll has expired' });
    }

    // Check if user has already voted on any option in this poll
    const existingVote = await prisma.pollVote.findFirst({
      where: {
        userId,
        option: {
          pollId: option.poll.id,
        },
      },
      include: {
        option: true,
      },
    });

    // If user is voting for the same option, remove the vote (toggle)
    if (existingVote && existingVote.optionId === optionId) {
      await prisma.pollVote.delete({
        where: { id: existingVote.id },
      });
      return res.json({ message: 'Vote removed', voted_option_id: null });
    }

    // If user has voted for a different option, delete old vote and create new one
    if (existingVote) {
      await prisma.pollVote.delete({
        where: { id: existingVote.id },
      });
    }

    // Create new vote
    await prisma.pollVote.create({
      data: {
        userId,
        optionId,
      },
    });

    res.json({ message: 'Vote recorded', voted_option_id: optionId });
  } catch (error: any) {
    console.error('Error voting on poll:', error);
    res.status(500).json({ error: error.message || 'Failed to vote on poll' });
  }
});

/**
 * GET /api/polls/:pollId/user-vote
 * Get user's vote on a poll
 */
router.get('/:pollId/user-vote', authenticateToken, async (req: Request, res: Response) => {
  try {
    const pollId = parseInt(req.params.pollId);
    const userId = req.user!.id;

    if (isNaN(pollId)) {
      return res.status(400).json({ error: 'Invalid poll ID' });
    }

    const userVote = await prisma.pollVote.findFirst({
      where: {
        userId,
        option: {
          pollId,
        },
      },
      select: {
        optionId: true,
      },
    });

    res.json({ voted_option_id: userVote?.optionId || null });
  } catch (error) {
    console.error('Error fetching user vote:', error);
    res.status(500).json({ error: 'Failed to fetch user vote' });
  }
});

export default router;

