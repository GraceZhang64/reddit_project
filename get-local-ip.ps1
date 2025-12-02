# Get Local IP Address for Network Access
# Run this to find your IP address for beta testing

Write-Host "🌐 Finding your local IP address for network access..." -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan

$localIP = Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq 'IPv4' -and
    $_.PrefixOrigin -eq 'Dhcp' -and
    $_.IPAddress -notlike "127.*"
} | Select-Object -First 1 -ExpandProperty IPAddress

if ($localIP) {
Write-Host "✅ Your local IP address: $localIP" -ForegroundColor Green
Write-Host "" -ForegroundColor White
Write-Host "📱 Network Access URLs for Beta Testing:" -ForegroundColor Cyan
Write-Host "   🌐 Frontend (React App): http://$localIP`:3000" -ForegroundColor White
Write-Host "   🚀 Backend API:         http://$localIP`:5000" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "📋 Share the Frontend URL (port 3000) with your beta testers!" -ForegroundColor Green
Write-Host "   The backend API (port 5000) is accessed automatically by the frontend." -ForegroundColor Gray
} else {
    Write-Host "⚠️  Could not automatically detect local IP" -ForegroundColor Yellow
    Write-Host "Try running 'ipconfig' in Command Prompt to find your IP address" -ForegroundColor Gray
    Write-Host "Look for 'IPv4 Address' under your network adapter (usually 192.168.x.x)" -ForegroundColor Gray
}
