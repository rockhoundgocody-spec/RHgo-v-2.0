# Audit: `ROCKHOUNDGO_EVOLUTION_IDEAS.md`

Date: 2026-05-15
Auditor: Codex

## Scope

This audit reviews:

- strategic completeness
- sequencing realism
- KPI quality
- execution risk
- gaps that would block delivery

## Executive Assessment

**Overall quality: B (good directional strategy, weak operating detail).**

The brainstorm is strong for vision and prioritization, but it is **not yet execution-ready**. It lacks:

1. explicit owners/accountability
2. quantified targets per phase
3. legal/compliance controls for location and collection data
4. technical architecture choices and delivery constraints
5. concrete GTM and budget assumptions

## Strengths

1. **Correct initial focus on reliability and conversion** before expansion.
2. **Field-first product framing** (offline, map layers, low-signal behavior) aligns with real user context.
3. **Trust and education emphasis** is appropriate for a domain where bad IDs can spread quickly.
4. **Phased roadmap** gives a usable top-level sequence.
5. **Simple prioritization model** is practical for roadmap triage.

## Critical Gaps (Must Fix)

### 1) No explicit problem statement by persona

The plan does not define user segments (beginner hobbyist, family trip user, advanced collector, trip leader, educator), their top pain points, or the target value proposition per segment.

**Risk:** teams build generic features with unclear retention impact.

**Fix:** add a persona/problem matrix with top-3 jobs-to-be-done and success criteria per persona.

### 2) KPI framework is not instrumentable enough

The KPIs are conceptually good but missing baselines, targets, and event definitions.

**Risk:** no objective go/no-go decision for each phase.

**Fix:** for each KPI, define:
- event name
- numerator/denominator
- current baseline
- 90-day target
- data owner

### 3) Compliance and safety are under-specified

Collecting and sharing location data can expose sensitive sites and create legal risk.

**Risk:** ecological harm, user safety, land-access/legal violations, reputational damage.

**Fix:** define a compliance block:
- geofencing/privacy tiers
- delayed or fuzzed coordinates for sensitive finds
- terms for land access and permit responsibilities
- moderation SLA and incident workflow

### 4) Marketplace/trading is introduced too early

Marketplace appears in the first-year plan without trust and fraud controls.

**Risk:** chargebacks, scams, moderation overload.

**Fix:** gate marketplace behind prerequisites:
- verified identity tiers
- reputation scores
- dispute handling process
- payment/fraud stack selection

### 5) No architecture and resourcing envelope

Plan does not state build vs. buy decisions (maps, ML inference, offline sync, moderation tooling).

**Risk:** timeline optimism and technical debt.

**Fix:** add a one-page architecture ADR set and capacity assumptions (team size/skills).

## Sequencing Corrections Recommended

### Proposed sequence upgrade

1. **Phase 0 (2-4 weeks):** instrumentation, funnel reliability, domain canonicalization, support channels.
2. **Phase 1 (6-10 weeks):** onboarding + first-value loop (save first specimen, complete first ID).
3. **Phase 2 (8-12 weeks):** offline map pack MVP + confidence/explanation UI.
4. **Phase 3 (8-12 weeks):** community layer (trip circles + challenge seasons + moderation stack).
5. **Phase 4 (post-fit):** premium packaging and only then marketplace pilots.

This reduces monetization risk before product-market reliability is proven.

## KPI Upgrade Template

Use this template for each KPI:

- **Metric name:** Activation-24h
- **Definition:** users who save first specimen within 24h / new signups
- **Baseline:** _TBD_
- **Target (90 days):** _TBD_
- **Instrumentation events:** `signup_completed`, `specimen_saved`
- **Owner:** Product Analytics
- **Decision threshold:** proceed to Phase 2 if >= target for 3 consecutive weeks

## Delivery Risks & Mitigations

- **Risk:** over-broad scope in a single year.
  - **Mitigation:** enforce quarterly kill criteria for low-signal initiatives.
- **Risk:** low data quality for AI ID.
  - **Mitigation:** add human-in-the-loop review queue + confidence thresholds.
- **Risk:** community toxicity/location poaching.
  - **Mitigation:** privacy-by-default, moderation automation, strike policy.
- **Risk:** offline complexity underestimated.
  - **Mitigation:** pilot with one region + capped tile packs before expansion.

## Minimum Additions Needed for “Execution-Ready” Status

Add the following sections to `ROCKHOUNDGO_EVOLUTION_IDEAS.md`:

1. Persona/problem matrix
2. KPI table with baselines/targets/owners
3. Compliance + trust policy summary
4. Architecture and build-vs-buy decisions
5. Team capacity + budget assumptions
6. Phase exit criteria and kill criteria

## Conclusion

The current brainstorm is a strong strategic draft, but requires an operating layer (owners, targets, instrumentation, policy, architecture) to become deliverable.

**Audit verdict:**
- Strategy quality: **Good**
- Execution readiness: **Needs major improvement**
- Recommended action: **Revise before roadmap sign-off**
