import request from 'supertest';
import express, { Express } from 'express';
import followsRouter from '../routes/follows';
import { prisma } from '../lib/prisma';

// Mock dependencies
jest.mock('../lib/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
    userFollow: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    post: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
    vote: {
      aggregate: jest.fn(),
      findFirst: jest.fn(),
    },
    comment: {
      count: jest.fn(),
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
app.use('/api/follows', followsRouter);

describe('Follows API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/follows/:username', () => {
    it('should follow a user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.userFollow.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.userFollow.create as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .post('/api/follows/targetuser')
        .expect(200);

      expect(response.body.message).toBe('Successfully followed user');
      expect(prisma.userFollow.create).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .post('/api/follows/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should return 400 if trying to follow yourself', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });

      const response = await request(app)
        .post('/api/follows/testuser')
        .expect(400);

      expect(response.body.error).toBe('Cannot follow yourself');
    });

    it('should return 400 if already following', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.userFollow.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      const response = await request(app)
        .post('/api/follows/targetuser')
        .expect(400);

      expect(response.body.error).toBe('Already following this user');
    });

    it('should handle errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/follows/targetuser')
        .expect(500);

      expect(response.body.error).toBe('Failed to follow user');
    });
  });

  describe('DELETE /api/follows/:username', () => {
    it('should unfollow a user', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.userFollow.deleteMany as jest.Mock).mockResolvedValue({});

      const response = await request(app)
        .delete('/api/follows/targetuser')
        .expect(200);

      expect(response.body.message).toBe('Successfully unfollowed user');
      expect(prisma.userFollow.deleteMany).toHaveBeenCalled();
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .delete('/api/follows/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should handle errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .delete('/api/follows/targetuser')
        .expect(500);

      expect(response.body.error).toBe('Failed to unfollow user');
    });
  });

  describe('GET /api/follows/check/:username', () => {
    it('should return true if following', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.userFollow.findUnique as jest.Mock).mockResolvedValue({ id: 1 });

      const response = await request(app)
        .get('/api/follows/check/targetuser')
        .expect(200);

      expect(response.body.isFollowing).toBe(true);
    });

    it('should return false if not following', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-2' });
      (prisma.userFollow.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/follows/check/targetuser')
        .expect(200);

      expect(response.body.isFollowing).toBe(false);
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/follows/check/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should handle errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/follows/check/targetuser')
        .expect(500);

      expect(response.body.error).toBe('Failed to check follow status');
    });
  });

  describe('GET /api/follows/followers/:username', () => {
    it('should return list of followers', async () => {
      const mockFollowers = [
        {
          follower: {
            id: 'user-2',
            username: 'follower1',
            avatar_url: null,
            karma: 100,
            createdAt: new Date(),
          },
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.userFollow.findMany as jest.Mock).mockResolvedValue(mockFollowers);
      (prisma.userFollow.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/follows/followers/testuser')
        .expect(200);

      expect(response.body).toHaveProperty('followers');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.followers).toHaveLength(1);
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/follows/followers/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should handle pagination', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.userFollow.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.userFollow.count as jest.Mock).mockResolvedValue(50);

      const response = await request(app)
        .get('/api/follows/followers/testuser?page=2&limit=10')
        .expect(200);

      expect(prisma.userFollow.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
      expect(response.body.pagination.totalPages).toBe(5);
    });

    it('should handle errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/follows/followers/testuser')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch followers');
    });
  });

  describe('GET /api/follows/following/:username', () => {
    it('should return list of following users', async () => {
      const mockFollowing = [
        {
          following: {
            id: 'user-2',
            username: 'following1',
            avatar_url: null,
            karma: 100,
            createdAt: new Date(),
          },
        },
      ];

      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'user-1' });
      (prisma.userFollow.findMany as jest.Mock).mockResolvedValue(mockFollowing);
      (prisma.userFollow.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/api/follows/following/testuser')
        .expect(200);

      expect(response.body).toHaveProperty('following');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.following).toHaveLength(1);
    });

    it('should return 404 if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/follows/following/nonexistent')
        .expect(404);

      expect(response.body.error).toBe('User not found');
    });

    it('should handle errors', async () => {
      (prisma.user.findUnique as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/follows/following/testuser')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch following');
    });
  });

  describe('GET /api/follows/feed', () => {
    it('should return posts from followed users', async () => {
      const mockFollowing = [{ followingId: 'user-2' }, { followingId: 'user-3' }];
      const mockPosts = [
        {
          id: 1,
          title: 'Test Post',
          authorId: 'user-2',
          author: { id: 'user-2', username: 'user2', avatar_url: null },
          community: { id: 1, name: 'Test', slug: 'test' },
          flair: null,
        },
      ];

      (prisma.userFollow.findMany as jest.Mock).mockResolvedValue(mockFollowing);
      (prisma.post.findMany as jest.Mock).mockResolvedValue(mockPosts);
      (prisma.post.count as jest.Mock).mockResolvedValue(1);
      (prisma.vote.aggregate as jest.Mock).mockResolvedValue({ _sum: { value: 10 } });
      (prisma.comment.count as jest.Mock).mockResolvedValue(5);
      (prisma.vote.findFirst as jest.Mock).mockResolvedValue({ value: 1 });

      const response = await request(app)
        .get('/api/follows/feed')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.posts).toHaveLength(1);
      expect(response.body.posts[0].voteCount).toBe(10);
    });

    it('should return empty if not following anyone', async () => {
      (prisma.userFollow.findMany as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/follows/feed')
        .expect(200);

      expect(response.body.posts).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    it('should handle pagination', async () => {
      (prisma.userFollow.findMany as jest.Mock).mockResolvedValue([{ followingId: 'user-2' }]);
      (prisma.post.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.post.count as jest.Mock).mockResolvedValue(100);

      const response = await request(app)
        .get('/api/follows/feed?page=2&limit=10')
        .expect(200);

      expect(prisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        })
      );
    });

    it('should handle errors', async () => {
      (prisma.userFollow.findMany as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/follows/feed')
        .expect(500);

      expect(response.body.error).toBe('Failed to fetch following feed');
    });
  });
});

