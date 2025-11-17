# Load Testing Suite for BlueIt

## Overview

This load testing suite measures the **Critical Workflow: Viewing a Post + First 10 Comments** with 100 trials to assess latency and responsiveness.

## Prerequisites

Install K6:
```bash
# Windows (using Chocolatey)
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

## Setup

1. **Get Authentication Token:**
   - Log in to the application
   - Get your auth token from browser DevTools (Application > Local Storage > `access_token`)

2. **Set Environment Variables:**
   ```bash
   export BASE_URL=http://localhost:3001
   export AUTH_TOKEN=your_token_here
   ```

   Or on Windows PowerShell:
   ```powershell
   $env:BASE_URL="http://localhost:3001"
   $env:AUTH_TOKEN="your_token_here"
   ```

## Running Tests

### Critical Workflow Test (100 Trials)
This is the main test that measures the responsiveness KPI:
```bash
k6 run --iterations 100 k6-load-test.js
```

### Baseline Load Test
```bash
k6 run --vus 10 --duration 5m k6-load-test.js
```

### Stress Test
```bash
k6 run --vus 50 --duration 10m k6-load-test.js
```

### Spike Test
```bash
k6 run --vus 100 --duration 2m k6-load-test.js
```

## Test Workflow

The critical workflow test measures:

1. **Step 1:** User loads a post (`GET /api/posts/:id`)
2. **Step 2:** Fetches first 10 comments (`GET /api/comments/post/:postId`)

**Measurement:** Backend response time (server) excluding front-end rendering.

## Success Criteria

- **Average Latency:** < 500ms
- **P95 Latency:** < 1000ms  
- **P99 Latency:** < 2000ms
- **Error Rate:** < 1%
- **Success Rate:** > 95%

## Output

The test will output:
- Total requests and response times
- Success/failure rates
- Latency percentiles (p50, p95, p99)
- Error rates
- Custom metrics for the critical workflow

## Interpreting Results

- **Green:** All thresholds met - system is performing well
- **Yellow:** Some thresholds exceeded - investigate bottlenecks
- **Red:** Multiple thresholds failed - system needs optimization

## Troubleshooting

1. **401 Unauthorized:** Check that AUTH_TOKEN is set correctly
2. **Connection refused:** Ensure server is running on BASE_URL
3. **High latency:** Check database queries, add indexes if needed
4. **High error rate:** Check server logs for errors

