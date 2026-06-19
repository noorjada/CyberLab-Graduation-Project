#!/bin/bash
# Build all CyberLab Docker images

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LABS_DIR="$SCRIPT_DIR/docker-labs"

declare -A IMAGES=(
  ["linux-basic"]="cyberlab-linux-basic"
  ["web-basic"]="cyberlab-web-basic"
  ["network-basic"]="cyberlab-network-basic"
  ["privesc"]="cyberlab-privesc"
  ["xss"]="cyberlab-xss"
  ["cmd-injection"]="cyberlab-cmd-injection"
  ["hash-crack"]="cyberlab-hash-crack"
  ["ssh-brute"]="cyberlab-ssh-brute"
  ["cronjob"]="cyberlab-cronjob"
  ["lfi"]="cyberlab-lfi"
)

for dir in "${!IMAGES[@]}"; do
  image="${IMAGES[$dir]}"
  path="$LABS_DIR/$dir"
  if [ -d "$path" ]; then
    echo "Building $image from $path ..."
    docker build -t "$image" "$path"
    echo "  ✓ $image built successfully"
  else
    echo "  ✗ Skipping $image — directory $path not found"
  fi
done

echo ""
echo "All lab images built. Run seedLabs to update the database:"
echo "  cd server && node seedLabs.js"
