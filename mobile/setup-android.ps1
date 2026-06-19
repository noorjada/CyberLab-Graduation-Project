# Install Android SDK on D: drive (keeps C: free) for real mobile APK builds
$ErrorActionPreference = "Stop"

Write-Host "`n📱 CyberLab — Android SDK Setup (D: drive)`n" -ForegroundColor Cyan

$SdkRoot = "D:\Android\Sdk"
$JdkHome = "D:\jdk\jdk-17"
$GradleHome = "D:\gradle"
$TempDir = "D:\temp"
$JdkZip = "$TempDir\jdk17.zip"
$JdkUrl = "https://api.adoptium.net/v3/binary/latest/17/ga/windows/x64/jdk/hotspot/normal/eclipse?project=jdk"
$CmdlineZip = "$TempDir\cmdline-tools.zip"
$CmdlineUrl = "https://dl.google.com/android/repository/commandlinetools-win-11076708_latest.zip"

New-Item -ItemType Directory -Force -Path $SdkRoot, "$SdkRoot\cmdline-tools\latest", $GradleHome, $TempDir | Out-Null

# JDK 17 (required by sdkmanager + Gradle)
if (-not (Test-Path "$JdkHome\bin\java.exe")) {
    Write-Host "Downloading JDK 17..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $JdkUrl -OutFile $JdkZip -UseBasicParsing
    $jdkExtract = "$TempDir\jdk-extract"
    if (Test-Path $jdkExtract) { Remove-Item -Recurse -Force $jdkExtract }
    Expand-Archive -Path $JdkZip -DestinationPath $jdkExtract -Force
    New-Item -ItemType Directory -Force -Path "D:\jdk" | Out-Null
    $jdkDir = Get-ChildItem $jdkExtract -Directory | Select-Object -First 1
    if (Test-Path $JdkHome) { Remove-Item -Recurse -Force $JdkHome }
    Move-Item $jdkDir.FullName $JdkHome
    Write-Host "JDK installed at $JdkHome" -ForegroundColor Green
}

$env:JAVA_HOME = $JdkHome
$env:ANDROID_HOME = $SdkRoot
$env:ANDROID_SDK_ROOT = $SdkRoot
$env:GRADLE_USER_HOME = $GradleHome
$env:TEMP = $TempDir
$env:TMP = $TempDir
$env:Path = "$JdkHome\bin;D:\flutter\bin;$SdkRoot\cmdline-tools\latest\bin;$SdkRoot\platform-tools;" + $env:Path

# Download command-line tools
if (-not (Test-Path "$SdkRoot\cmdline-tools\latest\bin\sdkmanager.bat")) {
    Write-Host "Downloading Android command-line tools..." -ForegroundColor Yellow
    Invoke-WebRequest -Uri $CmdlineUrl -OutFile $CmdlineZip -UseBasicParsing
    $extract = "$TempDir\cmdline-extract"
    if (Test-Path $extract) { Remove-Item -Recurse -Force $extract }
    Expand-Archive -Path $CmdlineZip -DestinationPath $extract -Force
    Copy-Item -Path "$extract\cmdline-tools\*" -Destination "$SdkRoot\cmdline-tools\latest" -Recurse -Force
    Write-Host "Command-line tools installed." -ForegroundColor Green
}

# Accept licenses + install packages
Write-Host "Installing SDK packages (may take several minutes)..." -ForegroundColor Yellow
$yes = ("y`n" * 20)
$yes | & "$SdkRoot\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root=$SdkRoot --licenses 2>&1 | Out-Null
& "$SdkRoot\cmdline-tools\latest\bin\sdkmanager.bat" --sdk_root=$SdkRoot `
    "platform-tools" `
    "platforms;android-36" `
    "build-tools;35.0.0" `
    "build-tools;28.0.3" `
    "cmdline-tools;latest"

# Tell Flutter where the SDK lives
& "D:\flutter\bin\flutter.bat" config --android-sdk $SdkRoot

# Gradle local.properties for this project
$localProps = Join-Path $PSScriptRoot "android\local.properties"
$sdkDir = $SdkRoot -replace '\\', '\\'
"sdk.dir=$SdkRoot`nflutter.sdk=D:\\flutter" | Set-Content -Path $localProps -Encoding ASCII

Write-Host "`n✅ Android SDK ready at $SdkRoot" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "  1. Connect your Android phone via USB (USB debugging ON)"
Write-Host "     OR install Android Studio and create an emulator"
Write-Host "  2. Start API server:  cd ..\server ; npm run dev"
Write-Host "  3. Build & install:  .\run.ps1"
Write-Host "     Or build APK only: .\build-apk.ps1`n"
