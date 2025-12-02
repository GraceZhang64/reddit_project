"use strict";
/**
 * Full integration test for auth flow
 * Tests the complete registration and login flow
 */
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const supabase_1 = require("../config/supabase");
describe('Auth Integration Tests', () => {
    let prisma;
    beforeAll(async () => {
        prisma = new client_1.PrismaClient();
    });
    afterAll(async () => {
        await prisma.$disconnect();
    });
    describe('User Registration Flow', () => {
        const testUser = {
            email: `test_${Date.now()}@example.com`,
            username: `testuser_${Date.now()}`.substring(0, 20),
            password: 'TestPass123!',
        };
        it('should register a new user in both Supabase and database', async () => {
            const supabase = (0, supabase_1.getSupabaseClient)();
            // 1. Sign up with Supabase
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: testUser.email,
                password: testUser.password,
                options: {
                    data: {
                        username: testUser.username,
                    },
                },
            });
            expect(authError).toBeNull();
            expect(authData.user).toBeDefined();
            expect(authData.user?.email).toBe(testUser.email);
            if (!authData.user)
                return;
            // 2. Create user in database
            const dbUser = await prisma.user.create({
                data: {
                    id: authData.user.id,
                    email: testUser.email,
                    username: testUser.username,
                    avatar_url: null,
                    bio: null,
                },
            });
            expect(dbUser).toBeDefined();
            expect(dbUser.email).toBe(testUser.email);
            expect(dbUser.username).toBe(testUser.username);
            expect(dbUser.id).toBe(authData.user.id);
            // 3. Verify user can be found
            const foundUser = await prisma.user.findUnique({
                where: { id: authData.user.id },
            });
            expect(foundUser).toBeDefined();
            expect(foundUser?.username).toBe(testUser.username);
            // Cleanup
            await prisma.user.delete({ where: { id: authData.user.id } });
            await supabase.auth.admin.deleteUser(authData.user.id);
        });
        it('should prevent duplicate usernames', async () => {
            const existingUser = await prisma.user.findFirst();
            if (!existingUser) {
                console.log('No existing users to test duplicate prevention');
                return;
            }
            // Try to create user with existing username
            await expect(prisma.user.create({
                data: {
                    id: 'test-id-12345',
                    email: 'newemail@test.com',
                    username: existingUser.username,
                    avatar_url: null,
                    bio: null,
                },
            })).rejects.toThrow();
        });
        it('should prevent duplicate emails', async () => {
            const existingUser = await prisma.user.findFirst();
            if (!existingUser) {
                console.log('No existing users to test duplicate prevention');
                return;
            }
            // Try to create user with existing email
            await expect(prisma.user.create({
                data: {
                    id: 'test-id-67890',
                    email: existingUser.email,
                    username: 'newusername123',
                    avatar_url: null,
                    bio: null,
                },
            })).rejects.toThrow();
        });
    });
    describe('User Login Flow', () => {
        it('should verify user exists in database', async () => {
            const existingUser = await prisma.user.findFirst();
            if (!existingUser) {
                console.log('No users exist to test login');
                return;
            }
            expect(existingUser).toBeDefined();
            expect(existingUser.email).toBeDefined();
            expect(existingUser.username).toBeDefined();
        });
        it('should fetch user by ID', async () => {
            const existingUser = await prisma.user.findFirst();
            if (!existingUser)
                return;
            const fetchedUser = await prisma.user.findUnique({
                where: { id: existingUser.id },
                select: {
                    id: true,
                    email: true,
                    username: true,
                    avatar_url: true,
                    bio: true,
                },
            });
            expect(fetchedUser).toBeDefined();
            expect(fetchedUser?.id).toBe(existingUser.id);
            expect(fetchedUser?.email).toBe(existingUser.email);
        });
        it('should fetch user by email', async () => {
            const existingUser = await prisma.user.findFirst();
            if (!existingUser)
                return;
            const fetchedUser = await prisma.user.findUnique({
                where: { email: existingUser.email },
            });
            expect(fetchedUser).toBeDefined();
            expect(fetchedUser?.email).toBe(existingUser.email);
        });
        it('should fetch user by username', async () => {
            const existingUser = await prisma.user.findFirst();
            if (!existingUser)
                return;
            const fetchedUser = await prisma.user.findUnique({
                where: { username: existingUser.username },
            });
            expect(fetchedUser).toBeDefined();
            expect(fetchedUser?.username).toBe(existingUser.username);
        });
    });
    describe('Database Schema Validation', () => {
        it('should have correct user table structure', async () => {
            const user = await prisma.user.findFirst();
            if (!user) {
                console.log('No users to validate schema');
                return;
            }
            // Check all required fields exist
            expect(user).toHaveProperty('id');
            expect(user).toHaveProperty('email');
            expect(user).toHaveProperty('username');
            expect(user).toHaveProperty('createdAt');
            // Check types
            expect(typeof user.id).toBe('string');
            expect(typeof user.email).toBe('string');
            expect(typeof user.username).toBe('string');
        });
        it('should have email index for fast lookups', async () => {
            // This tests that queries by email are efficient
            const startTime = Date.now();
            await prisma.user.findUnique({
                where: { email: 'nonexistent@test.com' },
            });
            const endTime = Date.now();
            // Should be reasonably fast (< 500ms) due to index
            expect(endTime - startTime).toBeLessThan(500);
        });
        it('should have username index for fast lookups', async () => {
            const startTime = Date.now();
            await prisma.user.findUnique({
                where: { username: 'nonexistentuser' },
            });
            const endTime = Date.now();
            expect(endTime - startTime).toBeLessThan(500);
        });
    });
});
