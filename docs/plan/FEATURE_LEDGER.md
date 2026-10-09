# Feature ledger: what to port from the donor repos

Snapshot **2026-10-09** · part of the [master plan](MASTER_PLAN.md) · the "mix and match" half of _trunk + donors_

A feature crosses into `RHgo-v-2.0` only if **all** of these hold (from the master plan): it advances the core loop (Explore, Scan, GeoDex, Auth, Safety/legal, Offline) or an approved roadmap layer · it fits Base44's data model with no new backend · it has no fake science or invented telemetry · it respects the geo-privacy and legal guardrails in `docs/RHGO_BUILD_DIRECTIVE.md` · it ships with tests, an accessibility check and a feature flag · anything that calls a paid model has a cost cap.

Priorities: **P1** next sprint · **P2** after the core loop is complete · **P3** opportunistic · **Hold** needs a decision first · **Skip**.

Page and function domains below were assigned **by name** (~ approximate); the specific candidates were read.

---

## A. RockHound-GO_HUB (109 pages, 99 functions, 79 entities)

HUB is a separate Base44 app: it shares only 5 backend functions (`awardXP`, `createCheckoutSession`, `stripeWebhook`, `xaiVoiceToken`, `_shared`) and 3 entities (`Post`, `Specimen`, `Subscription`) with the trunk, so **nothing is portable as a drop-in**. Port _ideas and logic_, rewritten against RHgo's entities.

### Domain inventory

| Domain | HUB assets (~) | RHgo today ✓ | Recommendation |
| --- | --- | --- | --- |
| Core-loop duplicates (identify, collection, explore, profile) | ~26 pages | all exist, with 696 tests | **Skip**, except the specific P1/P2 items below |
| Safety, legal, land access | `LandAccess`, `LegalityIntelligence`, `FieldAlerts`, `WeatherSafety`, `SpecimenAlerts`; `geoSiteIntel`; Python `access_resolver` | `LandAccessPanel` in Explore; `Hotspot`, `LocationSubmission` entities | **P2**: port the _data-model ideas_ (below), not the code |
| Offline and field tools | `OfflineFieldMode`, `OfflineMap`, `OfflineSyncDashboard`, `FieldPackBuilder`, `FieldVoiceLogger` | `offlineQueue`, `syncPush/Pull`, dictation (`parseSpecimenDictation`) | **P3**: compare designs; `FieldPackBuilder` may be new |
| Learning | `Mineralpedia`, `MineralGuides`, `FieldLessons`, `GeoTutorChat`, `EducationHub`, `LearningCenter`, `MineralNewsFeed` | `AgateGuide`, `Docs`; mineral stories were deleted in `13ce6d5` | **P2**: roadmap "Learning" layer; this is mostly _content_, so decide scope first |
| Gamification | `GamificationHub`, `Achievements`, `BadgeShowcase`, `Challenges`, `DailyChallenge`, `QuestHub`, `SeasonalHunt`, `StreakCalendar`, `FieldMissions`, `GhostHunt`, `RockIDBattle` | Quests, Badges, Leaderboard, XP ledger, weekly missions | **Skip** (parity); revisit `SeasonalHunt` only |
| Community and social | `Community`, `SocialFeed`, `Guilds`, `ClubFinder`, `Events`, `GroupExpeditions`, `ExpertVerification` | `Community`, `Clubs`, `Expeditions`, `castFindVote`, `progressiveVerify` | **Skip**; roadmap layer already present |
| **Marketplace and commerce** | `Marketplace`, `Store`, `TradeBoard`, `Orders`, `SellerCommandCenter`, `CommerceEngine`, `DisputeDashboard`, ...; ~22 functions incl. escrow, disputes, negotiation, arbitrage, seller trust score | a basic `Market` page and `MarketListing` entity | **Hold** (**D9**). Escrow, disputes and payments carry financial and legal risk; the directive says Market stays roadmap-only. Do not port the engine |
| Trips and trails | `ExpeditionPlanner`, `ItineraryPlanner`, `TripPlanner`, `TrailsRoutes`, `FieldTripManager`; `generateTripPlan`, `trailsNearby` | `Expeditions`, `ExpeditionPlanner` | **Skip**, or P3 for trail data |
| Billing and plans | `Pricing`, `BillingAccount`, `SubscriptionManagement`, `AISubscription` | Stripe flow, `Pricing`, `Paywall`, server-side entitlements | **Skip**; RHgo's is cleaner |
| Ops, admin, analytics | `AdminDashboard`, `AuditCommandCenter`, `AgentsHub`, `Analytics`, `ConversionPaths` | `Admin`, GA/GTM | **Skip** |
| Family and kids | `ParentalDashboard` | `FamilyProfile` entity; a merged `feat/kid-friendly-junior-explorer` branch | **Hold** (**D8**): under-13 obligations come first |
| AR | `ARVeinMap` | `components/ar/` | **Skip** |

### Specific candidates (read, not just listed)

