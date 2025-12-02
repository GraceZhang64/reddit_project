"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const comments_1 = __importDefault(require("../routes/comments"));
const prisma_1 = require("../lib/prisma");
const cache_1 = require("../lib/cache");
// Mock dependencies
jest.mock('../lib/prisma', () => ({
    prisma: {
        comment: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        vote: {
            aggregate: jest.fn(),
            findUnique: jest.fn(),
            findMany: jest.fn(),
            groupBy: jest.fn(),
        },
        post: {
            findUnique: jest.fn(),
        },
        user: {
            findUnique: jest.fn(),
            findMany: jest.fn(),
        },
        notification: {
            createMany: jest.fn(),
        },
    },
}));
jest.mock('../lib/cache', () => ({
    cache: {
        get: jest.fn(),
        set: jest.fn(),
    },
    CACHE_TTL: {
        COMMENTS: 30,
    },
}));
jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'user-1', username: 'testuser' };
        next();
    },
}));
jest.mock('../middleware/rateLimiter', () => ({
    apiLimiter: (req, res, next) => next(),
}));
jest.mock('../middleware/requestValidator', () => ({
    validateCommentCreation: (req, res, next) => next(),
}));
jest.mock('../utils/communityMemberCount', () => ({
    updateCommunityMemberCount: jest.fn(),
}));
jest.mock('../utils/mentions', () => ({
    createMentionNotifications: jest.fn(),
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/comments', comments_1.default);
describe('Comments API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/comments/search', () => {
        it('should search comments by query', async () => {
            const mockComments = [
                {
                    id: 1,
                    body: 'Test comment with keyword',
                    authorId: 'user-2',
                    postId: 1,
                    parentCommentId: null,
                    createdAt: new Date(),
                    author: { id: 'user-2', username: 'author', avatar_url: null },
                    post: {
                        id: 1,
                        slug: 'test-post',
                        title: 'Test Post',
                        community: { id: 1, name: 'test', slug: 'test' },
                    },
                },
            ];
            prisma_1.prisma.comment.findMany.mockResolvedValue(mockComments);
            prisma_1.prisma.comment.count.mockResolvedValue(1);
            prisma_1.prisma.vote.aggregate.mockResolvedValue({ _sum: { value: 5 } });
            prisma_1.prisma.vote.findUnique.mockResolvedValue({ value: 1 });
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/search?q=keyword')
                .expect(200);
            expect(response.body).toHaveProperty('comments');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.comments).toHaveLength(1);
            expect(response.body.comments[0].vote_count).toBe(5);
            expect(response.body.comments[0].user_vote).toBe(1);
        });
        it('should return 400 if query is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/search')
                .expect(400);
            expect(response.body).toHaveProperty('error');
            expect(response.body.error).toBe('Search query is required');
        });
        it('should handle pagination parameters', async () => {
            prisma_1.prisma.comment.findMany.mockResolvedValue([]);
            prisma_1.prisma.comment.count.mockResolvedValue(50);
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/search?q=test&page=2&limit=10')
                .expect(200);
            expect(prisma_1.prisma.comment.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 10,
                take: 10,
            }));
            expect(response.body.pagination).toEqual({
                page: 2,
                limit: 10,
                total: 50,
                totalPages: 5,
            });
        });
    });
    describe('GET /api/comments/post/:postId', () => {
        it('should return cached comments if available', async () => {
            const cachedData = { comments: [] };
            cache_1.cache.get.mockReturnValue(cachedData);
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/post/1')
                .expect(200);
            expect(response.body).toEqual(cachedData);
            expect(prisma_1.prisma.comment.findMany).not.toHaveBeenCalled();
        });
        it('should fetch and cache comments for a post', async () => {
            cache_1.cache.get.mockReturnValue(null);
            prisma_1.prisma.post.findUnique.mockResolvedValue({ id: 1 });
            const mockComments = [
                {
                    id: 1,
                    body: 'Top level comment',
                    authorId: 'user-2',
                    postId: 1,
                    parentCommentId: null,
                    createdAt: new Date(),
                    author: { id: 'user-2', username: 'author', avatar_url: null },
                },
            ];
            prisma_1.prisma.comment.findMany
                .mockResolvedValueOnce(mockComments)
                .mockResolvedValueOnce([]);
            prisma_1.prisma.vote.groupBy.mockResolvedValue([
                { target_id: 1, _sum: { value: 10 } },
            ]);
            prisma_1.prisma.vote.findMany.mockResolvedValue([
                { target_id: 1, value: 1 },
            ]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/post/1')
                .expect(200);
            expect(response.body).toHaveProperty('comments');
            expect(cache_1.cache.set).toHaveBeenCalled();
        });
        it('should return 400 for invalid post ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/post/invalid')
                .expect(400);
            expect(response.body.error).toBe('Invalid post ID');
        });
        it('should return 404 if post not found', async () => {
            cache_1.cache.get.mockReturnValue(null);
            prisma_1.prisma.post.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/post/999')
                .expect(404);
            expect(response.body.error).toBe('Post not found');
        });
    });
    describe('GET /api/comments/:id', () => {
        it('should return a specific comment with vote data', async () => {
            const mockComment = {
                id: 1,
                body: 'Test comment',
                authorId: 'user-2',
                postId: 1,
                parentCommentId: null,
                createdAt: new Date(),
                author: { id: 'user-2', username: 'author', avatar_url: null },
                replies: [],
            };
            prisma_1.prisma.comment.findUnique.mockResolvedValue(mockComment);
            prisma_1.prisma.vote.aggregate.mockResolvedValue({ _sum: { value: 5 } });
            prisma_1.prisma.vote.findUnique.mockResolvedValue({ value: 1 });
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/1')
                .expect(200);
            expect(response.body.id).toBe(1);
            expect(response.body.vote_count).toBe(5);
            expect(response.body.user_vote).toBe(1);
        });
        it('should return 400 for invalid comment ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/invalid')
                .expect(400);
            expect(response.body.error).toBe('Invalid comment ID');
        });
        it('should return 404 if comment not found', async () => {
            prisma_1.prisma.comment.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/comments/999')
                .expect(404);
            expect(response.body.error).toBe('Comment not found');
        });
    });
    describe('POST /api/comments', () => {
        it('should create a new comment', async () => {
            const mockComment = {
                id: 1,
                body: 'New comment',
                authorId: 'user-1',
                postId: 1,
                parentCommentId: null,
                createdAt: new Date(),
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
            };
            prisma_1.prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma_1.prisma.post.findUnique.mockResolvedValue({ id: 1, communityId: 1 });
            prisma_1.prisma.comment.create.mockResolvedValue(mockComment);
            const response = await (0, supertest_1.default)(app)
                .post('/api/comments')
                .send({ body: 'New comment', postId: 1 })
                .expect(201);
            expect(response.body.body).toBe('New comment');
            expect(prisma_1.prisma.comment.create).toHaveBeenCalled();
        });
        it('should create a reply to a comment', async () => {
            const mockParentComment = {
                id: 1,
                postId: 1,
            };
            const mockReply = {
                id: 2,
                body: 'Reply comment',
                authorId: 'user-1',
                postId: 1,
                parentCommentId: 1,
                createdAt: new Date(),
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
            };
            prisma_1.prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma_1.prisma.post.findUnique.mockResolvedValue({ id: 1, communityId: 1 });
            prisma_1.prisma.comment.findUnique.mockResolvedValue(mockParentComment);
            prisma_1.prisma.comment.create.mockResolvedValue(mockReply);
            const response = await (0, supertest_1.default)(app)
                .post('/api/comments')
                .send({ body: 'Reply comment', postId: 1, parentCommentId: 1 })
                .expect(201);
            expect(response.body.parent_comment_id).toBe(1);
        });
        it('should return 400 if body or postId is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/comments')
                .send({ body: 'Comment without postId' })
                .expect(400);
            expect(response.body.error).toBe('Body and postId are required');
        });
        it('should return 404 if post not found', async () => {
            prisma_1.prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma_1.prisma.post.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .post('/api/comments')
                .send({ body: 'Comment', postId: 999 })
                .expect(404);
            expect(response.body.error).toBe('Post not found');
        });
        it('should return 404 if parent comment not found', async () => {
            prisma_1.prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma_1.prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma_1.prisma.comment.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .post('/api/comments')
                .send({ body: 'Reply', postId: 1, parentCommentId: 999 })
                .expect(404);
            expect(response.body.error).toBe('Parent comment not found');
        });
        it('should return 400 if parent comment is from different post', async () => {
            prisma_1.prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma_1.prisma.post.findUnique.mockResolvedValue({ id: 1 });
            prisma_1.prisma.comment.findUnique.mockResolvedValue({ id: 1, postId: 2 });
            const response = await (0, supertest_1.default)(app)
                .post('/api/comments')
                .send({ body: 'Reply', postId: 1, parentCommentId: 1 })
                .expect(400);
            expect(response.body.error).toBe('Parent comment must be from the same post');
        });
    });
    describe('PUT /api/comments/:id', () => {
        it('should update a comment', async () => {
            const existingComment = {
                id: 1,
                body: 'Old comment',
                authorId: 'user-1',
            };
            const updatedComment = {
                ...existingComment,
                body: 'Updated comment',
                author: { id: 'user-1', username: 'testuser', avatar_url: null },
            };
            prisma_1.prisma.comment.findUnique.mockResolvedValue(existingComment);
            prisma_1.prisma.comment.update.mockResolvedValue(updatedComment);
            const response = await (0, supertest_1.default)(app)
                .put('/api/comments/1')
                .send({ body: 'Updated comment' })
                .expect(200);
            expect(response.body.body).toBe('Updated comment');
        });
        it('should return 400 for invalid comment ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/comments/invalid')
                .send({ body: 'Updated' })
                .expect(400);
            expect(response.body.error).toBe('Invalid comment ID');
        });
        it('should return 400 if body is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .put('/api/comments/1')
                .send({})
                .expect(400);
            expect(response.body.error).toBe('Body is required');
        });
        it('should return 404 if comment not found', async () => {
            prisma_1.prisma.comment.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .put('/api/comments/999')
                .send({ body: 'Updated' })
                .expect(404);
            expect(response.body.error).toBe('Comment not found');
        });
        it('should return 403 if user does not own the comment', async () => {
            prisma_1.prisma.comment.findUnique.mockResolvedValue({
                id: 1,
                authorId: 'user-2',
            });
            const response = await (0, supertest_1.default)(app)
                .put('/api/comments/1')
                .send({ body: 'Updated' })
                .expect(403);
            expect(response.body.error).toBe('Not authorized to update this comment');
        });
    });
    describe('DELETE /api/comments/:id', () => {
        it('should delete a comment', async () => {
            prisma_1.prisma.comment.findUnique.mockResolvedValue({
                id: 1,
                authorId: 'user-1',
            });
            prisma_1.prisma.comment.delete.mockResolvedValue({});
            const response = await (0, supertest_1.default)(app)
                .delete('/api/comments/1')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(prisma_1.prisma.comment.delete).toHaveBeenCalledWith({ where: { id: 1 } });
        });
        it('should return 400 for invalid comment ID', async () => {
            const response = await (0, supertest_1.default)(app)
                .delete('/api/comments/invalid')
                .expect(400);
            expect(response.body.error).toBe('Invalid comment ID');
        });
        it('should return 404 if comment not found', async () => {
            prisma_1.prisma.comment.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .delete('/api/comments/999')
                .expect(404);
            expect(response.body.error).toBe('Comment not found');
        });
        it('should return 403 if user does not own the comment', async () => {
            prisma_1.prisma.comment.findUnique.mockResolvedValue({
                id: 1,
                authorId: 'user-2',
            });
            const response = await (0, supertest_1.default)(app)
                .delete('/api/comments/1')
                .expect(403);
            expect(response.body.error).toBe('Not authorized to delete this comment');
        });
    });
});
