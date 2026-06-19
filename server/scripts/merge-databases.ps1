# Merge C: original + D: dev into ONE database at D:\mongodb-unified
$ErrorActionPreference = "Stop"
$ServerRoot = Split-Path $PSScriptRoot -Parent
$BackupDir = Join-Path $ServerRoot "backups\db-export-d"
$Mongod = "C:\Program Files\MongoDB\Server\8.3\bin\mongod.exe"
$Unified = "D:\mongodb-unified"
$Original = "C:\Program Files\MongoDB\Server\8.3\data"
$DevPath = "D:\mongodb-data"

Write-Host "`nCyberLab - Unify MongoDB`n" -ForegroundColor Cyan

# 1) Export D: dev if running
$devRunning = Get-CimInstance Win32_Process -Filter "name='mongod.exe'" -ErrorAction SilentlyContinue |
    Where-Object { $_.CommandLine -match 'D:\\mongodb-data' }

Set-Location $ServerRoot
if ($devRunning) {
    Write-Host "Step 1: Export dev database (D:)..." -ForegroundColor Yellow
    node scripts/export-database.js "mongodb://127.0.0.1:27017/cyberlab" $BackupDir
} elseif (Test-Path $BackupDir) {
    Write-Host "Step 1: Using existing dev export at backups\db-export-d" -ForegroundColor Yellow
} else {
    Write-Host "Step 1: No dev DB to export (skip)." -ForegroundColor DarkYellow
}

# 2) Stop all MongoDB
Write-Host "`nStep 2: Stop all MongoDB instances..." -ForegroundColor Yellow
try { Stop-Service MongoDB -Force -ErrorAction SilentlyContinue } catch {}
Get-Process mongod -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 3

# 3) Copy original C: data to unified location on D:
Write-Host "`nStep 3: Copy original database (C:) -> D:\mongodb-unified..." -ForegroundColor Yellow
if (-not (Test-Path $Original)) {
    Write-Host "  Original data not found at $Original" -ForegroundColor Red
    exit 1
}
if (Test-Path $Unified) {
    Rename-Item $Unified "$Unified.bak-$(Get-Date -Format 'yyyyMMdd-HHmmss')" -ErrorAction SilentlyContinue
}
New-Item -ItemType Directory -Force -Path $Unified | Out-Null
robocopy $Original $Unified /E /R:2 /W:2 /NFL /NDL /NJH /NJS | Out-Null
Write-Host "  Copied original data to $Unified" -ForegroundColor Green

# 4) Start unified MongoDB
Write-Host "`nStep 4: Start unified MongoDB..." -ForegroundColor Yellow
Start-Process $Mongod -ArgumentList "--dbpath",$Unified,"--port","27017","--bind_ip","127.0.0.1" -WindowStyle Hidden
Start-Sleep 5

if (-not (netstat -an | Select-String "127.0.0.1:27017.*LISTENING")) {
    Write-Host "  Failed to start MongoDB on 27017" -ForegroundColor Red
    exit 1
}

# 5) Merge dev export into unified
if (Test-Path $BackupDir) {
    Write-Host "`nStep 5: Merge dev accounts into unified DB..." -ForegroundColor Yellow
    node scripts/import-merge.js "mongodb://127.0.0.1:27017/cyberlab" $BackupDir
}

Write-Host "`nStep 6: Ensure test accounts..." -ForegroundColor Yellow
node seedUsers.js 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host "`nSingle unified database: D:\mongodb-unified" -ForegroundColor Green
Write-Host "   Your account + admin/instructor/student test accounts."
Write-Host "`n   Always start with:  .\scripts\start-mongodb.ps1" -ForegroundColor Cyan
Write-Host "   Then API:           npm run dev`n"
