import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const API_URL = `http://localhost:${process.env.PORT || 3001}`;

interface TestResult {
  name: string;
  success: boolean;
  message: string;
  details?: any;
}

const tests: TestResult[] = [];

async function testHealthCheck(): Promise<TestResult> {
  try {
    const response = await axios.get(`${API_URL}/api/health`);
    return {
      name: 'Health Check',
      success: response.status === 200,
      message: response.data.message
    };
  } catch (error: any) {
    return {
      name: 'Health Check',
      success: false,
      message: `Failed: ${error.message}`
    };
  }
}

async function testAPIEndpoints(): Promise<TestResult> {
  try {
    const response = await axios.get(`${API_URL}/`);
    return {
      name: 'API Endpoints List',
      success: response.status === 200,
      message: 'All endpoints documented',
      details: Object.keys(response.data.endpoints)
    };
  } catch (error: any) {
    return {
      name: 'API Endpoints List',
      success: false,
      message: `Failed: ${error.message}`
    };
  }
}

async function testCommunities(): Promise<TestResult> {
  try {
    const response = await axios.get(`${API_URL}/api/communities`);
    return {
      name: 'Get Communities',
      success: response.status === 200,
      message: `Found ${response.data.communities.length} communities`,
      details: { total: response.data.pagination.total }
    };
  } catch (error: any) {
    return {
      name: 'Get Communities',
      success: false,
      message: `Failed: ${error.message}`
    };
  }
}

async function testPosts(): Promise<TestResult> {
  try {
    const response = await axios.get(`${API_URL}/api/posts`);
    return {
      name: 'Get Posts',
      success: response.status === 200,
      message: `Found ${response.data.posts.length} posts`,
      details: { total: response.data.pagination.total }
    };
  } catch (error: any) {
    return {
      name: 'Get Posts',
      success: false,
      message: `Failed: ${error.message}`
    };
  }
}

async function testAuth(): Promise<TestResult[]> {
  const authTests: TestResult[] = [];
  let token: string | null = null;

  // Test registration endpoint (may fail if Supabase requires email confirmation)
  try {
    const timestamp = Date.now().toString().slice(-8); // Last 8 digits
    const uniqueUsername = `test${timestamp}`;
    const registerResponse = await axios.post(`${API_URL}/api/auth/register`, {
      email: `${uniqueUsername}@example.com`,
      password: 'TestPass123!',
      username: uniqueUsername
    });

    authTests.push({
      name: 'User Registration Endpoint',
      success: registerResponse.status === 201,
      message: 'User registered successfully',
      details: { username: registerResponse.data.user.username }
    });

    token = registerResponse.data.session?.access_token;
  } catch (error: any) {
    const errorMsg = error.response?.data?.error || error.message;
    // Some Supabase configs require email confirmation or have domain restrictions
    authTests.push({
      name: 'User Registration Endpoint',
      success: false,
      message: `Skipped (Supabase config): ${errorMsg}`,
      details: { note: 'This may be expected if email confirmation is enabled' }
    });
  }

  // Test login with existing seed data
  try {
    const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'john@example.com',
      password: 'password123' // Default seed password if any
    });

    authTests.push({
      name: 'User Login (Seed Data)',
      success: loginResponse.status === 200,
      message: 'Login successful',
      details: { username: loginResponse.data.user?.username }
    });

    token = loginResponse.data.session?.access_token;
  } catch (error: any) {
    authTests.push({
      name: 'User Login (Seed Data)',
      success: false,
      message: `Expected (no password in seed): ${error.response?.data?.error || error.message}`,
      details: { note: 'Seed data users have no passwords set yet' }
    });
  }

  // Test get current user (if token exists)
  if (token) {
    try {
      const meResponse = await axios.get(`${API_URL}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      authTests.push({
        name: 'Get Current User',
        success: meResponse.status === 200,
        message: 'Retrieved user profile',
        details: { username: meResponse.data.user.username }
      });
    } catch (error: any) {
      authTests.push({
        name: 'Get Current User',
        success: false,
        message: `Failed: ${error.response?.data?.error || error.message}`
      });
    }

    // Test create community (authenticated)
    try {
      const communitySlug = `test-community-${Date.now()}`;
      const createCommunityResponse = await axios.post(
        `${API_URL}/api/communities`,
        {
          name: 'Test Community',
          slug: communitySlug,
          description: 'A test community'
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      authTests.push({
        name: 'Create Community (Authenticated)',
        success: createCommunityResponse.status === 201,
        message: 'Community created successfully',
        details: { slug: createCommunityResponse.data.slug }
      });
    } catch (error: any) {
      authTests.push({
        name: 'Create Community (Authenticated)',
        success: false,
        message: `Failed: ${error.response?.data?.error || error.message}`
      });
    }
  }

  return authTests;
}

async function testUnauthenticatedAccess(): Promise<TestResult> {
  try {
    await axios.post(`${API_URL}/api/communities`, {
      name: 'Test',
      slug: 'test',
      description: 'Test'
    });

    return {
      name: 'Unauthenticated Access Protection',
      success: false,
      message: 'Should have been rejected but was allowed'
    };
  } catch (error: any) {
    return {
      name: 'Unauthenticated Access Protection',
      success: error.response?.status === 401,
      message: error.response?.status === 401 
        ? 'Correctly rejected unauthenticated request'
        : `Wrong status: ${error.response?.status}`
    };
  }
}

async function runTests() {
  console.log('\n🧪 Testing BlueIt API...\n');
  console.log('='.repeat(60));

  // Run all tests
  tests.push(await testHealthCheck());
  tests.push(await testAPIEndpoints());
  tests.push(await testCommunities());
  tests.push(await testPosts());
  tests.push(...await testAuth());
  tests.push(await testUnauthenticatedAccess());

  // Display results
  console.log('\n📊 Test Results:\n');
  tests.forEach((test, index) => {
    const icon = test.success ? '✅' : '❌';
    console.log(`${index + 1}. ${icon} ${test.name}`);
    console.log(`   ${test.message}`);
    if (test.details) {
      console.log(`   Details:`, test.details);
    }
    console.log('');
  });

  console.log('='.repeat(60));
  
  const passed = tests.filter(t => t.success).length;
  const total = tests.length;
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n📈 Results: ${passed}/${total} tests passed (${passRate}%)\n`);

  if (passed === total) {
    console.log('✅ All tests passed!\n');
    process.exit(0);
  } else {
    console.log('❌ Some tests failed. Please review the errors above.\n');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test suite failed:', error);
  process.exit(1);
});

