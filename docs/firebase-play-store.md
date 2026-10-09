# Firebase Hosting + Google Play (Trusted Web Activity)

The app is a PWA. It is hosted on Firebase Hosting and wrapped as an Android app with
Bubblewrap (Trusted Web Activity), then uploaded to Google Play.

Play Console account: robbincole6@gmail.com (uploading is done by the account owner).

## 1. Host on Firebase
```bash
npm i -g firebase-tools
firebase login
# set the real project id in .firebaserc and twa-manifest.json
npm ci
# build-time settings: Vite inlines VITE_* values into the bundle (see .env.example)
export VITE_BASE44_APP_ID=<your Base44 app id>
export VITE_BASE44_APP_BASE_URL=<your Base44 app URL, e.g. https://your-app.base44.app>
npm run build
firebase deploy --only hosting
```
Site: https://YOUR_FIREBASE_PROJECT_ID.web.app (add a custom domain in the Firebase console if wanted).

### Sign-in (Base44 auth)
Sign-in, Google OAuth and sign-out are handled by Base44, not by Firebase. The SDK builds those URLs from
`VITE_BASE44_APP_BASE_URL`; if it is empty they resolve against the Firebase origin and fail, so it must be set at
build time. Before going live, verify against the real backend that:
- the Firebase site origin (and any custom domain) is accepted by Base44 as a sign-in return target, and
- Base44's API accepts requests from that origin (the SDK calls `https://base44.app/api` by default; see `src/api/base44Legacy.js`), and
- the Google OAuth client allows the origin if it restricts origins.

## 2. Icons
`public/manifest.json` and `twa-manifest.json` both use the PNG icons in `public/icons/`
(`icon-192.png`, `icon-512.png`, `maskable-512.png`). After deploying, confirm the URLs in
`twa-manifest.json` (`iconUrl`, `maskableIconUrl`) return the images, since Bubblewrap downloads them at build time.

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
1. Create app with package id `me.rhgo.app`, upload `app-release-bundle.aab` to an internal/closed test track.
2. Turn on Play App Signing. Copy the **App signing key SHA-256** (Setup → App signing).
3. Put it in `public/.well-known/assetlinks.json`, rebuild and redeploy Firebase so
   https://YOUR_FIREBASE_PROJECT_ID.web.app/.well-known/assetlinks.json serves it. Without this the app shows a browser URL bar.
4. Complete the store listing, content rating, data safety form and privacy policy URL, then promote to production.
   New personal developer accounts must run a closed test with 12+ testers for 14 days first.

## Note
Backend, data and auth run on Base44; Firebase only hosts the frontend.

## Optional: deploy on every merge to main
`.github/workflows/firebase-hosting.yml` deploys the site automatically. It stays skipped until you set, in the
GitHub repo settings (Settings -> Secrets and variables -> Actions):
- variable `FIREBASE_PROJECT_ID`
- secret `FIREBASE_SERVICE_ACCOUNT` (a Google Cloud service account key JSON with the "Firebase Hosting Admin" role)
- required repository variables `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL`; without them, API calls and
  sign-in fail.
- optional repository variables `VITE_BASE44_FUNCTIONS_VERSION`, `VITE_GOOGLE_MAPS_API_KEY`, `VITE_GTM_ID`,
  `VITE_GA4_MEASUREMENT_ID` and `VITE_GSC_VERIFICATION`. Without `VITE_GOOGLE_MAPS_API_KEY`, maps call the
  Base44 `getMapsKey` function, which requires a signed-in user and a backend `GOOGLE_MAPS_API_KEY` or `google_maps`
  setting. Set a browser key or configure that backend key; otherwise collection and expedition maps cannot load.
  (A Maps key is exposed to the browser, so restrict it by HTTP referrer in Google Cloud.)
