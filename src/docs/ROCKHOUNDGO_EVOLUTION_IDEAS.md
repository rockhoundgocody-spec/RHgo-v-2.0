# RockHoundGO Evolution Plan: Safety-First Regional Beta

**Status:** Approved product direction; execution source of truth for the regional beta  
**Updated:** 2026-08-15  
**Beta geography:** Illinois, Iowa, and Missouri  
**Initial cohort:** 25-50 invited users  
**Decision owner:** Product owner  
**Supersedes for beta decisions:** the broad 2026 evolution brainstorm and any proposal that places community, marketplace, subscriptions, AR, advanced overlays, or national expansion ahead of the core field loop

## 1. Executive decision

RockHoundGO will first prove one complete, responsible field loop:

**Explore a responsible place -> Scan a specimen -> Preserve the find in a private collection.**

The beta wins when a user can answer five questions without guessing:

1. Where might I responsibly explore?
2. What access and collection rules apply?
3. What did I possibly find?
4. How certain is the result, and what evidence is missing?
5. How do I preserve the find without exposing a sensitive location?

When a feature makes RockHoundGO look more impressive but makes access, confidence, privacy, or the next field action less clear, the feature waits.

## 2. Decision hierarchy

When documents, implementation notes, or feature requests conflict, decide in this order:

1. Safety and legal responsibility
2. Verified user need
3. Focused beta scope
4. Accessibility and field usability
5. Data quality and scientific credibility
6. Technical feasibility and performance
7. Brand expression
8. Monetization
9. Future-platform ambition

The product owner records exceptions in the decision log. Safety, privacy, access, and scientific-confidence exceptions require review by the corresponding domain owner before implementation.

## 3. Authoritative beta scope

### Must ship

- Navigation: `Explore`, `Scan`, `Collection`, `More`.
- Responsible-use onboarding with camera, location, and privacy education.
- A regional map/list limited to reviewed Illinois, Iowa, and Missouri records.
- Separate access status, collection status, coordinate quality, publication state, source, and last-verified date.
- Policy-controlled navigation that is impossible for research localities, holds, and unverified entrances.
- Multi-angle capture or an explicit single-image limitation state.
- Ranked identification candidates with calibrated confidence bands, alternatives, supporting traits, missing or conflicting traits, safety notes, and correction/rescan paths.
- A private personal collection with precise find coordinates private by default.
- Privacy-safe sharing that strips image metadata and excludes exact coordinates.
- Offline access to previously reviewed location summaries, rules, warnings, and the user's collection.
- Reporting, correction, monitoring, support ownership, and rollback procedures.

### May ship only after P0 gates

- Collection export.
- Saved locations and recently viewed locations.
- Educational challenges and lightweight badges.
- Expert-review pilot.
- Privacy-safe specimen cards.
- Small, reviewed offline regional packs.

### Disabled behind independent feature flags

- Community posting and trip circles.
- Marketplace, trading, valuation, orders, and escrow.
- Subscriptions and premium entitlements.
- AR encounters and advanced overlays.
- Public leaderboards, competitive progression, and location-revealing social features.
- Public creation of hotspots from user finds.
- National location coverage.

No deferred feature may be represented as production-ready in product copy, screenshots, demos, or store material.

## 4. Personas, jobs, and success criteria

| Persona | Primary job | Top problems | Beta value proposition | Success evidence |
|---|---|---|---|---|
| Active learner | Turn an outing into a safe learning experience | Unclear access, low ID confidence, confusing geology | Clear rules, guided capture, understandable uncertainty | Completes the core loop; correctly explains access and confidence states |
| Serious collector | Preserve credible provenance and compare finds | Shallow records, opaque AI, poor source traceability | Detailed candidates, sources, history, private location controls | Saves a complete record and can reopen, correct, export, or delete it |
| Club leader or educator | Prepare a responsible group activity | Mixed rules, youth safety, inconsistent devices | Qualified destination types, source links, observation-only states | Builds an outing plan without treating education sites as collecting sites |
| Family or first-trip user | Know what is safe and allowed before leaving | Jargon, unclear permissions, weak connectivity | Plain-language rules, large actions, cached essentials | Recovers from denied permissions and completes tasks without assistance |
| Accessibility/adverse-condition tester | Use the app with glare, gloves, larger text, assistive technology, or an older device | Color-only meaning, small targets, motion, weak signal | Redundant labels, readable hierarchy, reduced motion, list alternative | Completes core tasks on the supported device and accessibility matrix |

