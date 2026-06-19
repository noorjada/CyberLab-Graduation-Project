# Start the unified CyberLab MongoDB (your account + test accounts, one database)
$ErrorActionPreference = "Stop"

$Mongod = "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
$DbPath = "D:\mongodb-unified"

if (-not (Test-Path $DbPath)) {
    Write-Host "Unified database not found at $DbPath" -ForegroundColor Red
    Write-Host "Run: powershell -File server\scripts\merge-databases.ps1" -ForegroundColor Yellow
    exit 1
}

# Stop other MongoDB instances
try { Stop-Service MongoDB -Force -ErrorAction SilentlyContinue } catch {}
Get-Process mongod -ErrorAction SilentlyContinue | ForEach-Object {
    $cmd = (Get-CimInstance Win32_Process -Filter "ProcessId=$($_.Id)" -ErrorAction SilentlyContinue).CommandLine
    if ($cmd -notmatch [regex]::Escape($DbPath)) {
        Stop-Process -Id $_.Id -Force -ErrorAction SilentlyContinue
    }
}

$listening = netstat -an | Select-String "127.0.0.1:27017.*LISTENING"
if ($listening) {
    $proc = Get-CimInstance Win32_Process -Filter "name='mongod.exe'" -ErrorAction SilentlyContinue |
        Where-Object { $_.CommandLine -match [regex]::Escape($DbPath) }
    if ($proc) {
        Write-Host "MongoDB already running (unified DB on D:)." -ForegroundColor Green
        exit 0
    }
}

New-Item -ItemType Directory -Force -Path $DbPath | Out-Null
Start-Process $Mongod -ArgumentList "--dbpath",$DbPath,"--port","27017","--bind_ip","127.0.0.1" -WindowStyle Hidden
Start-Sleep 4

if (netstat -an | Select-String "127.0.0.1:27017.*LISTENING") {
    Write-Host "MongoDB started - unified database at $DbPath" -ForegroundColor Green
} else {
    Write-Host "MongoDB failed to start." -ForegroundColor Red
    exit 1
}
