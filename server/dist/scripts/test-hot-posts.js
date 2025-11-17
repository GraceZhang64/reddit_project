"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function testHotPosts() {
    try {
        console.log('Testing hot posts query...');
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const posts = await prisma.post.findMany({
            where: {
                createdAt: {
                    gte: sevenDaysAgo,
                },
            },
            take: 20,
            include: {
                author: {
                    select: {
                        id: true,
                        username: true,
                        avatar_url: true,
                    },
                },
                community: {
                    select: {
                        id: true,
                        name: true,
                        slug: true,
                    },
                },
            },
        });
        console.log(`Found ${posts.length} posts`);
        console.log('First post:', posts[0]);
        await prisma.$disconnect();
    }
    catch (error) {
        console.error('Error:', error);
        await prisma.$disconnect();
        process.exit(1);
    }
}
testHotPosts();
