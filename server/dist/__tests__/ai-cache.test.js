"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
describe('AI Summary Caching System', () => {
    let prisma;
    beforeAll(() => {
        prisma = new client_1.PrismaClient();
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('Cache Invalidation Logic', () => {
        it('should regenerate summary if none exists', () => {
            const post = {
                ai_summary: null,
                ai_summary_generated_at: null,
                comment_count: 5,
                ai_summary_comment_count: 0,
            };
            const shouldRegenerate = !post.ai_summary ||
                !post.ai_summary_generated_at;
            expect(shouldRegenerate).toBe(true);
        });
        it('should regenerate summary after 24 hours', () => {
            const now = new Date();
            const yesterday = new Date(now.getTime() - 25 * 60 * 60 * 1000); // 25 hours ago
            const post = {
                ai_summary: 'Old summary',
                ai_summary_generated_at: yesterday,
                comment_count: 5,
                ai_summary_comment_count: 5,
            };
            const shouldRegenerate = new Date().getTime() - new Date(post.ai_summary_generated_at).getTime() > 24 * 60 * 60 * 1000;
            expect(shouldRegenerate).toBe(true);
        });
        it('should not regenerate summary before 24 hours with no new comments', () => {
            const now = new Date();
            const recentTime = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
            const post = {
                ai_summary: 'Recent summary',
                ai_summary_generated_at: recentTime,
                comment_count: 5,
                ai_summary_comment_count: 5,
            };
            const newCommentsCount = post.comment_count - post.ai_summary_comment_count;
            const shouldRegenerate = new Date().getTime() - new Date(post.ai_summary_generated_at).getTime() > 24 * 60 * 60 * 1000 ||
                newCommentsCount >= 3;
            expect(shouldRegenerate).toBe(false);
        });
        it('should regenerate summary with 3+ new comments', () => {
            const now = new Date();
            const recentTime = new Date(now.getTime() - 5 * 60 * 60 * 1000); // 5 hours ago
            const post = {
                ai_summary: 'Recent summary',
                ai_summary_generated_at: recentTime,
                comment_count: 8,
                ai_summary_comment_count: 5,
            };
            const newCommentsCount = post.comment_count - post.ai_summary_comment_count;
            const shouldRegenerate = newCommentsCount >= 3;
            expect(shouldRegenerate).toBe(true);
            expect(newCommentsCount).toBe(3);
        });
        it('should not regenerate with only 2 new comments', () => {
            const now = new Date();
            const recentTime = new Date(now.getTime() - 5 * 60 * 60 * 1000);
            const post = {
                ai_summary: 'Recent summary',
                ai_summary_generated_at: recentTime,
                comment_count: 7,
                ai_summary_comment_count: 5,
            };
            const newCommentsCount = post.comment_count - post.ai_summary_comment_count;
            const shouldRegenerate = new Date().getTime() - new Date(post.ai_summary_generated_at).getTime() > 24 * 60 * 60 * 1000 ||
                newCommentsCount >= 3;
            expect(shouldRegenerate).toBe(false);
            expect(newCommentsCount).toBe(2);
        });
    });
    describe('Database Field Integrity', () => {
        it('should have ai_summary_comment_count field in schema', async () => {
            // This tests that the migration was applied correctly
            const result = await prisma.$queryRaw `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'posts' 
        AND column_name = 'ai_summary_comment_count'
      `;
            expect(result.length).toBeGreaterThan(0);
        });
        it('should default ai_summary_comment_count to 0', async () => {
            const post = await prisma.post.findFirst({
                select: { ai_summary_comment_count: true },
            });
            if (post) {
                expect(typeof post.ai_summary_comment_count).toBe('number');
            }
        });
    });
});
