import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics for critical workflow
const criticalWorkflowSuccess = new Rate('critical_workflow_success');
const criticalWorkflowLatency = new Trend('critical_workflow_latency_ms');

// Bottleneck detection metrics
const postListLatency = new Trend('post_list_latency_ms');
const postViewLatency = new Trend('post_view_latency_ms');
const commentsLatency = new Trend('comments_latency_ms');

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

const BASE_URL = __ENV.BASE_URL || 'http://localhost:5000';
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
  // Check if AUTH_TOKEN is set
  if (!AUTH_TOKEN || AUTH_TOKEN === '') {
    if (__ITER === 0) {
      console.error('❌ ERROR: AUTH_TOKEN is not set!');
      console.error('   Get your token from browser DevTools > Application > Local Storage > access_token');
      console.error('   Then set: $env:AUTH_TOKEN = "your_token_here"');
    }
    criticalWorkflowSuccess.add(0);
    sleep(1);
    return;
  }

  // Step 1: Get list of posts
  const postListStart = Date.now();
  const postsResponse = makeRequest('GET', `${BASE_URL}/api/posts?page=1&limit=20`);
  const postListLatencyMs = Date.now() - postListStart;
  postListLatency.add(postListLatencyMs);
  
  // Check for authentication errors
  if (postsResponse.status === 401) {
    if (__ITER === 0) {
      console.error('❌ ERROR: 401 Unauthorized - Invalid or expired token!');
      console.error('   Get a fresh token from browser DevTools and update $env:AUTH_TOKEN');
    }
    criticalWorkflowSuccess.add(0);
    sleep(1);
    return;
  }
  
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
  const postViewStart = Date.now();
  const postResponse = makeRequest('GET', `${BASE_URL}/api/posts/${postId}`);
  const postViewLatencyMs = Date.now() - postViewStart;
  postViewLatency.add(postViewLatencyMs);
  
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
    if (__ITER < 5) {
      console.error(`❌ Post fetch failed: Status ${postResponse.status}, Body: ${postResponse.body.substring(0, 200)}`);
    }
    sleep(1);
    return;
  }

  // Step 3b: Fetch first 10 comments for the post
  const commentsStart = Date.now();
  const commentsResponse = makeRequest('GET', `${BASE_URL}/api/comments/post/${postId}`);
  const commentsLatencyMs = Date.now() - commentsStart;
  commentsLatency.add(commentsLatencyMs);
  
  const commentsCheck = check(commentsResponse, {
    'comments status is 200': (r) => r.status === 200,
    'comments response is valid': (r) => {
      try {
        const data = JSON.parse(r.body);
        // Comments can be empty array, that's valid
        return data.comments !== undefined;
      } catch (e) {
        if (__ITER < 5) {
          console.error(`❌ Comments parse error: ${e}, Body: ${r.body.substring(0, 200)}`);
        }
        return false;
      }
    },
  });

  if (!commentsCheck && __ITER < 5) {
    console.error(`❌ Comments fetch failed: Status ${commentsResponse.status}, Body: ${commentsResponse.body.substring(0, 200)}`);
  }

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
    console.log(`Trial ${__ITER}: Post ${postId} - Total: ${totalLatency}ms (Post: ${postViewLatencyMs}ms, Comments: ${commentsLatencyMs}ms) - Success: ${postCheck && commentsCheck}`);
  }

  sleep(1); // Think time between requests
}

// Track failure reasons
const failureReasons = {
  postList: 0,
  postView: 0,
  comments: 0,
  other: 0
};

