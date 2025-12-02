# BlueIt Beta Feature Testing Script
# Comprehensive end-to-end testing for all core features

param(
    [string]$BaseUrl = "http://localhost:5000",
    [string]$Email = "test@example.com",
    [string]$Password = "TestPass123!",
    [string]$Username = "testuser"
)

Write-Host "🧪 BlueIt Beta Feature Testing" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Base URL: $BaseUrl" -ForegroundColor Gray
Write-Host "Test User: $Email" -ForegroundColor Gray

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

# Test results tracking
$testResults = @()
$authToken = $null

function Test-Feature {
    param(
        [string]$Name,
        [scriptblock]$Test
    )

    Write-Host "`n🧪 Testing: $Name" -ForegroundColor Yellow
    try {
        $result = & $Test
        if ($result.Success) {
            Write-Host "✅ PASS" -ForegroundColor Green
            $testResults += @{ Name = $Name; Status = "PASS"; Details = $result.Details }
        } else {
            Write-Host "❌ FAIL: $($result.Error)" -ForegroundColor Red
            $testResults += @{ Name = $Name; Status = "FAIL"; Details = $result.Error }
        }
    }
    catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{ Name = $Name; Status = "ERROR"; Details = $_.Exception.Message }
    }
}

# 1. Health Check
Test-Feature "API Health Check" {
    $result = Invoke-ApiRequest -Method GET -Endpoint "health"
    if ($result.Success) {
        return @{ Success = $true; Details = "API is healthy" }
    } else {
        return @{ Success = $false; Error = "API health check failed" }
    }
}

