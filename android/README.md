# MiniMINDS Android

Package: `com.miniminds.myapp` - version 1.0.9 (10), minSdk 26, targetSdk 36 (Play Console requirement: API 36+).
Online-first: the app loads the live site `https://codingkonet.github.io/miniminds/#/app`, so web updates sync to Android without a new APK. If offline/unreachable it falls back to the bundled copy in the APK (which is why the web app is still copied into assets at build time). Keep the `gh-pages` branch in sync on every push: `git push origin main:gh-pages`.
Native WebView wrapper around the MiniMINDS web app (bundled in assets, works offline in Demo content, connects to Supabase when online). Pronunciation uses native Android TextToSpeech via the `AndroidTTS` bridge.

## Outputs (in ../dist-android/)

- `MiniMINDS.apk` - signed release APK, install directly on a phone (enable "Install unknown apps").
- `MiniMINDS.aab` - signed release App Bundle, upload to Google Play Console.
- `MiniMINDS-debug.apk` / `.aab` - debug builds for testing.

## Keystore (IMPORTANT)

Release signing key: `C:\Users\ouag\android-toolchain\miniminds-release.keystore`, alias `miniminds`.
Passwords are stored in `../dist-android/private-keystore/KEYSTORE-INFO.txt`.
Keep both private forever and back them up - Google Play rejects updates signed with a different key.

## Rebuild

```powershell
cd C:\Users\ouag\MiniMINDS\android
# debug
powershell -ExecutionPolicy Bypass -File tools\build.ps1
# release (read passwords from KEYSTORE-INFO.txt first)
$env:KEYSTORE_PASS='...'; $env:KEY_PASS='...'
powershell -ExecutionPolicy Bypass -File tools\build.ps1 -Release
```

The build script copies the latest web app (`../index.html`, `app.js`, `data.js`, `style.css`, `supabase-config.js`) into Android assets and bundles Supabase JS locally.

## Testing

Automated (2026-10-24): Robolectric launch tests 2/2 pass (`app/src/test/.../MainActivityTest.java`) -
activity launches, WebView loads `file:///android_asset/www/index.html` with JavaScript/domStorage enabled, back press safe.
Run: `gradle :app:testDebugUnitTest` (see tools/build.ps1 env). APK signature verified with apksigner.
On-device/emulator testing still requires a physical device (this PC has no hypervisor driver for the emulator):
connect a phone with USB debugging, then `adb install ../dist-android/MiniMINDS.apk`.

## Google Play

Upload `MiniMINDS.aab` in Play Console. Note: apps for children must complete the Families / Designed for Families declarations, content rating, and a privacy policy in Play Console.
