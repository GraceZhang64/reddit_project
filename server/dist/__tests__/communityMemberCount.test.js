"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Create a mock prisma instance BEFORE importing
const mockPrisma = {
    post: {
        findFirst: jest.fn(),
    },
    comment: {
        findFirst: jest.fn(),
    },
    $executeRaw: jest.fn(),
};
// Mock the entire PrismaClient
jest.mock('@prisma/client', () => {
    return {
        PrismaClient: jest.fn(() => mockPrisma),
    };
});
const communityMemberCount_1 = require("../utils/communityMemberCount");
describe('Community Member Count Utils', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('updateCommunityMemberCount', () => {
        it('should increment member count for first-time user interaction', async () => {
            // User has never posted or commented in this community
            mockPrisma.post.findFirst.mockResolvedValue(null);
            mockPrisma.comment.findFirst.mockResolvedValue(null);
            mockPrisma.$executeRaw.mockResolvedValue(1);
            await (0, communityMemberCount_1.updateCommunityMemberCount)(1, 'user-1');
            expect(mockPrisma.post.findFirst).toHaveBeenCalledWith({
                where: {
                    communityId: 1,
                    authorId: 'user-1',
                },
                select: { id: true },
            });
            expect(mockPrisma.comment.findFirst).toHaveBeenCalledWith({
                where: {
                    post: { communityId: 1 },
                    authorId: 'user-1',
                },
                select: { id: true },
            });
            expect(mockPrisma.$executeRaw).toHaveBeenCalled();
        });
        it('should not increment if user has posted before', async () => {
            // User has posted in this community
            mockPrisma.post.findFirst.mockResolvedValue({ id: 1 });
            mockPrisma.comment.findFirst.mockResolvedValue(null);
            await (0, communityMemberCount_1.updateCommunityMemberCount)(1, 'user-1');
            expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
        });
        it('should not increment if user has commented before', async () => {
            // User has commented in this community
            mockPrisma.post.findFirst.mockResolvedValue(null);
            mockPrisma.comment.findFirst.mockResolvedValue({ id: 1 });
            await (0, communityMemberCount_1.updateCommunityMemberCount)(1, 'user-1');
            expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
        });
        it('should not increment if user has both posted and commented', async () => {
            mockPrisma.post.findFirst.mockResolvedValue({ id: 1 });
            mockPrisma.comment.findFirst.mockResolvedValue({ id: 1 });
            await (0, communityMemberCount_1.updateCommunityMemberCount)(1, 'user-1');
            expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
        });
        it('should handle errors gracefully without throwing', async () => {
            mockPrisma.post.findFirst.mockRejectedValue(new Error('Database error'));
            // Should not throw
            await expect((0, communityMemberCount_1.updateCommunityMemberCount)(1, 'user-1')).resolves.not.toThrow();
        });
        it('should handle SQL execution errors gracefully', async () => {
            mockPrisma.post.findFirst.mockResolvedValue(null);
            mockPrisma.comment.findFirst.mockResolvedValue(null);
            mockPrisma.$executeRaw.mockRejectedValue(new Error('SQL error'));
            // Should not throw
            await expect((0, communityMemberCount_1.updateCommunityMemberCount)(1, 'user-1')).resolves.not.toThrow();
        });
    });
});
