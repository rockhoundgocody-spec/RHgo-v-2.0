# RockHound-GO — Grounded Architecture & Evolution Blueprint

Audit date: 2026-09-13. Scope: the accessible branch repository only. This replaces the stale earlier blueprint; prior assertions are not evidence of current behavior.

## Executive status and coverage

**Delivered in this branch:** a storage-independent replication engine implementing the eight specified event types; transaction-contract tests; a nondestructive offline storage-quota fix; escaped map-popup text; repaired Node test fixtures; removal of unused imports reported by ESLint; an ignore map; and a ready-to-apply CI artifact.

**Not delivered:** a PostgreSQL/PostGIS deployment or transaction adapter, Redis, global ETL, training/inference infrastructure, live sync endpoints, new data tables, workflows, a replacement map SDK, new screens, app-store listings, or ten-million-user capacity validation. This is a foundation and scoped audit, not a completed platform rewrite or security certification.

A filesystem/import inventory covered 327 non-test source files and 541 relevant source/backend/schema files, including 47 backend entry files and 34 entity definitions. Inventory is not exhaustive semantic review: deep findings below are limited to the cited files. Static unreferenced-file candidates were NOT deleted; dynamic imports, routes, and tests need manual corroboration.

Only this repository is available. The comment in `src/lib/useSubscription.js:7-12` describes an intended shared backend for two domains; it does NOT prove `rhgo2.base44.app` uses this code or data. That deployment and any separate repository remain unaudited. No production records or Stripe objects were changed. No underlying model switching, global CLI installation, GPU training, or load test was performed.

## 1. Discovery and runtime map

| Boundary | Observed implementation and evidence | Consequence |
|---|---|---|
| Web client | React 18.2 and ReactDOM 18.2, Vite 6, scripts in `package.json:6-13`, `package.json:59-61`, `package.json:95-96` | Retain the working Vite client; do not replace it with a second auth stack. |
| Map | Google map with Leaflet fallback: `src/components/explore/GoogleHotspotMap.jsx:9-15`; full marker loop at `src/components/explore/GoogleHotspotMap.jsx:100-115` | Not a PostGIS vector-tile/server-clustering implementation. |
| API | Base44 request auth and integrations: `base44/functions/identifySpecimen/entry.ts:148-164`, `base44/functions/identifySpecimen/entry.ts:240-252` | Existing inference is an LLM call, not an EfficientNet/ResNet model service. |
| Offline | Browser localStorage queue and AES-GCM key: `src/lib/offlineQueue.js:14-18`, `src/lib/offlineQueue.js:48-90` | Not SQLite/WAL or an atomic replicated outbox. |
| Payments | Server product-tier mapping: `base44/functions/createCheckoutSession/entry.ts:36-48`; signed webhook: `base44/functions/stripeWebhook/entry.ts:64-75` | Preserve signature verification; additional entitlement and ordering work is required. |
| Ingestion | Admin-only HTML mineral crawler: `base44/functions/crawlMindat/entry.ts:29-46`, `base44/functions/crawlMindat/entry.ts:107-115` | Reuse as legacy catalog tooling, not as a global locality ingestion engine. |
| Quality gates | Existing GitHub workflow triggers only main pushes/PRs: `.github/workflows/deno.yml:11-15`; Deno v1 setup at `.github/workflows/deno.yml:28-32` | It is not a complete web build/test/deploy pipeline. |

## 2. Five-type Code Evolution Matrix

Citations reflect this branch after edits unless explicitly marked pre-edit. “AUDIT” means a security/control concern requiring remediation or adversarial verification; it is not a claim that exploitation was observed.

