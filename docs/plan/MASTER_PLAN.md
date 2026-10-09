# Master plan: bring RockHound-GO to "perfect"

Snapshot **2026-10-09** · trunk `main` @ `d59407e` · companion docs: [PR backlog](PR_BACKLOG_TRIAGE.md) · [Security backlog](SECURITY_BACKLOG.md) · [Feature ledger](FEATURE_LEDGER.md)

Legend: **✓** verified (I ran it or read the code) · **~** inferred (reasoned, not executed) · **⚑** needs the owner (a decision, credential or GitHub setting only they have).

---

## 0. TL;DR

**Decision (recommended, ⚑ D1): _trunk + donors_.** Do not merge the three repos. Make `RHgo-v-2.0` the single trunk and the only repo that gets product investment. Treat `RockHound-GO_HUB` and `Ai-i-want-for-game` as **donors**: mine them through a [ledger](FEATURE_LEDGER.md) of specific features, give them just enough hygiene to be safe while they exist, then archive them.

That is a hybrid of your three options: _combine_ into one trunk, _mix and match_ features into it, and do _individual_ work on the donors only to the extent that it makes them safe.

**Already fixed in this PR (all verified locally with the exact CI commands):**

| # | Fix | Before → after |
| --- | --- | --- |
| 1 | `npm run lint` failing on `main` | 2 errors → 0 |
| 2 | The one CI workflow (`deno test -A`) failing type-check | 8 TS errors → 93/93 tests pass, type-checked |
| 3 | No automated gate for the React app | none → lint + 696 tests + build + type-error ratchet on every PR |
| 4 | `twa-manifest.json` pointed at a maskable icon file that does not exist | Bubblewrap could not fetch it → now points at `icons/maskable-512.png` |
| 5 | README linked to a missing doc; required build env undocumented | self-hosted sign-in would silently break → documented |
| 6 | Dead scaffolding (`FINAL-LIVE-DEPLOY/`, stale `pnpm-lock.yaml`, Supabase standalone) | removed / archived |

**Biggest problems still open, in order:**

1. **152 open PRs / 170 branches, 78 % of them conflicting with `main`.** ~100 are duplicates or obsolete. A 15-PR batch is verified safe to merge now. → [triage](PR_BACKLOG_TRIAGE.md)
2. **Nothing enforces quality** until the owner turns on required checks (⚑ D11).
3. **Security hardening** that no open PR covers systematically: 42 of 51 edge functions return raw error text; guest rate limits are bypassable; the offline-queue encryption key sits next to the ciphertext. → [security backlog](SECURITY_BACKLOG.md)
4. **A self-hosted deploy cannot be proven from the repo** (CORS/redirect acceptance by Base44, CSP, placeholders). → §4 Phase 1.8
5. **A single builder-bot commit deleted 144 files** (`13ce6d5`); roadmap-relevant pieces need a deliberate keep/restore decision. → §4 Phase 1.9

---

## 1. Where things stand (measured)

| | **RHgo-v-2.0** (trunk) | **RockHound-GO_HUB** | **Ai-i-want-for-game** |
| --- | --- | --- | --- |
| What it is ✓ | Focused V2 PWA on Base44. The README declares it "the active deployment target" | Sprawling v1 "everything" app (Base44) plus Firebase Hosting / TWA packaging | Google AI Studio prototype: client-side Gemini scan, Firestore, React-Three-Fiber "NEURAL" UI |
| Size ✓ | 55 pages · 246 components · 51 edge functions · 41 entities · 1,268 commits | 109 pages · 565 components · 99 functions · 79 entities · 1,547 commits | 48 files · 2 commits |
| ESLint ✓ | 2 errors (fixed here) | **559** (508 auto-fixable unused imports; 51 are R3F-prop false positives) | none configured |
| Types ✓ | 264 `tsc` errors (checkJs) | **1,391** | 0 |
| Tests ✓ | 696 frontend (129 files) + 93 backend | none | none |
| CI ✓ | Deno only, **red** → frontend + Deno, green | none | none |
| Build ✓ | passes, 22 s, 5.6 MB, 141 JS chunks | passes, 7.3 MB, 184 chunks | passes, but **1.95 MB (504 kB gz) entry chunk** |
| `npm audit --omit=dev` ✓ | 18 (13 high, 0 critical) | 30 (**2 critical**: `jspdf`, `maplibre-gl`) | 6 (**2 critical**: `protobufjs`, `websocket-driver`) |
| Open PRs / remote branches ✓ | **152 / 170** | 0 / 2 | 0 / 1 |
| Backend ✓ | Base44 (`rhgo.base44.app`) | a _different_ Base44 app | Firebase + browser-side Gemini; an unrunnable Express/Mongo `server/` |

