import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const postViewLatency = new Rate('post_view_success');

// Test configuration
export const options = {
  stages: [
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '2m', target: 10 },   // Stay at 10 users
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '2m', target: 20 },  // Stay at 20 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'], // 95% of requests < 500ms, 99% < 1000ms
    http_req_failed: ['rate<0.01'],                  // Less than 1% errors
    errors: ['rate<0.01'],
    post_view_success: ['rate>0.95'],                // 95% success rate for post views
  },
};

// Base URL - adjust to your server
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';

// Get auth token (you'll need to set this as an environment variable)
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

// Helper function to make authenticated request
function makeRequest(method, url, body = null) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
  };

  let response;
  if (method === 'GET') {
    response = http.get(url, params);
  } else if (method === 'POST') {
    response = http.post(url, JSON.stringify(body), params);
  }

  return response;
}

// Main test function - Critical Workflow: Viewing a Post + First 10 Comments
export default function () {
  // Step 1: Get a list of posts to choose from
  const postsResponse = makeRequest('GET', `${BASE_URL}/api/posts?page=1&limit=20`);
  
  const postsCheck = check(postsResponse, {
    'posts list status is 200': (r) => r.status === 200,
    'posts list has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.posts && data.posts.length > 0;
      } catch {
        return false;
      }
    },
  });

  if (!postsCheck) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  const postsData = JSON.parse(postsResponse.body);
  if (!postsData.posts || postsData.posts.length === 0) {
    errorRate.add(1);
    sleep(1);
    return;
  }

  // Step 2: Select a random post
  const randomPost = postsData.posts[Math.floor(Math.random() * postsData.posts.length)];
  const postId = randomPost.id;

  // Step 3: Fetch the post details (this is the critical workflow start)
  const postStartTime = Date.now();
  const postResponse = makeRequest('GET', `${BASE_URL}/api/posts/${postId}`);
  
  const postCheck = check(postResponse, {
    'post view status is 200': (r) => r.status === 200,
    'post view has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.id && data.title;
      } catch {
        return false;
      }
    },
  });

  if (!postCheck) {
    errorRate.add(1);
    postViewLatency.add(0);
    sleep(1);
    return;
  }

  // Step 4: Fetch first 10 comments for the post
  const commentsResponse = makeRequest('GET', `${BASE_URL}/api/comments/post/${postId}`);
  
  const commentsCheck = check(commentsResponse, {
    'comments status is 200': (r) => r.status === 200,
    'comments response is valid': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.comments !== undefined;
      } catch {
        return false;
      }
    },
  });

  // Calculate total latency for the critical workflow
  const totalLatency = Date.now() - postStartTime;
  
  const workflowCheck = check(null, {
    'critical workflow completed': () => postCheck && commentsCheck,
    'workflow latency acceptable': () => totalLatency < 2000, // 2 seconds threshold
  });

  if (workflowCheck) {
    postViewLatency.add(1);
  } else {
    errorRate.add(1);
    postViewLatency.add(0);
  }

  // Log the latency for analysis
  console.log(`Post ${postId} workflow latency: ${totalLatency}ms`);

  sleep(1); // Think time between requests
}

// Setup function to authenticate and get token (optional)
export function setup() {
  // If you need to authenticate first, do it here
  // For now, we assume AUTH_TOKEN is provided as environment variable
  return { token: AUTH_TOKEN };
}