| Priority | Type | Grounded finding | Action and status |
|---|---|---|---|
| P0 | FIX | Offline quota handling previously sliced away half the queued writes, then removed storage. Corrected in `src/lib/offlineQueue.js:170-178`; regression at `src/lib/offlineQueue.test.js:105-130`. | **Implemented:** persist the full queue atomically; throw on failure; do not update cached count before durable success. Existing durable bytes remain intact. Does not solve replay idempotency/concurrency. |
| P0 | AUDIT | PrivateRockLog create checks creator email but read/update/delete trust supplied owner_email: `base44/entities/PrivateRockLog.jsonc:50-70`. | Creation does not bind owner_email to creator, allowing record injection into another owner's scope. Plan immutable creator-based rules plus owner consistency. **Main-branch change required; not applied.** |
| P0 | AUDIT | MarketListing has a user-editable verified field and owner-editable records: `base44/entities/MarketListing.jsonc:50-53`, `base44/entities/MarketListing.jsonc:94-104`. | Row authorization does not restrict which fields an owner can mutate. Move verification to server-controlled metadata or a separate admin-written verification record. **Open.** |
| P0 | AUDIT | Metadata cleaning returns the original blob on decoding/re-encoding failure: `src/lib/stripExif.js:20-25`. | Fail closed, with an explicit user-visible retry, before private uploads. Do not claim EXIF stripping is absent: the scanner calls it at `src/pages/Scan.jsx:119`. **Open; needs capture-flow verification.** |
| P0 | AUDIT | Raw specimen and club text was interpolated into map HTML. Current encoded call sites: `src/components/explore/GoogleHotspotMap.jsx:127-155`; encoder at `src/lib/escapeHtml.js:2-6`. | **Implemented:** encode all six dynamic text values without changing map behavior. Encoder adversarial unit tests added. Whole-site XSS audit remains open. |
| P0 | AUDIT | Caller-supplied prefilled_result bypasses the vision call: `base44/functions/identifySpecimen/entry.ts:240-242`; its fields become specimen data at `base44/functions/identifySpecimen/entry.ts:345-357`. | Treat imported labels as unverified assertions; validate a bounded schema; use server-owned inference receipts for awards/training. **Open.** |
| P0 | AUDIT | Scan quota lives in client state (`src/pages/Scan.jsx:60-76`); identifier authenticates then parses body (`base44/functions/identifySpecimen/entry.ts:150-164`) and invokes paid inference at `base44/functions/identifySpecimen/entry.ts:242-252`. | Enforce server-side quota, rate limits, replay protection, and entitlement before expensive calls. **Open; client gating is not a security boundary.** |
| P1 | FIX | Offline replay can drop 4xx/5-attempt writes at `src/lib/offlineQueue.js:208-215`, and create retries are plain create calls at `src/lib/offlineQueue.js:198-203`. | Preserve dead-letter events; add immutable event IDs and a transaction-backed receipt ledger before retry. **Open in legacy client; new engine contract implements replay receipts.** |
| P1 | AUDIT | Queue AES key is exported to localStorage at `src/lib/offlineQueue.js:73-76`; absent crypto falls back to plaintext at `src/lib/offlineQueue.js:85-90`. | This does not protect against origin script compromise or shared-device access. Design device key lifecycle and account-scoped encrypted IndexedDB. **Open.** |
| P1 | FIX | Identifier defaults to Great Lakes with no GPS: `base44/functions/identifySpecimen/entry.ts:214-220`; global identification is restricted by `base44/functions/identifySpecimen/entry.ts:104-108`. | No GPS must mean unknown region, not regional certainty. Add scientific regression cases before changing the prompt. **Open.** |
| P1 | FIX | Scanner asks for a guess even without evidence: `src/pages/Scan.jsx:148`; backend repeats always-attempt language: `base44/functions/identifySpecimen/entry.ts:248`. | Align both with unknown/alternatives/next-check contract. **Open; no model-accuracy claim.** |
| P1 | AUDIT | Checkout propagates app id only on session, not subscription: `base44/functions/createCheckoutSession/entry.ts:55-65`. Webhook activates on checkout completion without checking payment/subscription state: `base44/functions/stripeWebhook/entry.ts:82-85`. | Add subscription app metadata; validate routed app identity and paid/trial policy; durable event dedupe and ordering before upsert. **Open; no live payment operations performed.** |
| P1 | AUDIT | Deletion helper removes four entities only (`src/components/nav/DeleteAccountDialog.jsx:5-11`) then logs out (`src/components/nav/DeleteAccountDialog.jsx:60-63`), while UI promises profile/photo deletion (`src/components/nav/DeleteAccountDialog.jsx:107-114`). | Add a resumable server erasure job covering owned entities, storage objects, identity, backups/retention and payment obligations. Do not claim account deletion is complete. **Open; destructive test not performed.** |
| P1 | IMPROVE | Map recreates a marker for every visible input point at `src/components/explore/GoogleHotspotMap.jsx:95-115`; heatmap is circles at `src/components/explore/GoogleHotspotMap.jsx:186-197`. | Introduce indexed viewport queries, bounded low-zoom clustering and versioned vector tiles. Current circles are NOT prospectivity predictions. **Planned, not deployed.** |
| P1 | ADD/REPLACE | Crawler dedupes with a full mineral list and names (`base44/functions/crawlMindat/entry.ts:80-88`); it processes records sequentially (`base44/functions/crawlMindat/entry.ts:87-98`). | Build separate locality ETL with source identifiers, raw provenance, resumable jobs, 50m + fuzzy-match conflict review. **Planned.** |
| P1 | AUDIT | Corrections validate only a nonempty string (`base44/functions/submitCorrection/entry.ts:29-45`); accepted correction notes are inserted into inference prompt (`base44/functions/identifySpecimen/entry.ts:227-235`). | Require consent/licensing, owned upload linkage, bounded labels and metadata, independent verification; isolate prompt data from instructions. **Open.** |
| P2 | FIX | Guest tests used browser storage without a fixture (`src/lib/guestDevice.test.js:23-32` pre-edit). Map icon tests initialized real DOM-dependent modules (`src/components/explore/HotspotMap.test.jsx:19-42` pre-edit). | **Implemented:** scoped storage/cookie test doubles and isolate the map renderer, preserving real icon-cache assertions. No product behavior changed. |
| P2 | REMOVE | ESLint reported unused imports in CreateCapsuleSheet, PlayerLegend, ScanResultSheet, Compare, Scan. Current import locations: `src/components/expeditions/CreateCapsuleSheet.jsx:3`, `src/components/hub/PlayerLegend.jsx:7`, `src/components/scan/ScanResultSheet.jsx:3`, `src/pages/Compare.jsx:1-5`, `src/pages/Scan.jsx:1-14`. | **Implemented:** remove only bindings proven unused. No routes, features or packages removed. |
| P2 | AUDIT | Raw exceptions are returned at `base44/functions/identifySpecimen/entry.ts:410-411` and `base44/functions/submitCorrection/entry.ts:48-49`. | Use stable public error codes + redacted server logs + correlation IDs. Error.message is not inherently safe. **Open.** |
| P2 | ADD/REPLACE | Existing CI is Deno-only (`.github/workflows/deno.yml:20-42`); local scripts are in `package.json:6-13`. | **Prepared, not active:** `src/docs/quality-gates.workflow.yml:1-47`. Repo-sync permission blocks writes to `.github/workflows`. Repository administrator must apply it; contact Base44 support for platform permission assistance. |

