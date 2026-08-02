# RockHound-GO — Omni-Audit & Evolution Blueprint

**Scope:** repository backing `rhgo.base44.app` (and `rhgo2.base44.app`, which per
`src/lib/useSubscription.js:7-12` is intended to be the *same* Base44 app published under a
second domain — one app ID, one database).
**Grounding rule:** every finding below carries a literal `file:line` citation verified by reading
the file. Items that could not be verified are listed under "Not verified" rather than asserted.
**Runner note:** this environment has no shell, so `npm run build` / `npm test` / `deno test` were
not executed here. Verification was done by (a) live preview route + console-error checks and
(b) direct backend function invocation. CI commands to run are given in Phase 3.

---

## Phase 1 — Sub-system findings

### 1. Multi-tenant isolation boundaries
- `base44/entities/PrivateRockLog.jsonc` — read/update/delete scoped to `data.owner_email` +
  `created_by_id`. Correct; the private log is not readable cross-tenant.
- `base44/entities/Post.jsonc`, `MarketListing.jsonc` — `"read": {}` (fully public). Intended for a
  community feed/marketplace, but note both carry `location_label`, so locality precision is a
  product decision, not an isolation bug.
- `base44/entities/TrainingCandidate.jsonc` — **was** missing an explicit owner-or-admin rule set.
  **RESOLVED**: four ops now scoped to `created_by_id` or admin.
- `base44/functions/interactPost/entry.ts:12` — fetches any post by id via `asServiceRole`, but only
  ever mutates reactions/comments attributed to `user.email` (`:21`, `:46`). No IDOR: a caller
  cannot edit another user's post body through this path.

### 2. Offline field mode durability
- `src/lib/offlineQueue.js:25-32` — **FIXED.** Storage-full handler recursed on an identical array
  and silently discarded writes. Now halves the batch per attempt.
- `src/lib/offlineQueue.js:46-63` — **FIXED.** One failing write blocked the whole queue forever.
  Now evicts 4xx immediately and caps transient retries at 5.
- `src/lib/offlineQueue.js:14` — storage is **plaintext localStorage**, not encrypted. Queued finds
  include GPS. Acceptable for a single-user device; flag if kiosk/shared-device use is planned.
- **Open:** no conflict resolution on reconnect. `flushQueue` replays blind; a record edited on
  another device is overwritten last-write-wins (`:53-55`).

### 3. AI pipeline ingestion safety
- `base44/functions/removeSpecimenBackground/entry.ts:15` — **FIXED.** Accepted any external URL
  into a paid image integration. Now host-restricted; verified returning
  `400 image_url must be an uploaded app file` for `evil.example.com`.
- **Open:** no max payload/dimension constraint on scan uploads (`src/pages/Scan.jsx` runner) and no
  EXIF scrubbing before upload — EXIF GPS travels with the photo independent of the app's own
  geo-privacy choice made at `src/pages/Scan.jsx` `saveWithChoice`.
- `src/lib/macrostrat.js:7` — **FIXED.** Unbounded fetch on the scan critical path now aborts at 5s.

### 4. Geo-spatial constraints & legality
- `src/pages/Scan.jsx` `saveWithChoice` — geo-privacy honored server-path and fallback path:
  `private` nulls coordinates, `approximate` rounds to 2dp (~1.1 km). Correct.
- **Open:** no explicit zero-accuracy GPS fallback — `navigator.geolocation` success is accepted
  regardless of `coords.accuracy`, so a 5 km-accuracy fix is stored as an exact find location.

### 5. Transactional walls & entitlements
- `base44/functions/createCheckoutSession/entry.ts:17,31` — **FIXED.** Tier came from the request
  body and the webhook treats metadata as authoritative (`stripeWebhook/entry.ts:13`). A caller
  could buy the $4.99 price and claim `family`. Tier is now resolved server-side from the price's
  Stripe product ID.
- `createCheckoutSession` ↔ `stripeWebhook/entry.ts:89` — **FIXED.** Metadata was set on the session
  only, so `customer.subscription.updated` saw no tier and defaulted every renewal to `field_pro`,
  silently downgrading family subscribers. Now propagated via `subscription_data.metadata`.
- `src/lib/useSubscription.js:39-44` — **FIXED.** Tier cached with no TTL; cancellations never
  propagated within a session. Now 10-minute TTL.
- `src/lib/useSubscription.js:66-73` — **FIXED.** `refresh()` set `loading=true` but the effect only
  depended on `user?.email`, so it never re-fetched — permanent spinner after checkout.
- **Note (by design):** `src/pages/Scan.jsx` free-tier scan counting uses `localStorage` and is
  trivially resettable by the user. Enforce server-side if scan cost becomes material.

### 6. Privacy, anonymization, export
- Geo-privacy: correct at write time (see pillar 4).
- **Open:** EXIF GPS (pillar 3) is the one path that bypasses the user's privacy choice.

