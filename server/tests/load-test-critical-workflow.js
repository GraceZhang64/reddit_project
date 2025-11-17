import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for critical workflow
const criticalWorkflowSuccess = new Rate('critical_workflow_success');
const criticalWorkflowLatency = new Trend('critical_workflow_latency_ms');

// Test configuration - 100 trials for the critical workflow
export const options = {
  iterations: 100, // Exactly 100 trials as specified
  vus: 10, // 10 virtual users running concurrently
  thresholds: {
    // Critical workflow specific thresholds
    critical_workflow_success: ['rate>0.95'], // 95% success rate
    critical_workflow_latency_ms: [
      'avg<500',   // Average < 500ms
      'p(95)<1000', // 95th percentile < 1000ms
      'p(99)<2000'  // 99th percentile < 2000ms
    ],
    // General HTTP thresholds
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'], // Less than 1% errors
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3001';
const AUTH_TOKEN = __ENV.AUTH_TOKEN || '';

function makeRequest(method, url, body = null) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${AUTH_TOKEN}`,
    },
    tags: { name: 'critical_workflow' },
  };

  let response;
  if (method === 'GET') {
    response = http.get(url, params);
  } else if (method === 'POST') {
    response = http.post(url, JSON.stringify(body), params);
  }

  return response;
}

// Critical Workflow: Viewing a Post + First 10 Comments
export default function () {
  // Step 1: Get list of posts
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
    criticalWorkflowSuccess.add(0);
    sleep(1);
    return;
  }

  const postsData = JSON.parse(postsResponse.body);
  if (!postsData.posts || postsData.posts.length === 0) {
    criticalWorkflowSuccess.add(0);
    sleep(1);
    return;
  }

  // Step 2: Select a random post
  const randomPost = postsData.posts[Math.floor(Math.random() * postsData.posts.length)];
  const postId = randomPost.id;

  // Step 3: CRITICAL WORKFLOW STARTS - Measure from here
  const workflowStartTime = Date.now();
  
  // Step 3a: Fetch the post details
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
    const latency = Date.now() - workflowStartTime;
    criticalWorkflowLatency.add(latency);
    criticalWorkflowSuccess.add(0);
    sleep(1);
    return;
  }

  // Step 3b: Fetch first 10 comments for the post
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
  const totalLatency = Date.now() - workflowStartTime;
  
  // Record metrics
  criticalWorkflowLatency.add(totalLatency);
  
  if (postCheck && commentsCheck) {
    criticalWorkflowSuccess.add(1);
  } else {
    criticalWorkflowSuccess.add(0);
  }

  // Log for analysis (only in verbose mode)
  if (__ENV.VERBOSE === 'true') {
    console.log(`Trial ${__ITER}: Post ${postId} - Latency: ${totalLatency}ms - Success: ${postCheck && commentsCheck}`);
  }

  sleep(1); // Think time between requests
}

// Summary function to print detailed results
export function handleSummary(data) {
  const criticalLatency = data.metrics.critical_workflow_latency_ms;
  const criticalSuccess = data.metrics.critical_workflow_success;
  
  return {
    'stdout': `
========================================
CRITICAL WORKFLOW TEST RESULTS
========================================
Workflow: Viewing a Post + First 10 Comments
Trials: 100

LATENCY METRICS:
  Average: ${criticalLatency.values.avg.toFixed(2)}ms
  Min: ${criticalLatency.values.min}ms
  Max: ${criticalLatency.values.max}ms
  P50: ${criticalLatency.values.med.toFixed(2)}ms
  P95: ${criticalLatency.values['p(95)'].toFixed(2)}ms
  P99: ${criticalLatency.values['p(99)'].toFixed(2)}ms

SUCCESS METRICS:
  Success Rate: ${(criticalSuccess.values.rate * 100).toFixed(2)}%
  Total Requests: ${data.metrics.http_reqs.values.count}
  Failed Requests: ${data.metrics.http_req_failed.values.rate * 100}%

THRESHOLDS:
  ✓ Average < 500ms: ${criticalLatency.values.avg < 500 ? 'PASS' : 'FAIL'}
  ✓ P95 < 1000ms: ${criticalLatency.values['p(95)'] < 1000 ? 'PASS' : 'FAIL'}
  ✓ P99 < 2000ms: ${criticalLatency.values['p(99)'] < 2000 ? 'PASS' : 'FAIL'}
  ✓ Success Rate > 95%: ${criticalSuccess.values.rate > 0.95 ? 'PASS' : 'FAIL'}
========================================
    `,
  };
}

