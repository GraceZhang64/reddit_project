# Load Testing Script for BlueIt (PowerShell)
# This script runs the critical workflow test with 100 trials

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "BlueIt Load Testing Suite" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check if K6 is installed
try {
    $null = Get-Command k6 -ErrorAction Stop
} catch {
    Write-Host "❌ K6 is not installed. Please install it first:" -ForegroundColor Red
    Write-Host "   choco install k6" -ForegroundColor Yellow
    Write-Host "   Or download from: https://k6.io/docs/getting-started/installation/" -ForegroundColor Yellow
    exit 1
}

# Check for required environment variables
if (-not $env:BASE_URL) {
    Write-Host "⚠️  BASE_URL not set, using default: http://localhost:3001" -ForegroundColor Yellow
    $env:BASE_URL = "http://localhost:3001"
}

if (-not $env:AUTH_TOKEN) {
    Write-Host "❌ AUTH_TOKEN is required!" -ForegroundColor Red
    Write-Host "   Get your token from browser DevTools > Application > Local Storage > access_token" -ForegroundColor Yellow
    Write-Host "   Then run: `$env:AUTH_TOKEN='your_token_here'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Configuration:" -ForegroundColor Green
Write-Host "   BASE_URL: $env:BASE_URL"
Write-Host "   AUTH_TOKEN: $($env:AUTH_TOKEN.Substring(0, [Math]::Min(20, $env:AUTH_TOKEN.Length)))..."
Write-Host ""

Write-Host "🚀 Starting Critical Workflow Test (100 trials)..." -ForegroundColor Green
Write-Host ""

# Run the critical workflow test
k6 run --iterations 100 tests/load-test-critical-workflow.js

Write-Host ""
Write-Host "✅ Load testing completed!" -ForegroundColor Green

