# Security backlog

Snapshot **2026-10-09** · part of the [master plan](MASTER_PLAN.md)

Everything below was found by reading code or running commands in this session (✓), not by penetration testing. Where a finding depends on something I cannot see (Base44 platform settings, the live site, cloud consoles) it says so. **Severity** is my judgement of impact if the issue is exploited in the way the repo is meant to be deployed:

- **High**: unauthenticated or low-privilege abuse that costs money, breaks privilege boundaries or leaks private data, or a deployable artifact that is insecure by default.
- **Medium**: information disclosure, authenticated abuse, or weak defence in depth.
- **Low**: hygiene.

## Overview

| ID | Sev | Repo | Finding | Fix size |
| --- | --- | --- | --- | --- |
| [R-1](#r-1-raw-error-text-returned-by-42-of-51-edge-functions) | ~~Medium~~ **fixed** (Phase 1.3) | RHgo | 42 of 51 edge functions returned raw `error.message`; now one helper plus a guard test | M |
| [R-2](#r-2-guest-rate-limits-are-keyed-by-a-client-supplied-id) | **High** (cost) | RHgo | Guest limits keyed by a client-supplied id; unauthenticated paid-LLM calls | M |
| [R-3](#r-3-image-url-allowlist-is-far-broader-than-its-intent) | Medium | RHgo | `isValidImageUrl` accepts any `*.amazonaws.com` and any `*.base44.app` host | S-M |
| [R-4](#r-4-offline-queue-encryption-key-is-stored-next-to-the-ciphertext) | Medium | RHgo | AES key in `localStorage` beside the data it protects | M |
| [R-5](#r-5-csp-is-weak-and-differs-between-the-two-hosts) | Medium | RHgo | `unsafe-eval` + `unsafe-inline`; Firebase also allows any HTTPS host | M |
| R-6 | Low-Med | RHgo | Coordinate "fuzzing" uses independent `Math.random()` per call, so repeats average out; dictation transcript length unbounded (`parseDictation.ts:11-12`) | S |
| R-7 | Low | RHgo | Checkout idempotency key is a fresh UUID per call, so it prevents nothing (`createCheckoutSession/entry.ts:86`) | S |
| R-8 | Low | RHgo | Webhook calls `auth.me()` when an `Authorization` header is present (`stripeWebhook/entry.ts:69-70`); a webhook has no user session | S |
| R-9 | Low | RHgo | `@base44/sdk` pinned at 7 different versions across `base44/` (0.8.25 to 0.8.53) | S |
| R-10 | Low | RHgo | `getMapsKey` hands a browser Maps key to signed-in users (by design); key restrictions cannot be verified from the repo (**⚑**) | owner |
| R-11 | Info | RHgo | `npm audit --omit=dev`: 18 findings (13 high, 0 critical), mostly build-time transitive (`braces`, `micromatch`, `postcss`...); `socket.io-parser` is a runtime dependency | S |
| [G-1](#g-1-the-gemini-key-is-compiled-into-the-browser-bundle) | **High** if built with a key | Game | `GEMINI_API_KEY` inlined into the client bundle; key also placed in a URL | M |
| [G-2](#g-2-the-express--mongo-server-is-insecure-and-cannot-run) | **Critical** if ever deployed | Game | Hardcoded JWT secret, mock MFA, first-user-is-admin, open CORS | S (delete) |
| [G-3](#g-3-firestore-rules-let-users-write-their-own-xp-level-credits-and-isadmin) | **High** | Game | Users can set their own `xp`, `level`, `credits`, `isAdmin` | M |
| G-4 | Medium | Game | `isAdmin` is derived client-side from an email string (`services/api.ts:142`) and stored in a self-writable document; UI gating only | S |
| G-5 | Medium | Game | Runtime scripts with no integrity pinning: `cdn.tailwindcss.com`, Leaflet from `unpkg.com`, and a dead `esm.sh` import map | M |
| G-6 | Low | Game | Assets you do not own are loaded at runtime: `rock.glb` from `aistudiocdn.com` (`DiscoveryReveal.tsx:70`, `RockDetails.tsx:96`) and 10 MP3s from a third-party Google codelab bucket (`services/audioUtils.ts:12-21`): single points of failure | S |
| G-7 | Info | Game | Firebase web `apiKey` is committed (`firebase-applet-config.json`). Public by design; restrict by HTTP referrer and enable App Check (**⚑**) | owner |
| G-8 | Low | Game | 565 KB AI Studio prompt history committed (`migrated_prompt_history/`); contains one email address, no secrets | S |
| H-1 | Medium | HUB | 95 of 99 functions return raw `error.message` (relevant only while HUB is live) | M |
| H-2 | **High** (deps) | HUB | `npm audit --omit=dev`: 30 findings incl. **2 critical** (`jspdf`, `maplibre-gl`, the latter needs a breaking upgrade) | M |
| H-3 | Info | HUB | Python backend skeleton imports 6 modules that are not in the repo, so it cannot run. **Do not deploy.** | n/a |
| O-1 | **⚑** | all | PR #533's description says a **service API key was pasted into a chat** and "should be rotated". Confirm it was. | owner |

**Exit criteria for the trunk:** no `.message` in any `Response` (enforced by `base44/errorLeakGuard_test.ts`, done); guest paid calls impossible without sign-in or a verified bot challenge; offline key non-extractable; CSP free of `unsafe-eval` and bare `https:` on both hosts with 0 violations in a Playwright run; one SDK version; `npm audit --omit=dev --audit-level=high` reviewed and either clean or each remaining item justified; a secret scanner in CI.

---

## RHgo-v-2.0

### R-1 Raw error text returned by 42 of 51 edge functions

**Evidence ✓** `grep -rnE "\.message" base44/functions --include=*.ts | grep Response` finds 42 return sites in 42 functions, e.g. `stripeWebhook/entry.ts:110`, `identifySpecimen/entry.ts:507`, `getMapsKey/entry.ts:20`, `createCheckoutSession/entry.ts` (cast form `(error as Error).message`). Nine functions already return generic errors: `ditChat`, `ditClassify`, `fieldCommand`, `houndTrial`, `parseSpecimenDictation`, `quickClassifySpecimen`, `syncPull`, `syncPush`, `xaiVoiceToken`.

**Impact.** Provider, database and SDK error strings (hostnames, entity names, stack-derived text) reach any caller.

**Fix.** One helper, not 42 hand edits:

```ts
// base44/shared/httpErrors.ts
export function safeError(context: string, err: unknown, status = 500): Response {
  const id = crypto.randomUUID().slice(0, 8);
  console.error(`[${context}] ${id}`, err);                    // full detail stays server-side
  return Response.json({ error: 'Something went wrong', request_id: id }, { status });
}
```

Apply it in every `catch`. Keep intentional, caller-safe messages (validation errors, 401/403/429) as they are. Frontend code that displays `error` text should be checked (`grep -rn "\.error" src/lib src/pages`) so users still see useful copy.

**Verify.** A Deno test that walks `base44/functions/**/*.ts` (excluding `_test`) and fails if a line containing `Response.json`/`new Response` also contains `.message`. Four open Sentinel PRs (#714, #717, #722, #725) are closed as superseded.

**Status: done in Phase 1.3.** `base44/shared/httpErrors.ts` provides `safeError(context, err, { status?, extra? })` (log the full error under an 8-character reference, answer `{ error, request_id }`) and `logError(context, err)` (for per-item failures inside a larger response). All 42 final `catch` blocks use it, and the three admin functions that returned per-item error text in a success response (`crawlMindat`, `seedSpecimenImages`, `sendWeeklySummary`) now return only a reference such as `error (ref 3fa9c2d1)`. Where a function already logged the error just before returning, the duplicate `console.error` was dropped. `getLeaderboard` and `removeSpecimenBackground` keep the response shape their callers expect through `extra`.

The guard, `base44/errorLeakGuard_test.ts`, is deliberately blunt and stricter than the sketch above: no file under `base44/functions` or `base44/shared` may read an error's text at all. It fails on `.message` or `.stack` (dot, `?.` or brackets), on `String(e)`, `${e}`, `'x' + e`, `e.toString()` (also `e?.toString()` and `(e as Error).toString()`) for a variable bound by a `catch` or a `.catch(...)` handler, with a space or line break allowed wherever JavaScript allows one, and on `const { message } = e` / `catch ({ message })`. The only exemption is the `message` of an LLM completion (`data.choices[0].message`). A log line is not exempt: log the error object (`console.error('what failed', error)`), which is also the more useful log. Nothing is parsed: the whole file is searched, comments and strings included, so a comment cannot hide code and a line break cannot split a match (a comment that has to mention it says "the error's text"). Earlier versions exempted console calls by matching brackets and skipped comment lines; review showed both could be fooled (comments, strings and regular expressions for the scanner; `/* note */ return …` and `e.` followed by a line break for the skip), so they were removed, not patched, and the ten remaining log lines in `liveEyes`, `scanQuota`, `cloverChat`, `quickClassifySpecimen`, `syncPull`, `syncPush` and `weeklyFieldMissions` now log the error object. The guard has its own self-test and refuses to pass if it scans fewer than 50 files; it failed on 49 lines before the conversion. It catches accidental leaks, for example in a bot-written fix, not deliberate obfuscation; review covers those.

Follow-up, low severity: logs now carry whole error objects (as 13 functions already did). Errors thrown by an HTTP client can include the request configuration, headers included. If function logs are ever shipped to a third party, have `logError` log only the error's name, message, stack and status.

Left as is, on purpose: `publishHotspotToInstagram` still returns Instagram's own response body in `detail` on a 502. That is the provider's reply, not an exception, and the function is admin-only (the guard does not look for it). Say so if you want it removed too. The four open Sentinel PRs (#714, #717, #722, #725) are superseded by this change; closing them needs the owner's approval (D4).

### R-2 Guest rate limits are keyed by a client-supplied id

**Evidence ✓** `base44/shared/guestRateLimit.ts:21-24` accepts any string that starts with `g_` and is at least 8 characters. The limits (`identify` 1 per 30 days, `cloverChat` 25/day, `synthesizeSpeech` 40/day) are per id, in an in-memory `Map` plus a `CompanionLog` row keyed by the same id. Callers: `identifySpecimen/entry.ts:175`, `cloverChat/entry.ts:61`, `synthesizeSpeech/entry.ts:22`, `guestScanGate/entry.ts`. A caller who sends a fresh `g_…` id each time is never limited.

**Impact.** Unauthenticated users can drive paid LLM and speech calls with no effective cap. Whether Base44 applies platform-level quotas on top is something I cannot see (**⚑**).

**Fix options (pick one).** (a) Require sign-in for `identify`: simplest, and it reuses the existing monthly member quota in `shared/scanQuota.ts`. (b) Keep guests but add an IP-derived key, a bot challenge (Turnstile/hCaptcha) verified server-side, and a **global daily budget circuit-breaker** that stops all guest calls when exceeded.

**Verify.** A Deno test that two different `g_` ids from the same simulated client IP share one budget, and that exceeding the global breaker returns 429.

### R-3 Image URL allowlist is far broader than its intent

**Evidence ✓** `base44/shared/imageUrlValidation.ts:1` allows `['base44.app', 'base44.com', 'amazonaws.com']`, and lines 19-21 accept the domain or any subdomain. The comment on the caller says "Only process images hosted on our trusted storage domains", but `attacker.s3.amazonaws.com` and any other Base44 app's `*.base44.app` pass. `removeSpecimenBackground/entry.ts` then feeds the URL to a paid image-generation integration. (The suffix-spoofing bug in the earlier Sentinel PRs _is_ fixed: matching is exact or dot-boundary.)

**Fix.** Match this app's own upload host **and path prefix** (include the app id). I need one real production upload URL to write the exact pattern, so ship it in log-only mode first, then enforce. Add a per-user rate limit.

**Verify.** Unit tests: a foreign S3 bucket and another app's host are rejected; this app's upload URL is accepted.

### R-4 Offline-queue encryption key is stored next to the ciphertext

**Evidence ✓** `src/lib/offlineQueue.js:16` defines `KEY_STORAGE_KEY`; lines 57-90 read the raw AES key from `localStorage` and `:90` writes it there (`localStorage.setItem(KEY_STORAGE_KEY, keyBase64)`), while the encrypted queue is in `localStorage` too (`STORAGE_KEY`, lines 15, 162-173). The Sentinel journal's stated threat is local script access or device inspection; with key and ciphertext side by side, neither is prevented.

**Fix.** Generate a **non-extractable** `CryptoKey` and persist the `CryptoKey` object in IndexedDB (structured clone supports it). Be honest in the docs about what this buys: it stops key exfiltration and offline dumps of storage/backups, but code running in your origin can still _use_ the key. The real control against that is R-5 (CSP). Open PR #668 takes this approach: rebase and review it rather than rewriting.

**Verify.** A test that no `localStorage` value contains key material, and that a queue written before the change is migrated.

### R-5 CSP is weak and differs between the two hosts

**Evidence ✓** parsed from `Caddyfile:19` and `firebase.json:37`:

| Directive | Caddy | Firebase |
| --- | --- | --- |
| `script-src` | `'unsafe-inline'` `'unsafe-eval'`, explicit hosts | `'unsafe-inline'` `'unsafe-eval'` **and any `https:` host** |
| `connect-src` | explicit hosts, plus bare `wss:` | **any `https:`**, and a stale `*.supabase.co` |
| `frame-src` | `'self'` + GTM | **any `https:`** |

With `'unsafe-eval'` and `'unsafe-inline'`, the CSP does little against injected script; with `https:` in `script-src` (Firebase) it does nothing.

**Fix.** Work out why each unsafe keyword is needed (candidates: Three/MapLibre shader or WASM paths, inline GTM, `react-quill`). Remove `unsafe-eval`; replace inline scripts with hashes/nonces; use explicit host lists on both hosts; generate both header sets from one source and test that they agree. Remove `*.supabase.co`.

**Verify.** A Playwright run over the core-loop pages with `securitypolicyviolation` listeners: 0 violations, on both a Caddy and a Firebase-emulator origin. **I could not run a browser here, so the current CSP's compatibility is untested (~).**

---

## Ai-i-want-for-game

### G-1 The Gemini key is compiled into the browser bundle

**Evidence ✓** `vite.config.ts:14-15` defines `process.env.API_KEY` and `process.env.GEMINI_API_KEY` from `GEMINI_API_KEY`; `services/geminiService.ts:7` builds the client with it in the browser, and `:79` appends `&key=${process.env.API_KEY}` to a download URL (keys in URLs end up in logs and referrers). With a key present at build time, every visitor can extract it from the JavaScript and spend your quota. (My local build had no key, so the bundle contained none; the mechanism is in the code.)

**Fix.** Call Gemini from a server you control (Cloud Function / Cloud Run / a Base44 function): authenticate the user (Firebase ID token), validate input, rate-limit per user, and enable App Check. Until that exists, do not build with a real key. If AI Studio's own deployment injects and proxies the key for you, say so in the README, since that is a different (safer) setup.

### G-2 The Express + Mongo server is insecure and cannot run

**Evidence ✓** `server/index.js`: hardcoded fallback secret `'rockhound-neural-key-v4'` (`:21`); **mock MFA that accepts any 6 digits** (`:166-168`) and an enrolment that stores the literal secret `"MOCK_SECRET_BASE32"`; the first registered user becomes admin (`:104,110`); CORS reflects any origin with credentials (`:27`); 50 MB JSON bodies (`:33`); the rate limiter covers `/api/` only (`:57`), leaving `/auth/*` open to brute force; handlers return `error.message`. Its dependencies (`express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, …) are **not in `package.json`**, so it cannot even start from this repo, and the app uses Firestore, not Mongo.

**Fix.** Delete it (git history keeps it). Done in the game repo's PR.

### G-3 Firestore rules let users write their own `xp`, `level`, `credits` and `isAdmin`

**Evidence ✓** `firestore.rules:128` allows a user to update their own document if `isValidUser(...)` and the `roles` field is unchanged. `isValidUser` only checks types and minimums, so `xp`, `level`, `credits`, `operatorStats` and `isAdmin` are all self-writable. XP is computed in the browser (`services/api.ts`, `_addRock`). `rocks` documents (`:137,142`) accept any `rarityScore` from 0 to 100 and any extra fields, with no size cap on `imageUrl` (base64 images can exceed Firestore's 1 MiB document limit). Admin by hard-coded verified email (`:77`) is acceptable but brittle.

**Fix sketch (needs emulator tests before it ships ~).** Restrict user updates to profile fields with `request.resource.data.diff(resource.data).affectedKeys().hasOnly(['username','avatarUrl','settings'])`; move XP/level/credits/stats to a Cloud Function using the Admin SDK; require `hasOnly([...])` and size caps on `rocks`; compute `rarityScore`/XP server-side.

**Verify.** `@firebase/rules-unit-testing` against the Firestore emulator (Java 21 is available here; the emulator download was not attempted).

---

## RockHound-GO_HUB

- **H-1.** 95 of 99 functions return raw `error.message`. If HUB stays live, reuse R-1's helper; if it is being retired, do nothing.
- **H-2.** `npm audit --omit=dev`: 30 findings, **2 critical** (`jspdf`, `maplibre-gl`; the `maplibre-gl` fix is a breaking upgrade). Matters only while HUB is deployed, or if code is ported from it with its dependencies.
- **H-3.** `src/backend/app/main.py` imports `app.core.trusted_route`, `app.routes.analysis`, `app.routes.findings` and (via services/schemas) `app.models.trust`, `app.services.trust`, `app.schemas.trust`. None exist in the repo ✓. Its trust/provenance model is a useful **design** reference (see the [ledger](FEATURE_LEDGER.md)); it is not deployable.

---

## Verified non-issues (so nobody re-raises them)

- **Stripe webhook** (`stripeWebhook/entry.ts`) verifies the signature (`constructEventAsync`), is idempotent per event id, ignores out-of-order events, scopes to this app's id, and re-fetches subscription state from Stripe. `String(data.metadata.owner_email)` is reached only after `shouldIgnoreStripeEvent` has rejected events lacking that field.
- **`createCheckoutSession`** requires sign-in, takes price and entitlement from a server-side catalog (never the client), and validates redirect targets.
- **`parseSpecimenDictation`**: the entry file has no auth check, but the helper it delegates to (`parseDictation.ts`) does, and it returns a generic error.
- **HUB `rockhoundMCP`** uses a bearer token (`MCP_BEARER_TOKEN`) and **`marketplaceWebhook`** verifies Stripe signatures; my "no `auth.me()`" scan flagged both, wrongly.
- **Frontend**: zero `dangerouslySetInnerHTML`, `innerHTML =`, `eval(`, `new Function(`, `document.write` in `src/`. Two `target="_blank"` links (`LandAccessPanel.jsx:86`, `Contact.jsx:67`) lack an explicit `rel`; current browsers imply `noopener`, so this is cosmetic.
- **Already fixed on `main`** (so the open PRs for them are redundant): OAuth redirect validation, `getDeviceId` using `crypto`, GTM/GA4 id validation, EXIF stripping (`src/lib/stripExif.js`), domain-suffix matching.
- **Secrets in git history**: I scanned the full history of all three repos for Stripe live/restricted/webhook keys, Google API keys, GitHub/Slack tokens, private-key blocks, Supabase secret keys, JWTs and AWS keys. Only two public-by-design client keys appeared (the game's Firebase web key; a Supabase _publishable_ key in RHgo's removed standalone docs). No private secret was found. A first run of my scan was invalid because of a regex-dialect bug; I caught it because it missed a key I knew was there, fixed it, and re-ran.

## Not verified

Base44 platform behaviour (CORS, quotas, effective RLS), Stripe dashboard and price configuration, Firebase and Google Cloud console restrictions, DNS/TLS on the live domains, anything that needs a browser (CSP, service worker, sign-in), and the Firestore rules under test. Penetration testing was not performed.

## Appendix: functions that returned raw error text (R-1)

_Historical list: all of these were fixed in Phase 1.3 (see R-1)._

`autoClassifySpecimen` `awardVerifiedXP` `awardXP` `castFindVote` `cloverChat` `crawlMindat` `createCheckoutSession` `dailyCheckIn` `dedupeMineral` `ditModels` `enrichSpecimen` `generateFieldMissions` `getCompanionState` `getLatestModel` `getLeaderboard` `getMapsKey` `getPlayerProfile` `getWeeklyBallot` `grokChat` `grokCodeAssist` `guestScanGate` `identifySpecimen` `intentionRoulette` `interactPost` `investigateCase` `processReferral` `progressiveVerify` `promoteVerifiedSpecimen` `publishHotspotToInstagram` `recordDailyCompanionLog` `removeSpecimenBackground` `resolveDepletion` `runDeepAnalysis` `saveBattleResult` `seedSpecimenImages` `sendWeeklySummary` `stripeWebhook` `submitCorrection` `suggestNextFinds` `syncStatsToSheets` `synthesizeSpeech` `weeklyFieldMissions`