// Summary function to print detailed results
export function handleSummary(data) {
  const criticalLatency = data.metrics?.critical_workflow_latency_ms;
  const criticalSuccess = data.metrics?.critical_workflow_success;
  const httpReqs = data.metrics?.http_reqs;
  const httpFailed = data.metrics?.http_req_failed;
  const httpStatus = data.metrics?.http_req_duration;
  const postList = data.metrics?.post_list_latency_ms;
  const postView = data.metrics?.post_view_latency_ms;
  const comments = data.metrics?.comments_latency_ms;
  
  // Handle case where metrics might not exist (all requests failed)
  const avgLatency = criticalLatency?.values?.avg || 0;
  const minLatency = criticalLatency?.values?.min || 0;
  const maxLatency = criticalLatency?.values?.max || 0;
  const medLatency = criticalLatency?.values?.med || 0;
  const p95Latency = criticalLatency?.values?.['p(95)'] || 0;
  const p99Latency = criticalLatency?.values?.['p(99)'] || 0;
  const successRate = criticalSuccess?.values?.rate || 0;
  const totalReqs = httpReqs?.values?.count || 0;
  const failedRate = httpFailed?.values?.rate || 0;
  
  // Bottleneck analysis
  const postListAvg = postList?.values?.avg || 0;
  const postListP95 = postList?.values?.['p(95)'] || 0;
  const postViewAvg = postView?.values?.avg || 0;
  const postViewP95 = postView?.values?.['p(95)'] || 0;
  const commentsAvg = comments?.values?.avg || 0;
  const commentsP95 = comments?.values?.['p(95)'] || 0;
  
  // Identify bottleneck
  let bottleneck = 'Unknown';
  let bottleneckPct = 0;
  if (postViewAvg > commentsAvg) {
    bottleneck = 'Post View';
    bottleneckPct = (postViewAvg / avgLatency) * 100;
  } else if (commentsAvg > postViewAvg) {
    bottleneck = 'Comments Fetch';
    bottleneckPct = (commentsAvg / avgLatency) * 100;
  } else {
    bottleneck = 'Balanced';
  }
  
  return {
    'stdout': `
========================================
CRITICAL WORKFLOW TEST RESULTS
========================================
Workflow: Viewing a Post + First 10 Comments
Trials: 100

OVERALL LATENCY METRICS:
  Average: ${avgLatency.toFixed(2)}ms
  Min: ${minLatency}ms
  Max: ${maxLatency}ms
  P50: ${medLatency.toFixed(2)}ms
  P95: ${p95Latency.toFixed(2)}ms
  P99: ${p99Latency.toFixed(2)}ms

BOTTLENECK ANALYSIS:
  🔍 Primary Bottleneck: ${bottleneck} (${bottleneckPct.toFixed(1)}% of total time)
  
  Post List (warmup):
    Average: ${postListAvg.toFixed(2)}ms
    P95: ${postListP95.toFixed(2)}ms
  
  Post View (critical):
    Average: ${postViewAvg.toFixed(2)}ms
    P95: ${postViewP95.toFixed(2)}ms
    % of Total: ${((postViewAvg / avgLatency) * 100).toFixed(1)}%
  
  Comments Fetch (critical):
    Average: ${commentsAvg.toFixed(2)}ms
    P95: ${commentsP95.toFixed(2)}ms
    % of Total: ${((commentsAvg / avgLatency) * 100).toFixed(1)}%

SUCCESS METRICS:
  Success Rate: ${(successRate * 100).toFixed(2)}%
  Total Requests: ${totalReqs}
  Failed Requests: ${(failedRate * 100).toFixed(2)}%

THRESHOLDS:
  ${avgLatency < 500 ? '✓' : '✗'} Average < 500ms: ${avgLatency < 500 ? 'PASS' : 'FAIL'}
  ${p95Latency < 1000 ? '✓' : '✗'} P95 < 1000ms: ${p95Latency < 1000 ? 'PASS' : 'FAIL'}
  ${p99Latency < 2000 ? '✓' : '✗'} P99 < 2000ms: ${p99Latency < 2000 ? 'PASS' : 'FAIL'}
  ${successRate > 0.95 ? '✓' : '✗'} Success Rate > 95%: ${successRate > 0.95 ? 'PASS' : 'FAIL'}

${failedRate > 0.5 ? '⚠️  WARNING: High failure rate detected. Make sure the server is running!' : ''}

RECOMMENDATIONS:
${postViewAvg > 300 ? '  ⚠️  Post View is slow - optimize post fetching queries' : ''}
${commentsAvg > 300 ? '  ⚠️  Comments Fetch is slow - optimize comment queries and vote aggregation' : ''}
${postListAvg > 500 ? '  ⚠️  Post List is slow - consider pagination or caching' : ''}

ERROR ANALYSIS:
  HTTP Status Codes:
${httpStatus ? `    2xx: ${((httpStatus.values?.['http_reqs{status:2xx}']?.count || 0) / totalReqs * 100).toFixed(1)}%` : '    N/A'}
${httpStatus ? `    4xx: ${((httpStatus.values?.['http_reqs{status:4xx}']?.count || 0) / totalReqs * 100).toFixed(1)}%` : '    N/A'}
${httpStatus ? `    5xx: ${((httpStatus.values?.['http_reqs{status:5xx}']?.count || 0) / totalReqs * 100).toFixed(1)}%` : '    N/A'}
  
  ${successRate < 0.95 ? '⚠️  Low success rate detected! Check server logs for errors.' : ''}
  ${failedRate > 0.01 ? '⚠️  High HTTP failure rate! Check network connectivity and server status.' : ''}
========================================
    `,
  };
}

