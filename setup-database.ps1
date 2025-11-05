# Quick Database Setup for Windows PostgreSQL
# Run this AFTER installing PostgreSQL locally

param(
    [string]$PostgresPassword = $(Read-Host "Enter PostgreSQL superuser password"),
    [string]$PostgresPath = "C:\Program Files\PostgreSQL\16\bin"
)

Write-Host "Setting up Reddit Clone Database..." -ForegroundColor Cyan
Write-Host ""

# Check if PostgreSQL is installed
if (-Not (Test-Path "$PostgresPath\psql.exe")) {
    Write-Host "[ERROR] PostgreSQL not found at: $PostgresPath" -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Install PostgreSQL: https://www.postgresql.org/download/windows/" -ForegroundColor White
    Write-Host "2. Use cloud database (Supabase/Neon) - See DATABASE_SETUP.md" -ForegroundColor White
    Write-Host "3. Provide correct PostgreSQL path with -PostgresPath parameter" -ForegroundColor White
    exit 1
}

# Set environment variable for password
$env:PGPASSWORD = $PostgresPassword

try {
    Write-Host "Creating database 'reddit_db'..." -ForegroundColor Yellow
    
    # Create database
    & "$PostgresPath\createdb.exe" -U postgres reddit_db 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Database created successfully!" -ForegroundColor Green
    } else {
        Write-Host "[WARNING] Database might already exist (this is OK)" -ForegroundColor Yellow
    }
    
    # Test connection
    Write-Host ""
    Write-Host "Testing database connection..." -ForegroundColor Yellow
    $result = & "$PostgresPath\psql.exe" -U postgres -d reddit_db -t -c "SELECT 'Connection successful!';" 2>$null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[SUCCESS] Connection successful!" -ForegroundColor Green
        Write-Host ""
        
        # Update .env file
        Write-Host "Updating .env file..." -ForegroundColor Yellow
        $envContent = Get-Content "server\.env" -Raw
        
        # Escape special characters in password for URL
        $escapedPassword = [uri]::EscapeDataString($PostgresPassword)
        
        $newDatabaseUrl = "DATABASE_URL=`"postgresql://postgres:$escapedPassword@localhost:5432/reddit_db?schema=public`""
        
        if ($envContent -match 'DATABASE_URL=') {
            $envContent = $envContent -replace 'DATABASE_URL=.*', $newDatabaseUrl
        } else {
            $envContent += "`n$newDatabaseUrl"
        }
        
        Set-Content "server\.env" $envContent
        Write-Host "[SUCCESS] .env updated with database connection" -ForegroundColor Green
        
    } else {
        Write-Host "[ERROR] Connection failed. Check your password." -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "[ERROR] $_" -ForegroundColor Red
    exit 1
} finally {
    # Clear password from environment
    Remove-Item Env:PGPASSWORD
}

Write-Host ""
Write-Host "[COMPLETE] Database setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. cd server" -ForegroundColor White
Write-Host "2. npm run prisma:generate" -ForegroundColor White
Write-Host "3. npm run prisma:migrate" -ForegroundColor White
Write-Host "4. npm run prisma:seed" -ForegroundColor White
Write-Host "5. npm run dev" -ForegroundColor White