# 2. User Registration
Test-Feature "User Registration" {
    $registerData = @{
        username = $Username
        email = $Email
        password = $Password
        confirmPassword = $Password
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "auth/register" -Body $registerData

    if ($result.Success -and $result.Content.access_token) {
        $script:authToken = $result.Content.access_token
        return @{ Success = $true; Details = "User registered successfully" }
    } else {
        return @{ Success = $false; Error = "Registration failed: $($result.Error)" }
    }
}

# 3. User Login
Test-Feature "User Login" {
    if (-not $authToken) {
        # Try login if registration didn't work
        $loginData = @{
            email = $Email
            password = $Password
        }

        $result = Invoke-ApiRequest -Method POST -Endpoint "auth/login" -Body $loginData

        if ($result.Success -and $result.Content.access_token) {
            $script:authToken = $result.Content.access_token
            return @{ Success = $true; Details = "User logged in successfully" }
        } else {
            return @{ Success = $false; Error = "Login failed: $($result.Error)" }
        }
    } else {
        return @{ Success = $true; Details = "Already authenticated from registration" }
    }
}

# 4. Get Current User
Test-Feature "Get Current User" {
    if (-not $authToken) {
        return @{ Success = $false; Error = "No auth token available" }
    }

    $result = Invoke-ApiRequest -Method GET -Endpoint "auth/me" -AuthToken $authToken

    if ($result.Success -and $result.Content.username) {
        return @{ Success = $true; Details = "Current user: $($result.Content.username)" }
    } else {
        return @{ Success = $false; Error = "Failed to get current user: $($result.Error)" }
    }
}

# 5. List Communities
Test-Feature "List Communities" {
    $result = Invoke-ApiRequest -Method GET -Endpoint "communities"

    if ($result.Success -and $result.Content -is [array]) {
        return @{ Success = $true; Details = "Found $($result.Content.Count) communities" }
    } else {
        return @{ Success = $false; Error = "Failed to list communities: $($result.Error)" }
    }
}

# 6. Create Community
Test-Feature "Create Community" {
    if (-not $authToken) {
        return @{ Success = $false; Error = "No auth token available" }
    }

    $communityData = @{
        name = "BetaTest"
        description = "Community for beta testing"
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "communities" -Body $communityData -AuthToken $authToken

    if ($result.Success) {
        return @{ Success = $true; Details = "Community created successfully" }
    } else {
        return @{ Success = $false; Error = "Failed to create community: $($result.Error)" }
    }
}

# 7. Create Post
Test-Feature "Create Post" {
    if (-not $authToken) {
        return @{ Success = $false; Error = "No auth token available" }
    }

    $postData = @{
        title = "Beta Testing Post"
        body = "This is a test post created during beta testing."
        communityId = 1  # Assuming community ID 1 exists from seed
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "posts" -Body $postData -AuthToken $authToken

    if ($result.Success -and $result.Content.id) {
        $script:postId = $result.Content.id
        return @{ Success = $true; Details = "Post created with ID: $($result.Content.id)" }
    } else {
        return @{ Success = $false; Error = "Failed to create post: $($result.Error)" }
    }
}

# 8. List Posts
Test-Feature "List Posts" {
    $result = Invoke-ApiRequest -Method GET -Endpoint "posts"

    if ($result.Success -and $result.Content -is [array]) {
        return @{ Success = $true; Details = "Found $($result.Content.Count) posts" }
    } else {
        return @{ Success = $false; Error = "Failed to list posts: $($result.Error)" }
    }
}

# 9. Get Hot Posts
Test-Feature "Get Hot Posts" {
    $result = Invoke-ApiRequest -Method GET -Endpoint "posts/hot"

    if ($result.Success -and $result.Content -is [array]) {
        return @{ Success = $true; Details = "Found $($result.Content.Count) hot posts" }
    } else {
        return @{ Success = $false; Error = "Failed to get hot posts: $($result.Error)" }
    }
}

# 10. Create Comment
Test-Feature "Create Comment" {
    if (-not $authToken -or -not $postId) {
        return @{ Success = $false; Error = "No auth token or post ID available" }
    }

    $commentData = @{
        body = "This is a test comment for beta testing."
        postId = $postId
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "comments" -Body $commentData -AuthToken $authToken

    if ($result.Success -and $result.Content.id) {
        $script:commentId = $result.Content.id
        return @{ Success = $true; Details = "Comment created with ID: $($result.Content.id)" }
    } else {
        return @{ Success = $false; Error = "Failed to create comment: $($result.Error)" }
    }
}

# 11. Get Post Comments
Test-Feature "Get Post Comments" {
    if (-not $postId) {
        return @{ Success = $false; Error = "No post ID available" }
    }

    $result = Invoke-ApiRequest -Method GET -Endpoint "comments/post/$postId"

    if ($result.Success -and $result.Content -is [array]) {
        return @{ Success = $true; Details = "Found $($result.Content.Count) comments for post" }
    } else {
        return @{ Success = $false; Error = "Failed to get post comments: $($result.Error)" }
    }
}

# 12. Vote on Post
Test-Feature "Vote on Post" {
    if (-not $authToken -or -not $postId) {
        return @{ Success = $false; Error = "No auth token or post ID available" }
    }

    $voteData = @{
        target_type = "post"
        target_id = $postId
        value = 1  # Upvote
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "votes" -Body $voteData -AuthToken $authToken

    if ($result.Success) {
        return @{ Success = $true; Details = "Vote cast successfully" }
    } else {
        return @{ Success = $false; Error = "Failed to cast vote: $($result.Error)" }
    }
}

# 13. Get Vote Count
Test-Feature "Get Vote Count" {
    if (-not $postId) {
        return @{ Success = $false; Error = "No post ID available" }
    }

    $result = Invoke-ApiRequest -Method GET -Endpoint "votes/post/$postId"

    if ($result.Success) {
        return @{ Success = $true; Details = "Vote count retrieved: $($result.Content)" }
    } else {
        return @{ Success = $false; Error = "Failed to get vote count: $($result.Error)" }
    }
}

# 14. Search Posts
Test-Feature "Search Posts" {
    $result = Invoke-ApiRequest -Method GET -Endpoint "posts/search?q=beta"

    if ($result.Success -and $result.Content -is [array]) {
        return @{ Success = $true; Details = "Search found $($result.Content.Count) results" }
    } else {
        return @{ Success = $false; Error = "Search failed: $($result.Error)" }
    }
}

# 15. AI Summary (if configured)
Test-Feature "AI Post Summary" {
    if (-not $postId) {
        return @{ Success = $false; Error = "No post ID available" }
    }

    $result = Invoke-ApiRequest -Method GET -Endpoint "posts/$postId/summary"

    if ($result.Success) {
        return @{ Success = $true; Details = "AI summary generated successfully" }
    } elseif ($result.StatusCode -eq 500) {
        return @{ Success = $false; Error = "AI summary failed (likely no OpenAI API key configured)" }
    } else {
        return @{ Success = $false; Error = "AI summary request failed: $($result.Error)" }
    }
}

# 16. User Logout
Test-Feature "User Logout" {
    if (-not $authToken) {
        return @{ Success = $false; Error = "No auth token available" }
    }

    $result = Invoke-ApiRequest -Method POST -Endpoint "auth/logout" -AuthToken $authToken

    if ($result.Success) {
        return @{ Success = $true; Details = "User logged out successfully" }
    } else {
        return @{ Success = $false; Error = "Logout failed: $($result.Error)" }
    }
}

# Summary
Write-Host "`n📊 Test Results Summary" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

$passed = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($testResults | Where-Object { $_.Status -eq "FAIL" }).Count
$errors = ($testResults | Where-Object { $_.Status -eq "ERROR" }).Count
$total = $testResults.Count

Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Errors: $errors" -ForegroundColor Yellow

if ($passed -eq $total) {
    Write-Host "`n🎉 All tests passed! Beta is ready!" -ForegroundColor Green
} elseif ($passed / $total -gt 0.8) {
    Write-Host "`n⚠️  Most tests passed. Beta is mostly ready." -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Many tests failed. More work needed before beta." -ForegroundColor Red
}

# Detailed results
Write-Host "`n📋 Detailed Results:" -ForegroundColor Cyan
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

Write-Host "`n📖 Next steps:" -ForegroundColor Cyan
Write-Host "1. Fix any failed tests" -ForegroundColor White
Write-Host "2. Configure OpenAI API key for AI summaries" -ForegroundColor White
Write-Host "3. Test with multiple devices: http://YOUR_LOCAL_IP:3000" -ForegroundColor White
Write-Host "4. Run concurrent user tests" -ForegroundColor White
Write-Host "5. See BETA_SETUP.md for detailed instructions" -ForegroundColor White