**How much do the repos overlap?** ✓ Only 56 of HUB's 1,120 tracked paths exist in RHgo (7 identical). They share **5 of 99** backend functions and **3 of 79** entities. They are different Base44 apps with different data models. The game repo shares no code or schema at all.

---

## 2. Strategy: why _trunk + donors_

| Criterion | A. Combine all into one repo | B. Perfect each individually | **C. Trunk + donors (recommended)** |
| --- | --- | --- | --- |
| Data-model fit ✓ | ✗ HUB's 79 entities and the game's Firestore schema do not map onto RHgo's 41 entities; merging means a data migration project | ✓ | ✓ port features, not schemas |
| Debt imported | ✗ HUB's 1,391 type / 559 lint errors and the game's insecure server come along | none | none: only reviewed code crosses |
| Effort | very high, high regret | 3× the work for one product | low per feature, incremental |
| Matches the README doctrine ("one repo, one build, one URL") ✓ | partially | ✗ | ✓ |
| Where the quality infrastructure is ✓ | would dilute it | duplicated three times | only RHgo has tests (789), a PR flow and the Deno suite |
| Reversible | ✗ | ✓ | ✓ nothing is deleted; donors can be archived, not destroyed |

**What each repo becomes**

- **RHgo-v-2.0**: the product. Gets the roadmap in §4.
- **RockHound-GO_HUB**: _feature quarry_. Gets a role banner, a build/lint gate and an inventory ([ledger](FEATURE_LEDGER.md)). **No new features.** Archive when the ledger's P1/P2 items are ported or declined (⚑ D7).
- **Ai-i-want-for-game**: _prototype quarry_ for the "reveal moment" and the identification schema. Gets a security quarantine, a working PWA build and CI, then is archived the same way.

**Port criteria** (a feature crosses into the trunk only if all hold): advances the core loop or an approved roadmap layer · fits Base44's data model without a new backend · contains no fake science or invented telemetry · respects the geo-privacy / legal guardrails in `docs/RHGO_BUILD_DIRECTIVE.md` · arrives with tests, accessibility checks and a feature flag · has a cost cap if it calls a paid model.

---

## 3. What "perfect" means: measurable quality gates

| Gate | Today (trunk) | Target | Enforced by |
| --- | --- | --- | --- |
| G1 CI green on `main` | red (Deno), no frontend CI | lint, vitest, build, Deno lint + type-checked tests, type ratchet all green | `.github/workflows/ci.yml`, `deno.yml` + required checks (⚑ D11) |
| G2 Type errors | 264 | 0, then make `typecheck` blocking | ratchet, lowered each PR |
| G3 Test depth | 789 tests, no coverage report | coverage thresholds on `src/lib` and `base44/shared` (proposal: ≥ 80 % lines) | `@vitest/coverage-v8` in CI |
| G4 Security | 42 leaking functions, bypassable guest limits | see [security backlog](SECURITY_BACKLOG.md) "exit criteria" | Deno test + CSP check + secret scan in CI |
| G5 Backlog hygiene | 152 PRs, 170 branches | ≤ 10 open PRs, none stale > 14 days, branches auto-deleted | GitHub settings + stale policy (⚑ D11) |
| G6 Accessibility | ad-hoc Palette PRs | 0 serious/critical axe violations on the core-loop pages; full keyboard path | Playwright + `@axe-core/playwright` |
| G7 Performance | 336 kB entry chunk, 455 kB `three.tsl`, 362 kB recharts (all raw, before gzip) | Lighthouse CI budgets (proposal: LCP ≤ 2.5 s on mid-tier mobile, initial JS ≤ 250 kB gz on Explore) | Lighthouse CI |
| G8 Core-loop E2E | none | Playwright: sign-in → scan → choose → GeoDex → go offline → resync | CI nightly + on PR |
| G9 PWA / Play | manifest OK; Firebase/TWA placeholders unset (⚑ D5) | installable, `assetlinks` verified, Play pre-launch report clean | Lighthouse PWA + manual |
| G10 Docs | README fixed here | every env var documented; link checker; runbooks | `lychee` in CI |

