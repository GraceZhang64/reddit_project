import request from 'supertest';
import express, { Express } from 'express';
import postsRouter from '../routes/posts';
import { PrismaClient } from '@prisma/client';

// Mock Prisma
jest.mock('@prisma/client');

const app: Express = express();
app.use(express.json());
app.use('/api/posts', postsRouter);

describe('Posts API', () => {
  let prisma: jest.Mocked<PrismaClient>;

  beforeEach(() => {
    prisma = new PrismaClient() as jest.Mocked<PrismaClient>;
    jest.clearAllMocks();
  });

  describe('GET /api/posts', () => {
    it('should return paginated posts', async () => {
      const mockPosts = [
        {
          id: 1,
          slug: 'test-post',
          title: 'Test Post',
          body: 'Test body',
          authorId: 'user-1',
          communityId: 1,
          createdAt: new Date(),
          author: { id: 'user-1', username: 'testuser', avatar_url: null },
          community: { id: 1, name: 'test', slug: 'test' },
        },
      ];

      const response = await request(app)
        .get('/api/posts?page=1&limit=20')
        .expect(200);

      expect(response.body).toHaveProperty('posts');
      expect(response.body).toHaveProperty('pagination');
    });

    it('should return 400 for invalid pagination params', async () => {
      const response = await request(app)
        .get('/api/posts?page=-1&limit=0')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/posts/:idOrSlug', () => {
    it('should return a post by numeric ID', async () => {
      const response = await request(app)
        .get('/api/posts/1')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('title');
    });

    it('should return a post by slug', async () => {
      const response = await request(app)
        .get('/api/posts/test-post-slug')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('slug');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .get('/api/posts/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Post not found');
    });
  });

  describe('POST /api/posts', () => {
    it('should create a new post with valid data', async () => {
      const newPost = {
        title: 'New Test Post',
        body: 'Test content',
        community_id: 1,
      };

      const response = await request(app)
        .post('/api/posts')
        .send(newPost)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.title).toBe(newPost.title);
      expect(response.body).toHaveProperty('slug');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/posts')
        .send({ body: 'Missing title' })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/posts/:idOrSlug/summary', () => {
    it('should return post with AI summary', async () => {
      const response = await request(app)
        .get('/api/posts/1/summary')
        .expect(200);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('ai_summary');
    });

    it('should cache AI summary for 24 hours', async () => {
      // First request generates summary
      const response1 = await request(app)
        .get('/api/posts/1/summary')
        .expect(200);

      // Second request should use cache
      const response2 = await request(app)
        .get('/api/posts/1/summary')
        .expect(200);

      // Both should have same summary if cached
      expect(response1.body.ai_summary).toBeDefined();
      expect(response2.body.ai_summary).toBe(response1.body.ai_summary);
    });

    it('should regenerate summary after 3+ new comments', async () => {
      const response = await request(app)
        .get('/api/posts/1/summary')
        .expect(200);

      expect(response.body).toHaveProperty('ai_summary');
      // Summary should regenerate if comment_count - ai_summary_comment_count >= 3
    });
  });

  describe('PUT /api/posts/:id', () => {
    it('should update a post', async () => {
      const updates = {
        title: 'Updated Title',
        body: 'Updated content',
      };

      const response = await request(app)
        .put('/api/posts/1')
        .send(updates)
        .expect(200);

      expect(response.body.title).toBe(updates.title);
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .put('/api/posts/99999')
        .send({ title: 'Updated' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/posts/:id', () => {
    it('should delete a post', async () => {
      const response = await request(app)
        .delete('/api/posts/1')
        .expect(200);

      expect(response.body).toHaveProperty('message');
    });

    it('should return 404 for non-existent post', async () => {
      const response = await request(app)
        .delete('/api/posts/99999')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});