Specimen buyers/sellers, professional mining operators, investors, and social-media-only audiences are not primary beta personas.

## 5. Product contracts

### Explore

Inputs:

- Optional user location.
- Published regional locations only.
- Policy-aware filters.
- Cached records with freshness indicators.

Required behavior:

- Managed collecting, managed education, research locality, and hold are distinct states.
- Access status and collection status are separate and readable without relying on color.
- Approximate records render as regions or halos, not entrance pins.
- Every map result is available in a list alternative.
- Raw trust scores are never displayed as scientific certainty or a percentage of safety.

### Hotspot detail

- Show collection status, access status, coordinate quality, source, and last-verified date before the primary action.
- Open the official/operator source.
- Require rules acknowledgment before a managed-collecting navigation action.
- Permit navigation only to a verified official entrance or business address.
- Support save, report, and contact actions without implying permission.

### Scan

- Guide two or three useful angles when the pipeline supports them.
- Reject duplicate or unusable images with recovery guidance.
- Explain metadata handling before upload.
- Never turn a model's willingness to answer into a claim of certainty.
- Preserve the model version, prompt version, taxonomy version, and original result.

### Identification result

- Use `strong visual match`, `possible match`, or `uncertain` only when calibrated evaluation supports the band.
- Show ranked alternatives and the traits that distinguish them.
- Show supporting traits and missing or conflicting traits.
- Provide safe, non-destructive follow-up tests where appropriate.
- Provide rescan, correction, unresolved, and expert-review paths.
- Never present `geode` as a mineral species or force a precise fossil identification from an ambiguous fragment.

### Collection

- Exact coordinates are private by default and never required to save a specimen.
- Shared cards exclude exact coordinates, hidden metadata, internal IDs, and private notes.
- Users can edit, reopen as unresolved, export, and delete their records.
- Original AI results and correction history remain auditable.

## 6. Location publication and navigation policy

### Publication state A: verified managed collecting

Required evidence:

- Current operator or agency source.
- Verified official entrance or business address.
- Written collection rules.
- Current permit, fee, reservation, season, and limit details where applicable.
- Contact method and last-verified date.
- No unresolved contradictory source.

Product behavior: navigation allowed; collecting badge shown; rules acknowledgment required; reminder to verify before departure.

### Publication state B: managed educational destination

Required evidence: current facility source, official address, educational purpose, and explicit no-removal or no-implied-collecting treatment.

Product behavior: navigation allowed; education/observation badge; no-removal guidance above the fold.

### Publication state C: research locality

Required evidence: credible geological source, locality/region coordinate, and explicit uncertainty.

Product behavior: no turn-by-turn navigation; region halo; `Research this area` action; ownership and permission checklist.

### Publication state D: hold

Triggers: conflicting identity or coordinates, missing official source, unclear access, unclear collection rule, duplicate, superseded record, or overdue high-risk revalidation.

Product behavior: hidden from beta users and visible only in the internal review queue.

### Minimum location data contract

Every candidate record must support:

- `publication_state`
- `access_status`
- `collection_status`
- `coordinate_quality`
- `navigation_eligible`
- `official_entrance_lat` and `official_entrance_lng`, only where verified
- `region_geometry` or approximate context, where applicable
- `managing_authority`
- `source_url`, `source_type`, `source_retrieved_at`, and `last_verified_at`
- `permit_or_fee_summary`, `seasonal_rules`, and `hazards`
- `review_status`, `reviewer`, and `next_review_at`

`navigation_eligible` is derived and enforced by backend policy. It is not a user-editable or frontend-trusted field.

### Locked regional decisions

- Correct Sheffler Rock Shop from Iowa to Alexandria, Missouri in staging; navigate only to the official business address after current operator revalidation.
- Replace the vague Mazon Creek record with Mazonia-Braidwood SFWA in staging; carry the current permit, season, no-excavation, and no-commercial-collecting rules only after source revalidation.
- Consolidate the two Rockford-area records into Fossil & Prairie Park Preserve; keep removal limits unresolved until directly confirmed.
- Treat Missouri state parks as education/observation only unless written collection permission is current and site-specific.
- Use Missouri Mines State Historic Site as an educational anchor.
- Keep broad mining districts and locality centroids as research context with navigation disabled.

