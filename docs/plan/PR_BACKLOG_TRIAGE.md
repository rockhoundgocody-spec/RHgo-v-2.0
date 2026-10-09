# PR and branch backlog: triage

Snapshot **2026-10-09** against `main` @ `d59407e` · part of the [master plan](MASTER_PLAN.md)

> **Nothing here has been closed, merged or deleted.** Closing PRs and deleting branches are outward-facing, so they wait for your approval (**D4**). The dispositions are a heuristic plus hand-verification of every security-relevant PR; please skim the **Close** table before approving.

## Summary

| | Count |
| --- | --- |
| Open PRs | **152** (nearly all by `google-labs-jules[bot]`; #533 is yours) |
| Conflict with current `main` | **119** (78 %) · 32 merge cleanly · 1 is a no-op |
| Base commit 31-60 days behind `main` | 88 · 8-30 days: 50 · <= 7 days: 14 |
| Remote branches (excluding `main`) | **170**: 152 are 1:1 with open PRs, **9 already merged**, **9 orphans** |

| Recommendation | PRs |
| --- | --- |
| **Merge now** (verified as a batch) | 15 |
| **Salvage first** (high value, needs a rebase or port) | 2 |
| **Replace** with one systematic fix | 4 |
| **Salvage**: merge distinct test cases into existing files | 5 |
| **Keep**: rebase onto `main`, then CI | 26 |
| **Close**: duplicate / superseded / obsolete / cosmetic | 100 |

## What went wrong (so it does not recur)

See [master plan section 5](MASTER_PLAN.md#5-automation-governance-why-the-backlog-happened-and-how-to-stop-it). The short version, each point verified in the git data:

- **Duplicates.** The same micro-change was proposed over and over: 11 PRs for the expedition route planner, 7 for `CreateCapsuleSheet`, 7 for `suggestNextFinds`, 25 for "remove an unused React import". Several `suggestNextFinds` PRs contradict each other (loop to `flatMap` and back).
- **Contaminated PRs.** `base44-builder[bot]` pushes "External agent changes" onto Jules branches. For example #440, titled as an EXIF security fix, also edits `ARRockBattle.jsx` and two unrelated test files.
- **A deleted target.** Commit `13ce6d5` removed 144 files in one go, so 14 PRs now target files that no longer exist. One more (#474) merges cleanly yet **breaks the test suite**, because it tests `src/lib/mineralStories.js`, a module that commit deleted.
- **Clean does not mean correct.** That is why CI (added in this PR) has to gate merges.

## How the "merge now" batch was verified

I merged all 16 candidate PRs into a throwaway local branch (never pushed), resolving the shared `.Jules/*.md` journal files by line-union. Everything merged without conflicts. Then:

| Check | Result |
| --- | --- |
| `npm run lint` | pass |
| `npm run build` | pass |
| `npm run typecheck:ratchet` | pass (264, no new type errors) |
| `deno lint` + `deno test -A` (type-checked) | pass, 93 tests |
| `npm test` | **1 failing file**: #474 (module deleted on `main`). Without #474: **135 files / 730 tests pass** (baseline 129 / 696, so +34 tests) |

So the batch is the 15 PRs below.

## Recommended order

1. **Merge the 15** (⚑ D4; CI is now there to confirm each). Prefer one at a time or in two groups: backend-touching (#724) and the rest.
2. **Close the 100** with a standard comment (below). This also removes ~100 branches once "auto-delete head branches" is on.
3. **Salvage first**: #533 (port in three slices: empty-`DELETE` guard; owner-filtered GeoDex + first-login subscription; feature-progression gating) and #668 (offline-queue key).
4. **Replace** the four Sentinel PRs with the single `safeError` change ([security backlog S1](SECURITY_BACKLOG.md)).
5. **Merge distinct test cases** from the five test PRs into the existing files (about 70 cases; `main` already has a different file of the same name, which is why they conflict).
6. **Rebase and CI** the 26 keepers; where a cluster had several versions only one is kept.
7. **Branches**: delete the 9 merged ones; review the orphans below before touching them.

Suggested closing comment: _"Closing as a duplicate of #X / superseded by <commit or PR> / obsolete (file removed in <sha>). The change is not lost: the branch stays available until it is deleted. Reopen with a rebase if you disagree."_

## Branch cleanup

**Merged into `main`: safe to delete (9)**
`cleanup/remove-dead-code` · `feat/3d-vertex-displacement-mindat-iridescence` · `feat/identifier-uv-lattice-scratch-vault` · `feat/kid-friendly-junior-explorer` · `feat/orb-performance-viz-abilities` · `feat/scannable-identifier-layout-and-digital-collection-flow` · `feat/support-env-maps-key` · `fix/crawl-audit-seo-metadata-and-cosmetics` · `restore-fiery-black-opal-orb`

**Orphans (unmerged, no open PR): review first (9)**

| Branch | Author | Ahead of `main` | Note |
| --- | --- | --- | --- |
| `clover/command-layer` | owner | 4 | unmerged owner work; check before deleting |
| `standalone-supabase` | owner | 3 | the abandoned Supabase path; likely safe once confirmed |
| `cleanup/dead-code-2026-10-03` | owner | 1 | |
| `b44/6a96f6b5...`, `b44/6aa6935b...`, `b44/6ac852d1...` | base44-builder | 5 / 8 / 4 | builder branches; may hold edits not yet synced to `main` |
| `coderabbit/changes/281f107b` | CodeRabbit | 2 | |
| `jules-1640246997341324847-50cf9705`, `palette/weather-panel-accessibility-1347...` | Jules | 1 each | |

## Full table

### Merge now (verified batch) - 15

| PR | Merges vs main | Base age | Title | Why |
| --- | --- | --- | --- | --- |
| #727 | clean | 0d | Palette: Add focus states and aria labels to ExploreEmptyS | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #726 | clean | 2d | Palette: Enhance TestSelector button accessibility and sta | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #724 | clean | 2d | Bolt: Batch quest creation with bulkCreate in field missio | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #723 | clean | 2d | Palette: Add state-aware title tooltips to map control but | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #721 | clean | 2d | Palette: add region role and title tooltip to streak remin | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #720 | clean | 2d | Palette: Hide decorative icons in HolographicVaultView | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #719 | clean | 2d | Palette: Add ARIA combobox accessibility to MapSearchBar | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #718 | clean | 2d | Palette: Enhance Cookie Consent Banner accessibility and m | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #716 | clean | 3d | Palette: Enhance accessibility and micro-UX in CreateListi | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #715 | clean | 3d | Palette: Improve accessibility in BadgeUnlockAnimation mod | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #505 | clean | 37d | Add comprehensive unit tests for dumpCache | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #501 | clean | 37d | refactor AREncounterScreen to extract hook and subcomponen | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #489 | clean | 37d | Add unit tests for offlineCache IndexedDB operations | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #481 | clean | 37d | refactor long function in SpecimenCard | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |
| #447 | clean | 41d | Bolt: avoid redundant badge metrics computation in useBadg | verified: merges cleanly with the other 14 and passes lint, 730 tests, build, deno |

### Salvage first (high value, needs a rebase/port) - 2

| PR | Merges vs main | Base age | Title | Why |
| --- | --- | --- | --- | --- |
| #668 | conflict | 11d | fix insecure storage of offline queue encryption key | real security fix: offline-queue AES key is still stored in localStorage on main (offlineQueue.js:16,90) |
| #533 | conflict | 33d | Wrap authenticated pages in FeatureGate so sealed wings sh | owner's core-loop PR (empty-DELETE guard, ownership-filtered GeoDex, first-login subscription, feature gating); none of it is on main. Port in 3 slices |

### Replace with one systematic fix - 4

| PR | Merges vs main | Base age | Title | Why |
| --- | --- | --- | --- | --- |
| #725 | conflict | 2d | Sentinel: sanitize edge function error responses | error sanitization: fold into the shared safeError helper |
| #722 | clean | 2d | Sentinel: sanitize runDeepAnalysis error responses | error sanitization: fold into the shared safeError helper |
| #717 | clean | 2d | Sentinel: sanitize edge function error responses | error sanitization: fold into the shared safeError helper |
| #714 | clean | 3d | Sentinel: Sanitize error responses in Grok edge functions | error sanitization: fold into the shared safeError helper (42 functions still leak) |

### Salvage: merge distinct test cases - 5

| PR | Merges vs main | Base age | Title | Why |
| --- | --- | --- | --- | --- |
| #648 | conflict | 11d | add unit tests for geo utilities | adds ~24 distinct geo cases; main already has a different geo.test.js, so merge by hand |
| #608 | conflict | 19d | test: add unit tests for OAuthConsent page | adds ~25 OAuth-consent cases (main has 4); merge into the existing file |
| #591 | conflict | 19d | Add error handling and Web Audio unit tests for useIntroAu | adds ~12 error-path cases for useIntroAudio; merge into the existing file |
| #588 | conflict | 19d | test(collection): add comprehensive unit tests for ShareSp | adds ~10 ShareSpecimenButton cases; keep this one, close #590 |
| #502 | conflict | 37d | test(macrostrat): add unit tests for fetchGeologyAt abort  | adds 2 timeout/abort cases for macrostrat |

### Keep: rebase onto main, then CI - 26

| PR | Merges vs main | Base age | Title | Why |
| --- | --- | --- | --- | --- |
| #692 | conflict | 9d | Palette: ExpeditionTeaserModal accessibility and focus sta | conflicts with main; rebase or re-implement |
| #684 | conflict | 10d | Palette: Enhance LandAccessPanel accessibility and link st | conflicts with main; rebase or re-implement |
| #679 | conflict | 11d | Parallelize DB updates in ID_RESULT_APPEND sync handler | conflicts with main; rebase or re-implement |
| #676 | conflict | 11d | Bolt: Parallelize chunked bulk Mineral creation in crawlMi | crawlMindat parallel chunk creation; depends on an unmerged operations.ts extraction, re-apply on entry.ts |
| #674 | conflict | 11d | Extract shared map logic and styles into useGoogleMap hook | conflicts with main; rebase or re-implement |
| #671 | conflict | 11d | Extract AiCandidateRow component in SpecimenDetail | conflicts with main; rebase or re-implement |
| #667 | conflict | 11d | Bolt: Eliminate N+1 query waterfall in weeklyFieldMissions | weeklyFieldMissions N+1 fix; overlaps the verified #724, so re-check after #724 merges (depends on an unmerged operations.ts extraction) |
| #654 | conflict | 11d | Parallelize SyncIdResult updates in applyEvents & fix outc | review together with #679: both parallelise applyEvents DB writes (concurrency-sensitive); #654 also carries an outcome fix |
| #646 | conflict | 11d | Add explicit Mission interface in weeklyFieldMissions test | weeklyFieldMissions typing/bulkCreate; overlaps #724 and #667, re-check after #724 merges |
| #634 | conflict | 15d | Palette: Improve accessibility and micro-UX in Clover Voic | conflicts with main; rebase or re-implement |
| #620 | conflict | 18d | Palette: Improve ShareSpecimenButton accessibility and fee | conflicts with main; rebase or re-implement |
| #603 | conflict | 19d | Optimize Map operations in CollectionDashboard loop | conflicts with main; rebase or re-implement |
| #602 | conflict | 19d | Document useGoogleMapsScript parameters, return values, AP | conflicts with main; rebase or re-implement |
| #578 | conflict | 21d | Palette: Improve EmptyState accessibility, focus states, a | conflicts with main; rebase or re-implement |
| #564 | conflict | 25d | Palette: Enhance ExportBar accessibility and state feedbac | conflicts with main; rebase or re-implement |
| #563 | conflict | 25d | Bolt: Optimize TSP route selection in ExpeditionPlanner wi | only candidate for the ExpeditionPlanner micro-optimization; merge only if a benchmark at realistic N (<=50 stops) shows a gain |
| #562 | conflict | 25d | Palette: Accessible Floating Clover Companion Orb Toggle | conflicts with main; rebase or re-implement |
| #558 | conflict | 27d | Palette: Improve CreateCapsuleSheet micro-UX and accessibi | conflicts with main; rebase or re-implement |
| #548 | conflict | 31d | Palette: Improve accessibility & keyboard focus in MapFilt | conflicts with main; rebase or re-implement |
| #546 | conflict | 31d | Palette: Accessible CaseFileLedger accordion controls | conflicts with main; rebase or re-implement |
| #508 | conflict | 37d | Bolt: optimize DB field projection & specimen aggregation  | keep: DB field projection + aggregation reduces payload; the other six PRs just rewrite the same loop |
| #478 | conflict | 37d | Refactor ProfileDrawer into custom hooks and helper functi | ProfileDrawer refactor (extract hooks); two competing versions exist, keep this one |
| #446 | conflict | 41d | Palette: Add ARIA accessibility and focus state to Hypothe | conflicts with main; rebase or re-implement |
| #443 | conflict | 41d | Palette: Add keyboard focus rings and aria-label to Chrono | conflicts with main; rebase or re-implement |
| #442 | conflict | 41d | Bolt: memoize SpecimenCard to prevent unnecessary list re- | perf: memoize SpecimenCard (distinct from the #481 refactor); verify with a profiler before merging |
| #437 | conflict | 42d | Bolt: optimize useBadgeAwarder payload with field projecti | conflicts with main; rebase or re-implement |

### Close (duplicate / superseded / obsolete / cosmetic) - 100

| PR | Merges vs main | Base age | Title | Why |
| --- | --- | --- | --- | --- |
| #696 | conflict | 9d | Sentinel: Sanitize error responses in AI edge functions | superseded: ditChat/ditClassify already return sanitized errors on main |
| #689 | noop | 10d | remove unused beforeAll import in offlineQueue.test.js | no-op: merge changes nothing |
| #681 | conflict | 11d | Palette: [ExploreEmptyState Keyboard Navigation Focus Styl | duplicate of cluster src/components/explore/ExploreEmptyState.jsx; keep #727 |
| #675 | conflict | 11d | Bolt: optimize suggestNextFinds mineral flattening with fl | duplicate churn on suggestNextFinds (flatMap vs loop, contradicts the Bolt journal's own advice); keep #508 |
| #672 | conflict | 11d | [suggestNextFinds] optimize mineral extraction and query f | duplicate churn on suggestNextFinds (flatMap vs loop, contradicts the Bolt journal's own advice); keep #508 |
| #665 | conflict | 11d | Bolt: refactor nearby minerals extraction using flatMap | duplicate churn on suggestNextFinds (flatMap vs loop, contradicts the Bolt journal's own advice); keep #508 |
| #664 | conflict | 11d | Remove hardcoded Supabase Anon Key and URL fallbacks | obsolete: src/api/standaloneClient.js was deleted in a04eac5 |
| #663 | conflict | 11d | Fix hardcoded Supabase key fallback in standaloneClient | obsolete: src/api/standaloneClient.js was deleted in a04eac5 |
| #662 | conflict | 11d | Fix DOM-based XSS in analytics GTM tag generation | superseded: main validates GTM/GA4 ids (analytics.js:42,73) and URL-encodes them |
| #661 | conflict | 11d | remove hardcoded Supabase publishable key fallback | obsolete: src/api/standaloneClient.js was deleted in a04eac5 |
| #660 | conflict | 11d | Refactor nearbyMinerals set construction using flatMap | duplicate churn on suggestNextFinds (flatMap vs loop, contradicts the Bolt journal's own advice); keep #508 |
| #658 | conflict | 11d | replace empty catch handler with proper error logging in o | tiny logging change in offlineQueue.js; fold into the #668 rebase |
| #657 | conflict | 11d | perf: refactor uncollected nearby minerals extraction usin | duplicate churn on suggestNextFinds (flatMap vs loop, contradicts the Bolt journal's own advice); keep #508 |
| #655 | conflict | 11d | optimize uncollected nearby minerals loop in suggestNextFi | duplicate churn on suggestNextFinds (flatMap vs loop, contradicts the Bolt journal's own advice); keep #508 |
| #617 | conflict | 19d | Palette: Enhance MapSearchBar accessibility and keyboard n | duplicate of cluster src/components/explore/MapSearchBar.jsx; keep #719 |
| #615 | conflict | 19d | Palette: Improve MapSearchBar accessibility and empty sear | duplicate of cluster src/components/explore/MapSearchBar.jsx; keep #719 |
| #607 | conflict | 19d | Sentinel: Fix unvalidated redirect in OAuth Consent | superseded: main validates consent redirects (validateAndGetSafeConsentRedirect in OAuthConsent.jsx) |
| #599 | conflict | 19d | Bolt: optimize fallback quest creation with bulkCreate | obsolete: src/components/hub/QuestEngine.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #590 | conflict | 19d | Add unit tests for ShareSpecimenButton component | duplicate of #588 (same test file, fewer cases) |
| #560 | conflict | 27d | Palette: Enhance ExportBar accessibility and disabled stat | duplicate of cluster src/components/collection/ExportBar.jsx; keep #564 |
| #559 | conflict | 27d | Bolt: optimize expedition route planning algorithm with si | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #557 | conflict | 27d | Palette: Enhance EmptyState accessibility and micro-UX | duplicate of cluster src/components/visuals/EmptyState.jsx; keep #578 |
| #556 | conflict | 27d | Palette: Enhance accessibility and micro-UX for MohsScratc | obsolete: src/components/scan/MohsScratchLab.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #555 | conflict | 27d | Bolt: optimize expedition route planning using single-pass | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #553 | conflict | 28d | Palette: Enhance ExportBar accessibility with state-aware  | duplicate of cluster src/components/collection/ExportBar.jsx; keep #564 |
| #552 | conflict | 28d | Palette: Add ARIA expanded state, controls, and themed foc | duplicate of cluster src/components/nav/FloatingCloverCompanion.jsx; keep #562 |
| #551 | conflict | 28d | Bolt: optimize Dashboard payload and calculation complexit | obsolete: src/components/dashboard/FindsSummary.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #550 | conflict | 31d | Palette: Add dynamic ARIA labels and disabled tooltips to  | duplicate of cluster src/components/collection/ExportBar.jsx; keep #564 |
| #549 | conflict | 31d | Bolt: optimize expedition route calculation with linear pa | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #545 | conflict | 31d | Palette: Enhance ExportBar accessibility and dynamic feedb | duplicate of cluster src/components/collection/ExportBar.jsx; keep #564 |
| #544 | conflict | 31d | perf(explore): optimize nearest-neighbor pathfinding in Ex | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #543 | conflict | 31d | Palette: Enhance ProvenanceCertificateModal accessibility  | obsolete: src/components/scan/ProvenanceCertificateModal.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #542 | conflict | 31d | Bolt: optimize expedition route pathfinding algorithm & fi | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #541 | conflict | 31d | Palette: Enhance CreateCapsuleSheet modal accessibility an | duplicate of cluster src/components/expeditions/CreateCapsuleSheet.jsx; keep #558 |
| #539 | conflict | 33d | Palette: Fix Deno lint error and improve CreateCapsuleShee | duplicate of cluster src/components/expeditions/CreateCapsuleSheet.jsx; keep #558 |
| #538 | conflict | 33d | Bolt: optimize expedition route planner with single-pass n | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #537 | conflict | 33d | Palette: Enhance MohsScratchLab accessibility and fix Deno | obsolete: src/components/scan/MohsScratchLab.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #536 | conflict | 33d | Palette: Enhance CreateCapsuleSheet accessibility and micr | duplicate of cluster src/components/expeditions/CreateCapsuleSheet.jsx; keep #558 |
| #535 | conflict | 33d | Bolt: optimize expedition route pathfinding with linear mi | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #534 | conflict | 33d | Palette: Enhance MohsScratchLab tool button accessibility  | obsolete: src/components/scan/MohsScratchLab.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #531 | conflict | 35d | Palette: improve CreateCapsuleSheet accessibility and form | duplicate of cluster src/components/expeditions/CreateCapsuleSheet.jsx; keep #558 |
| #530 | conflict | 35d | Bolt: optimize nearest-neighbor route planning algorithm i | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #529 | conflict | 35d | Palette: Enhance ExportBar accessibility and focus feedbac | duplicate of cluster src/components/collection/ExportBar.jsx; keep #564 |
| #528 | conflict | 36d | Palette: Add keyboard focus states to Offline Topo Sync bu | obsolete: src/components/explore/OfflineTopoSync.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #527 | conflict | 36d | Palette: Enhance expedition capsule sheet accessibility an | duplicate of cluster src/components/expeditions/CreateCapsuleSheet.jsx; keep #558 |
| #526 | conflict | 36d | Palette: Enhance CreateCapsuleSheet dialog accessibility & | duplicate of cluster src/components/expeditions/CreateCapsuleSheet.jsx; keep #558 |
| #525 | conflict | 36d | Bolt: optimize nearest-neighbor route pathfinding in Exped | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #523 | conflict | 37d | Bolt: optimize expedition route planning algorithm | duplicate of #563 (same nearest-neighbour micro-optimization) |
| #522 | conflict | 37d | Palette: enhance DailyStreakCard accessibility and ARIA at | obsolete: src/components/hub/DailyStreakCard.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #521 | conflict | 37d | Palette: Improve EmptyState component accessibility and ke | duplicate of cluster src/components/visuals/EmptyState.jsx; keep #578 |
| #520 | conflict | 37d | Palette: Enhance EmptyState component accessibility and ke | duplicate of cluster src/components/visuals/EmptyState.jsx; keep #578 |
| #519 | conflict | 37d | Palette: Add keyboard focus rings to ExportBar export butt | duplicate of cluster src/components/collection/ExportBar.jsx; keep #564 |
| #506 | conflict | 37d | remove unused React import in DeferredSection.jsx | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #504 | conflict | 37d | Bolt: eliminate N+1 Cache API queries in offline tile pref | obsolete: src/lib/useOfflineTiles.js was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #503 | conflict | 37d | optimize ARRockBattle fighter emoji lookup using Map | obsolete: src/components/hub/ARRockBattle.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #500 | conflict | 37d | Fix insecure random number generation in getDeviceId | superseded: main's getDeviceId uses crypto.randomUUID/getRandomValues (Math.random only as last resort) |
| #499 | conflict | 37d | Fix Open Redirect vulnerability in OAuthConsent redirect U | superseded: same open-redirect fix as #607; already on main |
| #498 | conflict | 37d | replace insecure PRNG in getDeviceId with Web Crypto API | superseded: same getDeviceId fix as #500; already on main |
| #497 | conflict | 37d | remove unused React import in AuthLayout | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #496 | conflict | 37d | Fix insecure random number generation in getDeviceId | superseded: same getDeviceId fix as #500; already on main |
| #495 | clean | 37d | remove unused React import from src/main.jsx | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #493 | clean | 37d | remove unused React import in GoogleIcon | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #492 | conflict | 37d | fix(security): prevent open redirect in OAuth consent page | superseded: same open-redirect fix as #607; already on main |
| #491 | conflict | 37d | refactor(SpecimenDetail): extract modular sub-components a | duplicate of cluster src/pages/SpecimenDetail.jsx; keep #671 |
| #490 | conflict | 37d | remove unused React import in AuthLayout | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #488 | conflict | 37d | remove unused React import in Layout.jsx | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #487 | clean | 37d | remove unused React import from UserNotRegisteredError | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #486 | conflict | 37d | Refactor PsvProvenancePanel into modular components | obsolete: src/components/psv/PsvProvenancePanel.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #485 | clean | 37d | remove unused React import in PermissionsPrompt | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #484 | conflict | 37d | remove dead code comment in LiveScanStage | obsolete: src/components/scan/LiveScanStage.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #483 | conflict | 37d | [security] add Secure and SameSite=Lax flags to sidebar co | obsolete: src/components/ui/sidebar.jsx no longer exists |
| #482 | conflict | 37d | remove unused React import in ProfileDrawer | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #480 | clean | 37d | remove unused React import in HotspotProximityWatcher | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #479 | clean | 37d | remove unused React import from GoogleIcon component | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #477 | conflict | 37d | remove unused React import in FacebookIcon | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #476 | conflict | 37d | remove unused React import from AuthLayout | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #475 | clean | 37d | test: add unit tests for dumpCache module | duplicate of cluster src/lib/dumpCache.test.js; keep #505 |
| #474 | clean | 37d | test: add unit tests for mineralStories module | broken: tests src/lib/mineralStories.js, which was deleted on main (verified: suite fails when merged) |
| #473 | clean | 37d | Remove unused React import in PermissionItem | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #472 | conflict | 37d | Refactor ProfileDrawer to extract hooks and menu builder | duplicate of #478 (same ProfileDrawer refactor) |
| #471 | conflict | 37d | remove unused React import in AuthLayout | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #470 | clean | 37d | Remove unused import 'React' from App.jsx | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #469 | conflict | 37d | remove unused React import in ProfileDrawer.jsx | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #468 | conflict | 37d | remove unused React import from FacebookIcon | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #467 | conflict | 37d | remove unused React import in AuthLayout | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #466 | clean | 37d | remove unused import 'React' from CollectionMap.jsx | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #465 | clean | 37d | remove unused React import in HotspotProximityWatcher | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #464 | conflict | 37d | remove unused import 'React' from AuthLayout | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #463 | clean | 37d | remove unused React import from App.jsx | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #462 | clean | 37d | remove unused React import in CollectionMap | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #461 | conflict | 37d | remove unused React import from Layout component | cosmetic: `react/jsx-uses-react` is on and lint passes; do once with a codemod if wanted |
| #445 | conflict | 41d | Fix domain suffix spoofing in removeSpecimenBackground | superseded: base44/shared/imageUrlValidation.ts already does exact/dot-boundary host matching |
| #444 | conflict | 41d | Palette: Accessible lighting tips dialog in ScanModeBar | obsolete: src/components/scan/ScanModeBar.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #441 | conflict | 41d | Sentinel: [HIGH] Fix unsafe domain suffix validation in re | superseded: same domain-suffix fix as #445; already on main |
| #440 | conflict | 42d | Sentinel: Sanitize EXIF metadata before community post and | superseded: main's PostComposer already strips EXIF via src/lib/stripExif.js; PR also bundles unrelated Base44-builder commits |
| #439 | conflict | 42d | Palette: Add accessible feedback for specimen share button | duplicate of cluster src/components/collection/ShareSpecimenButton.jsx; keep #620 |
| #438 | conflict | 42d | Palette: improve ARIA accessibility for ScanModeBar tips s | obsolete: src/components/scan/ScanModeBar.jsx was deleted from main by 13ce6d5 (base44-builder, 'External agent changes') |
| #436 | conflict | 42d | Palette: Improve ConfidenceBreakdown toggle accessibility | obsolete: src/components/scan/ConfidenceBreakdown.jsx was deleted from main by 9cd8d9a (base44-builder, 'External agent changes') |
| #435 | conflict | 42d | Bolt: optimize useBadgeAwarder entity queries with field p | duplicate of cluster src/lib/useBadgeAwarder.js; keep #437 |
| #434 | conflict | 43d | Sentinel: Sanitize error response details in ditChat edge  | superseded: ditChat already returns sanitized errors on main |

---
_Method and commands: master plan, Appendix A. "Merges vs main" is `git merge-tree` against the current tip; "Base age" is how many days older the PR's merge-base is than `main`._
