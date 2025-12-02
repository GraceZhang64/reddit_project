# BlueIt Concurrent User Testing Script
# Tests the system with 5-10 simultaneous users

param(
    [string]$BaseUrl = "http://localhost:5000",
    [int]$UserCount = 5,
    [int]$DurationMinutes = 2
)

Write-Host "👥 BlueIt Concurrent User Testing" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host "Testing $UserCount concurrent users for $DurationMinutes minutes" -ForegroundColor Gray
Write-Host "Target: $BaseUrl" -ForegroundColor Gray

# Check if k6 is installed
$k6Installed = Get-Command k6 -ErrorAction SilentlyContinue
if (-not $k6Installed) {
    Write-Host "❌ k6 is not installed. Installing..." -ForegroundColor Yellow

    # Install k6 (requires Chocolatey or manual install)
    try {
        choco install k6
        Write-Host "✅ k6 installed successfully" -ForegroundColor Green
    }
    catch {
        Write-Host "❌ Failed to install k6 automatically" -ForegroundColor Red
        Write-Host "Please install k6 manually from: https://k6.io/docs/get-started/installation/" -ForegroundColor Yellow
        exit 1
    }
}

# Create a custom k6 test script for concurrent users
$testScript = @"
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '30s', target: $UserCount },  // Ramp up to $UserCount users
    { duration: '${DurationMinutes}m', target: $UserCount }, // Stay at $UserCount users
    { duration: '30s', target: 0 },     // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'], // 95% of requests should be below 1s
    http_req_failed: ['rate<0.1'],     // Error rate should be below 10%
  },
};

const BASE_URL = '$BaseUrl';

export default function () {
  // Simulate a typical user journey

  // 1. Health check
  let response = http.get(`${BASE_URL}/api/health`);
  check(response, { 'health check status is 200': (r) => r.status === 200 });

  // 2. Get communities
  response = http.get(`${BASE_URL}/api/communities`);
  check(response, { 'communities status is 200': (r) => r.status === 200 });

  // 3. Get posts
  response = http.get(`${BASE_URL}/api/posts`);
  check(response, { 'posts status is 200': (r) => r.status === 200 });

  // 4. Get hot posts
  response = http.get(`${BASE_URL}/api/posts/hot`);
  check(response, { 'hot posts status is 200': (r) => r.status === 200 });

  // 5. Search posts
  response = http.get(`${BASE_URL}/api/posts/search?q=test`);
  check(response, { 'search status is 200': (r) => r.status === 200 });

  // Random sleep between 1-5 seconds to simulate real user behavior
  sleep(Math.random() * 4 + 1);
}
"@

# Write the test script to a temporary file
$testScriptPath = "concurrent-test.js"
$testScript | Out-File -FilePath $testScriptPath -Encoding UTF8

Write-Host "`n🚀 Starting concurrent user test..." -ForegroundColor Green
Write-Host "This will simulate $UserCount users for $DurationMinutes minutes" -ForegroundColor Gray
Write-Host "Press Ctrl+C to stop early" -ForegroundColor Yellow

try {
    # Run the k6 test
    & k6 run $testScriptPath
    $exitCode = $LASTEXITCODE

    if ($exitCode -eq 0) {
        Write-Host "`n✅ Concurrent user test completed successfully!" -ForegroundColor Green
        Write-Host "Your system can handle $UserCount concurrent users" -ForegroundColor Green
    } else {
        Write-Host "`n⚠️  Concurrent user test completed with warnings" -ForegroundColor Yellow
        Write-Host "Check the output above for performance issues" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "`n❌ Concurrent user test failed: $($_.Exception.Message)" -ForegroundColor Red
}
finally {
    # Clean up
    if (Test-Path $testScriptPath) {
        Remove-Item $testScriptPath
    }
}

# Additional manual testing instructions
Write-Host "`n📱 Manual Concurrent Testing Instructions:" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "For more realistic testing, also try:" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "1. Open the app on $UserCount different devices/browsers" -ForegroundColor White
Write-Host "2. Have users simultaneously:" -ForegroundColor White
Write-Host "   - Create posts" -ForegroundColor White
Write-Host "   - Vote on the same posts" -ForegroundColor White
Write-Host "   - Comment on posts" -ForegroundColor White
Write-Host "   - Refresh feeds" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "3. Monitor browser developer tools for errors" -ForegroundColor White
Write-Host "4. Check server logs for any issues" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "Expected Results:" -ForegroundColor Green
Write-Host "- No crashes or 500 errors" -ForegroundColor Green
Write-Host "- Real-time updates work" -ForegroundColor Green
Write-Host "- Database handles concurrent writes" -ForegroundColor Green
Write-Host "- Vote counts update correctly" -ForegroundColor Green