These are staging decisions. Promotion to production requires current official/operator evidence at the time of release.

## 7. AI identification governance

### Input contract

- Two or three user-selected images when supported.
- Bounded file size and allowed formats.
- Image-quality feedback.
- No hidden access to unrelated gallery content.
- EXIF and other sensitive metadata stripped before storage or sharing.
- Optional generalized regional context; exact find coordinates are not required for identification.

### Output contract

- `candidate_id` and `candidate_name`
- `confidence_band`
- `supporting_traits`
- `conflicting_or_missing_traits`
- `alternatives`
- `safety_notes`
- `model_version`, `prompt_version`, and `taxonomy_version`
- `created_at`

Raw provider scores are internal evidence, not automatically calibrated probabilities. The UI confidence band is produced only by a versioned calibration policy.

### Evaluation gate

- Use a labeled, rights-cleared set representing the supported tri-state taxonomy and real phone conditions.
- Measure top-1, top-3, per-class precision/recall, calibration error, abstention rate, and hazardous/unsupported false-confidence cases.
- A `strong visual match` requires at least 90% precision overall and at least 85% precision for every class allowed into that band.
- Hazardous or unsupported material has a zero-tolerance target for high-confidence false positives in the release evaluation set.
- Classes below threshold remain `possible match` or `uncertain`, or are removed from the supported beta taxonomy.
- Corrections create review candidates; they never become truth without review.

## 8. Privacy, safety, and incident controls

### Required defaults

- `geo_privacy` defaults to `private` server-side.
- Exact coordinates are stored only for the owning user under enforced row-level access.
- Public sharing uses a deliberately generalized region chosen by policy, never an automatic transform of the private coordinate alone.
- A user find creates a moderated submission, not a publicly readable hotspot.
- Images used for sharing have metadata stripped and are re-encoded where necessary.
- Normal analytics never contain exact coordinates, raw images, private notes, auth tokens, or unrestricted free text.
- Account deletion and export cover specimens, images, corrections, and precise location data.

### Incident severity and response

| Severity | Example | Required response |
|---|---|---|
| Critical | Exact-coordinate leak, navigation to an unsafe/unverified location, unauthorized collection access | Disable affected feature or data immediately; acknowledge within 1 hour; owner and privacy/safety lead investigate; no beta expansion until closed |
| High | Misleading collection status, unsafe high-confidence result, broken account isolation | Triage within 1 business day; correct or disable within 2 business days |
| Normal | Stale fee, hours, link, or non-safety content | Triage within 3 business days; include in weekly content release |

Moderation and governance changes require an audit trail. Critical features must be independently disableable.

## 9. Architecture decisions for the existing repository

### ADR-001: retain the current platform for beta

Use the existing React 18/Vite client, Base44 SDK, Base44 entities, and Base44 backend functions. Do not introduce a parallel Expo/FastAPI/MongoDB stack during the regional beta unless an accepted ADR demonstrates a release-blocking platform limitation.

### ADR-002: backend owns authority

The frontend owns capture, rendering, local drafts, cache display, permission recovery, and optimistic state. Backend functions and entity policies own publication, navigation eligibility, location promotion, AI confidence-band policy, moderation, user-data access, and any future entitlement decision.

### ADR-003: one canonical location model

Extend or replace the current hotspot contract so that exact coordinates and a generic `land_type` cannot stand in for access, collection, coordinate quality, or publication state. Public reads return only policy-approved fields.

### ADR-004: moderated promotion path

Create a separate location-submission/review path. Client or scan functions may submit evidence, but only a reviewed backend action may create or promote a public hotspot.

### ADR-005: privacy is enforced, not suggested

Make privacy defaults and share redaction server-enforced. Client indicators remain explanatory defense in depth.

### ADR-006: one map abstraction

The repository currently contains multiple mapping libraries. Select one primary beta renderer behind a small adapter, document tile/licensing/offline limits, and remove duplicate production paths after parity is verified.

### ADR-007: bounded offline behavior

Cache only reviewed summaries, rules, warnings, and user-owned collection data needed for field continuity. Show cache age. Queue only idempotent writes. Never let stale cached rules appear more authoritative than a current source.

### ADR-008: provider isolation and observability

Wrap AI, maps, storage, and monitoring providers behind narrow application contracts. Record version, latency, failure class, and cost without logging sensitive payloads.