## 3. High-risk changes implemented and atomic application order

1. Fix the verified local quota-loss path before introducing new network dependencies.
2. Encode map popup values before adding community-supplied geological records.
3. Add `base44/shared/applyEvents.ts` as a reusable server-side transaction coordinator, with tests that do not write real data.
4. Fix the two failing test fixtures and remove unused imports so build/test/lint gates remain meaningful.
5. Replace stale audit assertions with this evidence ledger; supply inactive CI configuration rather than claiming activation.

Representative applied changes (exact source behavior, not a suggested fake backend):

```diff
- cachedQueue = items;
- // retry by discarding half the batch, eventually remove the queue
+ const encrypted = await encryptPayload(items);
+ localStorage.setItem(STORAGE_KEY, encrypted);
+ cachedQueue = items;
```

```diff
- ${s.mineral_name || ''}
+ ${escapeHtml(s.mineral_name)}
- ${c.name || ''}
+ ${escapeHtml(c.name)}
```

Additional main-branch rule changes must keep owners/admins able to perform intended operations and be tested using two identities. Do not rewrite the built-in User auth backend. No existing entity permissions were changed in this branch.

## 4. Replication engine contract and explicit limitations

Implementation: `base44/shared/applyEvents.ts:1-16` defines the required storage adapter; `base44/shared/applyEvents.ts:73-119` implements event handlers; `base44/shared/applyEvents.ts:120-171` coordinates receipts, revisions, conflicts, and cursor generation.

