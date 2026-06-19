# Open CyberLab on a running emulator or USB phone
$ErrorActionPreference = "Stop"

$env:ANDROID_HOME = "D:\Android\Sdk"
$env:Path = "D:\Android\Sdk\platform-tools;D:\Android\Sdk\emulator;" + $env:Path

$Adb = "D:\Android\Sdk\platform-tools\adb.exe"
if (-not (Test-Path $Adb)) {
    Write-Host "adb not found. Run .\setup-android.ps1 first." -ForegroundColor Red
    exit 1
}

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

$device = Invoke-Adb @("devices") | Select-String "^(emulator-\S+|\S+)\s+device\s*$" | Select-Object -First 1
if (-not $device) {
    Write-Host "No Android device. Run .\start-emulator.ps1 first." -ForegroundColor Yellow
    Invoke-Adb @("devices")
    exit 1
}

$deviceId = $device.Line.Trim().Split([char]9)[0].Split()[0]
Invoke-Adb @("-s", $deviceId, "reverse", "tcp:5000", "tcp:5000") | Out-Null
Invoke-Adb @("-s", $deviceId, "reverse", "tcp:3000", "tcp:3000") | Out-Null

$installed = Invoke-Adb @("-s", $deviceId, "shell", "pm", "list", "packages") | Select-String "com.cyberlab.cyberlab_mobile"
if (-not $installed) {
    Write-Host "App not installed. Run .\install-emulator.ps1 first." -ForegroundColor Yellow
    exit 1
}

$activity = "com.cyberlab.cyberlab_mobile/.MainActivity"
Invoke-Adb @("-s", $deviceId, "shell", "am", "force-stop", "com.cyberlab.cyberlab_mobile") | Out-Null
Invoke-Adb @("-s", $deviceId, "shell", "am", "start", "-a", "android.intent.action.MAIN", "-c", "android.intent.category.LAUNCHER", "-n", $activity) | Out-Null
Write-Host "CyberLab launched on $deviceId" -ForegroundColor Green