## 10. Current repository gap assessment

The following observations describe the repository at the time of this update and are not claims that remediation is complete:

| Area | Current evidence | Risk | Gate |
|---|---|---|---|
| Hotspot data | `base44/entities/Hotspot.jsonc` has exact `lat`/`lng`, generic `land_type`, free-text rules/source, and public read, but no publication/access/collection/coordinate-quality states | Approximate or education-only records can look navigable/collectible | P0 blocker |
| Explore UI | `src/pages/Explore.jsx` groups public land and state parks as public and displays `trust_score` as a percentage | Users may infer safety, legality, or scientific certainty from an unsupported score | P0 blocker |
| Specimen privacy | `base44/entities/Specimen.jsonc` supports `geo_privacy`, but it is not required and has no schema default | Exact coordinates can be stored without a durable private-default state | P0 blocker |
| User-find sharing | `base44/functions/identifySpecimen/entry.ts` can create or update a publicly readable hotspot directly from a user find after simple coordinate rounding | Sensitive-site disclosure, unreviewed public data, and permission ambiguity | P0 blocker |
| AI contract | Identification currently accepts one image in the reviewed path and returns a provider confidence number plus value/rarity language | False precision, taxonomy overreach, and premature commercial framing | P0/P1 |
| Feature scope | Explore and navigation code includes route, heat, weather, collection gaps, and AR behavior | Expansion features compete with legal/access clarity and field performance | Feature-flag or defer |
| Offline | Offline cache/queue helpers exist | Useful foundation, but freshness, privacy, idempotency, and conflict rules require acceptance tests | P1 after P0 policy |

No external regional beta begins until the four P0 privacy/location blockers above are fixed and verified.

## 11. Instrumentation and KPI gates

Baselines are unknown until instrumentation is verified. The first two weeks collect a clean baseline; the targets below are initial 90-day gates and may be changed only through the decision log.

| Metric | Definition | Required events | Baseline | 90-day target | Accountable owner | Decision use |
|---|---|---|---|---|---|---|
| Responsible-loop activation | New users who view a qualified hotspot, complete/attempt a scan, and save or resolve a specimen within 7 days / eligible new users | `hotspot_detail_viewed`, `scan_completed` or `scan_failed`, `specimen_saved` or unresolved action | First 2 weeks | >=60% | Product owner | Expand invites only if stable for 3 weeks |
| Access-state comprehension | Moderated users who correctly explain access, collection, coordinate, and navigation state / tested users | Moderated task record plus `hotspot_detail_viewed` | Pre-beta study | >=80% | Product design/research | Block launch if below target |
| Map-to-detail completion | Users completing Explore -> qualified hotspot detail without assistance / task starters | `explore_opened`, `hotspot_detail_viewed` | First 2 weeks | >=85% | Frontend owner | Rework hierarchy if below target |
| Capture-to-save completion | Users completing capture -> result -> save / valid task starters | `scan_started`, `scan_submitted`, `scan_completed`, `specimen_saved` | First 2 weeks | >=75% | Scan owner | Do not add taxonomy/classes if below target |
| High-confidence precision | Correct strong-match results / all strong-match results in reviewed evaluation | Versioned evaluation run | Before alpha | >=90% overall and >=85% per admitted class | AI/geology owner | Remove class or downgrade band if missed |
| Hazardous high-confidence failures | Hazardous/unsupported cases shown as strong matches | Versioned safety slice | Before alpha | 0 | AI/geology owner | Release blocker |
| Coordinate privacy leakage | Shared/exported/public objects containing exact private coordinates or source metadata | Privacy test suite and incident log | 0 expected | 0 | Backend/privacy owner | Release blocker |
| Invalid navigation exposure | Non-eligible records offering directions / policy-test records | `hotspot_primary_action`, `navigation_blocked`, policy tests | Before alpha | 0 | Location-data owner | Release blocker |
| Crash-free sessions | Sessions without an unhandled crash / all sessions | Crash monitoring | First 2 weeks | >=99.5% | Engineering owner | Pause expansion if missed for 2 releases |
| Scan completion reliability | Successful scan results / submitted valid scans, excluding user cancellation | `scan_submitted`, `scan_completed`, `scan_failed` | First 2 weeks | >=90% | Backend/AI owner | Provider/performance remediation |
| Safety/privacy report SLA | Critical/high reports acknowledged within the stated SLA / all such reports | `location_report_submitted`, incident timestamps | Alpha | 100% | Operations owner | Pause beta if ownership or SLA fails |
| Week-4 retained field users | Activated users completing at least one responsible loop in week 4 / activated users with four weeks elapsed | Responsible-loop composite | Cohort 1 | >=30% | Product owner | Evidence for retention experiments, not marketplace |

