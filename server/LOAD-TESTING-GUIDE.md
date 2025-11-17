# Load Testing Guide - Critical Workflow

## Overview

This guide explains how to run load tests for the **Critical Workflow: Viewing a Post + First 10 Comments** with 100 trials to measure latency and responsiveness.

## Responsiveness KPI

**Metric:** Average Latency for Critical Workflow (Viewing a Post + First 10 Comments)

**Method of Measurement:**
- Conducted 100 trials using K6 load testing tool
- Workflow: User loads a post → Fetches first 10 comments
- Measured backend response time (server) excluding front-end rendering

## Prerequisites

1. **Install K6:**
   ```bash
   # Windows (Chocolatey)
   choco install k6
   
   # macOS
   brew install k6
   
   # Linux
   sudo gpg -k
   sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
   echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
   sudo apt-get update
   sudo apt-get install k6
   ```

2. **Get Authentication Token:**
   - Log in to the application in your browser
   - Open DevTools (F12)
   - Go to Application > Local Storage
   - Copy the `access_token` value

## Quick Start

### Windows (PowerShell)
```powershell
# Set environment variables
$env:BASE_URL = "http://localhost:3001"
$env:AUTH_TOKEN = "your_token_here"

# Run the critical workflow test (100 trials)
npm run loadtest:critical
```

### Linux/macOS
```bash
# Set environment variables
export BASE_URL=http://localhost:3001
export AUTH_TOKEN=your_token_here

# Run the critical workflow test (100 trials)
npm run loadtest:critical
```

## Test Scenarios

### 1. Critical Workflow Test (100 Trials)
This is the main test for the responsiveness KPI:
```bash
npm run loadtest:critical
```

**What it measures:**
- Latency for loading a post
- Latency for fetching first 10 comments
- Total workflow latency
- Success rate

**Success Criteria:**
- Average latency < 500ms
- P95 latency < 1000ms
- P99 latency < 2000ms
- Success rate > 95%

### 2. Baseline Load Test
```bash
npm run loadtest:baseline
```
- 10 concurrent users
- 5 minute duration
- Normal load conditions

### 3. Stress Test
```bash
npm run loadtest:stress
```
- 50 concurrent users
- 10 minute duration
- High load conditions

## Understanding Results

The test output includes:

### Latency Metrics
- **Average:** Mean response time across all requests
- **Min/Max:** Fastest and slowest requests
- **P50 (Median):** 50% of requests are faster than this
- **P95:** 95% of requests are faster than this
- **P99:** 99% of requests are faster than this

### Success Metrics
- **Success Rate:** Percentage of successful requests
- **Error Rate:** Percentage of failed requests

### Example Output
```
========================================
CRITICAL WORKFLOW TEST RESULTS
========================================
Workflow: Viewing a Post + First 10 Comments
Trials: 100

LATENCY METRICS:
  Average: 342.50ms
  Min: 120ms
  Max: 890ms
  P50: 310.00ms
  P95: 650.00ms
  P99: 820.00ms

SUCCESS METRICS:
  Success Rate: 98.00%
  Total Requests: 200
  Failed Requests: 2.00%

THRESHOLDS:
  ✓ Average < 500ms: PASS
  ✓ P95 < 1000ms: PASS
  ✓ P99 < 2000ms: PASS
  ✓ Success Rate > 95%: PASS
========================================
```

## Troubleshooting

### 401 Unauthorized Errors
- Verify AUTH_TOKEN is set correctly
- Token may have expired - get a new one from browser
- Check that token is not wrapped in quotes

### Connection Refused
- Ensure server is running on BASE_URL
- Check firewall settings
- Verify port is correct (default: 3001)

### High Latency
- Check database query performance
- Review server logs for slow queries
- Consider adding database indexes
- Check server CPU/memory usage

### High Error Rate
- Check server logs for errors
- Verify database connection
- Check for rate limiting
- Review API endpoint implementations

## Advanced Usage

### Custom Configuration
Edit `tests/load-test-critical-workflow.js` to modify:
- Number of iterations
- Virtual users (VUs)
- Thresholds
- Test duration

### Verbose Output
```bash
VERBOSE=true npm run loadtest:critical
```

### Save Results to File
```bash
k6 run --iterations 100 --out json=results.json tests/load-test-critical-workflow.js
```

## Performance Optimization Tips

If tests fail thresholds:

1. **Database Optimization:**
   - Add indexes on frequently queried columns
   - Optimize JOIN queries
   - Use database connection pooling

2. **API Optimization:**
   - Implement response caching
   - Use pagination efficiently
   - Minimize data transfer

3. **Server Optimization:**
   - Increase server resources
   - Use load balancing
   - Implement request queuing

## Continuous Monitoring

Run tests regularly to:
- Track performance trends
- Identify regressions
- Validate optimizations
- Ensure SLA compliance

