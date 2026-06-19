# Start CyberLab Android emulator (AVD stored on D: drive)
$ErrorActionPreference = "Stop"

$env:JAVA_HOME = "D:\jdk\jdk-17"
$env:ANDROID_HOME = "D:\Android\Sdk"
$env:ANDROID_SDK_ROOT = "D:\Android\Sdk"
$env:ANDROID_AVD_HOME = "D:\Android\avd"
$Adb = "D:\Android\Sdk\platform-tools\adb.exe"
$Emulator = "D:\Android\Sdk\emulator\emulator.exe"
$env:Path = "D:\Android\Sdk\emulator;D:\Android\Sdk\platform-tools;D:\jdk\jdk-17\bin;D:\Android\Sdk\cmdline-tools\latest\bin;" + $env:Path

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

function Set-EmulatorPortForward {
    param([string]$DeviceId)
    Invoke-Adb @("-s", $DeviceId, "reverse", "tcp:5000", "tcp:5000") | Out-Null
    Invoke-Adb @("-s", $DeviceId, "reverse", "tcp:3000", "tcp:3000") | Out-Null
}

function Skip-AndroidSetupWizard {
    param([string]$DeviceId)
    Start-Sleep -Seconds 4
    Invoke-Adb @("-s", $DeviceId, "shell", "settings", "put", "global", "device_provisioned", "1") | Out-Null
    Invoke-Adb @("-s", $DeviceId, "shell", "settings", "put", "secure", "user_setup_complete", "1") | Out-Null
    Invoke-Adb @("-s", $DeviceId, "shell", "settings", "put", "global", "setup_wizard_has_run", "1") | Out-Null
}

if (-not (Test-Path $Adb)) {
    Write-Host "adb not found. Run .\setup-android.ps1 first." -ForegroundColor Red
    exit 1
}

if (-not (Test-Path "D:\Android\avd\CyberLab_Phone.avd")) {
    Write-Host "Emulator not found. Run .\setup-android.ps1 first." -ForegroundColor Red
    exit 1
}

$running = Invoke-Adb @("devices") | Select-String "emulator-\d+\s+device"
if ($running) {
    Write-Host "Emulator already running." -ForegroundColor Green
    $id = ($running.Line -split "\s+")[0]
    Set-EmulatorPortForward $id
    Invoke-Adb @("devices")
    exit 0
}

Write-Host "Starting CyberLab_Phone emulator..." -ForegroundColor Cyan
# Do not use -no-snapshot-save: it resets the emulator and shows Google setup every boot.
Start-Process -FilePath $Emulator `
    -ArgumentList "-avd","CyberLab_Phone","-gpu","swiftshader_indirect" `
    -WindowStyle Normal

Write-Host "Waiting for boot..."
for ($i = 1; $i -le 60; $i++) {
    $line = Invoke-Adb @("devices") | Select-String "^(emulator-\S+)\s+device\s*$" | Select-Object -First 1
    if ($line) {
        $id = $line.Line.Trim().Split([char]9)[0].Split()[0]
        Set-EmulatorPortForward $id
        Skip-AndroidSetupWizard $id
        Write-Host "Emulator ready! (ports 5000+3000 forwarded to PC)" -ForegroundColor Green
        Write-Host "If Google sign-in still appears: tap Skip, then run .\launch-app.ps1" -ForegroundColor DarkYellow
        Invoke-Adb @("devices")
        exit 0
    }
    Start-Sleep -Seconds 3
}
Write-Host "Emulator slow to start - check the emulator window." -ForegroundColor Yellow