Event properties must use generalized or categorical location context. Exact coordinates and raw images are prohibited in normal analytics.

## 12. Capacity and budget assumptions

The 12-week beta plan assumes approximately 2.5-3.0 full-time-equivalent capacity:

- Product owner: 0.5 FTE.
- Frontend engineer: 1.0 FTE.
- Backend/Base44 engineer: 1.0 FTE.
- Product design and research: 0.5 FTE.
- Location data/content lead: 0.5 FTE.
- Geological and access/legal reviewers: scheduled review capacity, at least four hours each week during alpha and beta.

One person may cover multiple roles, but no role may be silently unowned. If engineering capacity falls below 1.5 FTE, the schedule expands; scope does not expand to compensate.

Planning cash envelope, requiring product-owner sign-off:

- Up to $1,500 per month for beta AI, maps, storage, monitoring, and support services.
- Up to $3,000 total for source verification, field checks, accessibility testing, reviewer honoraria, and contingency.
- Cost alerts at 50%, 75%, and 90% of the monthly service ceiling.
- No marketplace, subscription, paid social, national data acquisition, or new major platform migration spend in the beta envelope.

If actual quotes exceed the envelope, the owner reduces volume or changes the delivery date through the decision log; safety and privacy controls are not cut.

## 13. Twelve-week delivery plan

### Phase 0: lock and remediate, weeks 1-2

Deliverables:

- Accept this document as the repository source of truth.
- Create the publication/access/collection/coordinate model and migration plan.
- Remove direct public hotspot creation from user finds.
- Enforce private coordinate defaults and share redaction.
- Remove raw trust-score presentation.
- Establish feature flags and disable deferred modules for beta users.
- Wire the event dictionary and incident ownership.

Exit criteria:

- Automated policy tests prove zero navigation for research/hold/unverified records.
- Automated privacy tests prove exact coordinates and metadata do not enter public/shared paths.
- Named owners accept the incident queue.

Kill/pause criteria:

- No backend-enforceable publication model.
- No way to isolate private specimen coordinates.
- No owner for safety/privacy incidents.

### Phase 1: first-value loop, weeks 3-5

Deliverables: responsible-use onboarding, policy-aware Explore/list, hotspot detail, permission recovery, and private collection basics.

Exit criteria: >=80% access-state comprehension and >=85% Explore-to-detail task completion in moderated testing; no unresolved critical safety/privacy defect.

Kill/pause criteria: users continue to treat research localities or education sites as permission to collect after one redesign cycle.

### Phase 2: evidence-aware identification, weeks 6-8

Deliverables: supported taxonomy, capture guidance, ranked candidates, calibrated bands, alternatives, safe tests, unresolved/correction flow, and versioned evaluation report.

Exit criteria: AI precision and safety thresholds pass; >=75% capture-to-save task completion; no hidden metadata leakage.

Kill/pause criteria: hazardous high-confidence failure, unsupported class overreach, or inability to reproduce the evaluation.

### Phase 3: regional alpha, weeks 9-10

Participants: 15-25 invited users across the defined cohorts.

Deliverables: real-device field sessions, offline/failure testing, daily incident review, weekly content corrections, cost and performance baseline.

Exit criteria: P0 metrics hold for two weekly releases; crash-free sessions >=99.5%; report queue meets SLA.

Kill/pause criteria: coordinate leak, unsafe navigation, unowned queue, or repeated severe false-confidence incident.

### Phase 4: closed regional beta, weeks 11-12 and onward

Participants: expand to 25-50 users only after Phase 3 exit.

Deliverables: weekly release cadence, support playbook, revalidation cadence, retention baseline, and graduation review.

Exit criteria for expansion: all beta-ready gates in section 14 pass for three consecutive weeks.

Marketplace, subscriptions, and public community remain outside this phase regardless of schedule pressure.

## 14. Release gates

### Beta ready