Targets in G3, G7 are **proposals**: set the numbers once you have a baseline.

---

## 4. Roadmap

Effort: **S** < ½ day · **M** 1–3 days · **L** ~1–2 weeks (one engineer; estimates, not promises). _Who_: **C** = Claude, **J** = Jules/automation, **⚑** = owner.

### Phase 0: safety net (this PR) ✓ done

See the table in §0. Verification: `npm run lint` · `npm test` · `npm run build` · `npm run typecheck:ratchet` · `deno lint` · `deno test -A` all pass (§Appendix A).

### Phase 1: stabilize the trunk (≈ 2 weeks)

| ID | Task | Size | Who | Acceptance |
| --- | --- | --- | --- | --- |
| 1.1 | Execute the PR triage: merge the verified 15, close ~100 duplicates/obsolete with a standard comment, port the salvage list | M | C after ⚑ D4 | open PRs ≤ 30, then ≤ 10 |
| 1.2 | Turn on required checks (`CI`, `Deno`), "automatically delete head branches", Dependabot/Renovate (its `github-actions` ecosystem keeps the SHA-pinned actions in `ci.yml` current) | S | ⚑ D11 | a red PR cannot merge |
| 1.3 | **One systematic fix for error leakage**: `base44/shared/httpErrors.ts` (`safeError(ctx, err)` logs server-side, returns a generic message + request id), applied to all 42 functions, plus a Deno test that fails if any `entry.ts` puts `.message` in a `Response` | M | C | the test passes; the 4 open Sentinel PRs closed as superseded |
| 1.4 | Unify `@base44/sdk` pins (7 versions today: 0.8.25 → 0.8.53) via one `deno.json` import map | S | C | one version across `base44/` |
| 1.5 | Guest abuse controls: require sign-in for `identify`, or add IP-keyed limits + a bot challenge + a global daily budget breaker | M | C + ⚑ policy | unmetered guest calls = 0 |
| 1.6 | Restrict `isValidImageUrl` to this app's own upload host and path prefix (log-only first, then enforce) and add a per-user rate limit to `removeSpecimenBackground` | S–M | C (needs a real upload URL sample) | arbitrary S3 / other-app URLs rejected |
| 1.7 | Rebase PR #668: non-extractable `CryptoKey` in IndexedDB for the offline queue | M | C | key never appears in `localStorage` |
| 1.8 | **Deploy readiness**: Playwright smoke test from the real Caddy/Firebase origin (sign-in, one function call, no CSP violations); unify the Caddy and Firebase header sets; add immutable caching for `/assets/*` and `no-cache` for `index.html`/`sw.js` to Caddy | M | C + ⚑ (needs a staging origin) | smoke test green on both hosts |
| 1.9 | **Audit commit `13ce6d5`** (144 files, 14,851 lines deleted by `base44-builder`): confirm each removal was intended; restore anything the directive needs from `13ce6d5^` | S | C + ⚑ | keep/restore list signed off |
| 1.10 | **Secrets and key hygiene**: confirm the service API key mentioned in PR #533 was rotated; restrict the Maps and Firebase web keys by HTTP referrer and API | S | ⚑ D6 | confirmed |

### Phase 2: complete the core loop (≈ 3 weeks)

The directive (`docs/RHGO_BUILD_DIRECTIVE.md`) says ship **Explore → Scan → GeoDex → Auth/Profile → Safety/legal → Offline**. Much is built. ✓ I checked the Discovery Choice against `DISCOVERY_PSYCHOLOGY_LAYER.md`: it **is implemented** (`src/pages/Scan.jsx:297-390`: Keep / Leave / Observe, legal-access confirmation, geo-privacy, server-side idempotent XP with `steward` / `explorer` / `collector` categories). The remaining gaps are narrower than the doc implies:

