# Firebase Hosting + Google Play (Trusted Web Activity)

The app is a PWA. It is hosted on Firebase Hosting and wrapped as an Android app with
Bubblewrap (Trusted Web Activity), then uploaded to Google Play.

Play Console account: robbincole6@gmail.com (uploading is done by the account owner).

## 1. Host on Firebase
```bash
npm i -g firebase-tools
firebase login
# set the real project id in .firebaserc and twa-manifest.json
npm ci && npm run build
firebase deploy --only hosting
```
Site: https://YOUR_FIREBASE_PROJECT_ID.web.app (add a custom domain in the Firebase console if wanted).

## 2. Before building the Android app
Play needs real PNG icons, not the remote JPG/URL icons currently in `public/manifest.json`:
- add `public/icons/icon-512.png` and `public/icons/icon-512-maskable.png` (plus 192px) and point `manifest.json` at them
- redeploy so the URLs in `twa-manifest.json` resolve

## 3. Build the Android bundle
```bash
npm i -g @bubblewrap/cli
# `bubblewrap init` regenerates twa-manifest.json from the web manifest and would overwrite the
# checked-in package id. Build from the checked-in file instead:
bubblewrap update      # applies ./twa-manifest.json and generates the Android project
# Create the signing key once (KEEP + BACK UP android.keystore and its passwords, never commit them).
# Its alias must match signingKey.alias in twa-manifest.json ("android").
keytool -genkeypair -v -keystore android.keystore -alias android -keyalg RSA -keysize 2048 -validity 10000
bubblewrap build        # signs with android.keystore and produces app-release-bundle.aab
```
`android.keystore` and `*.aab` are gitignored.

## 4. Play Console
1. Create app with package id `com.rockhoundgo.app`, upload `app-release-bundle.aab` to an internal/closed test track.
2. Turn on Play App Signing. Copy the **App signing key SHA-256** (Setup → App signing).
3. Put it in `public/.well-known/assetlinks.json`, rebuild and redeploy Firebase so
   https://YOUR_FIREBASE_PROJECT_ID.web.app/.well-known/assetlinks.json serves it. Without this the app shows a browser URL bar.
4. Complete the store listing, content rating, data safety form and privacy policy URL, then promote to production.
   New personal developer accounts must run a closed test with 12+ testers for 14 days first.

## Note
Backend/data/auth still run on Base44 (and Supabase for RHgo-v-2.0); Firebase only hosts the frontend.
