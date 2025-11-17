# Quick test script to verify environment variables and server connection

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Quick Load Test Setup Verification" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# Check server
Write-Host "1. Checking server connection..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -Method GET -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "   ✓ Server is running on port 5000" -ForegroundColor Green
    }
} catch {
    Write-Host "   ✗ Server is NOT running on port 5000" -ForegroundColor Red
    Write-Host "   Start it with: cd server; npm run dev" -ForegroundColor Yellow
    exit 1
}

# Check BASE_URL
Write-Host "2. Checking BASE_URL..." -ForegroundColor Yellow
if ($env:BASE_URL) {
    Write-Host "   ✓ BASE_URL is set: $env:BASE_URL" -ForegroundColor Green
} else {
    Write-Host "   ⚠ BASE_URL not set, using default: http://localhost:5000" -ForegroundColor Yellow
    $env:BASE_URL = "http://localhost:5000"
}

# Check AUTH_TOKEN
Write-Host "3. Checking AUTH_TOKEN..." -ForegroundColor Yellow
if ($env:AUTH_TOKEN) {
    $tokenPreview = $env:AUTH_TOKEN.Substring(0, [Math]::Min(30, $env:AUTH_TOKEN.Length))
    Write-Host "   ✓ AUTH_TOKEN is set (length: $($env:AUTH_TOKEN.Length), preview: $tokenPreview...)" -ForegroundColor Green
    
    # Test the token
    Write-Host "4. Testing authentication..." -ForegroundColor Yellow
    try {
        $headers = @{
            "Authorization" = "Bearer $env:AUTH_TOKEN"
            "Content-Type" = "application/json"
        }
        $testUrl = "$env:BASE_URL/api/posts?page=1&limit=1"
        $testResponse = Invoke-WebRequest -Uri $testUrl -Method GET -Headers $headers -UseBasicParsing
        if ($testResponse.StatusCode -eq 200) {
            Write-Host "   ✓ Token is valid and working!" -ForegroundColor Green
            Write-Host ""
            Write-Host "✅ All checks passed! You can now run:" -ForegroundColor Green
            Write-Host "   npm run loadtest:critical" -ForegroundColor Cyan
        } else {
            Write-Host "   ✗ Token test failed with status: $($testResponse.StatusCode)" -ForegroundColor Red
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -eq 401) {
            Write-Host "   ✗ Token is invalid or expired (401 Unauthorized)" -ForegroundColor Red
            Write-Host "   Get a fresh token from browser DevTools > Application > Local Storage > access_token" -ForegroundColor Yellow
        } else {
            Write-Host "   ✗ Error testing token: $_" -ForegroundColor Red
        }
    }
} else {
    Write-Host "   ✗ AUTH_TOKEN is NOT set!" -ForegroundColor Red
    Write-Host ""
    Write-Host "   To get your token:" -ForegroundColor Yellow
    Write-Host "   1. Open your BlueIt app in browser (make sure you're logged in)" -ForegroundColor White
    Write-Host "   2. Press F12 to open DevTools" -ForegroundColor White
    Write-Host "   3. Go to Application tab > Local Storage > your site URL" -ForegroundColor White
    Write-Host "   4. Find 'access_token' and copy the value" -ForegroundColor White
    Write-Host "   5. Run: `$env:AUTH_TOKEN = 'paste_token_here'" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""