| ID | Task | Size | Notes |
| --- | --- | --- | --- |
| 2.1 | **Port PR #533 in three slices**: (a) empty-`DELETE` guard `assertSafeDeleteQuery` (prevents wiping a table), (b) owner-filtered GeoDex + first-login `Subscription` row, (c) feature-progression gating | L | none of #533 is on `main` ✓; it is the owner's own PR and 33 days stale |
| 2.2 | Reconcile spec and code: the doc says `chattel_collected / affixed_logged / restricted_observed / unknown`, the code uses `collected / left_in_place / observed`. **Update the doc to the code** (cheaper than migrating data); decide whether `restricted_observed` needs distinct behaviour on restricted land | S | |
| 2.3 | Add the two XP categories the spec lists but the code never awards (`scientist`, `mentor`), or drop them from the spec | S–M | |
| 2.4 | Discovery chains (suggest related minerals by site/district): check how `suggestNextFinds` is surfaced in the UI; the deleted `DiscoveryChain.jsx` was a _streak_ widget, not this | M | |
| 2.5 | GPS accuracy gate (reject or flag fixes worse than a threshold), EXIF-strip coverage test for every upload path (avatar, post, scan), offline sync conflict handling (`syncPush` is last-write-wins) | M | open items from the earlier audit (`.github/audits/fable_omni_evolution_blueprint.md`) |
| 2.6 | Core-loop E2E + axe (G6, G8) | M | |
| 2.7 | "Reveal moment" for Scan, informed by the game prototype's sequence (flash → rarity beam → specimen → info) | M | see ledger; no invented telemetry |

### Phase 3: mix and match: port from the donors (parallelizable)

