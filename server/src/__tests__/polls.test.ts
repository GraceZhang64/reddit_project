import request from 'supertest';
import express, { Express } from 'express';
import pollsRouter from '../routes/polls';
import { prisma } from '../lib/prisma';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  prisma: {
    poll: {
      findFirst: jest.fn(),
    },
    pollOption: {
      findUnique: jest.fn(),
    },
    pollVote: {
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

jest.mock('../middleware/auth', () => ({
  authenticateToken: (req: any, res: any, next: any) => {
    req.user = { id: 'user-1', username: 'testuser' };
    next();
  },
}));

const app: Express = express();
app.use(express.json());
app.use('/api/polls', pollsRouter);

describe('Polls API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/polls/post/:postId', () => {
    it('should return poll data with vote counts', async () => {
      const mockPoll = {
        id: 1,
        postId: 1,
        expires_at: new Date(Date.now() + 86400000), // 1 day in future
        options: [
          {
            id: 1,
            text: 'Option 1',
            position: 1,
            votes: [{ userId: 'user-2' }, { userId: 'user-3' }],
          },
          {
            id: 2,
            text: 'Option 2',
            position: 2,
            votes: [{ userId: 'user-4' }],
          },
        ],
      };

      (prisma.poll.findFirst as jest.Mock).mockResolvedValue(mockPoll);

      const response = await request(app)
        .get('/api/polls/post/1')
        .expect(200);

      expect(response.body.options).toHaveLength(2);
      expect(response.body.options[0].vote_count).toBe(2);
      expect(response.body.options[1].vote_count).toBe(1);
      expect(response.body.total_votes).toBe(3);
      expect(response.body.is_expired).toBe(false);
    });

    it('should detect expired polls', async () => {
      const mockPoll = {
        id: 1,
        postId: 1,
        expires_at: new Date(Date.now() - 86400000), // 1 day in past
        options: [
          {
            id: 1,
            text: 'Option 1',
            position: 1,
            votes: [],
          },
        ],
      };

      (prisma.poll.findFirst as jest.Mock).mockResolvedValue(mockPoll);

      const response = await request(app)
        .get('/api/polls/post/1')
        .expect(200);

      expect(response.body.is_expired).toBe(true);
    });

    it('should return 400 for invalid post ID', async () => {
      const response = await request(app)
        .get('/api/polls/post/invalid')
        .expect(400);

      expect(response.body.error).toBe('Invalid post ID');
    });

    it('should return 404 if poll not found', async () => {
      (prisma.poll.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/polls/post/999')
        .expect(404);

      expect(response.body.error).toBe('Poll not found');
    });

    it('should handle errors', async () => {
      (prisma.poll.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/polls/post/1')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch poll');
    });
  });

  describe('POST /api/polls/vote', () => {
    it('should create a new vote', async () => {
      const mockOption = {
        id: 1,
        poll: {
          id: 1,
          expires_at: new Date(Date.now() + 86400000),
        },
      };

      (prisma.pollOption.findUnique as jest.Mock).mockResolvedValue(mockOption);
      (prisma.pollVote.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.pollVote.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/polls/vote')
        .send({ option_id: 1 })
        .expect(200);

      expect(response.body.message).toBe('Vote recorded');
      expect(response.body.voted_option_id).toBe(1);
      expect(prisma.pollVote.create).toHaveBeenCalled();
    });

    it('should toggle vote if user votes for same option', async () => {
      const mockOption = {
        id: 1,
        poll: {
          id: 1,
          expires_at: new Date(Date.now() + 86400000),
        },
      };

      const existingVote = {
        id: 1,
        optionId: 1,
        option: mockOption,
      };

      (prisma.pollOption.findUnique as jest.Mock).mockResolvedValue(mockOption);
      (prisma.pollVote.findFirst as jest.Mock).mockResolvedValue(existingVote);
      (prisma.pollVote.delete as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/polls/vote')
        .send({ option_id: 1 })
        .expect(200);

      expect(response.body.message).toBe('Vote removed');
      expect(response.body.voted_option_id).toBe(null);
      expect(prisma.pollVote.delete).toHaveBeenCalled();
    });

    it('should change vote if user votes for different option', async () => {
      const mockOption = {
        id: 2,
        poll: {
          id: 1,
          expires_at: new Date(Date.now() + 86400000),
        },
      };

      const existingVote = {
        id: 1,
        optionId: 1,
        option: { id: 1 },
      };

      (prisma.pollOption.findUnique as jest.Mock).mockResolvedValue(mockOption);
      (prisma.pollVote.findFirst as jest.Mock).mockResolvedValue(existingVote);
      (prisma.pollVote.delete as jest.Mock).mockResolvedValue({});
      (prisma.pollVote.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/polls/vote')
        .send({ option_id: 2 })
        .expect(200);

      expect(response.body.voted_option_id).toBe(2);
      expect(prisma.pollVote.delete).toHaveBeenCalled();
      expect(prisma.pollVote.create).toHaveBeenCalled();
    });

    it('should return 400 if option_id is missing', async () => {
      const response = await request(app)
        .post('/api/polls/vote')
        .send({})
        .expect(400);

      expect(response.body.error).toBe('option_id is required');
    });

    it('should return 400 for invalid option_id', async () => {
      const response = await request(app)
        .post('/api/polls/vote')
        .send({ option_id: 'invalid' })
        .expect(400);

      expect(response.body.error).toBe('Invalid option_id');
    });

    it('should return 404 if option not found', async () => {
      (prisma.pollOption.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/polls/vote')
        .send({ option_id: 999 })
        .expect(404);

      expect(response.body.error).toBe('Poll option not found');
    });

    it('should return 400 if poll is expired', async () => {
      const mockOption = {
        id: 1,
        poll: {
          id: 1,
          expires_at: new Date(Date.now() - 86400000), // Expired
        },
      };

      (prisma.pollOption.findUnique as jest.Mock).mockResolvedValue(mockOption);

      const response = await request(app)
        .post('/api/polls/vote')
        .send({ option_id: 1 })
        .expect(400);

      expect(response.body.error).toBe('Poll has expired');
    });

    it('should handle errors', async () => {
      (prisma.pollOption.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/polls/vote')
        .send({ option_id: 1 })
        .expect(500);

      expect(response.body.error).toBe('Database error');
    });
  });

  describe('GET /api/polls/:pollId/user-vote', () => {
    it('should return user vote if exists', async () => {
      (prisma.pollVote.findFirst as jest.Mock).mockResolvedValue({ optionId: 2 });

      const response = await request(app)
        .get('/api/polls/1/user-vote')
        .expect(200);

      expect(response.body.voted_option_id).toBe(2);
    });

    it('should return null if user has not voted', async () => {
      (prisma.pollVote.findFirst as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/polls/1/user-vote')
        .expect(200);

      expect(response.body.voted_option_id).toBe(null);
    });

    it('should return 400 for invalid poll ID', async () => {
      const response = await request(app)
        .get('/api/polls/invalid/user-vote')
        .expect(400);

      expect(response.body.error).toBe('Invalid poll ID');
    });

    it('should handle errors', async () => {
      (prisma.pollVote.findFirst as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/polls/1/user-vote')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch user vote');
    });
  });
});

