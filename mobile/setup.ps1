# CyberLab Mobile — first-time Flutter setup (installs to D: drive)
$ErrorActionPreference = "Stop"

Write-Host "`n🛡️ CyberLab Mobile Setup`n" -ForegroundColor Green

New-Item -ItemType Directory -Force -Path "D:\temp", "D:\pub-cache" | Out-Null

if (-not (Test-Path "D:\flutter\bin\flutter.bat")) {
    Write-Host "Installing Flutter SDK to D:\flutter ..." -ForegroundColor Cyan
    git clone https://github.com/flutter/flutter.git -b stable --depth 1 "D:\flutter"
}

$env:Path = "D:\flutter\bin;" + $env:Path
$env:FLUTTER_ROOT = "D:\flutter"
$env:PUB_CACHE = "D:\pub-cache"
$env:TEMP = "D:\temp"
$env:TMP = "D:\temp"

flutter --version
flutter config --enable-windows-desktop

if (-not (Test-Path "android")) {
    Write-Host "Generating platform folders..." -ForegroundColor Cyan
    flutter create . --project-name cyberlab_mobile --org com.cyberlab
}

flutter pub get

Write-Host "`n✅ Setup complete!`n" -ForegroundColor Green
Write-Host "IMPORTANT: Your C: drive was nearly full. Flutter is on D:\flutter."
Write-Host "For Windows desktop builds, enable Developer Mode:"
Write-Host "  start ms-settings:developers`n"
Write-Host "Start the API server:"
Write-Host "  cd ..\server ; npm run dev`n"
Write-Host "Run the app (Chrome — works without Developer Mode):"
Write-Host "  .\run.ps1 chrome`n"
Write-Host "Run on Windows desktop (requires Developer Mode):"
Write-Host "  .\run.ps1 windows`n"
