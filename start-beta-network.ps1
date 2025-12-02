# Start BlueIt Beta with Network Access
# This script configures both frontend and backend for network testing

Write-Host "🚀 Starting BlueIt Beta with Network Access" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Get local IP address
$localIP = Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq 'IPv4' -and
    $_.PrefixOrigin -eq 'Dhcp' -and
    $_.IPAddress -notlike "127.*"
} | Select-Object -First 1 -ExpandProperty IPAddress

if ($localIP) {
    Write-Host "✅ Your local IP: $localIP" -ForegroundColor Green

    # Set environment variable for backend API URL
    $env:VITE_API_URL = "http://$localIP`:5000"

    Write-Host "📡 Backend API URL set to: $env:VITE_API_URL" -ForegroundColor Yellow
    Write-Host "" -ForegroundColor White
    Write-Host "🌐 Beta Access URLs:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://$localIP`:3000" -ForegroundColor White
    Write-Host "   Backend:  http://$localIP`:5000" -ForegroundColor White
    Write-Host "" -ForegroundColor White

    # Start backend in new terminal
    Write-Host "🚀 Starting backend server..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "cd server; npm run dev" -NoNewWindow

    Start-Sleep -Seconds 3

    # Start frontend with network access
    Write-Host "🌐 Starting frontend with network access..." -ForegroundColor Green
    $env:VITE_API_URL = "http://$localIP`:5000"
    Start-Process powershell -ArgumentList "cd client; npm run dev -- --host 0.0.0.0" -NoNewWindow

    Write-Host "" -ForegroundColor White
    Write-Host "✅ Both services starting with network access!" -ForegroundColor Green
    Write-Host "📱 Share http://$localIP`:3000 with your beta testers" -ForegroundColor Cyan
    Write-Host "" -ForegroundColor White
    Write-Host "⚠️  Note: Make sure your firewall allows connections on ports 3000 and 5000" -ForegroundColor Yellow

} else {
    Write-Host "❌ Could not detect local IP address" -ForegroundColor Red
    Write-Host "Check your network connection and try again" -ForegroundColor Yellow
}
