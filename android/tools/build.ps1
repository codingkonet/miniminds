# Build MiniMINDS Android (APK + AAB)
# Usage:
#   powershell -ExecutionPolicy Bypass -File tools\build.ps1           # debug APK + AAB
#   $env:KEYSTORE_PASS='...'; $env:KEY_PASS='...'
#   powershell -ExecutionPolicy Bypass -File tools\build.ps1 -Release  # signed release APK + AAB
param([switch]$Release)
$ErrorActionPreference = 'Stop'
$cwd = (Get-Location).Path
if ($cwd.StartsWith('\\?\')) { Set-Location $cwd.Substring(4) }

$root = Split-Path -Parent $PSScriptRoot
$webRoot = Split-Path -Parent $root
$toolchain = if ($env:ANDROID_TOOLCHAIN) { $env:ANDROID_TOOLCHAIN } else { Join-Path $env:USERPROFILE 'android-toolchain' }
$jdk = Join-Path $toolchain 'jdk-17'
$sdk = Join-Path $toolchain 'sdk'
$gradleHome = Join-Path $toolchain 'gradle-home'
$gradleBin = Join-Path $toolchain 'gradle-8.7\bin\gradle.bat'
foreach ($p in @($jdk, $sdk, $gradleBin)) { if (-not (Test-Path $p)) { throw "Missing $p" } }

# 1. Bundle web app into Android assets (with locally-bundled Supabase JS for reliability)
$www = Join-Path $root 'app\src\main\assets\www'
New-Item -ItemType Directory -Force -Path $www | Out-Null
foreach ($f in @('index.html','style.css','data.js','app.js','supabase-config.js')) {
    Copy-Item (Join-Path $webRoot $f) (Join-Path $www $f) -Force
}
$vendor = Join-Path $root 'vendor'
New-Item -ItemType Directory -Force -Path $vendor | Out-Null
$sbJs = Join-Path $vendor 'supabase.js'
if (-not (Test-Path $sbJs)) {
    Invoke-WebRequest -UseBasicParsing 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js' -OutFile $sbJs -TimeoutSec 60
}
Copy-Item $sbJs (Join-Path $www 'supabase.js') -Force
$html = Get-Content (Join-Path $www 'index.html') -Raw
$html = $html -replace 'https://cdn\.jsdelivr\.net/npm/@supabase/supabase-js@2', 'supabase.js'
Set-Content (Join-Path $www 'index.html') $html -Encoding UTF8
Write-Host "Web assets bundled into app/src/main/assets/www"

# 2. Gradle env (same pattern as the local toolchain)
New-Item -ItemType Directory -Force -Path $gradleHome | Out-Null
$proxyProps = Join-Path $gradleHome 'gradle.properties'
if ($env:HTTPS_PROXY) {
    $uri = [System.Uri]$env:HTTPS_PROXY
    @"
systemProp.http.proxyHost=$($uri.Host)
systemProp.http.proxyPort=$($uri.Port)
systemProp.https.proxyHost=$($uri.Host)
systemProp.https.proxyPort=$($uri.Port)
systemProp.http.nonProxyHosts=localhost|127.0.0.1
systemProp.https.nonProxyHosts=localhost|127.0.0.1
"@ | Set-Content $proxyProps
} elseif (Test-Path $proxyProps) { Remove-Item $proxyProps }

($sdk -replace '\\', '/') | ForEach-Object { "sdk.dir=$_" } | Set-Content (Join-Path $root 'local.properties')
$env:JAVA_HOME = $jdk
$env:ANDROID_HOME = $sdk
$env:ANDROID_SDK_ROOT = $sdk
$env:GRADLE_USER_HOME = $gradleHome
$env:PATH = "$jdk\bin;$PATH"

if ($Release) {
    if (-not $env:KEYSTORE_PASS -or -not $env:KEY_PASS) { throw 'Release needs $env:KEYSTORE_PASS and $env:KEY_PASS' }
    & $gradleBin -p $root :app:assembleRelease :app:bundleRelease --no-daemon --offline
} else {
    & $gradleBin -p $root :app:assembleDebug :app:bundleDebug --no-daemon --offline
}
if ($LASTEXITCODE -ne 0) { throw "Gradle build failed." }

$dist = Join-Path (Split-Path -Parent $root) 'dist-android'
New-Item -ItemType Directory -Force -Path $dist | Out-Null
if ($Release) {
    Copy-Item (Join-Path $root 'app\build\outputs\apk\release\app-release.apk') (Join-Path $dist 'MiniMINDS.apk') -Force
    Copy-Item (Join-Path $root 'app\build\outputs\bundle\release\app-release.aab') (Join-Path $dist 'MiniMINDS.aab') -Force
} else {
    Copy-Item (Join-Path $root 'app\build\outputs\apk\debug\app-debug.apk') (Join-Path $dist 'MiniMINDS-debug.apk') -Force
    Copy-Item (Join-Path $root 'app\build\outputs\bundle\debug\app-debug.aab') (Join-Path $dist 'MiniMINDS-debug.aab') -Force
}
Write-Host "OK: $dist"
Get-ChildItem $dist | Select-Object Name, Length
