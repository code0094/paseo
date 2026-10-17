#!/usr/bin/env bash
set -euo pipefail
repo_root="$(cd "$(dirname "$0")/.." && pwd)"
cd "$repo_root"
export APP_VARIANT=karma CI=1
npm run build:app-deps
cd packages/app
case "${1:-}" in
  ios)
    npx expo prebuild --platform ios
    output="$repo_root/.dev/mobile/ios"
    mkdir -p "$output"
    xcodebuild -workspace ios/PaseoKarma.xcworkspace -scheme PaseoKarma \
      -configuration Release -sdk iphoneos -destination 'generic/platform=iOS' \
      -derivedDataPath "$output/DerivedData" -jobs 2 CODE_SIGNING_ALLOWED=NO build
    staging="$(mktemp -d "$output/package.XXXXXX")"
    mkdir -p "$staging/Payload"
    ditto "$output/DerivedData/Build/Products/Release-iphoneos/PaseoKarma.app" "$staging/Payload/PaseoKarma.app"
    ditto -c -k --keepParent "$staging/Payload" "$output/Paseo-Karma-unsigned.ipa"
    shasum -a 256 "$output/Paseo-Karma-unsigned.ipa"
    ;;
  android)
    : "${ANDROID_HOME:?Set ANDROID_HOME}"
    : "${KARMA_KEYSTORE:?Set the persistent signing keystore path}"
    : "${KARMA_KEYSTORE_PASSWORD_FILE:?Set the signing password file path}"
    : "${KARMA_APKSIGNER:?Set the Android SDK apksigner path}"
    npx expo prebuild --platform android --no-install
    (cd android && ./gradlew :app:assembleRelease --no-daemon --max-workers=2 \
      -PreactNativeArchitectures=arm64-v8a -Dorg.gradle.jvmargs=-Xmx2048m)
    output="$repo_root/.dev/mobile/android"
    mkdir -p "$output"
    "$KARMA_APKSIGNER" sign --ks "$KARMA_KEYSTORE" --ks-key-alias paseo-karma \
      --ks-pass "file:$KARMA_KEYSTORE_PASSWORD_FILE" --key-pass "file:$KARMA_KEYSTORE_PASSWORD_FILE" \
      --out "$output/Paseo-Karma-arm64.apk" android/app/build/outputs/apk/release/app-release.apk
    "$KARMA_APKSIGNER" verify "$output/Paseo-Karma-arm64.apk"
    ;;
  *) echo 'Usage: scripts/build-karma-mobile.sh ios|android' >&2; exit 2 ;;
esac
