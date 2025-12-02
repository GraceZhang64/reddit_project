# BlueIt Beta Setup Script
# Run this to configure your environment for beta testing

Write-Host "🚀 BlueIt Beta Setup Script" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (!(Test-Path "server/package.json") -or !(Test-Path "client/package.json")) {
    Write-Host "❌ Error: Run this script from the project root directory" -ForegroundColor Red
    exit 1
}

Write-Host "📍 Project root detected" -ForegroundColor Green

# Step 1: Check Node.js version
Write-Host "`n📦 Checking Node.js version..." -ForegroundColor Yellow
$nodeVersion = node --version
Write-Host "Node.js version: $nodeVersion" -ForegroundColor Gray

if ($nodeVersion -lt "v18.0.0") {
    Write-Host "❌ Node.js 18+ required. Please upgrade." -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js version OK" -ForegroundColor Green

# Step 2: Install dependencies
Write-Host "`n📦 Installing dependencies..." -ForegroundColor Yellow

Write-Host "Installing server dependencies..." -ForegroundColor Gray
cd server
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Server dependencies installation failed" -ForegroundColor Red
    exit 1
}

Write-Host "Installing client dependencies..." -ForegroundColor Gray
cd ../client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Client dependencies installation failed" -ForegroundColor Red
    exit 1
}

cd ..
Write-Host "✅ Dependencies installed" -ForegroundColor Green

# Step 3: Check environment configuration
Write-Host "`n🔧 Checking environment configuration..." -ForegroundColor Yellow

if (!(Test-Path "server/.env")) {
    Write-Host "⚠️  No .env file found in server directory" -ForegroundColor Yellow
    Write-Host "Please create server/.env with your Supabase and OpenAI credentials" -ForegroundColor Yellow
    Write-Host "See BETA_SETUP.md for the template" -ForegroundColor Yellow

    $createEnv = Read-Host "Create .env template now? (y/n)"
    if ($createEnv -eq "y") {
        @"
# Database Configuration (Supabase)
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT].supabase.co:5432/postgres"

# Supabase Auth
SUPABASE_URL="https://[YOUR_PROJECT].supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_KEY="your-service-role-key"

# OpenAI API (for AI post summaries)
OPENAI_API_KEY="sk-your-openai-api-key"

# Server Configuration
PORT=5000
NODE_ENV=development

# Security (for beta testing)
CORS_ORIGIN=true
"@ | Out-File -FilePath "server/.env" -Encoding UTF8

        Write-Host "✅ Template .env file created at server/.env" -ForegroundColor Green
        Write-Host "⚠️  Please edit it with your actual credentials!" -ForegroundColor Yellow
    }
} else {
    Write-Host "✅ .env file exists" -ForegroundColor Green
}

# Step 4: Setup database (optional)
Write-Host "`n🗄️  Database setup..." -ForegroundColor Yellow
$setupDb = Read-Host "Setup database now? (y/n)"
if ($setupDb -eq "y") {
    cd server
    Write-Host "Generating Prisma client..." -ForegroundColor Gray
    npm run prisma:generate

    Write-Host "Pushing database schema..." -ForegroundColor Gray
    npm run prisma:db:push

    Write-Host "Seeding database..." -ForegroundColor Gray
    npm run prisma:seed

    cd ..
    Write-Host "✅ Database setup complete" -ForegroundColor Green
}

# Step 5: Find local IP
Write-Host "`n🌐 Finding your local IP address..." -ForegroundColor Yellow
$localIP = Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq 'IPv4' -and
    $_.PrefixOrigin -eq 'Dhcp' -and
    $_.IPAddress -notlike "127.*"
} | Select-Object -First 1 -ExpandProperty IPAddress

if ($localIP) {
    Write-Host "✅ Your local IP: $localIP" -ForegroundColor Green
    Write-Host "📱 Other devices can access at:" -ForegroundColor Cyan
    Write-Host "   Frontend: http://$localIP`:3000" -ForegroundColor White
    Write-Host "   Backend:  http://$localIP`:5000" -ForegroundColor White
} else {
    Write-Host "⚠️  Could not determine local IP automatically" -ForegroundColor Yellow
    Write-Host "Check your network settings or use ipconfig" -ForegroundColor Gray
}

# Step 6: Start services
Write-Host "`n🚀 Starting services..." -ForegroundColor Yellow
$startServices = Read-Host "Start frontend and backend now? (y/n)"
if ($startServices -eq "y") {
    Write-Host "📋 Starting services in new terminals..." -ForegroundColor Gray
    Write-Host "Backend will start on port 5000 (accessible from network)" -ForegroundColor Gray
    Write-Host "Frontend will start on port 3000 (accessible from network)" -ForegroundColor Gray

    # Start backend
    Start-Process powershell -ArgumentList "cd server; npm run dev"

    # Start frontend
    Start-Process powershell -ArgumentList "cd client; npm run dev"

    Write-Host "✅ Services starting..." -ForegroundColor Green
    Write-Host "Wait a few seconds, then test:" -ForegroundColor Cyan
    if ($localIP) {
        Write-Host "   Frontend: http://$localIP`:3000" -ForegroundColor White
        Write-Host "   Backend: http://$localIP`:5000/api/health" -ForegroundColor White
    } else {
        Write-Host "   Frontend: http://localhost:3000" -ForegroundColor White
        Write-Host "   Backend: http://localhost:5000/api/health" -ForegroundColor White
    }
}

Write-Host "`n🎉 Beta setup complete!" -ForegroundColor Green
Write-Host "📖 Read BETA_SETUP.md for detailed testing instructions" -ForegroundColor Cyan
Write-Host "🔧 Run tests: cd server && npm run test:api" -ForegroundColor Gray