Implemented event vocabulary:
- FIND_CREATE, FIND_UPDATE, FIND_DELETE, FIND_SET_PRIVACY.
- PHOTO_ADD_LOCAL, PHOTO_UPLOAD_POINTER, PHOTO_DELETE.
- ID_RESULT_APPEND.

Properties:
- Principal comes from verified server auth, not event payload.
- Every transaction is owner-scoped; protected fields are rejected.
- Batches max 25, event max 32 KiB; revisions must match exactly.
- Replay of the same event is acknowledged without a new write; changed payload with the same ID is rejected.
- Fingerprints are SHA-256, so receipts do not duplicate raw notes/GPS.
- Revision conflicts persist a needs-review marker, not destructive last-write-wins. Client keeps the original event for review.
- Media pointers require an owner-scoped, hash-matched upload reservation from trusted storage. No arbitrary URL fetch.
- ID records are append-only, bounded, reference a confirmed uploaded photo, and are explicitly client-submitted/unverified.
- Hidden coordinates are cleared; coarse location uses grid quantization. Exact-location opt-in is not implemented; precision 0 is rejected. Quantization is not a mathematical anonymity guarantee.
- Cursor is a decimal string, owner-scoped, allocated under the same serialization lock as commit.

**Storage adapter is intentionally not invented.** The test store in `base44/shared/syncTestStore.js:1-36` is memory-only. Deploying independent Base44 CRUD calls as a “transaction” would not provide the required atomicity. Supply a real PostgreSQL transaction adapter before exposing /sync/push or /sync/pull. No sync endpoint or mock endpoint is exposed to app users.

Adapter implementation requirements:
1. Begin transaction; lock the authenticated owner's sync-head row.
2. Scope reads/writes/media/receipts to owner_id; use unique (owner_id,id) keys.
3. Record row updates, immutable changes, receipts and conflicts in the same commit.
4. Roll back ALL writes on storage failure. Do not acknowledge before commit.
5. Pull: authenticated owner only, ordered cursor > watermark, bounded limit, tombstones included; sign/validate owner-bound cursor tokens at HTTP boundary.
6. Parent deletion hides child photos/results on every pull/read/media-sign path. Object erasure and retention are a separate resumable job; historical change logs may retain prior owner-private data until policy purges them.
7. Preserve local events until durable ACK. Device IndexedDB/SQLite outbox, photo union by hash, automatic safe-field merges, conflict review UI and integration with existing queue remain subsequent work.

Tests establish reducer/adapter-contract behavior, NOT production database isolation, JWT authorization, durable crash recovery, exactly-once delivery across regions, or ten-million-user scalability.

## 5. Target architecture — planned, not provisioned

Retain React web/mobile client and platform-managed authentication. Treat network as a background upgrade path. Add domain repositories for capture, finds, identify, map, media, sync and telemetry; domain internals stay private. Do not introduce a parallel Supabase login system into the current app.

