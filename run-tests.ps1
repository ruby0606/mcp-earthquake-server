#!/usr/bin/env powershell

# Test Runner for MCP Earthquake Server
# Runs tests from the test directory with proper paths

param(
    [string]$TestFile = "",
    [switch]$All = $false,
    [switch]$Help = $false
)

if ($Help) {
    Write-Host "🧪 MCP Earthquake Server Test Runner" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usage:"
    Write-Host "  .\run-tests.ps1 -All                    # Run all tests"
    Write-Host "  .\run-tests.ps1 -TestFile test-server   # Run specific test"
    Write-Host "  .\run-tests.ps1 -Help                   # Show this help"
    Write-Host ""
    Write-Host "Available Tests:" -ForegroundColor Yellow
    Get-ChildItem -Path "test" -Name "test-*.js" | ForEach-Object {
        $testName = $_ -replace "\.js$", ""
        Write-Host "  - $testName" -ForegroundColor Cyan
    }
    exit 0
}

# Ensure we're in the project root
if (-not (Test-Path "package.json")) {
    Write-Error "❌ Must run from project root directory"
    exit 1
}

# Ensure dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "🔨 Building project first..." -ForegroundColor Yellow
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Error "❌ Build failed"
        exit 1
    }
}

# Change to test directory
Set-Location "test"

try {
    if ($All) {
        Write-Host "🧪 Running All Tests..." -ForegroundColor Green
        Write-Host ""
        
        $testFiles = Get-ChildItem -Name "test-*.js" | Sort-Object
        $passed = 0
        $failed = 0
        
        foreach ($test in $testFiles) {
            Write-Host "▶️  Running $test" -ForegroundColor Blue
            Write-Host "=" * 50
            
            node $test
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $test PASSED" -ForegroundColor Green
                $passed++
            } else {
                Write-Host "❌ $test FAILED" -ForegroundColor Red
                $failed++
            }
            Write-Host ""
        }
        
        Write-Host "📊 Test Summary:" -ForegroundColor Yellow
        Write-Host "   ✅ Passed: $passed" -ForegroundColor Green
        Write-Host "   ❌ Failed: $failed" -ForegroundColor Red
        
    } elseif ($TestFile -ne "") {
        $testPath = if ($TestFile.EndsWith(".js")) { $TestFile } else { "$TestFile.js" }
        
        if (Test-Path $testPath) {
            Write-Host "🧪 Running Test: $testPath" -ForegroundColor Green
            Write-Host ""
            node $testPath
        } else {
            Write-Error "❌ Test file not found: $testPath"
            Write-Host ""
            Write-Host "Available tests:" -ForegroundColor Yellow
            Get-ChildItem -Name "test-*.js" | ForEach-Object {
                Write-Host "  - $_" -ForegroundColor Cyan
            }
            exit 1
        }
    } else {
        Write-Host "🧪 MCP Earthquake Server Test Runner" -ForegroundColor Green
        Write-Host ""
        Write-Host "Use -Help to see usage options"
        Write-Host "Use -All to run all tests"
        Write-Host ""
        Write-Host "Quick Tests:" -ForegroundColor Yellow
        Write-Host "  .\run-tests.ps1 -TestFile test-server"
        Write-Host "  .\run-tests.ps1 -TestFile test-global-coverage"
        Write-Host "  .\run-tests.ps1 -TestFile test-mcp-global"
    }
    
} finally {
    # Return to project root
    Set-Location ".."
}
