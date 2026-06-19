# CyberLab Mobile — run on Android phone or emulator (NOT desktop/web)
$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "D:\jdk\jdk-17"
$env:Path = "D:\flutter\bin;D:\jdk\jdk-17\bin;D:\Android\Sdk\platform-tools;D:\Android\Sdk\cmdline-tools\latest\bin;" + $env:Path
$env:FLUTTER_ROOT = "D:\flutter"
$env:PUB_CACHE = "D:\pub-cache"
$env:TEMP = "D:\temp"
$env:TMP = "D:\temp"
$env:ANDROID_HOME = "D:\Android\Sdk"
$env:ANDROID_SDK_ROOT = "D:\Android\Sdk"
$env:GRADLE_USER_HOME = "D:\gradle"

Set-Location $PSScriptRoot

if (-not (Test-Path "D:\flutter\bin\flutter.bat")) {
    Write-Host "Run .\setup.ps1 first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "D:\Android\Sdk\platform-tools\adb.exe")) {
    Write-Host "Android SDK not found. Run .\setup-android.ps1 first." -ForegroundColor Red
    exit 1
}

# Detect connected Android device or emulator
$devices = & adb devices 2>&1 | Select-String "device$"
$deviceId = $null
if ($devices) {
    $deviceId = ($devices[0] -split "\s+")[0]
}

# API URL: emulator uses 10.0.2.2 (host PC); physical phone uses LAN IP
if ($env:API_URL) {
    $apiUrl = $env:API_URL
} elseif ($deviceId -like "emulator-*") {
    $apiUrl = "http://10.0.2.2:5000/api"
} else {
    $ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
        $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and
        $_.InterfaceAlias -notmatch 'WSL|Hyper-V|vEthernet|Loopback|Virtual'
    } | Sort-Object { if ($_.InterfaceAlias -match 'Wi-Fi|Ethernet') { 0 } else { 1 } } | Select-Object -First 1).IPAddress
    if (-not $ip) { $ip = "192.168.1.10" }
    $apiUrl = "http://${ip}:5000/api"
}

$webUrl = if ($env:WEB_URL) { $env:WEB_URL } else { $apiUrl -replace ":5000/api", ":3000" }

Write-Host "`n🛡️ CyberLab Mobile (Android)" -ForegroundColor Green
if ($deviceId) {
    Write-Host "Device: $deviceId"
} else {
    Write-Host "No Android device detected!" -ForegroundColor Yellow
    Write-Host "  • Connect phone via USB with USB debugging enabled, OR"
    Write-Host "  • Start an emulator from Android Studio"
    Write-Host "  • Or build APK: .\build-apk.ps1`n"
    & adb devices
    exit 1
}
Write-Host "API: $apiUrl`n"

flutter pub get

if ($deviceId) {
    flutter run -d $deviceId --dart-define=API_URL=$apiUrl --dart-define=WEB_URL=$webUrl
} else {
    flutter run --dart-define=API_URL=$apiUrl --dart-define=WEB_URL=$webUrl
}