External service boundary, once provisioned: authenticated API gateway → Node service workers → PostgreSQL/PostGIS, Redis, private object storage/CDN; queue-driven ETL and separate GPU inference/training workers. Base44 functions can remain the app-facing integration boundary. PostgreSQL/Redis/server credentials and hosting have not been configured here. Existing platform routes are not arbitrary /api/* REST endpoints; explicit gateway routing is required.

### Data model migration plan

Reuse existing domains instead of making disconnected duplicates:
- Hotspot → locations; Mineral → minerals; bridge → location_minerals.
- Built-in auth identity → users references; PlayerProfile → user_profiles.
- Specimen/PrivateRockLog → find_reports/collection with immutable owner IDs and visibility projections.
- ClubEvent → events, event_attendees; MarketListing → marketplace_items; separate orders/payment ledger.
- Badge/Quest → badges, user_badges, challenges, user_challenge_progress.
- Add location_photos, location_reviews, external_sources, external_records, normalized_records, source_conflicts, geology_overlays, ai_prediction_zones, mineral_identification_samples, user_uploads.
- Add sync_heads, sync_receipts, sync_changes, sync_conflicts. Keep id_results append-only and separate training consent/verification from user confirmation.

These are target migration names, NOT created tables. Migration requires reconciliation/backfill, rollback plan, retention rules and dual-read checks before switching sources of truth.

### Map/cache contract

Viewport query: finite WGS84 bounds, zoom integer 0–22, split antimeridian envelopes, bounded point/cluster count, minimal fields only (id/name/lat/lng/minerals/confidence). Full location details use a separate ID lookup. PostGIS GiST on geometries; geography-distance indexes for meters. Do not use degrees as meters or label unknown access as legal.

Tile cache key: tiles:v1:{dataset_version}:{layer}:{mineral_filter_hash}:{verification_filter}:{z}:{x}:{y}. Redis/CDN only caches public projections. No exact private finds in shared tiles. Cache miss → bounded ST_TileEnvelope query → ST_AsMVT → cache with TTL; single-flight generation and negative-cache empty tiles. Zoom/coordinate validation prevents unbounded queries. Versioned keys avoid stale overlap during dataset rollout.

### Ingestion and conflict engine

Schedule proposal: daily Mindat; weekly USGS deposits/mines; monthly geological overlays; per-source state survey cadence. These schedules are not created: branch workflows cannot be authored here.

Use licensed APIs/downloads, not assumptions about scraping rights. Each adapter declares source authority, schema version, license, attribution and access terms. Fetch with timeout/byte limits and retry/backoff → archive raw object + checksum/source ID/watermark → parse into staging → coordinate/CRS validation → normalize mineral taxonomy → spatial candidate search within 50 meters → fuzzy name comparison → conflict review → transactional merge/load → version bump.

Use unique (source_id,external_id,source_revision) for provenance idempotency. Nearby different mines must not merge solely because names match. Record alternatives and field-level conflicts, never silently overwrite legal status. Unknown/closed/restricted permissions stay separate from occurrence likelihood. Historical mine occurrence does not establish permission to enter or collect.

### Trust score

Proposed transparent heuristic, not trained accuracy: clamp(source_authority + bounded_independent_source_bonus + capped_verified_report_bonus - age_penalty - unresolved_conflict_penalty, 0, 1). Store each factor, formula_version and computed_at. Configure weights only after validation. Recompute via transactional outbox on import, verified report, and conflict resolution. Deduplicate corroborating sources/reporters to resist vote inflation. Trust score is neither mineral probability nor access permission.

### Identification/training/prospectivity

Private image upload → explicit AI/training consent → size/MIME/magic-byte/dimension limits → isolated decode/re-encode → background removal → image normalization/color histogram/texture extraction → versioned CNN inference → conservative geological context fusion → top three candidates, calibrated confidence, references, why and next checks. Keep originals private; store pointers, not blobs in entities. Unknown remains valid. Do not market LLM feedback prompts as CNN training.

Training uses reviewed public licenses and verified consented uploads, deduped by content/specimen to prevent leakage across train/validation/test; geographic holdout, class-balanced evaluation, model registry, immutable dataset manifest, calibration and drift reports, staged promotion and rollback. User confirmation creates a pending label, not ground truth. Uncertain/disputed samples receive higher review priority. No CNN has been trained or benchmarked in this turn.

Prospectivity combines versioned geology/faults/occurrences/associations with spatial cross-validation and sampling-bias controls. Store geometry/mineral/score/explanation/model version/data version/uncertainty. Never invent probability values or display empty/mock cells as prediction output. Separate predicted mineral potential from legal access and hazards.

### Monitoring and scale acceptance

Target ten million registered users is not a concurrency specification. Establish DAU, peak concurrent sessions, scan requests/sec, viewport requests/sec, tile hit ratio, ingest volume, storage growth and region footprint. No benchmark or platform capacity guarantee was obtained.

Measure p50/p95/p99 latency, queue lag, DB locks, cache hit ratio, viewport query time/row counts, ingestion stage failure rate, rejected records/conflicts, model calibration/accuracy/drift, privacy-safe signup aggregates and error rates. Logs must not contain photos, exact GPS, tokens or user notes. Deployment gates: correctness/isolation tests; real-Postgres rollback/concurrent retry tests; 50m/antimeridian geospatial fixtures; offline reconnect crash tests; load/soak/restore tests; alert delivery exercises.

## 6. Verification ledger

Initial post-patch checks: 33 targeted tests passed (25 sync-contract, six offline queue, two encoding), production build passed. Full suite exposed 11 guest-fixture failures and a map-suite setup failure; initial lint exposed 11 unused-import errors. These failures were read and patched rather than hidden/skipped.

Live preview: Explore controls/markers rendered on mobile, no horizontal document overflow; Compare empty state rendered; no captured console errors. The screenshot did not establish successful basemap tile loading. Popup malicious-input rendering and live offline-save gestures were not automatically exercised; their changed logic was unit-tested. No cross-user sessions, camera scans, live sync writes, payments or production records were tested.

Final complete-suite/build/lint result is recorded in the addendum below after the last corrective run. Deno is absent from this runtime (`spawnSync deno ENOENT`); Deno test/lint and PostgreSQL concurrency tests remain unrun. Browser checks do not replace those tests.

Reproduction commands (actual project scripts):
```sh
npm test -- base44/shared/applyEvents.spec.js src/lib/offlineQueue.test.js src/lib/escapeHtml.test.js
npm test
npm run build
npm run lint
# On a machine with Deno installed:
deno lint
deno test -A
# In repository CI, use the committed pnpm lockfile:
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm lint
```

Do not use ignore files to hide test failures, remove assertions, or claim warnings are successes. `.claudeignore` is present for tooling that honors it; it does not enforce security, CI exclusions, or model behavior.

## 7. Deployment blockers and next coherent milestones

1. Complete main-branch ownership/verification rules, AI input/entitlement and erasure fixes with two-identity tests.
2. Provision PostgreSQL/PostGIS + private storage + Redis; implement transaction adapter/push/pull/media signing; integrate a durable local outbox and conflict UI.
3. Build licensed source adapters, provenance/conflict dashboard, resumable ETL and schedules on main.
4. Implement indexed viewport/tile gateway, filtering and public projections before expanding global datasets.
5. Build and validate inference/training pipeline and active learning; only then publish prospectivity outputs.
6. Activate push-triggered quality gates through a repository administrator. This editor's GitHub sync integration lacks permission to change workflow files; the saved YAML is not active. Production deploy credentials/approval and global CLI installation remain unconfigured.
7. Performance/monitoring/load/restore validation, then progressive rollout. Landing redesign, download links, liquid-physics interactions and broad UI expansion are deferred; no fake download buttons or placeholder heatmaps were added.

Nothing on this branch reaches the published app until the builder merges to main and publishes. The second deployment must be independently supplied/verified before extending these findings to it.

## Final verification addendum — 2026-09-13

After correcting the actual failures, the final command results were:

| Check | Actual result | Coverage limit |
|---|---|---|
| `npm test -- --reporter=json --outputFile=/tmp/rhgo-final-verification.json` | Exit 0; **431 passed, 0 failed, 0 pending**, 85 test files | Includes 25 event-engine contract tests with a test-only transactional store, not PostgreSQL. |
| `npm run build` | Exit 0 | Vite production compile, not a deployment or scalability test. |
| `npm run lint` | Exit 0 | Configured frontend ESLint scope; not a dependency-vulnerability scan. |
| Mobile Explore preview | Controls and markers present; no horizontal document overflow; no captured console errors | Basemap tile imagery and malicious popup values were not visually verified. |
| Compare preview | “No specimen to compare” rendered | Existing empty state only; no specimen records were changed. |
| Offline storage fix | Six queue tests pass, including quota-rejection preservation | Live user save gesture and cross-tab racing not automatically verified. |
| Deno backend suites | Not run; Deno executable unavailable | Run in the proposed CI environment. |
| Live PostgreSQL sync / real-user isolation | Not attempted | Adapter/endpoints and second user session not provisioned. |
| GitHub Actions activation/deployment | Not performed | Workflow write refused by sync integration permissions. |
| Second app / global datasets / CNN / 10M load | Not audited, trained, ingested or benchmarked | Remains explicit follow-on work. |

Non-blocking build/test warning: the installed Browserslist dataset is seven months old. No packages were silently upgraded or installed. No tests were skipped to obtain a passing result. Production data cleanup was unnecessary because no production test records were created.