# Build + install CyberLab on running emulator (fixes "can't reach server")
$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "D:\jdk\jdk-17"
$env:Path = "D:\flutter\bin;D:\jdk\jdk-17\bin;D:\Android\Sdk\platform-tools;" + $env:Path
$env:ANDROID_HOME = "D:\Android\Sdk"
$env:GRADLE_USER_HOME = "D:\gradle"
$env:PUB_CACHE = "D:\pub-cache"
$env:TEMP = "D:\temp"
$env:TMP = "D:\temp"
$Adb = "D:\Android\Sdk\platform-tools\adb.exe"

function Invoke-Adb {
    param([string[]]$Command)
    $saved = $ErrorActionPreference
    $ErrorActionPreference = "Continue"
    try {
        & $Adb @Command 2>&1 | Where-Object { $_ -is [string] }
    } finally {
        $ErrorActionPreference = $saved
    }
}

Set-Location $PSScriptRoot

$device = Invoke-Adb @("devices") | Select-String "emulator-\d+\s+device"
if (-not $device) {
    Write-Host "No emulator running. Run .\start-emulator.ps1 first." -ForegroundColor Red
    exit 1
}

$deviceId = ($device.Line -split "\s+")[0]
Invoke-Adb @("-s", $deviceId, "reverse", "tcp:5000", "tcp:5000") | Out-Null
Invoke-Adb @("-s", $deviceId, "reverse", "tcp:3000", "tcp:3000") | Out-Null

# 10.0.2.2 = PC localhost from inside the Android emulator (more reliable than adb reverse)
$apiUrl = "http://10.0.2.2:5000/api"
$webUrl = "http://10.0.2.2:3000"

Write-Host "`nBuilding APK for emulator..." -ForegroundColor Cyan
flutter build apk --release --dart-define=API_URL=$apiUrl --dart-define=WEB_URL=$webUrl

$apk = "build\app\outputs\flutter-apk\app-release.apk"
Invoke-Adb @("-s", $deviceId, "install", "-r", $apk)
$activity = "com.cyberlab.cyberlab_mobile/.MainActivity"
Invoke-Adb @("-s", $deviceId, "shell", "am", "force-stop", "com.cyberlab.cyberlab_mobile") | Out-Null
Invoke-Adb @("-s", $deviceId, "shell", "am", "start", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-n", $activity) | Out-Null

Write-Host "`nInstalled! Login: admin@cyberlab.com / admin123" -ForegroundColor Green
Write-Host "Make sure DB + API are running:"
Write-Host "  cd ..\server ; npm run db:start ; npm run dev`n"
