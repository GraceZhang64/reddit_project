# BlueIt Beta Ready Checklist
# Quick verification that everything is set up for beta testing

Write-Host "🚀 BlueIt Beta Ready Checklist" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$allGood = $true
$checks = @()

function Check-Item {
    param(
        [string]$Name,
        [scriptblock]$Check,
        [string]$Fix = ""
    )

    Write-Host "`n🔍 Checking: $Name" -ForegroundColor Yellow
    try {
        $result = & $Check
        if ($result.Success) {
            Write-Host "✅ PASS" -ForegroundColor Green
            $checks += @{ Name = $Name; Status = "PASS"; Details = $result.Details }
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
            if ($result.Error) {
                Write-Host "   Error: $($result.Error)" -ForegroundColor Red
            }
            if ($Fix) {
                Write-Host "   Fix: $Fix" -ForegroundColor Yellow
            }
            $checks += @{ Name = $Name; Status = "FAIL"; Details = $result.Error }
            $script:allGood = $false
        }
    }
    catch {
        Write-Host "❌ ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($Fix) {
            Write-Host "   Fix: $Fix" -ForegroundColor Yellow
        }
        $checks += @{ Name = $Name; Status = "ERROR"; Details = $_.Exception.Message }
        $script:allGood = $false
    }
}

# 1. Project structure
Check-Item "Project Structure" {
    $hasServer = Test-Path "server/package.json"
    $hasClient = Test-Path "client/package.json"
    $hasReadme = Test-Path "README.md"

    if ($hasServer -and $hasClient -and $hasReadme) {
        return @{ Success = $true; Details = "All project files present" }
    } else {
        return @{ Success = $false; Error = "Missing project files" }
    }
} "Ensure you're in the project root directory"

# Summary
Write-Host "`n📊 Beta Readiness Summary" -ForegroundColor Cyan
Write-Host "===========================" -ForegroundColor Cyan

$passed = ($checks | Where-Object { $_.Status -eq "PASS" }).Count
$failed = ($checks | Where-Object { $_.Status -ne "PASS" }).Count
$total = $checks.Count

Write-Host "Checks passed: $passed/$total" -ForegroundColor $(if ($passed -eq $total) { "Green" } elseif ($passed / $total -gt 0.7) { "Yellow" } else { "Red" })

if ($allGood) {
    Write-Host "`n🎉 Your BlueIt project is BETA READY!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Some checks failed. Please fix the issues above." -ForegroundColor Yellow
    Write-Host "See BETA_SETUP.md for detailed setup instructions." -ForegroundColor Yellow
}

# Detailed results
Write-Host "`n📋 Detailed Check Results:" -ForegroundColor Cyan
foreach ($check in $checks) {
    $color = switch ($check.Status) {
        "PASS" { "Green" }
        "FAIL" { "Red" }
        "ERROR" { "Yellow" }
    }
    Write-Host "  $($check.Status): $($check.Name)" -ForegroundColor $color
    if ($check.Status -ne "PASS" -and $check.Details) {
        Write-Host "    $($check.Details)" -ForegroundColor Gray
    }
}

Write-Host "`n📖 Documentation:" -ForegroundColor Cyan
Write-Host "   BETA_SETUP.md      - Complete setup guide" -ForegroundColor White
Write-Host "   README.md           - Project overview" -ForegroundColor White
Write-Host "   TEST_GUIDE.md       - Testing instructions" -ForegroundColor White
