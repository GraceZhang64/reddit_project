# Test Username-Based Authentication
# Tests the new username/password login system

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$TestUsername = "testuser123",
    [string]$TestPassword = "TestPass123!",
    [string]$TestEmail = "testuser123@example.com"
)

Write-Host "🧪 Testing Username-Based Authentication" -ForegroundColor Cyan
Write-Host "===========================================" -ForegroundColor Cyan
Write-Host "Testing username/password instead of email/password" -ForegroundColor Gray
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray

# Function to make HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$AuthToken = $null
    )

    $headers = @{
        "Content-Type" = "application/json"
    }

    if ($AuthToken) {
        $headers["Authorization"] = "Bearer $AuthToken"
    }

    $params = @{
        Method = $Method
        Uri = "$BaseUrl/api/$Endpoint"
        Headers = $headers
    }

    if ($Body) {
        $params.Body = ($Body | ConvertTo-Json)
    }

    try {
        $response = Invoke-WebRequest @params
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = ($response.Content | ConvertFrom-Json)
            Headers = $response.Headers
        }
    }
    catch {
        return @{
            Success = $false
            StatusCode = $_.Exception.Response.StatusCode
            Error = $_.Exception.Message
        }
    }
}

$testResults = @()

function Test-Step {
    param(
        [string]$Name,
        [scriptblock]$Test
    )

    Write-Host "`n🧪 $Name" -ForegroundColor Yellow
    try {
        $result = & $Test
        if ($result.Success) {
            Write-Host "✅ PASS" -ForegroundColor Green
            $testResults += @{ Name = $Name; Status = "PASS"; Details = $result.Details }
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
            Write-Host "   Error: $($result.Error)" -ForegroundColor Red
            $testResults += @{ Name = $Name; Status = "FAIL"; Details = $result.Error }
        }
    }
    catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Name = $Name; Status = "ERROR"; Details = $_.Exception.Message }
    }
}

# 1. Test API Health
Test-Step "API Health Check" {
    $result = Invoke-ApiRequest -Method GET -Endpoint "health"
    if ($result.Success) {
        return @{ Success = $true; Details = "API is responding" }
    } else {
        return @{ Success = $false; Error = "API health check failed" }
    }
}

# 2. Test Username Uniqueness (should fail with existing username)
Test-Step "Username Uniqueness Validation" {
    $registerData = @{
        username = "admin"  # Assuming this exists from seed data
        email = "duplicate@example.com"
        password = "TestPass123!"
        confirmPassword = "TestPass123!"
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "auth/register" -Body $registerData

    if (-not $result.Success -and $result.StatusCode -eq 400 -and $result.Error -match "Username already taken") {
        return @{ Success = $true; Details = "Username uniqueness validation working" }
    } else {
        return @{ Success = $false; Error = "Username uniqueness validation failed" }
    }
}

# 3. Test Invalid Username Format
Test-Step "Invalid Username Format" {
    $registerData = @{
        username = "us"  # Too short
        email = "short@example.com"
        password = "TestPass123!"
        confirmPassword = "TestPass123!"
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "auth/register" -Body $registerData

    if (-not $result.Success -and $result.StatusCode -eq 400) {
        return @{ Success = $true; Details = "Username format validation working" }
    } else {
        return @{ Success = $false; Error = "Username format validation failed" }
    }
}

# 4. Test Valid Registration
Test-Step "Valid User Registration" {
    $registerData = @{
        username = $TestUsername
        email = $TestEmail
        password = $TestPassword
        confirmPassword = $TestPassword
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "auth/register" -Body $registerData

    if ($result.Success -and $result.Content.access_token) {
        $script:authToken = $result.Content.access_token
        return @{ Success = $true; Details = "User registered successfully" }
    } else {
        return @{ Success = $false; Error = "Registration failed: $($result.Error)" }
    }
}

# 5. Test Login with Username
Test-Step "Login with Username" {
    $loginData = @{
        username = $TestUsername
        password = $TestPassword
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "auth/login" -Body $loginData

    if ($result.Success -and $result.Content.access_token) {
        $script:loginToken = $result.Content.access_token
        return @{ Success = $true; Details = "Login with username successful" }
    } else {
        return @{ Success = $false; Error = "Login failed: $($result.Error)" }
    }
}

# 6. Test Invalid Username Login
Test-Step "Invalid Username Login" {
    $loginData = @{
        username = "nonexistentuser12345"
        password = $TestPassword
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "auth/login" -Body $loginData

    if (-not $result.Success -and $result.StatusCode -eq 401) {
        return @{ Success = $true; Details = "Invalid username rejected correctly" }
    } else {
        return @{ Success = $false; Error = "Invalid username login should fail" }
    }
}

# 7. Test Invalid Password Login
Test-Step "Invalid Password Login" {
    $loginData = @{
        username = $TestUsername
        password = "wrongpassword"
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "auth/login" -Body $loginData

    if (-not $result.Success -and $result.StatusCode -eq 401) {
        return @{ Success = $true; Details = "Invalid password rejected correctly" }
    } else {
        return @{ Success = $false; Error = "Invalid password login should fail" }
    }
}

# 8. Test Get Current User
Test-Step "Get Current User" {
    $result = Invoke-ApiRequest -Method GET -Endpoint "auth/me" -AuthToken $script:loginToken

    if ($result.Success -and $result.Content.username -eq $TestUsername) {
        return @{ Success = $true; Details = "Current user retrieved correctly" }
    } else {
        return @{ Success = $false; Error = "Failed to get current user: $($result.Error)" }
    }
}

# Summary
Write-Host "`n📊 Authentication Test Results" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -ne "PASS" }).Count
$total = $testResults.Count

Write-Host "Tests passed: $passed/$total" -ForegroundColor $(if ($passed -eq $total) { "Green" } elseif ($passed / $total -gt 0.7) { "Yellow" } else { "Red" })

if ($passed -eq $total) {
    Write-Host "`n🎉 All authentication tests passed!" -ForegroundColor Green
    Write-Host "Username/password authentication is working correctly." -ForegroundColor Green
} elseif ($passed / $total -gt 0.7) {
    Write-Host "`n⚠️  Most tests passed. Check the failed tests above." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Many tests failed. Authentication may not be working properly." -ForegroundColor Red
}

# Detailed results
Write-Host "`n📋 Test Details:" -ForegroundColor Cyan
foreach ($test in $testResults) {
    $color = switch ($test.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "ERROR" { "Yellow" }
    }
    Write-Host "  $($test.Status): $($test.Name)" -ForegroundColor $color
    if ($test.Status -ne "PASS") {
        Write-Host "    $($test.Details)" -ForegroundColor Gray
    }
}

Write-Host "`n🔑 Test Credentials Used:" -ForegroundColor Cyan
Write-Host "  Username: $TestUsername" -ForegroundColor White
Write-Host "  Email: $TestEmail" -ForegroundColor White
Write-Host "  Password: $TestPassword" -ForegroundColor White