### 7. Deprecated routing & admin ops
- `src/components/AdminRoute.jsx:20` — role-gated; `/admin`, `/dev/architecture`,
  `/dev/design-system` are behind it (`src/App.jsx`). Client gate only, which is fine because the
  backend enforces independently:
- `base44/functions/grokCodeAssist/entry.ts:13` and `crawlMindat/entry.ts:34` — both hard-check
  `user.role !== 'admin'` server-side. No privilege-escalation path found.
- **REMOVED:** `src/entities/*.json` (11 orphaned legacy schemas duplicating
  `base44/entities/*.jsonc`) and `src/functions/*.js` (5 superseded by `base44/functions/*/entry.ts`,
  including a duplicate `promoteVerifiedSpecimen`).

### 8. State management & async corruption
- `src/lib/useSubscription.js:34,58` — uses a `cancelled` flag correctly; no setState-after-unmount.
- `src/components/scan/LiveScanStage.jsx:38-77` — rAF loop driven through refs to avoid 60fps
  re-renders, cancelled on unmount. Sound.
- `src/lib/offlineQueue.js:135-145` — `setInterval` retry loop clears itself when the queue empties.

### 9. Dependency risk & infra drift
- **FIXED:** `submitCorrection/entry.ts:4` and `crawlMindat/entry.ts:1` pinned SDK `0.8.25` while the
  rest of the backend used `0.8.31`.
- **Open:** `package.json:72` `react-quill ^2.0.0` — unmaintained, quill-v1 XSS advisories.
- **Open:** repo ships `pnpm-lock.yaml` while README/scripts use `npm` — CI cannot use `npm ci`.
- **Open:** `deno.json:9` excludes `no-unused-vars` from lint, masking dead-binding drift.
- `.gitignore:1-3,30` correctly covers `.env` / `.env.*`. No credentials found in-repo; all keys read
  via `Deno.env.get`.

### 10. Observability & runtime exception safety
- **FIXED:** `crawlMindat/entry.ts:127` returned `error.stack` to the client, leaking internal module
  paths. Now logged server-side, message only to the caller.
- Remaining functions return `error.message` only — acceptable.

---

## Phase 2 — Evolution matrix

| Type | Item | Citation | Status |
|---|---|---|---|
| AUDIT | Client-supplied subscription tier | `createCheckoutSession/entry.ts:17` | Fixed |
| AUDIT | Arbitrary URL into paid image integration | `removeSpecimenBackground/entry.ts:15` | Fixed |
| AUDIT | Stack trace returned to client | `crawlMindat/entry.ts:127` | Fixed |
| AUDIT | TrainingCandidate RLS not explicit | `base44/entities/TrainingCandidate.jsonc` | Fixed |
| AUDIT | EXIF GPS bypasses geo-privacy choice | `src/pages/Scan.jsx` upload path | Open |
| AUDIT | Free-scan quota enforced client-side | `src/pages/Scan.jsx` | Open (by design) |
| FIX | Renewals downgrade family → field_pro | `stripeWebhook/entry.ts:89` | Fixed |
| FIX | `refresh()` never re-fetched | `useSubscription.js:66` | Fixed |
| FIX | Cached tier never expired | `useSubscription.js:39` | Fixed |
| FIX | Offline queue dropped writes when full | `offlineQueue.js:25` | Fixed |
| FIX | Poison write blocked entire queue | `offlineQueue.js:59` | Fixed |
| FIX | No offline conflict resolution | `offlineQueue.js:53` | Open |
| IMPROVE | Unbounded geology fetch on scan path | `macrostrat.js:7` | Fixed |
| IMPROVE | Zero-accuracy GPS accepted as exact | `Scan.jsx` geolocation effect | Open |
| ADD | Backend test coverage (0 → 21 cases) | `base44/shared/*_test.ts` | Added |
| ADD | Token ignore map | `.claudeignore` | Added |
| REPLACE | `react-quill` → `react-quill-new` | `package.json:72` | Open |
| REMOVE | 11 orphaned legacy entity schemas | `src/entities/*.json` | Removed |
| REMOVE | 5 superseded function copies | `src/functions/*.js` | Removed |
| REMOVE | Dead assertion-free test case | `src/lib/mineralRules.test.js:54` | Open |

---

## Phase 3 — Verification commands

Run locally or in CI (see `.github/workflows/`):

```bash
npm install
npm run build          # Vite production build
npm test               # vitest run — frontend units
npx eslint . --quiet   # frontend lint

deno lint                                        # backend lint (scoped to base44/)
deno test -A --no-check base44/shared/           # 21 backend assertions added by this audit
```

Order of application for the remaining open items, highest architectural risk first:
1. EXIF scrubbing before upload (privacy — one helper, called from the scan upload path).
2. Offline conflict resolution (`updated_date` compare before replay).
3. Server-side scan quota (only if AI cost becomes material).
4. `react-quill` → `react-quill-new`; commit a single lockfile.
5. GPS accuracy gate; delete the dead test case; re-enable `no-unused-vars`.