"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const communities_1 = __importDefault(require("../routes/communities"));
const prisma_1 = require("../lib/prisma");
// Mock dependencies
jest.mock('../lib/prisma', () => ({
    prisma: {
        community: {
            findMany: jest.fn(),
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
            count: jest.fn(),
        },
        post: {
            findMany: jest.fn(),
            count: jest.fn(),
        },
    },
}));
jest.mock('../middleware/auth', () => ({
    authenticateToken: (req, res, next) => {
        req.user = { id: 'user-1', username: 'testuser' };
        next();
    },
}));
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/communities', communities_1.default);
describe('Communities API', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('GET /api/communities', () => {
        it('should return paginated communities', async () => {
            const mockCommunities = [
                {
                    id: 1,
                    name: 'Test Community',
                    slug: 'test-community',
                    description: 'A test community',
                    creator_id: 'user-1',
                    createdAt: new Date(),
                    users: [],
                    _count: { posts: 10 },
                },
            ];
            prisma_1.prisma.community.findMany.mockResolvedValue(mockCommunities);
            prisma_1.prisma.community.count.mockResolvedValue(50);
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities?page=1&limit=20')
                .expect(200);
            expect(response.body).toHaveProperty('communities');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.communities).toHaveLength(1);
            expect(response.body.pagination.total).toBe(50);
        });
        it('should use default pagination values', async () => {
            prisma_1.prisma.community.findMany.mockResolvedValue([]);
            prisma_1.prisma.community.count.mockResolvedValue(0);
            await (0, supertest_1.default)(app).get('/api/communities').expect(200);
            expect(prisma_1.prisma.community.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 0,
                take: 20,
            }));
        });
        it('should handle errors', async () => {
            prisma_1.prisma.community.findMany.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities')
                .expect(500);
            expect(response.body.error).toBe('Failed to fetch communities');
        });
    });
    describe('GET /api/communities/:slug', () => {
        it('should return a specific community', async () => {
            const mockCommunity = {
                id: 1,
                name: 'Test Community',
                slug: 'test-community',
                description: 'A test community',
                creator_id: 'user-1',
                users: [],
                _count: { posts: 5 },
            };
            prisma_1.prisma.community.findUnique.mockResolvedValue(mockCommunity);
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities/test-community')
                .expect(200);
            expect(response.body.slug).toBe('test-community');
            expect(response.body.name).toBe('Test Community');
        });
        it('should return 404 if community not found', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities/nonexistent')
                .expect(404);
            expect(response.body.error).toBe('Community not found');
        });
        it('should handle errors', async () => {
            prisma_1.prisma.community.findUnique.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities/test')
                .expect(500);
            expect(response.body.error).toBe('Failed to fetch community');
        });
    });
    describe('POST /api/communities', () => {
        it('should create a new community', async () => {
            const newCommunity = {
                name: 'New Community',
                slug: 'new-community',
                description: 'A new test community',
            };
            const createdCommunity = {
                id: 1,
                ...newCommunity,
                creator_id: 'user-1',
                createdAt: new Date(),
                users: [],
            };
            prisma_1.prisma.community.findUnique.mockResolvedValue(null);
            prisma_1.prisma.community.create.mockResolvedValue(createdCommunity);
            const response = await (0, supertest_1.default)(app)
                .post('/api/communities')
                .send(newCommunity)
                .expect(201);
            expect(response.body.slug).toBe('new-community');
            expect(response.body.name).toBe('New Community');
            expect(prisma_1.prisma.community.create).toHaveBeenCalled();
        });
        it('should return 400 if name or slug is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/communities')
                .send({ description: 'No name or slug' })
                .expect(400);
            expect(response.body.error).toBe('Name and slug are required');
        });
        it('should return 400 for invalid slug format', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/communities')
                .send({ name: 'Test', slug: 'Invalid Slug!' })
                .expect(400);
            expect(response.body.error).toContain('lowercase letters');
        });
        it('should return 400 if slug already exists', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue({ id: 1 });
            const response = await (0, supertest_1.default)(app)
                .post('/api/communities')
                .send({ name: 'Test', slug: 'existing-slug' })
                .expect(400);
            expect(response.body.error).toBe('A community with this slug already exists');
        });
        it('should handle errors', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue(null);
            prisma_1.prisma.community.create.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/communities')
                .send({ name: 'Test', slug: 'test' })
                .expect(500);
            expect(response.body.error).toBe('Failed to create community');
        });
    });
    describe('PUT /api/communities/:slug', () => {
        it('should update a community', async () => {
            const existingCommunity = {
                id: 1,
                name: 'Old Name',
                slug: 'test-community',
                creator_id: 'user-1',
            };
            const updatedCommunity = {
                ...existingCommunity,
                name: 'New Name',
                description: 'Updated description',
                users: [],
            };
            prisma_1.prisma.community.findUnique.mockResolvedValue(existingCommunity);
            prisma_1.prisma.community.update.mockResolvedValue(updatedCommunity);
            const response = await (0, supertest_1.default)(app)
                .put('/api/communities/test-community')
                .send({ name: 'New Name', description: 'Updated description' })
                .expect(200);
            expect(response.body.name).toBe('New Name');
            expect(prisma_1.prisma.community.update).toHaveBeenCalled();
        });
        it('should return 404 if community not found', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .put('/api/communities/nonexistent')
                .send({ name: 'New Name' })
                .expect(404);
            expect(response.body.error).toBe('Community not found');
        });
        it('should return 403 if user is not the creator', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue({
                id: 1,
                creator_id: 'other-user',
            });
            const response = await (0, supertest_1.default)(app)
                .put('/api/communities/test-community')
                .send({ name: 'New Name' })
                .expect(403);
            expect(response.body.error).toBe('Only the community creator can update it');
        });
        it('should handle errors', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue({
                id: 1,
                creator_id: 'user-1',
            });
            prisma_1.prisma.community.update.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .put('/api/communities/test')
                .send({ name: 'New Name' })
                .expect(500);
            expect(response.body.error).toBe('Failed to update community');
        });
    });
    describe('DELETE /api/communities/:slug', () => {
        it('should delete a community', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue({
                id: 1,
                creator_id: 'user-1',
            });
            prisma_1.prisma.community.delete.mockResolvedValue({});
            const response = await (0, supertest_1.default)(app)
                .delete('/api/communities/test-community')
                .expect(200);
            expect(response.body.success).toBe(true);
            expect(prisma_1.prisma.community.delete).toHaveBeenCalled();
        });
        it('should return 404 if community not found', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .delete('/api/communities/nonexistent')
                .expect(404);
            expect(response.body.error).toBe('Community not found');
        });
        it('should return 403 if user is not the creator', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue({
                id: 1,
                creator_id: 'other-user',
            });
            const response = await (0, supertest_1.default)(app)
                .delete('/api/communities/test-community')
                .expect(403);
            expect(response.body.error).toBe('Only the community creator can delete it');
        });
        it('should handle errors', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue({
                id: 1,
                creator_id: 'user-1',
            });
            prisma_1.prisma.community.delete.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .delete('/api/communities/test')
                .expect(500);
            expect(response.body.error).toBe('Failed to delete community');
        });
    });
    describe('GET /api/communities/:slug/posts', () => {
        it('should return posts for a community', async () => {
            const mockCommunity = { id: 1, slug: 'test-community' };
            const mockPosts = [
                {
                    id: 1,
                    title: 'Test Post',
                    slug: 'test-post',
                    communityId: 1,
                    author: { id: 'user-1', username: 'testuser', avatar_url: null },
                    community: { id: 1, name: 'Test', slug: 'test' },
                    _count: { comments: 5 },
                },
            ];
            prisma_1.prisma.community.findUnique.mockResolvedValue(mockCommunity);
            prisma_1.prisma.post.findMany.mockResolvedValue(mockPosts);
            prisma_1.prisma.post.count.mockResolvedValue(1);
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities/test-community/posts')
                .expect(200);
            expect(response.body).toHaveProperty('posts');
            expect(response.body).toHaveProperty('pagination');
            expect(response.body.posts).toHaveLength(1);
        });
        it('should return 404 if community not found', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities/nonexistent/posts')
                .expect(404);
            expect(response.body.error).toBe('Community not found');
        });
        it('should handle pagination', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue({ id: 1 });
            prisma_1.prisma.post.findMany.mockResolvedValue([]);
            prisma_1.prisma.post.count.mockResolvedValue(100);
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities/test/posts?page=2&limit=10')
                .expect(200);
            expect(prisma_1.prisma.post.findMany).toHaveBeenCalledWith(expect.objectContaining({
                skip: 10,
                take: 10,
            }));
            expect(response.body.pagination.totalPages).toBe(10);
        });
        it('should handle errors', async () => {
            prisma_1.prisma.community.findUnique.mockResolvedValue({ id: 1 });
            prisma_1.prisma.post.findMany.mockRejectedValue(new Error('Database error'));
            const response = await (0, supertest_1.default)(app)
                .get('/api/communities/test/posts')
                .expect(500);
            expect(response.body.error).toBe('Failed to fetch posts');
        });
    });
});
