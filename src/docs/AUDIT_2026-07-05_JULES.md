# RockHound-GO — Jules Audit (Delta Pass)
**Date:** 2026-07-05 · **Prev:** 2026-07-04 (composite 69) · **Goal:** 95–97

## What moved since last audit (code-side, this session)
| Domain | Before | After | Δ | Why |
|---|---|---|---|---|
| Monetization | 38 | **72** | +34 | Stripe products+prices live, `createCheckoutSession` tested (returns real checkout URL), `stripeWebhook` registered syncing Subscription on pay/update/cancel, free-tier 5-scan/day gating enforced in Scan, Pricing wired to real price IDs + iframe guard |
| Aesthetic consistency | 72 | **78** | +6 | Onboarding orb → LiquidMetalOrb; Landing contrast bumps |
| Collection / a11y | 83 | **85** | +2 | GitHub palette commits merged (GalleryGrid + Collection contrast) |
| Accessibility | 63 | **70** | +7 | Landing low-contrast text raised to /50–/55 |
| Maps / Explore | 79 | **81** | +2 | Specimen query capped at 500 (unbounded → bounded) |
| Onboarding | 74 | **78** | +4 | Liquid-metal orb unified with Hub/Scan |
| **Telemetry** | — | — | — | TrainingCandidate 75 → **309** (seeder healthy, last_run success, 0 failures) |

## What did NOT move (and why it caps the score)
| Domain | Score | Blocker |
|---|---|---|
| **Public entry / acquisition** | **42** | Still a login wall — live root renders `/login`, not `Landing`. **Requires your dashboard action** (flip app to public). This alone caps the composite. |
| Community | 55 | 0 posts; no seed content or first-post nudge |
| Market / trade | 50 | 0 listings; no liquidity / cold-start |
| Gamification | 80 | Only 6 badge definitions for 362 minerals |
| Ecosystem | 70 | Family co-op marketed in Pricing but unbuilt; `rhgo_mode` kid flag still decorative (nothing reads it) |
| AI / on-device | — | MLModel still 0 records (cloud Gemini only, no fine-tuned model) |
| Subscriptions | — | 0 records — Stripe wired but no test checkout completed yet |

## Composite: **72 / 100** (↑3 from 69)

## Path to 95–97 (ranked, with owner)
1. **[You — dashboard]** Flip the app to **public** so Landing is the unauthenticated entry. (+~20 composite; single highest-leverage action)
2. **[You]** Complete one test checkout (card 4242…) to validate the webhook → Subscription sync end-to-end, then claim the Stripe account + add live keys.
3. **[Code]** Seed 10–15 curated community posts + 5 market listings so social surfaces aren't empty on first real visit.
4. **[Code]** Wire `rhgo_mode` into an adaptive kid layer (bigger tap targets, simpler copy, hide Market) — or drop the kid-gate pretense.
5. **[Code]** Expand badge definitions (target ≥30 rarity-tied) and build the family-account entity/flow or remove the Family tier claim.
6. **[Code]** Full a11y pass across Hub/Scan/Explore (aria-labels on remaining icon buttons, contrast ≥AA on all white/20–30 text).
7. **[Later]** Publish an on-device MLModel + offline tile packs for field reliability.

*Re-run after #1 + #2 to expect composite ~88–92; the remaining 3–7 points come from #3–#7.*

## Session delta (2026-07-05, cont.)
| Item | Status | Notes |
|---|---|---|
| #4 `rhgo_mode` kid layer | ✅ wired | New `useKidMode` hook consumed by CrystalNav (hides Market/trade tab for kids) + Hub (🌟 Explorer Mode badge). Flag no longer decorative. |
| #6 a11y — Hub/Onboarding/Scan | ✅ contrast pass | Sub-AA `text-white/30`/`40` bumped to `/55` across Hub hero subtitle, QuickAction labels, Onboarding quiz subtitle/Skip/step-counter, Scan header subtitle. CrystalNav already had aria-labels. |
| Leaderboard (real ranking) | ✅ new | `getLeaderboard` backend function aggregates unique minerals (Specimen by `created_by_id`) + total weight (CollectionWeight summed) across all collectors; `/leaderboard` page rebuilt with sort toggle + your-rank callout. Replaces fake seed board. |
| #3 community seed | ◐ partial | 6 Clover educational posts seeded (target 10–15). Market listings intentionally not seeded (deceptive to real buyers) — empty-state CTA preferred. |
| #1 public entry / #2 test checkout | ⛔ user/dashboard | Still requires owner action (flip app public, run 4242 checkout, claim Stripe). |