| Pri | Asset | What it does ✓ | Plan |
| --- | --- | --- | --- |
| **P1** | `geoObfuscate` (52 lines) | Snaps coordinates to a coarse grid (~0.005 / 0.01 / 0.02 degrees by requested precision), coarser for `kid_safe_mode` (0.02) and `stealth` (0.05) privacy modes. **Deterministic**, so repeating a request reveals nothing new | Fixes [R-6](SECURITY_BACKLOG.md): RHgo's `fuzzCoordinates` adds independent random noise per call, which averages out. Port as `base44/shared/geoPrivacy.ts` with tests; consider adding a keyed per-specimen offset. **Do not copy** its response, which echoes the exact input coordinates, nor its `e.message` error |
| **P1** | `scanConfidence` (47 lines) + `identifyByProperties` (164 lines) | Buckets confidence (HIGH >= 0.85, MED >= 0.55, else LOW) and recommends tests below 0.85 (streak, hardness scratch, acid, UV). `identifyByProperties` identifies from observed properties (colour, Mohs, streak, luster, crystal system, cleavage, fracture) | Implements the directive's "confidence, test prompts". Re-implement on Base44 `InvokeLLM`: the HUB version calls **OpenRouter** (extra vendor and key). The front end existed as `MohsScratchLab.jsx` and `AngleGuide.jsx`, deleted in `13ce6d5`: restore from `13ce6d5^` rather than rewriting |
| **P2** | Python `access_resolver.py` (348 lines), `identify_pipeline.py` (322), `logbook_normalizer.py` (182) | Land-access resolution with **provenance, verification tier, confidence method and a 180-day staleness rule** (`STALE_AFTER_DAYS = 180`) | Adopt the _concepts_ for access data: every access note carries a source, a verification level and an age, and stale notes degrade to "unknown". The code cannot run (6 missing modules, [H-3](SECURITY_BACKLOG.md)) and is a different stack |
| **P2** | Learning content (`Mineralpedia`, `MineralGuides`, `FieldLessons`) | Reference and lessons | Pick one source of truth and one content format before porting any UI |
| **P3** | `rockhoundMCP` | A bearer-token MCP server exposing site search, nearby sites, land-access checks | A differentiator for AI-agent users; needs its own security review. Park |
| **P3** | `FieldPackBuilder` | Builds a field checklist/pack | Check against RHgo's expedition features first |
| **Skip** | `calculateTrustScore` | Seller reputation from escrow, feedback and shipping | Part of the Hold commerce stack |

---

## B. Ai-i-want-for-game (48 files, 2 commits)

A Google AI Studio prototype with a "NEURAL" cyber aesthetic. Its value is in a few _ideas_; the architecture (client-side Gemini, Firestore, Express/Mongo server) does not transfer, and parts of it are unsafe ([security backlog](SECURITY_BACKLOG.md) G-1..G-3).

| Pri | Asset | What it is ✓ | Plan |
| --- | --- | --- | --- |
| **P2** | `components/DiscoveryReveal.tsx` (131 lines) | A four-phase reveal: flash, rarity-coloured beam, specimen, info card. Matches the directive's "make Scan the reveal moment" | Port the **sequence**, not the code, on Framer Motion, with `prefers-reduced-motion` honoured and a tone that fits an ethical, science-forward product. Note its "Local Archive" and "Broadcast" buttons have no handlers, and the 3D model is loaded from `aistudiocdn.com` |
| **P2** | Identification schema in `services/geminiService.ts` (`identifyRock`) | Structured output: crystal system, cleavage, hardness, petrology, formation genesis, rarity, an `isGeologicalSpecimen` guard | Compare with `identifySpecimen`'s output and add any missing educational fields. Keep calibrated confidence; drop invented fields such as `estimatedValue` unless there is a real source |
| **P3** | `services/audioUtils.ts` (253 lines) | A hybrid sound engine: preloads **10 MP3s from a third-party Google codelab bucket** (`storage.googleapis.com/aistudio-fluff-assets/codelab-rockhound-gcn/...`, not yours, so it can vanish) and synthesises tones only when that fetch fails | Compare with `useIntroAudio` and the Clover voice stack. If adopted, self-host the audio and keep the synthesis fallback |
| **P3** | `CLOVER_CORE_PERSONA` and Gemini Live audio config | A persona prompt and a voice configuration | RHgo already has Clover (`cloverChat`, voice). Compare tone against the directive ("create curiosity, reinforce safety, guide ethical choices"); port nothing wholesale |
| **Skip** | `FusionLab` | Prompts a model to "fuse" two minerals into a plausible hybrid | Invents minerals with "scientific backing", which conflicts with a science-forward product. If ever kept, label it clearly as fiction |
| **Skip** | `AILab` (image edit, Veo video) | Paid generative image/video | Cost and abuse surface, no core-loop value |
| **Skip** | `Scanner.tsx` holographic shader + telemetry | A WebGL scan overlay with **hard-coded fake sensor readouts** (`Scanner.tsx:135`: `accuracy: 99.8`) | Do not port fake telemetry. The marketing line "military-grade AI precision" (`manifest.json:4`) is the same problem |
| **Skip** | `server/`, Firestore rules, `firebase-blueprint.json` | Alternative backend | Not applicable on Base44 |
| **Parity** | Achievements, Statistics, Collection, Map, Weather | Standard features | RHgo already has equivalents (Badges, Leaderboard, Collection, Explore, `enrichSpecimen` weather + lunar data) |

---

## C. Exit criteria for retiring the donors

A donor can be **archived on GitHub** (reversible) when: every P1 and P2 row above is ported or explicitly declined · no domain, Android package (`com.rockhoundgo.hub`) or Base44 app still serves users from it · the owner confirms (**D7**). Until then: no new features, security fixes only if it is live.
