"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const express_1 = __importDefault(require("express"));
const auth_1 = __importDefault(require("../routes/auth"));
const client_1 = require("@prisma/client");
const supabase_1 = require("../config/supabase");
jest.mock('@prisma/client');
jest.mock('../config/supabase');
const app = (0, express_1.default)();
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
describe('Authentication Routes', () => {
    let mockPrisma;
    let mockSupabase;
    beforeEach(() => {
        mockPrisma = new client_1.PrismaClient();
        mockSupabase = {
            auth: {
                signUp: jest.fn(),
                signInWithPassword: jest.fn(),
                signOut: jest.fn(),
                getUser: jest.fn(),
                admin: {
                    deleteUser: jest.fn()
                }
            }
        };
        supabase_1.getSupabaseClient.mockReturnValue(mockSupabase);
        jest.clearAllMocks();
    });
    describe('POST /api/auth/register', () => {
        const validRegistrationData = {
            email: 'test@example.com',
            password: 'SecurePass123!',
            username: 'testuser'
        };
        it('should register a new user successfully', async () => {
            mockSupabase.auth.signUp.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: { access_token: 'token-123' }
                },
                error: null
            });
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser'
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(201);
            expect(response.body).toHaveProperty('message', 'Registration successful');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('session');
            expect(response.body.user.username).toBe('testuser');
        });
        it('should return 400 if email is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ password: 'test', username: 'test' })
                .expect(400);
            expect(response.body.error).toBe('Email, password, and username are required');
        });
        it('should return 400 if password is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ email: 'test@test.com', username: 'test' })
                .expect(400);
            expect(response.body.error).toBe('Email, password, and username are required');
        });
        it('should return 400 if username is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ email: 'test@test.com', password: 'test' })
                .expect(400);
            expect(response.body.error).toBe('Email, password, and username are required');
        });
        it('should return 400 if username is too short', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ ...validRegistrationData, username: 'ab' })
                .expect(400);
            expect(response.body.error).toBe('Username must be between 3 and 20 characters');
        });
        it('should return 400 if username is too long', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ ...validRegistrationData, username: 'a'.repeat(21) })
                .expect(400);
            expect(response.body.error).toBe('Username must be between 3 and 20 characters');
        });
        it('should return 400 if username has invalid characters', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send({ ...validRegistrationData, username: 'test-user!' })
                .expect(400);
            expect(response.body.error).toBe('Username can only contain letters, numbers, and underscores');
        });
        it('should return 400 if username already exists', async () => {
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'existing-user',
                username: 'testuser'
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(400);
            expect(response.body.error).toBe('Username already taken');
        });
        it('should return 400 if Supabase registration fails', async () => {
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockSupabase.auth.signUp.mockResolvedValue({
                data: { user: null },
                error: { message: 'Email already registered' }
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(400);
            expect(response.body.error).toBe('Email already registered');
        });
        it('should rollback auth user if database creation fails', async () => {
            const userId = 'user-123';
            mockSupabase.auth.signUp.mockResolvedValue({
                data: {
                    user: { id: userId, email: 'test@example.com' },
                    session: { access_token: 'token-123' }
                },
                error: null
            });
            mockPrisma.user.findUnique.mockResolvedValue(null);
            mockPrisma.user.create.mockRejectedValue(new Error('DB error'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/register')
                .send(validRegistrationData)
                .expect(500);
            expect(response.body.error).toBe('Failed to create user profile');
            expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith(userId);
        });
    });
    describe('POST /api/auth/login', () => {
        const validLoginData = {
            email: 'test@example.com',
            password: 'SecurePass123!'
        };
        it('should login successfully with valid credentials', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: { access_token: 'token-123' }
                },
                error: null
            });
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                avatar_url: null,
                bio: null
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData)
                .expect(200);
            expect(response.body).toHaveProperty('message', 'Login successful');
            expect(response.body).toHaveProperty('user');
            expect(response.body).toHaveProperty('session');
            expect(response.body.user.username).toBe('testuser');
        });
        it('should return 400 if email is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({ password: 'test' })
                .expect(400);
            expect(response.body.error).toBe('Email and password are required');
        });
        it('should return 400 if password is missing', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send({ email: 'test@test.com' })
                .expect(400);
            expect(response.body.error).toBe('Email and password are required');
        });
        it('should return 401 for invalid credentials', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid login credentials' }
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData)
                .expect(401);
            expect(response.body.error).toBe('Invalid email or password');
        });
        it('should return 401 if user is null despite no error', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: { user: null, session: null },
                error: null
            });
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData)
                .expect(401);
            expect(response.body.error).toBe('Invalid email or password');
        });
        it('should return 404 if user profile not found in database', async () => {
            mockSupabase.auth.signInWithPassword.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' },
                    session: { access_token: 'token-123' }
                },
                error: null
            });
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData)
                .expect(404);
            expect(response.body.error).toBe('User profile not found');
        });
        it('should handle server errors gracefully', async () => {
            mockSupabase.auth.signInWithPassword.mockRejectedValue(new Error('Server error'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/login')
                .send(validLoginData)
                .expect(500);
            expect(response.body.error).toBe('Internal server error');
        });
    });
    describe('POST /api/auth/logout', () => {
        it('should logout successfully with valid token', async () => {
            mockSupabase.auth.signOut.mockResolvedValue({ error: null });
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer valid-token')
                .expect(200);
            expect(response.body.message).toBe('Logged out successfully');
            expect(mockSupabase.auth.signOut).toHaveBeenCalled();
        });
        it('should logout even without token', async () => {
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/logout')
                .expect(200);
            expect(response.body.message).toBe('Logged out');
        });
        it('should handle logout errors gracefully', async () => {
            mockSupabase.auth.signOut.mockRejectedValue(new Error('Logout error'));
            const response = await (0, supertest_1.default)(app)
                .post('/api/auth/logout')
                .set('Authorization', 'Bearer valid-token')
                .expect(500);
            expect(response.body.error).toBe('Internal server error');
        });
    });
    describe('GET /api/auth/me', () => {
        it('should return user profile with valid token', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' }
                },
                error: null
            });
            mockPrisma.user.findUnique.mockResolvedValue({
                id: 'user-123',
                email: 'test@example.com',
                username: 'testuser',
                avatar_url: null,
                bio: 'Test bio',
                createdAt: new Date()
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer valid-token')
                .expect(200);
            expect(response.body).toHaveProperty('user');
            expect(response.body.user.username).toBe('testuser');
        });
        it('should return 401 if no token provided', async () => {
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/me')
                .expect(401);
            expect(response.body.error).toBe('Authentication required');
        });
        it('should return 401 if token is invalid', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid token' }
            });
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
            expect(response.body.error).toBe('Invalid or expired token');
        });
        it('should return 404 if user profile not found', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: { id: 'user-123', email: 'test@example.com' }
                },
                error: null
            });
            mockPrisma.user.findUnique.mockResolvedValue(null);
            const response = await (0, supertest_1.default)(app)
                .get('/api/auth/me')
                .set('Authorization', 'Bearer valid-token')
                .expect(404);
            expect(response.body.error).toBe('User profile not found');
        });
    });
});
