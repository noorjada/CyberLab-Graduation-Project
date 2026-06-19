# Build a release APK you can install on any Android phone
$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "D:\jdk\jdk-17"
$env:Path = "D:\flutter\bin;D:\jdk\jdk-17\bin;" + $env:Path
$env:PUB_CACHE = "D:\pub-cache"
$env:TEMP = "D:\temp"
$env:TMP = "D:\temp"
$env:ANDROID_HOME = "D:\Android\Sdk"
$env:ANDROID_SDK_ROOT = "D:\Android\Sdk"
$env:GRADLE_USER_HOME = "D:\gradle"

Set-Location $PSScriptRoot

# Auto-detect PC LAN IP for physical phone
$ip = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
    $_.IPAddress -notlike "127.*" -and $_.IPAddress -notlike "169.254.*" -and
    $_.InterfaceAlias -notmatch 'WSL|Hyper-V|vEthernet|Loopback|Virtual'
} | Sort-Object { if ($_.InterfaceAlias -match 'Wi-Fi|Ethernet') { 0 } else { 1 } } | Select-Object -First 1).IPAddress

if (-not $ip) { $ip = "192.168.1.10" }

$apiUrl = if ($env:API_URL) { $env:API_URL } else { "http://${ip}:5000/api" }
$webUrl = if ($env:WEB_URL) { $env:WEB_URL } else { "http://${ip}:3000" }

Write-Host "`n📱 Building CyberLab APK" -ForegroundColor Green
Write-Host "API URL baked in: $apiUrl"
Write-Host "(Phone and PC must be on the same Wi-Fi)`n"

flutter pub get
flutter build apk --release --dart-define=API_URL=$apiUrl --dart-define=WEB_URL=$webUrl

$apk = "build\app\outputs\flutter-apk\app-release.apk"
if (Test-Path $apk) {
    Write-Host "`n✅ APK ready:" -ForegroundColor Green
    Write-Host "   $((Resolve-Path $apk).Path)"
    Write-Host "`nInstall on phone:"
    Write-Host "  • Copy APK to phone and open it, OR"
    Write-Host "  • USB: adb install -r $apk`n"
} else {
    Write-Host "Build failed — run .\setup-android.ps1 first" -ForegroundColor Red
    exit 1
}
