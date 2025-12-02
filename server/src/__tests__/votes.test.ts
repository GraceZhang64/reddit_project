import request from 'supertest';
import express, { Express } from 'express';
import votesRouter from '../routes/votes';
import { prisma } from '../lib/prisma';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  prisma: {
    post: {
      findUnique: jest.fn(),
    },
    comment: {
      findUnique: jest.fn(),
    },
    vote: {
      upsert: jest.fn(),
      delete: jest.fn(),
      aggregate: jest.fn(),
      findUnique: jest.fn(),
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
app.use('/api/votes', votesRouter);

describe('Votes API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/votes', () => {
    it('should create an upvote on a post', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.vote.upsert as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        target_type: 'post',
        target_id: 1,
        value: 1,
      });
      (prisma.vote.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 10 } });

      const response = await request(app)
        .post('/api/votes')
        .send({ target_type: 'post', target_id: 1, value: 1 })
        .expect(200);

      expect(response.body.vote.value).toBe(1);
      expect(response.body.voteCount).toBe(10);
      expect(prisma.vote.upsert).toHaveBeenCalled();
    });

    it('should create a downvote on a comment', async () => {
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
      (prisma.vote.upsert as jest.Mock).mockResolvedValue({
        userId: 'user-1',
        target_type: 'comment',
        target_id: 1,
        value: -1,
      });
      (prisma.vote.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: -5 } });

      const response = await request(app)
        .post('/api/votes')
        .send({ target_type: 'comment', target_id: 1, value: -1 })
        .expect(200);

      expect(response.body.vote.value).toBe(-1);
      expect(response.body.voteCount).toBe(-5);
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .post('/api/votes')
        .send({ target_type: 'post' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should return 400 for invalid target_type', async () => {
      const response = await request(app)
        .post('/api/votes')
        .send({ target_type: 'invalid', target_id: 1, value: 1 })
        .expect(400);

      expect(response.body.error).toContain('must be either "post" or "comment"');
    });

    it('should return 400 for invalid value', async () => {
      const response = await request(app)
        .post('/api/votes')
        .send({ target_type: 'post', target_id: 1, value: 5 })
        .expect(400);

      expect(response.body.error).toContain('must be 1 (upvote) or -1 (downvote)');
    });

    it('should return 404 if post not found', async () => {
      (prisma.post.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/votes')
        .send({ target_type: 'post', target_id: 999, value: 1 })
        .expect(404);

      expect(response.body.error).toBe('Post not found');
    });

    it('should return 404 if comment not found', async () => {
      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/votes')
        .send({ target_type: 'comment', target_id: 999, value: 1 })
        .expect(404);

      expect(response.body.error).toBe('Comment not found');
    });

    it('should handle errors', async () => {
      (prisma.post.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/votes')
        .send({ target_type: 'post', target_id: 1, value: 1 })
        .expect(500);

      expect(response.body.error).toBe('Failed to cast vote');
    });
  });

  describe('DELETE /api/votes', () => {
    it('should remove a vote', async () => {
      (prisma.vote.delete as jest.Mock).mockResolvedValue({});
      (prisma.vote.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 5 } });

      const response = await request(app)
        .delete('/api/votes')
        .send({ target_type: 'post', target_id: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.voteCount).toBe(5);
      expect(prisma.vote.delete).toHaveBeenCalled();
    });

    it('should return 400 if required fields are missing', async () => {
      const response = await request(app)
        .delete('/api/votes')
        .send({ target_type: 'post' })
        .expect(400);

      expect(response.body.error).toContain('required');
    });

    it('should handle non-existent vote gracefully', async () => {
      (prisma.vote.delete as jest.Mock).mockRejectedValue(new Error('Not found'));
      (prisma.vote.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 0 } });

      const response = await request(app)
        .delete('/api/votes')
        .send({ target_type: 'post', target_id: 1 })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should handle errors', async () => {
      (prisma.vote.delete as jest.Mock).mockResolvedValue({});
      (prisma.vote.aggregate as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/votes')
        .send({ target_type: 'post', target_id: 1 })
        .expect(500);

      expect(response.body.error).toBe('Failed to remove vote');
    });
  });

  describe('GET /api/votes/:target_type/:target_id', () => {
    it('should return vote count for a target', async () => {
      (prisma.vote.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 15 } });

      const response = await request(app)
        .get('/api/votes/post/1')
        .expect(200);

      expect(response.body.voteCount).toBe(15);
    });

    it('should return 0 if no votes', async () => {
      (prisma.vote.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: null } });

      const response = await request(app)
        .get('/api/votes/post/1')
        .expect(200);

      expect(response.body.voteCount).toBe(0);
    });

    it('should handle errors', async () => {
      (prisma.vote.aggregate as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/votes/post/1')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch vote count');
    });
  });

  describe('GET /api/votes/user/:target_type/:target_id', () => {
    it('should return user vote if exists', async () => {
      (prisma.vote.findUnique as jest.Mock).mockResolvedValue({ value: 1 });

      const response = await request(app)
        .get('/api/votes/user/post/1')
        .expect(200);

      expect(response.body.userVote).toBe(1);
    });

    it('should return null if user has not voted', async () => {
      (prisma.vote.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/votes/user/post/1')
        .expect(200);

      expect(response.body.userVote).toBe(null);
    });

    it('should handle errors', async () => {
      (prisma.vote.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/votes/user/post/1')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch user vote');
    });
  });
});

