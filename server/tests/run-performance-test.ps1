# Performance Testing Script for Reddit Clone
# Generates comprehensive performance metrics

Write-Host "`n🚀 REDDIT CLONE - PERFORMANCE TEST SUITE" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# Check if AUTH_TOKEN is set
if (-not $env:AUTH_TOKEN) {
    Write-Host "❌ ERROR: AUTH_TOKEN environment variable is not set!" -ForegroundColor Red
    Write-Host "   Please set it using: `$env:AUTH_TOKEN = `"your_token_here`"`n" -ForegroundColor Yellow
    exit 1
}

Write-Host "📊 Running load test with 100 iterations..." -ForegroundColor Green
Write-Host "   Target: http://localhost:5000" -ForegroundColor Gray
Write-Host "   Workflow: View Post + First 10 Comments`n" -ForegroundColor Gray

# Run K6 load test and capture output
$output = k6 run --out json=performance-results.json tests/load-test-critical-workflow.js 2>&1

# Display the output
$output | ForEach-Object { Write-Host $_ }

Write-Host "`n✅ Performance test complete!" -ForegroundColor Green
Write-Host "📈 Results saved to: performance-results.json`n" -ForegroundColor Cyan

