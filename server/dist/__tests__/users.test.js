"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const users_1 = __importDefault(require("../routes/users"));
const prisma_1 = require("../lib/prisma");
// Mock dependencies
jest.mock('../lib/prisma', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
        post: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
        comment: {
            findMany: jest.fn(),
            count: jest.fn(),
            groupBy: jest.fn(),
        },
        vote: {
            groupBy: jest.fn(),
            aggregate: jest.fn(),
        },
    },
}));
jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'user-1', username: 'testuser' };
        next();
    },
}));
jest.mock('../config/supabase', () => ({
    getSupabaseClient: jest.fn(),
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/users', users_1.default);
describe('Users API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/users/:username', () => {
        it('should return user profile', async () => {
            const mockUser = {
                id: 'user-1',
                username: 'testuser',
                avatar_url: 'https://example.com/avatar.png',
                bio: 'Test bio',
                karma: 100,
                createdAt: new Date(),
                _count: {
                    posts: 5,
                    comments: 10,
                },
            };
            prisma_1.prisma.user.findUnique.mockResolvedValue(mockUser);
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/testuser')
                .expect(200);
            expect(response.body.username).toBe('testuser');
            expect(response.body.karma).toBe(100);
            expect(response.body._count.posts).toBe(5);
            expect(response.body).not.toHaveProperty('email');
        });
        it('should return 404 if user not found', async () => {
            prisma_1.prisma.user.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/nonexistent')
                .expect(404);
            expect(response.body.error).toBe('User not found');
        });
        it('should handle errors', async () => {
            prisma_1.prisma.user.findUnique.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/testuser')
                .expect(500);
            expect(response.body.error).toBe('Failed to fetch user');
        });
    });
    describe('GET /api/users/:username/posts', () => {
        it('should return user posts with counts', async () => {
            const mockUser = { id: 'user-1' };
            const mockPosts = [
                {
                    id: 1,
                    title: 'Test Post',
                    slug: 'test-post',
                    authorId: 'user-1',
                    author: { id: 'user-1', username: 'testuser', avatar_url: null },
                    community: { id: 1, name: 'Test', slug: 'test' },
                },
            ];
            prisma_1.prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma_1.prisma.post.findMany.mockResolvedValue(mockPosts);
            prisma_1.prisma.post.count.mockResolvedValue(1);
            prisma_1.prisma.vote.groupBy.mockResolvedValue([
                { target_id: 1, _sum: { value: 10 } },
            ]);
            prisma_1.prisma.comment.groupBy.mockResolvedValue([
                { postId: 1, _count: { id: 5 } },
            ]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/testuser/posts')
                .expect(200);
            expect(response.body).toHaveProperty('posts');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.posts).toHaveLength(1);
            expect(response.body.posts[0].vote_count).toBe(10);
            expect(response.body.posts[0].comment_count).toBe(5);
        });
        it('should return 404 if user not found', async () => {
            prisma_1.prisma.user.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/nonexistent/posts')
                .expect(404);
            expect(response.body.error).toBe('User not found');
        });
        it('should handle pagination', async () => {
            prisma_1.prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma_1.prisma.post.findMany.mockResolvedValue([]);
            prisma_1.prisma.post.count.mockResolvedValue(100);
            prisma_1.prisma.vote.groupBy.mockResolvedValue([]);
            prisma_1.prisma.comment.groupBy.mockResolvedValue([]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/testuser/posts?page=2&limit=10')
                .expect(200);
            expect(prisma_1.prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 10,
                take: 10,
            }));
            expect(response.body.pagination.totalPages).toBe(10);
        });
        it('should handle errors', async () => {
            prisma_1.prisma.user.findUnique.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/testuser/posts')
                .expect(500);
            expect(response.body.error).toBe('Failed to fetch posts');
        });
    });
    describe('GET /api/users/:username/comments', () => {
        it('should return user comments with vote counts', async () => {
            const mockUser = { id: 'user-1' };
            const mockComments = [
                {
                    id: 1,
                    body: 'Test comment',
                    authorId: 'user-1',
                    postId: 1,
                    author: { id: 'user-1', username: 'testuser', avatar_url: null },
                    post: {
                        id: 1,
                        title: 'Test Post',
                        community: { slug: 'test' },
                    },
                },
            ];
            prisma_1.prisma.user.findUnique.mockResolvedValue(mockUser);
            prisma_1.prisma.comment.findMany.mockResolvedValue(mockComments);
            prisma_1.prisma.comment.count.mockResolvedValue(1);
            prisma_1.prisma.vote.groupBy.mockResolvedValue([
                { target_id: 1, _sum: { value: 5 } },
            ]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/testuser/comments')
                .expect(200);
            expect(response.body).toHaveProperty('comments');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.comments).toHaveLength(1);
            expect(response.body.comments[0].vote_count).toBe(5);
        });
        it('should return 404 if user not found', async () => {
            prisma_1.prisma.user.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/nonexistent/comments')
                .expect(404);
            expect(response.body.error).toBe('User not found');
        });
        it('should handle pagination', async () => {
            prisma_1.prisma.user.findUnique.mockResolvedValue({ id: 'user-1' });
            prisma_1.prisma.comment.findMany.mockResolvedValue([]);
            prisma_1.prisma.comment.count.mockResolvedValue(50);
            prisma_1.prisma.vote.groupBy.mockResolvedValue([]);
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/testuser/comments?page=3&limit=10')
                .expect(200);
            expect(prisma_1.prisma.comment.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 20,
                take: 10,
            }));
        });
        it('should handle errors', async () => {
            prisma_1.prisma.user.findUnique.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/users/testuser/comments')
                .expect(500);
            expect(response.body.error).toBe('Failed to fetch comments');
        });
    });
});
