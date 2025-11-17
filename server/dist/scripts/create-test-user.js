"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
async function createTestUser() {
    try {
        console.log('Creating test user for development...');
        // Check if test user already exists
        const existingUser = await prisma.user.findUnique({
            where: { username: 'testuser' }
        });
        if (existingUser) {
            console.log('✅ Test user already exists!');
            console.log(`   ID: ${existingUser.id}`);
            console.log(`   Username: ${existingUser.username}`);
            console.log('\n🔑 To use this user, add to your .env:');
            console.log(`   TEST_USER_ID=${existingUser.id}`);
            return;
        }
        // Create test user
        const testUser = await prisma.user.create({
            data: {
                username: 'testuser',
                email: 'test@example.com',
                avatar_url: null,
                bio: 'Test user for development'
            }
        });
        console.log('✅ Test user created successfully!');
        console.log(`   ID: ${testUser.id}`);
        console.log(`   Username: ${testUser.username}`);
        console.log(`   Email: ${testUser.email}`);
        console.log('\n🔑 To use this user, add to your .env:');
        console.log(`   TEST_USER_ID=${testUser.id}`);
        console.log('\nℹ️  You can now create posts/comments as this user in development mode.');
    }
    catch (error) {
        console.error('❌ Error creating test user:', error);
        throw error;
    }
    finally {
        await prisma.$disconnect();
    }
}
createTestUser();
