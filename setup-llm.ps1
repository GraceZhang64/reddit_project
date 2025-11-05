# LLM Setup - Quick Start Script

Write-Host "🚀 Setting up LLM functionality for Reddit Clone..." -ForegroundColor Cyan
Write-Host ""

# Navigate to server directory
Set-Location -Path "server"

# Install OpenAI package
Write-Host "📦 Installing OpenAI package..." -ForegroundColor Yellow
npm install openai

# Check if .env exists
if (-Not (Test-Path ".env")) {
    Write-Host "⚙️ Creating .env file from template..." -ForegroundColor Yellow
    Copy-Item ".env.example" ".env"
    Write-Host ""
    Write-Host "⚠️ IMPORTANT: Edit server/.env and add your:" -ForegroundColor Red
    Write-Host "   1. DATABASE_URL (PostgreSQL connection string)" -ForegroundColor Red
    Write-Host "   2. OPENAI_API_KEY (from https://platform.openai.com/api-keys)" -ForegroundColor Red
    Write-Host ""
} else {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}

# Generate Prisma client
Write-Host "🔧 Generating Prisma client..." -ForegroundColor Yellow
npm run prisma:generate

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Set up PostgreSQL database (or use Supabase/Neon)" -ForegroundColor White
Write-Host "2. Update DATABASE_URL in server/.env" -ForegroundColor White
Write-Host "3. Add OPENAI_API_KEY in server/.env" -ForegroundColor White
Write-Host "4. Run migrations: npm run prisma:migrate" -ForegroundColor White
Write-Host "5. Seed database: npm run prisma:seed" -ForegroundColor White
Write-Host "6. Start server: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "📖 See LLM_IMPLEMENTATION_GUIDE.md for detailed instructions" -ForegroundColor Cyan
