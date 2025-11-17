"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const slugify_1 = require("../utils/slugify");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function updatePostSlugs() {
    console.log('Updating post slugs...');
    const posts = await prisma.post.findMany({
        where: {
            slug: null
        },
        select: {
            id: true,
            title: true
        }
    });
    console.log(`Found ${posts.length} posts without slugs`);
    for (const post of posts) {
        const slug = (0, slugify_1.generateUniqueSlug)(post.title);
        await prisma.post.update({
            where: { id: post.id },
            data: { slug }
        });
        console.log(`Updated post ${post.id}: ${slug}`);
    }
    console.log('✅ All post slugs updated!');
}
updatePostSlugs()
    .catch((e) => {
    console.error('Error updating post slugs:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