- One tri-state dataset has passed the publication review pipeline.
- Every visible location has explicit publication, access, collection, coordinate-quality, source, and verification fields.
- Every navigable record points to a verified official entrance/business address.
- Research/hold records cannot produce directions.
- Supported identification classes have a versioned evaluation baseline and pass confidence gates.
- Low-confidence, failure, correction, and unresolved states work.
- Exact find coordinates remain private by default.
- Shared cards and public data pass coordinate and metadata leak tests.
- Core flows pass the supported device, connectivity, accessibility, and reduced-motion matrix.
- Monitoring, cost alerts, support, incident, moderation, and rollback ownership are active.
- Privacy, responsible-use, access, and AI-limitations copy is published.
- No release-blocking defect remains.

### Public-launch ready

All beta gates plus:

- Stable performance at expanded beta volume.
- Demonstrated source revalidation and moderation cadence.
- Acceptable correction, abstention, and false-confidence trends.
- Account export/deletion and incident recovery verified end to end.
- Store and marketing claims match implemented behavior.
- Monetization decision is based on observed retention and cost evidence.

## 15. Ownership and operating cadence

| Role | Accountable for |
|---|---|
| Product owner | Scope, decision log, capacity, budget, metrics, and release decision |
| Frontend owner | Field flows, accessibility, permissions, cache UI, privacy indicators, and client tests |
| Backend/Base44 owner | Entity policy, backend functions, auth isolation, navigation policy, moderation path, rate limits, and audit logs |
| Data/content owner | Source verification, regional staging, publication state, revalidation, and report resolution |
| AI/geology owner | Taxonomy, evaluation set, calibration, safety exclusions, and correction review |
| Design/research owner | Persona validation, comprehension tests, field usability, and cohort interviews |
| Operations/privacy owner | Incident intake, response SLA, communications, deletion/export, and post-incident review |

Cadence:

- Daily during alpha: crashes, scan failures, reports, corrections, safety/privacy triage, and variable cost.
- Weekly: verified content release, KPI review, false-confidence review, beta interviews, and P0/P1 prioritization.
- Monthly: source revalidation, permission/privacy copy audit, per-class model review, capacity/budget review, and expansion decision.

## 16. Audit resolution matrix

| May audit finding | Resolution in this plan | Status |
|---|---|---|
| Personas absent | Persona/job/problem/success matrix in section 4 | Resolved for planning; validate in research |
| KPIs not instrumentable | Event-backed definitions, baselines, targets, owners, and decision gates in section 11 | Resolved for implementation |
| Compliance and safety under-specified | Publication states, privacy defaults, incident severity/SLA, and release blockers in sections 6 and 8 | Resolved for implementation |
| Marketplace too early | Marketplace, trading, valuation, subscriptions, and community explicitly disabled until post-beta evidence | Resolved |
| Architecture/resourcing absent | Base44-aligned ADRs, current-gap evidence, FTE assumptions, and budget envelope in sections 9, 10, and 12 | Resolved for beta planning |
| Phase exit/kill criteria absent | Measurable exit and pause criteria in sections 13 and 14 | Resolved |

## 17. Immediate execution backlog

### Next 48 hours

1. Assign named owners to the role table.
2. Convert the four P0 blockers in section 10 into tracked implementation issues.
3. Define the canonical location entity/migration and the moderated submission entity.
4. Disable or hide deferred modules for the beta cohort.
5. Add privacy and navigation policy tests before changing production data.

### Next seven days

1. Implement the staging publication workflow.
2. Enforce server-side private coordinates and share redaction.
3. Replace raw trust-score UI with policy/status/source language.
4. Revalidate the initial regional destinations against current operator/agency sources.
5. Wire the core analytics events without sensitive properties.
6. Build the first supported-taxonomy evaluation slice.

### Next 30 days

1. Complete Phase 0 and Phase 1 gates.
2. Run moderated comprehension and core-flow tests.
3. Publish the versioned regional dataset and evaluation report internally.
4. Begin regional alpha only if every P0 gate passes.

## 18. Change control

- This document governs beta product decisions until superseded by an approved pull request.
- Date-sensitive access, permit, fee, season, operator, model, provider, and platform facts must be revalidated before release.
- The live 414-location research sheet remains research input, not production routing data.
- Location corrections are staged, reviewed, and promoted; they are not edited directly into live data without verification.
- Changes to safety, privacy, publication, navigation, confidence, or release gates require explicit owner approval and an auditable decision-log entry.

