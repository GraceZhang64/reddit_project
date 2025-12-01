# Debug Authentication State
# Check current auth status and tokens

Write-Host "🔍 Authentication Debug Information" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan

# Check browser local storage (this would need to be run in browser console)
Write-Host "📋 To check browser storage, run this in browser console:" -ForegroundColor Yellow
Write-Host "localStorage.getItem('access_token')" -ForegroundColor White
Write-Host "localStorage.getItem('user')" -ForegroundColor White
Write-Host "sessionStorage.getItem('access_token')" -ForegroundColor White
Write-Host "sessionStorage.getItem('user')" -ForegroundColor White
Write-Host ""

# Check server logs
Write-Host "📊 Recent server logs (check terminal output for auth-related messages):" -ForegroundColor Yellow
Write-Host "✅ Auth successful for user: [ID]" -ForegroundColor Green
Write-Host "⚠️ No auth token provided" -ForegroundColor Yellow
Write-Host "🚫 Supabase auth error: [error]" -ForegroundColor Red
Write-Host "🔑 Auth token attached to request: [URL]" -ForegroundColor Green
Write-Host "⚠️ No auth token available for request: [URL]" -ForegroundColor Yellow
Write-Host ""

# Test API endpoints
Write-Host "🧪 Test API endpoints:" -ForegroundColor Yellow
Write-Host "GET http://localhost:5000/api/health - Check if server is running" -ForegroundColor White
Write-Host "GET http://localhost:5000/api/auth/me - Should return current user if authenticated" -ForegroundColor White
Write-Host "POST http://localhost:5000/api/auth/login - Test login with valid credentials" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Quick server test:" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✅ Server is running and responding" -ForegroundColor Green
} catch {
    Write-Host "❌ Server is not accessible (check if running on port 5000)" -ForegroundColor Red
}
Write-Host ""

# Common issues
Write-Host "🔧 Common Authentication Issues:" -ForegroundColor Yellow
Write-Host "1. Token expired - Supabase tokens expire after 1 hour by default" -ForegroundColor White
Write-Host "2. Server restart - Server needs to be running for API calls" -ForegroundColor White
Write-Host "3. Browser storage cleared - Refreshing page or clearing storage" -ForegroundColor White
Write-Host "4. Network issues - Can't reach Supabase servers" -ForegroundColor White
Write-Host "5. Username case sensitivity - Must match exactly (case-sensitive)" -ForegroundColor White
Write-Host "6. Port conflicts - Server not running on expected port (5000)" -ForegroundColor White
Write-Host "7. CORS issues - Frontend can't reach backend API" -ForegroundColor White
Write-Host ""

# Solutions
Write-Host "Solutions:" -ForegroundColor Green
Write-Host "1. Clear browser storage and re-login" -ForegroundColor White
Write-Host "2. Check server is running on correct port" -ForegroundColor White
Write-Host "3. Verify Supabase credentials in .env" -ForegroundColor White
Write-Host "4. Check browser console for detailed error messages" -ForegroundColor White
Write-Host "5. Use incognito/private browsing to test fresh state" -ForegroundColor White
