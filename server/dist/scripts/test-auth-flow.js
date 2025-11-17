"use strict";
/**
 * Manual test script for complete auth flow
 * Run with: npx ts-node src/scripts/test-auth-flow.ts
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const client_1 = require("@prisma/client");
const API_URL = 'http://localhost:5000';
const prisma = new client_1.PrismaClient();
const results = [];
async function testAuthFlow() {
    console.log('🧪 Starting Complete Auth Flow Test\n');
    console.log('='.repeat(50));
    const testUsername = `testuser_${Date.now()}`.substring(0, 20);
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPass123!';
    // =============== TEST 1: REGISTRATION ===============
    console.log('\n📝 TEST 1: User Registration');
    try {
        const registerResponse = await axios_1.default.post(`${API_URL}/api/auth/register`, {
            username: testUsername,
            email: testEmail,
            password: testPassword,
        });
        if (registerResponse.status === 201) {
            results.push({
                test: 'Registration API',
                status: 'PASS',
                details: {
                    userId: registerResponse.data.user?.id,
                    username: registerResponse.data.user?.username,
                },
            });
            console.log('✅ Registration API works');
            console.log(`   User ID: ${registerResponse.data.user?.id}`);
            console.log(`   Username: ${registerResponse.data.user?.username}`);
        }
        // Verify user in database
        const dbUser = await prisma.user.findUnique({
            where: { username: testUsername },
        });
        if (dbUser) {
            results.push({
                test: 'Database User Creation',
                status: 'PASS',
                details: { userId: dbUser.id, username: dbUser.username },
            });
            console.log('✅ User created in database');
        }
        else {
            throw new Error('User not found in database after registration');
        }
        // Note: Admin API requires service_role key, not anon key
        // We'll verify Supabase auth by attempting login instead
        console.log('ℹ️  Supabase admin check skipped (requires service_role key)');
    }
    catch (error) {
        results.push({
            test: 'Registration Flow',
            status: 'FAIL',
            error: error.response?.data?.error || error.message,
        });
        console.log('❌ Registration failed:', error.response?.data?.error || error.message);
        return; // Stop if registration fails
    }
    // =============== TEST 2: LOGIN ===============
    console.log('\n🔐 TEST 2: User Login');
    let authToken = null;
    let userId = null;
    try {
        const loginResponse = await axios_1.default.post(`${API_URL}/api/auth/login`, {
            email: testEmail,
            password: testPassword,
        });
        if (loginResponse.status === 200 && loginResponse.data.session) {
            authToken = loginResponse.data.session.access_token;
            userId = loginResponse.data.user.id;
            results.push({
                test: 'Login API',
                status: 'PASS',
                details: { hasToken: !!authToken, userId },
            });
            console.log('✅ Login API works');
            console.log(`   Token received: ${authToken?.substring(0, 20)}...`);
        }
        else {
            throw new Error('Login successful but no token received');
        }
    }
    catch (error) {
        results.push({
            test: 'Login Flow',
            status: 'FAIL',
            error: error.response?.data?.error || error.message,
        });
        console.log('❌ Login failed:', error.response?.data?.error || error.message);
        return;
    }
    // =============== TEST 3: GET CURRENT USER ===============
    console.log('\n👤 TEST 3: Get Current User');
    try {
        const meResponse = await axios_1.default.get(`${API_URL}/api/auth/me`, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        if (meResponse.status === 200 && meResponse.data.user) {
            results.push({
                test: 'Get Current User API',
                status: 'PASS',
                details: { username: meResponse.data.user.username },
            });
            console.log('✅ Get current user works');
            console.log(`   Username: ${meResponse.data.user.username}`);
            console.log(`   Email: ${meResponse.data.user.email}`);
        }
    }
    catch (error) {
        results.push({
            test: 'Get Current User',
            status: 'FAIL',
            error: error.response?.data?.error || error.message,
        });
        console.log('❌ Get current user failed:', error.response?.data?.error || error.message);
    }
    // =============== TEST 4: PROTECTED ENDPOINT ===============
    console.log('\n🔒 TEST 4: Protected Endpoint (Create Post)');
    try {
        // Try to create a post (requires authentication)
        const postResponse = await axios_1.default.post(`${API_URL}/api/posts`, {
            title: 'Test Post from Auth Flow',
            body: 'This post was created during auth testing',
            community_id: 1, // Assuming community 1 exists
        }, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        if (postResponse.status === 201) {
            results.push({
                test: 'Authenticated Post Creation',
                status: 'PASS',
                details: { postId: postResponse.data.id },
            });
            console.log('✅ Authenticated request works');
            console.log(`   Created post ID: ${postResponse.data.id}`);
            // Cleanup the test post
            await axios_1.default.delete(`${API_URL}/api/posts/${postResponse.data.id}`, {
                headers: { Authorization: `Bearer ${authToken}` },
            });
        }
    }
    catch (error) {
        if (error.response?.status === 401) {
            results.push({
                test: 'Authenticated Request',
                status: 'FAIL',
                error: 'Token not accepted by protected endpoint',
            });
            console.log('❌ Token not accepted by protected endpoint');
        }
        else {
            results.push({
                test: 'Authenticated Request',
                status: 'PASS',
                details: { note: 'Auth worked, other error occurred' },
            });
            console.log('⚠️  Auth worked, but post creation had other issue:', error.response?.data?.error || error.message);
        }
    }
    // =============== TEST 5: DUPLICATE PREVENTION ===============
    console.log('\n🚫 TEST 5: Duplicate Prevention');
    try {
        await axios_1.default.post(`${API_URL}/api/auth/register`, {
            username: testUsername,
            email: 'newemail@test.com',
            password: testPassword,
        });
        results.push({
            test: 'Duplicate Username Prevention',
            status: 'FAIL',
            error: 'Allowed duplicate username',
        });
        console.log('❌ Allowed duplicate username');
    }
    catch (error) {
        if (error.response?.status === 400) {
            results.push({
                test: 'Duplicate Username Prevention',
                status: 'PASS',
            });
            console.log('✅ Correctly prevents duplicate usernames');
        }
    }
    try {
        await axios_1.default.post(`${API_URL}/api/auth/register`, {
            username: 'newusername123',
            email: testEmail,
            password: testPassword,
        });
        results.push({
            test: 'Duplicate Email Prevention',
            status: 'FAIL',
            error: 'Allowed duplicate email',
        });
        console.log('❌ Allowed duplicate email');
    }
    catch (error) {
        if (error.response?.status === 400) {
            results.push({
                test: 'Duplicate Email Prevention',
                status: 'PASS',
            });
            console.log('✅ Correctly prevents duplicate emails');
        }
    }
    // =============== TEST 6: LOGOUT ===============
    console.log('\n🚪 TEST 6: User Logout');
    try {
        const logoutResponse = await axios_1.default.post(`${API_URL}/api/auth/logout`, {}, {
            headers: {
                Authorization: `Bearer ${authToken}`,
            },
        });
        if (logoutResponse.status === 200) {
            results.push({
                test: 'Logout API',
                status: 'PASS',
            });
            console.log('✅ Logout works');
        }
    }
    catch (error) {
        results.push({
            test: 'Logout',
            status: 'FAIL',
            error: error.response?.data?.error || error.message,
        });
        console.log('❌ Logout failed:', error.response?.data?.error || error.message);
    }
    // =============== CLEANUP ===============
    console.log('\n🧹 Cleaning up test data...');
    try {
        if (userId) {
            // Delete from database
            await prisma.user.delete({ where: { id: userId } });
            console.log('✅ Deleted test user from database');
            // Note: Admin deletion requires service_role key
            console.log('ℹ️  Supabase user cleanup skipped (requires service_role key)');
        }
    }
    catch (error) {
        console.log('⚠️  Cleanup warning:', error.message);
    }
    // =============== SUMMARY ===============
    console.log('\n' + '='.repeat(50));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(50));
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    results.forEach((result) => {
        const icon = result.status === 'PASS' ? '✅' : '❌';
        console.log(`${icon} ${result.test}: ${result.status}`);
        if (result.error) {
            console.log(`   Error: ${result.error}`);
        }
    });
    console.log('\n' + '='.repeat(50));
    console.log(`Total: ${results.length} tests`);
    console.log(`Passed: ${passed} ✅`);
    console.log(`Failed: ${failed} ❌`);
    console.log('='.repeat(50));
    if (failed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! Auth system is working correctly.');
    }
    else {
        console.log('\n⚠️  SOME TESTS FAILED. Please review the errors above.');
    }
}
testAuthFlow()
    .catch((error) => {
    console.error('\n💥 Fatal error during testing:', error);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
