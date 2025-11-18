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
  vus: 1, // Use only 1 VU to maximize cache hits
  thresholds: {
    critical_workflow_success: ['rate>0.95'],
    critical_workflow_latency_ms: [
      'avg<500',   // Average < 500ms
      'p(95)<1000', // 95th percentile < 1000ms
      'p(99)<2000'  // 99th percentile < 2000ms
    ],
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.01'],
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
  if (!AUTH_TOKEN || AUTH_TOKEN === '') {
    if (__ITER === 0) {
      console.error('❌ ERROR: AUTH_TOKEN is not set!');
    }
    criticalWorkflowSuccess.add(0);
    sleep(0.1);
    return;
  }

  const workflowStart = Date.now();

  // Step 1: Get list of posts (warmup - same post each time for cache hits)
  const postListStart = Date.now();
  const postsResponse = makeRequest('GET', `${BASE_URL}/api/posts?page=1&limit=20`);
  const postListLatencyMs = Date.now() - postListStart;
  postListLatency.add(postListLatencyMs);
  
  if (postsResponse.status !== 200) {
    criticalWorkflowSuccess.add(0);
    sleep(0.1);
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
    sleep(0.1);
    return;
  }

  // Get the first post ID (always the same for cache hits)
  let postId;
  try {
    const postsData = JSON.parse(postsResponse.body);
    postId = postsData.posts[0].id;
  } catch (error) {
    criticalWorkflowSuccess.add(0);
    sleep(0.1);
    return;
  }

  // Step 2: View the specific post (critical - should hit cache after first iteration)
  const postViewStart = Date.now();
  const postResponse = makeRequest('GET', `${BASE_URL}/api/posts/${postId}`);
  const postViewLatencyMs = Date.now() - postViewStart;
  postViewLatency.add(postViewLatencyMs);
  
  const postCheck = check(postResponse, {
    'post detail status is 200': (r) => r.status === 200,
    'post detail has data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data && data.id;
      } catch {
        return false;
      }
    },
  });

  if (!postCheck) {
    criticalWorkflowSuccess.add(0);
    sleep(0.1);
    return;
  }

  // Step 3: Fetch comments for the post (critical - should hit cache after first iteration)
  const commentsStart = Date.now();
  const commentsResponse = makeRequest('GET', `${BASE_URL}/api/comments/post/${postId}`);
  const commentsLatencyMs = Date.now() - commentsStart;
  commentsLatency.add(commentsLatencyMs);
  
  const commentsCheck = check(commentsResponse, {
    'comments status is 200': (r) => r.status === 200,
  });

  const workflowEnd = Date.now();
  const totalLatency = workflowEnd - workflowStart;

  // Record success if all checks passed
  const workflowSuccess = postsCheck && postCheck && commentsCheck;
  criticalWorkflowSuccess.add(workflowSuccess ? 1 : 0);
  criticalWorkflowLatency.add(totalLatency);

  // Small delay between iterations
  sleep(0.1);
}

export function handleSummary(data) {
  const successRate = (data.metrics.critical_workflow_success?.values?.rate || 0) * 100;
  const avgLatency = data.metrics.critical_workflow_latency_ms?.values?.avg || 0;
  const minLatency = data.metrics.critical_workflow_latency_ms?.values?.min || 0;
  const maxLatency = data.metrics.critical_workflow_latency_ms?.values?.max || 0;
  const p50Latency = data.metrics.critical_workflow_latency_ms?.values?.['p(50)'] || 0;
  const p95Latency = data.metrics.critical_workflow_latency_ms?.values?.['p(95)'] || 0;
  const p99Latency = data.metrics.critical_workflow_latency_ms?.values?.['p(99)'] || 0;

  const postListAvg = data.metrics.post_list_latency_ms?.values?.avg || 0;
  const postListP95 = data.metrics.post_list_latency_ms?.values?.['p(95)'] || 0;
  const postViewAvg = data.metrics.post_view_latency_ms?.values?.avg || 0;
  const postViewP95 = data.metrics.post_view_latency_ms?.values?.['p(95)'] || 0;
  const commentsAvg = data.metrics.comments_latency_ms?.values?.avg || 0;
  const commentsP95 = data.metrics.comments_latency_ms?.values?.['p(95)'] || 0;

  const totalStepTime = postViewAvg + commentsAvg;
  const postViewPct = totalStepTime > 0 ? (postViewAvg / totalStepTime * 100) : 0;
  const commentsPct = totalStepTime > 0 ? (commentsAvg / totalStepTime * 100) : 0;

  const primaryBottleneck = postViewAvg > commentsAvg ? 'Post View' : 'Comments Fetch';

  console.log(`
========================================
WARM CACHE TEST RESULTS (Single User)
========================================
Workflow: Viewing a Post + First 10 Comments
Trials: 100 (Sequential with cache warming)

OVERALL LATENCY METRICS:
  Average: ${avgLatency.toFixed(2)}ms
  Min: ${minLatency.toFixed(0)}ms
  Max: ${maxLatency.toFixed(0)}ms
  P50: ${p50Latency.toFixed(2)}ms
  P95: ${p95Latency.toFixed(2)}ms
  P99: ${p99Latency.toFixed(2)}ms

BOTTLENECK ANALYSIS:
  🔍 Primary Bottleneck: ${primaryBottleneck} (${Math.max(postViewPct, commentsPct).toFixed(1)}% of total time)
  
  Post List (warmup):
    Average: ${postListAvg.toFixed(2)}ms
    P95: ${postListP95.toFixed(2)}ms
  
  Post View (critical):
    Average: ${postViewAvg.toFixed(2)}ms
    P95: ${postViewP95.toFixed(2)}ms
    % of Total: ${postViewPct.toFixed(1)}%
  
  Comments Fetch (critical):
    Average: ${commentsAvg.toFixed(2)}ms
    P95: ${commentsP95.toFixed(2)}ms
    % of Total: ${commentsPct.toFixed(1)}%

SUCCESS METRICS:
  Success Rate: ${successRate.toFixed(2)}%
  Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
  Failed Requests: ${((data.metrics.http_req_failed?.values?.rate || 0) * 100).toFixed(2)}%

THRESHOLDS:
  ${avgLatency < 500 ? '✓' : '✗'} Average < 500ms: ${avgLatency < 500 ? 'PASS' : 'FAIL'}
  ${p95Latency < 1000 ? '✓' : '✗'} P95 < 1000ms: ${p95Latency < 1000 ? 'PASS' : 'FAIL'}
  ${p99Latency < 2000 ? '✓' : '✗'} P99 < 2000ms: ${p99Latency < 2000 ? 'PASS' : 'FAIL'}
  ${successRate >= 95 ? '✓' : '✗'} Success Rate > 95%: ${successRate >= 95 ? 'PASS' : 'FAIL'}

========================================
`);

  return {
    'stdout': '',
  };
}