Driven by the [feature ledger](FEATURE_LEDGER.md). Each port is an ADR (one page), a feature flag, tests, an axe check, and a cost cap if it calls a model. Starting candidates: guided identification and rule-based property identification, land-access and legality data model (HUB's Python `access_resolver` as a _design_ reference), Mineralpedia / learning content, field-pack builder, the identification response schema (hardness, petrology, formation genesis).

**Explicitly not recommended**: HUB's marketplace/escrow/dispute engine (financial and legal risk; the directive says Market stays roadmap-only), the game's "Fusion Lab" (invents plausible-sounding hybrid minerals, which conflicts with "science-forward"), Veo video / image-edit labs (cost, no core-loop value).

### Phase 4: quality and performance

Type-error burn-down 264 → 0 (start with `src/lib`, the bulk is TS2339 inference noise fixable with JSDoc typedefs) · coverage thresholds · bundle budgets (lazy-load `three`, `recharts`, `maplibre`) · image pipeline for the 100+ agate WebP files · CSP without `unsafe-eval` / `https:` wildcards, verified by Playwright violation reports · replace unmaintained `react-quill` (open since the earlier audit).

### Phase 5: release and operations

Real Firebase project id and Play identity (⚑ D5) · Bubblewrap build and Play closed test (the doc notes new personal accounts need 12 testers for 14 days) · error monitoring and uptime checks · backup/restore runbook for Base44 data · dependency policy (Renovate + `npm audit` as a CI signal) · release checklist.

### Phase 6: retire the donors

When the ledger's P1/P2 items are ported or declined: archive `RockHound-GO_HUB` and `Ai-i-want-for-game` on GitHub (reversible), update README banners, and confirm no live domain or Base44 app still depends on them (⚑ D7).

---

## 5. Automation governance (why the backlog happened, and how to stop it)

✓ Findings from the triage:

1. **No CI**, so agents could not tell whether their change worked, and nobody could tell either.
2. **No de-duplication.** Each daily agent run starts from `main` and rediscovers the same improvement: 11 PRs optimise the same route planner, 7 polish `CreateCapsuleSheet`, 7 rewrite `suggestNextFinds`, 25 remove an unused React import.
3. **Two bots write to one branch.** `base44-builder[bot]` pushes "External agent changes" onto Jules' PR branches, so PRs carry unrelated edits (e.g. a security PR that also edits `ARRockBattle.jsx`).
4. **Shared journals conflict.** Every Palette/Bolt/Sentinel PR appends to the same `.Jules/*.md` file, which guarantees conflicts between concurrent PRs.
5. **Unreviewed bulk deletion.** `13ce6d5` removed 144 files with the message "External agent changes".

Fixes: cap open PRs per agent (e.g. 3) · require green CI · auto-close PRs idle for 14 days · an agent must search open PRs for the same file before opening one · journals go in per-PR files or are updated only on `main` · stop the builder pushing to non-`b44/*` branches · require a descriptive message and human approval for any commit that deletes more than N files · enable "automatically delete head branches".

---

## 6. Risks and what I could not verify

- ✗ **No browser/E2E run.** CSP, service-worker behaviour, sign-in redirects and layout are untested here. Everything about runtime behaviour is **~** until Phase 1.8 / 2.6.
- ✗ **I cannot see production.** Base44 platform settings (CORS, quotas, RLS in effect), Stripe configuration, Firebase console, Play Console, DNS and live traffic are invisible to me.
- ✗ **Base44 builder interplay.** If the Base44 builder syncs from this repo, a force-removal or large refactor here may be re-applied by the platform. Treat deletions in this PR as reviewable, not final.
- ~ Estimates in §4 are rough.
- ~ PR dispositions are heuristic plus hand-checks on the high-stakes ones; a human must sign off before closing anything.
- ✓ I corrected two of my own earlier conclusions while verifying (the Discovery Choice _is_ implemented; the Stripe webhook's `owner_email` handling _is_ guarded). Treat the **✓** marks as the reliable ones.

---

## 7. Decisions needed from you

| ID | Decision | Why it blocks |
| --- | --- | --- |
| D1 | Ratify _trunk + donors_ | everything else hangs off it |
| D2 | Which domain is canonical: `rhgo.me`, `rockhoundgo.com`, `rhgo.base44.app`/`rhgo2.base44.app`? | CSP, Caddy, sitemap, OAuth return URLs, `assetlinks.json` |
| D3 | Primary host: own server (Caddy), Firebase Hosting, or Base44-hosted | README says "one server path"; docs also describe Firebase/TWA |
| D4 | Approve the PR/branch cleanup lists (I will execute) | closing PRs and deleting branches are outward-facing |
| D5 | Real Firebase project id; Play Console identity; keystore custody | `.firebaserc` and `twa-manifest.json` still say `YOUR_FIREBASE_PROJECT_ID`; `me.rhgo.app` (RHgo) vs `com.rockhoundgo.hub` (HUB) are two Android identities |
| D6 | Rotate secrets: the service API key mentioned in PR #533; any Gemini key ever put in `.env.local` for the game build | |
| D7 | Retire HUB and the game, and when | reversible (GitHub archive) |
| D8 | Is the audience under 13? There is a merged `feat/kid-friendly-junior-explorer` branch, a deleted `JuniorExplorerCard`, HUB's `ParentalDashboard` and a `FamilyProfile` entity | COPPA / Play Families obligations; I am not giving legal advice |
| D9 | Marketplace/escrow/disputes: stay roadmap-only (recommended) or invest, with legal review | |
| D10 | `docs/firebase-play-store.md` contains a personal email address; keep it in a repo? | |
| D11 | GitHub settings I cannot change: branch protection with required checks, auto-delete head branches, Dependabot (the actions in the new `ci.yml` files are already pinned to commit SHAs, verified against the upstream tags; Dependabot would only keep those pins current) | |

---

## Appendix A: how the numbers were produced

```bash
# frontend (RHgo-v-2.0)
npm ci && npm run lint && npm test && npm run build && npm run typecheck:ratchet
# backend: Deno was not installed, so: npm i deno (in a scratch dir)
deno lint && deno test -A            # before the fix: "Type checking failed", 8 TS7006
# PR triage (full history required: git fetch --unshallow)
git fetch origin '+refs/pull/*/head:refs/prs/*'
git merge-tree --write-tree origin/main refs/prs/<n>   # exit 1 = conflict
git cherry origin/main refs/prs/<n> <merge-base>        # patch already applied?
# dependency risk
npm audit --omit=dev
```

The merge-batch probe merged 16 candidate PRs into a throwaway local branch (never pushed): lint, build, ratchet and Deno passed; vitest failed on **one** PR (#474 tests a module deleted from `main`); without it, 135 files / 730 tests passed.
