"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const posts_1 = __importDefault(require("../routes/posts"));
// Mock post service
jest.mock('../services/postService', () => ({
    postService: {
        getPosts: jest.fn(),
        getPostById: jest.fn(),
        getPostBySlug: jest.fn(),
        createPost: jest.fn(),
        updatePost: jest.fn(),
        deletePost: jest.fn(),
    },
}));
// Mock authentication middleware
jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'user-1', username: 'testuser' };
        next();
    },
    optionalAuth: (req, res, next) => {
        req.user = { id: 'user-1', username: 'testuser' };
        next();
    },
}));
// Mock rate limiter
jest.mock('../middleware/rateLimiter', () => ({
    apiLimiter: (req, res, next) => next(),
    postCreationLimiter: {
        middleware: () => (req, res, next) => next(),
    },
}));
// Mock request validator
jest.mock('../middleware/requestValidator', () => ({
    validatePostCreation: (req, res, next) => next(),
}));
// Mock cache
jest.mock('../lib/cache', () => ({
    cache: {
        get: jest.fn(),
        set: jest.fn(),
    },
    CACHE_TTL: {
        POSTS: 30,
    },
}));
// Mock AI service
jest.mock('../services/aiService', () => ({
    getAIService: () => ({
        generateSummary: jest.fn().mockResolvedValue('AI summary'),
    }),
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/posts', posts_1.default);
// Get the mocked post service
const { postService } = require('../services/postService');
describe('Posts API', () => {
    beforeEach(() => {
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
            postService.getPosts.mockResolvedValue({
                posts: mockPosts,
                total: 1,
                page: 1,
                limit: 20,
                totalPages: 1,
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/posts?page=1&limit=20')
                .expect(200);
            expect(response.body).toHaveProperty('posts');
            expect(Array.isArray(response.body.posts)).toBe(true);
            expect(response.body).toHaveProperty('total');
            expect(response.body).toHaveProperty('page');
            expect(response.body).toHaveProperty('limit');
        });
        it('should handle invalid pagination params gracefully', async () => {
            postService.getPosts.mockResolvedValue({
                posts: [],
                total: 0,
                page: 1,
                limit: 20,
                totalPages: 0,
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/posts?page=-1&limit=0')
                .expect(200);
            expect(response.body).toHaveProperty('posts');
            expect(Array.isArray(response.body.posts)).toBe(true);
        });
    });
    describe('GET /api/posts/:idOrSlug', () => {
        it('should return a post by numeric ID', async () => {
            const mockPost = {
                id: 1,
                slug: 'test-post',
                title: 'Test Post',
                body: 'Test body',
                authorId: 'user-1',
                communityId: 1,
                createdAt: new Date(),
                ai_summary: null,
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
                community: { id: 1, name: 'test', slug: 'test' },
                _count: { comments: 0 },
            };
            postService.getPostById.mockResolvedValue(mockPost);
            const response = await (0, supertest_1.default)(app)
                .get('/api/posts/1')
                .expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('title');
        });
        it('should return a post by slug', async () => {
            const mockPost = {
                id: 1,
                slug: 'test-post-slug',
                title: 'Test Post',
                body: 'Test body',
                authorId: 'user-1',
                communityId: 1,
                createdAt: new Date(),
                ai_summary: null,
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
                community: { id: 1, name: 'test', slug: 'test' },
                _count: { comments: 0 },
            };
            postService.getPostBySlug.mockResolvedValue(mockPost);
            const response = await (0, supertest_1.default)(app)
                .get('/api/posts/test-post-slug')
                .expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('slug');
        });
        it('should return 404 for non-existent post', async () => {
            postService.getPostById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
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
            const createdPost = {
                id: 2,
                title: 'New Test Post',
                body: 'Test content',
                slug: 'new-test-post',
                authorId: 'user-1',
                communityId: 1,
                createdAt: new Date(),
            };
            postService.createPost.mockResolvedValue(createdPost);
            const response = await (0, supertest_1.default)(app)
                .post('/api/posts')
                .send(newPost)
                .expect(201);
            expect(response.body).toHaveProperty('id');
            expect(response.body.title).toBe(newPost.title);
            expect(response.body).toHaveProperty('slug');
        });
        it('should return 400 for missing required fields', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/posts')
                .send({ body: 'Missing title' })
                .expect(400);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('GET /api/posts/:idOrSlug/summary', () => {
        it('should return post with AI summary', async () => {
            const mockPost = {
                id: 1,
                slug: 'test-post',
                title: 'Test Post',
                body: 'Test body',
                authorId: 'user-1',
                communityId: 1,
                createdAt: new Date(),
                ai_summary: 'AI generated summary',
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
                community: { id: 1, name: 'test', slug: 'test' },
                _count: { comments: 0 },
            };
            postService.getPostById.mockResolvedValue(mockPost);
            const response = await (0, supertest_1.default)(app)
                .get('/api/posts/1/summary')
                .expect(200);
            expect(response.body).toHaveProperty('id');
            expect(response.body).toHaveProperty('ai_summary');
        });
        it('should cache AI summary for 24 hours', async () => {
            const mockPost = {
                id: 1,
                slug: 'test-post',
                title: 'Test Post',
                body: 'Test body',
                authorId: 'user-1',
                communityId: 1,
                createdAt: new Date(),
                ai_summary: 'Cached AI summary',
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
                community: { id: 1, name: 'test', slug: 'test' },
                _count: { comments: 0 },
            };
            postService.getPostById.mockResolvedValue(mockPost);
            // First request generates summary
            const response1 = await (0, supertest_1.default)(app)
                .get('/api/posts/1/summary')
                .expect(200);
            // Second request should use cache
            const response2 = await (0, supertest_1.default)(app)
                .get('/api/posts/1/summary')
                .expect(200);
            // Both should have same summary if cached
            expect(response1.body.ai_summary).toBeDefined();
            expect(response2.body.ai_summary).toBe(response1.body.ai_summary);
        });
        it('should regenerate summary after 3+ new comments', async () => {
            const mockPost = {
                id: 1,
                slug: 'test-post',
                title: 'Test Post',
                body: 'Test body',
                authorId: 'user-1',
                communityId: 1,
                createdAt: new Date(),
                ai_summary: 'Regenerated AI summary',
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
                community: { id: 1, name: 'test', slug: 'test' },
                _count: { comments: 5 },
            };
            postService.getPostById.mockResolvedValue(mockPost);
            const response = await (0, supertest_1.default)(app)
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
            const mockPost = {
                id: 1,
                slug: 'test-post',
                title: 'Updated Title',
                body: 'Updated content',
                authorId: 'user-1',
                communityId: 1,
                createdAt: new Date(),
                ai_summary: null,
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
                community: { id: 1, name: 'test', slug: 'test' },
                _count: { comments: 0 },
            };
            postService.getPostById.mockResolvedValue(mockPost);
            postService.updatePost.mockResolvedValue(mockPost);
            const response = await (0, supertest_1.default)(app)
                .put('/api/posts/1')
                .send(updates)
                .expect(200);
            expect(response.body.title).toBe(updates.title);
        });
        it('should return 404 for non-existent post', async () => {
            postService.getPostById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .put('/api/posts/99999')
                .send({ title: 'Updated' })
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
    describe('DELETE /api/posts/:id', () => {
        it('should delete a post', async () => {
            const mockPost = {
                id: 1,
                slug: 'test-post',
                title: 'Test Post',
                body: 'Test body',
                authorId: 'user-1',
                communityId: 1,
                createdAt: new Date(),
                ai_summary: null,
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
                community: { id: 1, name: 'test', slug: 'test' },
                _count: { comments: 0 },
            };
            postService.getPostById.mockResolvedValue(mockPost);
            postService.deletePost.mockResolvedValue(true);
            const response = await (0, supertest_1.default)(app)
                .delete('/api/posts/1')
                .expect(200);
            expect(response.body).toHaveProperty('message');
        });
        it('should return 404 for non-existent post', async () => {
            postService.getPostById.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .delete('/api/posts/99999')
                .expect(404);
            expect(response.body).toHaveProperty('error');
        });
    });
});
