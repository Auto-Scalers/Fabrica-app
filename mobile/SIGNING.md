# Fabrica Android APK — Signing & Internal Distribution

Companion to `eas.json`. This covers building a Fabrica-branded (`com.autoscalers.fabrica.mobile`)
Android APK for sideload / internal Beta distribution. **Not** for Google Play (deferred).

## 1. Package identity (already rebranded)

`app.json` already ships the correct, non-Orca identity:

- `expo.android.package` = `com.autoscalers.fabrica.mobile`
- `expo.ios.bundleIdentifier` = `com.autoscalers.fabrica.mobile`
- `expo.name` = `Fabrica`, `expo.scheme` = `fabrica`

No `com.stablyai.orca` / `onorca.dev` references remain. The only "orca" strings in the
tree are intentional legacy migration keys in `src/storage/preferences.ts` (handling the
old `orca-browser` stored value) — leave those in place.

## 2. Keystore

EAS manages signing credentials. You have two options.

### Option A — let EAS generate & store the keystore (recommended, fastest)

```bash
cd mobile
eas credentials   # choose: Android > Production > Generate new keystore
```

EAS encrypts and stores the upload/ signing key. The `preview` profile in `eas.json`
then signs automatically. You never touch a raw keystore file.

### Option B — bring your own keystore (self-managed)

Generate a keystore once and keep it safe (treat the .keystore + passwords as secrets):

```bash
cd mobile
keytool -genkeypair -v \
  -keystore fabrica-mobile.keystore \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias fabrica \
  -dname "O=Auto-Scalers, CN=Fabrica Mobile"
```

Document the resulting locations/secrets in your environment, e.g.:

```bash
# .env (DO NOT COMMIT) or CI secret store
export FABRICA_ANDROID_KEYSTORE="$PWD/fabrica-mobile.keystore"
export FABRICA_ANDROID_KEY_ALIAS="fabrica"
export FABRICA_ANDROID_KEYSTORE_PASSWORD="********"
export FABRICA_ANDROID_KEY_PASSWORD="********"
```

`FABRICA_ANDROID_KEYSTORE` is the path to the keystore file. Upload it to EAS so cloud
builds can sign with it:

```bash
eas credentials   # Android > Production > Upload existing keystore
```

`fabrica-mobile.keystore` is git-ignored — never commit it.

## 3. Build (internal / sideload APK)

Requires: EAS CLI (`npm i -g eas-cli`), an Expo account, and
`EXPO_TOKEN` (or `eas login`).

```bash
cd mobile
eas build -p android --profile preview
```

- `distribution: "internal"` → produces an installable **APK** (not AAB).
- The APK is uploaded to EAS and a download URL / QR is printed.
- Testers install by opening the URL or scanning the QR (internal distribution).
- To also receive it in the EAS dashboard / email, keep `distribution: "internal"`.

## 4. Local build (no EAS) — alternative

If you prefer a fully local signed APK (needs Android SDK + `FABRICA_ANDROID_KEYSTORE`):

```bash
cd mobile
expo prebuild --platform android
cd android
./gradlew assembleRelease \
  -PFABRICA_ANDROID_KEYSTORE="$FABRICA_ANDROID_KEYSTORE" \
  -PFABRICA_ANDROID_KEY_ALIAS="$FABRICA_ANDROID_KEY_ALIAS" \
  -PFABRICA_ANDROID_KEYSTORE_PASSWORD="$FABRICA_ANDROID_KEYSTORE_PASSWORD" \
  -PFABRICA_ANDROID_KEY_PASSWORD="$FABRICA_ANDROID_KEY_PASSWORD"
# APK: android/app/build/outputs/apk/release/app-release.apk
```

(Requires adding the corresponding `signingConfigs` block to the generated
`android/app/build.gradle` reading those `-P` properties.)

## 5. What this environment is missing (build could NOT run here)

- `eas` CLI not installed
- `EXPO_TOKEN` / `eas login` not present
- Android SDK (`ANDROID_HOME`) not set
- No keystore / `FABRICA_ANDROID_KEYSTORE` provided
- No network access to install `eas-cli` in this sandbox

The PM must run section 2 + 3 on a machine with EAS access.
