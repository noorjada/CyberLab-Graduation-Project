# Frees the server port before starting (fixes EADDRINUSE on Windows)
$port = if ($env:PORT) { $env:PORT } else { 5000 }

$lines = netstat -ano | Select-String ":$port\s" | Select-String "LISTENING"
$pids = $lines | ForEach-Object {
  if ($_ -match '\s+(\d+)\s*$') { $matches[1] }
} | Select-Object -Unique

if (-not $pids) {
  Write-Host "Port $port is free."
  exit 0
}

foreach ($procId in $pids) {
  if ($procId -eq 0) { continue }
  Write-Host "Stopping process $procId on port $port..."
  taskkill /PID $procId /F 2>$null
}

Write-Host "Port $port is ready."
