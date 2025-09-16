# Install Memurai (Redis 5.0+ compatible for Windows)

Write-Host "Installing Memurai (Redis-compatible for Windows)..." -ForegroundColor Cyan
Write-Host "=====================================================" -ForegroundColor Cyan
Write-Host ""

$memuraiUrl = "https://www.memurai.com/get-memurai"
$wslRedisUrl = "https://aka.ms/wslstore"

Write-Host "BullMQ requires Redis 5.0+. The old Windows Redis port is version 3.2." -ForegroundColor Yellow
Write-Host ""
Write-Host "You have 2 options for Redis 5.0+ on Windows:" -ForegroundColor Green
Write-Host ""
Write-Host "OPTION 1: Memurai (Recommended - Native Windows)" -ForegroundColor Cyan
Write-Host "1. Download from: $memuraiUrl" -ForegroundColor White
Write-Host "2. Install Memurai Developer (free)" -ForegroundColor White
Write-Host "3. It will run automatically on port 6379" -ForegroundColor White
Write-Host ""
Write-Host "OPTION 2: WSL with Ubuntu (More setup required)" -ForegroundColor Cyan
Write-Host "1. Install WSL: wsl --install" -ForegroundColor White
Write-Host "2. Restart computer" -ForegroundColor White
Write-Host "3. Open Ubuntu terminal and run:" -ForegroundColor White
Write-Host "   sudo apt update && sudo apt install redis-server" -ForegroundColor White
Write-Host "   sudo service redis-server start" -ForegroundColor White
Write-Host ""
Write-Host "Opening Memurai download page..." -ForegroundColor Green
Start-Process $memuraiUrl

Write-Host ""
Write-Host "After installing Memurai:" -ForegroundColor Yellow
Write-Host "1. Memurai will start automatically" -ForegroundColor White
Write-Host "2. Restart your npm run dev:all command" -ForegroundColor White
Write-Host "3. The app will work without errors" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")