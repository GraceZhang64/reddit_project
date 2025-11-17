"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../config/supabase");
jest.mock('../config/supabase');
describe('Authentication Middleware', () => {
    let mockRequest;
    let mockResponse;
    let nextFunction;
    let mockSupabase;
    beforeEach(() => {
        mockRequest = {
            headers: {}
        };
        mockResponse = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        nextFunction = jest.fn();
        mockSupabase = {
            auth: {
                getUser: jest.fn()
            }
        };
        supabase_1.getSupabaseClient.mockReturnValue(mockSupabase);
        jest.clearAllMocks();
    });
    describe('authenticateToken', () => {
        it('should authenticate valid token and add user to request', async () => {
            mockRequest.headers = {
                authorization: 'Bearer valid-token-123'
            };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        id: 'user-123',
                        email: 'test@example.com'
                    }
                },
                error: null
            });
            await (0, auth_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockSupabase.auth.getUser).toHaveBeenCalledWith('valid-token-123');
            expect(mockRequest.user).toEqual({
                id: 'user-123',
                email: 'test@example.com'
            });
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should return 401 if no authorization header', async () => {
            mockRequest.headers = {};
            await (0, auth_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication required'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 401 if authorization header is malformed', async () => {
            mockRequest.headers = {
                authorization: 'InvalidFormat'
            };
            await (0, auth_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication required'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 401 if token is invalid', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token'
            };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid token' }
            });
            await (0, auth_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid or expired token'
            });
            expect(nextFunction).not.toHaveBeenCalled();
        });
        it('should return 401 if Supabase returns null user', async () => {
            mockRequest.headers = {
                authorization: 'Bearer token'
            };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null
            });
            await (0, auth_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Invalid or expired token'
            });
        });
        it('should handle Supabase errors gracefully', async () => {
            mockRequest.headers = {
                authorization: 'Bearer token'
            };
            mockSupabase.auth.getUser.mockRejectedValue(new Error('Supabase error'));
            await (0, auth_1.authenticateToken)(mockRequest, mockResponse, nextFunction);
            expect(mockResponse.status).toHaveBeenCalledWith(401);
            expect(mockResponse.json).toHaveBeenCalledWith({
                error: 'Authentication failed'
            });
        });
    });
    describe('optionalAuth', () => {
        it('should add user to request if valid token provided', async () => {
            mockRequest.headers = {
                authorization: 'Bearer valid-token-123'
            };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: {
                    user: {
                        id: 'user-123',
                        email: 'test@example.com'
                    }
                },
                error: null
            });
            await (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toEqual({
                id: 'user-123',
                email: 'test@example.com'
            });
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should continue without user if no token provided', async () => {
            mockRequest.headers = {};
            await (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should continue without user if token is invalid', async () => {
            mockRequest.headers = {
                authorization: 'Bearer invalid-token'
            };
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: { message: 'Invalid token' }
            });
            await (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
        it('should continue without user on Supabase error', async () => {
            mockRequest.headers = {
                authorization: 'Bearer token'
            };
            mockSupabase.auth.getUser.mockRejectedValue(new Error('Supabase error'));
            await (0, auth_1.optionalAuth)(mockRequest, mockResponse, nextFunction);
            expect(mockRequest.user).toBeUndefined();
            expect(nextFunction).toHaveBeenCalled();
            expect(mockResponse.status).not.toHaveBeenCalled();
        });
    });
});
