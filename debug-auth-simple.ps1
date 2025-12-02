# Simple Authentication Debug
Write-Host "Authentication Debug Information" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "To check browser storage, run in browser console:" -ForegroundColor Yellow
Write-Host "localStorage.getItem('access_token')" -ForegroundColor White
Write-Host "localStorage.getItem('user')" -ForegroundColor White

Write-Host "`nTesting server connectivity..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Server is running and responding" -ForegroundColor Green
} catch {
    Write-Host "Server is not accessible (check if running on port 5000)" -ForegroundColor Red
}

Write-Host "`nCommon Issues:" -ForegroundColor Yellow
Write-Host "1. Token expired - Supabase tokens expire after 1 hour" -ForegroundColor White
Write-Host "2. Server not running" -ForegroundColor White
Write-Host "3. Browser storage cleared" -ForegroundColor White
Write-Host "4. Username/password mismatch" -ForegroundColor White

Write-Host "`nCheck server logs for detailed error messages" -ForegroundColor Green
