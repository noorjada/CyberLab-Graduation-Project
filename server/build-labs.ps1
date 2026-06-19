# Build all CyberLab Docker images (run from PowerShell)

$LabsDir = Join-Path $PSScriptRoot "docker-labs"

$images = @{
    "linux-basic"    = "cyberlab-linux-basic"
    "web-basic"      = "cyberlab-web-basic"
    "network-basic"  = "cyberlab-network-basic"
    "privesc"        = "cyberlab-privesc"
    "xss"            = "cyberlab-cmd-injection"
    "cmd-injection"  = "cyberlab-cmd-injection"
    "hash-crack"     = "cyberlab-hash-crack"
    "ssh-brute"      = "cyberlab-ssh-brute"
    "cronjob"        = "cyberlab-cronjob"
    "lfi"            = "cyberlab-lfi"
}

# Fix: xss maps to cyberlab-xss
$images["xss"] = "cyberlab-xss"

foreach ($dir in $images.Keys) {
    $image = $images[$dir]
    $path  = Join-Path $LabsDir $dir
    if (Test-Path $path) {
        Write-Host "Building $image ..." -ForegroundColor Cyan
        docker build -t $image $path
        if ($?) { Write-Host "  OK $image" -ForegroundColor Green }
        else     { Write-Host "  FAILED $image" -ForegroundColor Red }
    } else {
        Write-Host "  Skipping $image - $path not found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Done. Now seed the database:" -ForegroundColor Green
Write-Host "  node seedLabs.js"
