# PowerShell script to download and run Redis on Windows

$redisPath = "C:\Redis"
$redisZip = "$env:TEMP\Redis-x64-3.2.100.zip"
$downloadUrl = "https://github.com/microsoftarchive/redis/releases/download/win-3.2.100/Redis-x64-3.2.100.zip"

Write-Host "Redis Setup for Windows" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

# Check if Redis is already installed
if (Test-Path "$redisPath\redis-server.exe") {
    Write-Host "Redis found at $redisPath" -ForegroundColor Green
    Write-Host "Starting Redis..." -ForegroundColor Yellow
    Start-Process -FilePath "$redisPath\redis-server.exe" -WorkingDirectory $redisPath
    Write-Host "Redis started successfully!" -ForegroundColor Green
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit
}

# Download Redis
Write-Host "Redis not found. Downloading..." -ForegroundColor Yellow
try {
    Invoke-WebRequest -Uri $downloadUrl -OutFile $redisZip -UseBasicParsing
    Write-Host "Download complete!" -ForegroundColor Green
} catch {
    Write-Host "Failed to download Redis. Please download manually from:" -ForegroundColor Red
    Write-Host $downloadUrl -ForegroundColor Yellow
    exit 1
}

# Extract Redis
Write-Host "Extracting Redis to $redisPath..." -ForegroundColor Yellow
Expand-Archive -Path $redisZip -DestinationPath "C:\" -Force
if (Test-Path "C:\Redis-x64-3.2.100") {
    if (Test-Path $redisPath) {
        Remove-Item $redisPath -Recurse -Force
    }
    Rename-Item "C:\Redis-x64-3.2.100" $redisPath
}

# Clean up
Remove-Item $redisZip -Force

# Start Redis
Write-Host "Starting Redis..." -ForegroundColor Yellow
Start-Process -FilePath "$redisPath\redis-server.exe" -WorkingDirectory $redisPath
Write-Host "Redis installed and started successfully!" -ForegroundColor Green
Write-Host "Redis is now running on port 6379" -ForegroundColor Green
Write-Host ""
Write-Host "To stop Redis, close the Redis window" -ForegroundColor Yellow
Write-Host "To start Redis next time, run: $redisPath\redis-server.exe" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")