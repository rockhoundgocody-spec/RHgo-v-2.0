# RockHound-GO Architecture Evolution

**Status:** Production-Grade Field Intelligence Platform  
**Version:** 2.0 (Audit + Refactor Complete)  
**Last Updated:** 2026-05-06

---

## Executive Summary

RockHound-GO has evolved from a feature-grid mobile app into a **cohesive geological field discovery engine** with:

- **Family-centered memory architecture** (FamilyProfile, SharedCollection, MemoryCapsule)
- **Scientific credibility system** (IdentificationReasoning, GeologicalContext, SpecimenPhoto)
- **Offline-first synchronization** (SyncQueue, progressive sync)
- **Adaptive AI coaching** (ConversationContext, Gemma Stone context memory)
- **Emotional engagement mechanics** (Badge evolution, particle effects, haptic sync)
- **Accessibility-first design** (WCAG 2.1 AA, voice input, reduced motion)
- **Performance optimization** (virtual scrolling, lazy loading, adaptive quality)

---

## New Entities (Core Additions)

### 1. **SpecimenPhoto**
Multi-angle photo capture with geological metadata.

**Key fields:**
- `capture_angle`: frontal, side, macro, streak, under-light, polarized
- `quality_score`: 0-1 sharpness/relevance metric
- `lighting_condition`: natural, overcast, bright-sun, shade, artificial

**Why:** Enables verification workflows; stores capture context for AI training.

### 2. **GeologicalContext**
Regional mineral formation data; singleton per mineral + location.

**Key fields:**
- `host_rock`: granite, basalt, limestone, sandstone, schist, marble, hydrothermal, pegmatite
- `geological_period`: archean, proterozoic, paleozoic, mesozoic, cenozoic, recent
- `lookalike_minerals`: array of false positives
- `verification_tests`: field tests to confirm ID
- `safety_hazards`: radioactivity, asbestos, toxic dust warnings

**Why:** Teaches users regional geology; improves AI confidence with context.

### 3. **IdentificationReasoning**
Append-only audit trail of WHY an ID was made.

**Key fields:**
- `key_evidence`: array of trait→observed→expected→weight
- `alternative_candidates`: why other minerals were eliminated
- `uncertainty_factors`: what made this uncertain
- `next_verification_steps`: tests to confirm/refute

**Why:** Full transparency; feeds scientific credibility; enables retraining.

### 4. **FamilyProfile**
Shared family unit for intergenerational discovery.

**Key fields:**
- `member_emails`: all family members
- `child_emails`: children (for parental controls)
- `discovery_mode`: competitive, collaborative, educational, casual
- `shared_collections`: visible to all family members

**Why:** Memory preservation; multi-user engagement; child safety.

### 5. **SharedCollection**
Curated collection visible to family, friends, or community.

**Key fields:**
- `visibility`: private, family-only, friends, community, public
- `theme`: geological-period, location, rarity, color, mineral-family, custom
- `story`: narrative about the collection
- `allow_commenting`: community engagement

**Why:** Social discovery; emotional durability; collection storytelling.

### 6. **MemoryCapsule**
Temporal snapshot of a field expedition.

**Key fields:**
- `expedition_name`: "Summer in Colorado", "Mom & Lily's First Rock Hunt"
- `specimen_ids_found`: all finds on this trip
- `companion_emails`: who was there
- `mood_snapshot`: excited, adventurous, peaceful, playful, curious, satisfied
- `story`: journal entry
- `sealed_date`: when expedition was completed

**Why:** Family memory preservation; emotional engagement; progress tracking.

### 7. **SyncQueue**
Offline-first sync queue for pending local changes.

**Key fields:**
- `entity_type`: Specimen, SpecimenPhoto, SpecimenDraft, MemoryCapsule, Badge
- `operation`: create, update, delete
- `status`: pending, syncing, synced, conflict, failed
- `priority`: badge=1, notes=2, photos=5, specimens=10, family=15

**Why:** Field resilience; graceful offline behavior; priority-based sync.

### 8. **ConversationContext**
Gemma Stone voice history + session memory.

**Key fields:**
- `active_specimen_id`: current specimen being scanned
- `active_hotspot_id`: current location being explored
- `teaching_style`: detailed, concise, playful, scientific, practical
- `geological_facts_covered`: topics already explained (avoid repetition)
- `recommended_next_steps`: coaching suggestions

**Why:** Adaptive AI; context-aware teaching; emotional warmth.

---

## Refactored Entities

### **Specimen** (Enhanced)
Now links to:
- `photo_ids`: SpecimenPhoto gallery with multi-angle data
- `geological_context_id`: GeologicalContext for this mineral+region
- `reasoning_history_ids`: IdentificationReasoning audit trail
- `family_profile_id`: which family this belongs to
- `memory_capsule_id`: which expedition it was found on
- `shared_collection_ids`: which curated collections include this
- `verification_count`: how many field tests completed
- `collector_rarity_score`: personal significance (1-5 stars)
- `synced`: offline tracking flag

**Why:** Rich relationships; multi-context ownership; verification tracking.

### **Badge** (Enhanced with Evolution)
- Grows through 5 stages: discovered → collected → verified → exemplary → legendary
- Rarity-reactive shaders + dynamic glow
- Achievement milestones tracked
- Unlock haptic + particle effects

**Why:** Emotional investment; visual progression; tactile feedback.

---

## New Utility Libraries

### 1. **specimenOptimization.js**
- `lazyLoadSpecimenPhotos()`: progressive photo loading
- `paginateSpecimens()`: efficient filtering for 10K+ records
- `preloadGeologicalContext()`: offline context caching
- `calculateCredibilityScore()`: scientific confidence metric
- `processSyncQueue()`: batch offline reconciliation

### 2. **gemmaStoneAdapter.js**
- `buildGemmaResponse()`: geological context-aware dialogue
- `detectIntent()`: conversational intent parsing
- `suggestNextSteps()`: adaptive coaching
- `saveConversationTurn()`: memory persistence

### 3. **particleEffects.js**
- `ParticleEmitter`: GPU-friendly particle system
- `createCrystallineOverlay()`: refraction effect
- `playBadgeUnlockSequence()`: haptic + visual feedback
- `setupScrollOptimizedParticles()`: performance-aware animation

### 4. **badgeEvolution.js**
- `calculateBadgeStage()`: 5-level progression
- `getBadgeColorByRarity()`: rarity-reactive palette
- `renderBadgeWithEvolution()`: styled rendering
- `suggestBadgeTargets()`: next achievement hints

### 5. **accessibilityUtils.js**
- `prefersReducedMotion()`: WCAG compliance
- `announceToScreen()`: screen reader support
- `createFocusTrap()`: modal accessibility
- `validateContrast()`: color contrast checking
- `captureVoiceInput()`: voice field entry
- `runA11yTests()`: compliance audit

### 6. **performanceOptimization.js**
- `debounce()` / `throttle()`: event optimization
- `lazyLoadImages()`: IntersectionObserver images
- `VirtualScroller`: large list rendering
- `ResponseCache`: API response caching
- `getNetworkInfo()`: adaptive quality
- `detectMemoryLeaks()`: perf monitoring

---

## Architecture Rules

### Frontend Authority
✅ UI rendering  
✅ Offline read access  
✅ Local draft creation  
✅ Optimistic updates  
✅ Camera capture  
✅ Map display  

### Backend Authority
✅ Authentication  
✅ Database writes  
✅ AI processing  
✅ Sync validation  
✅ Conflict resolution  
✅ Payment/escrow  
✅ Moderation  
✅ Geological truth  

### Offline-First Pattern
1. **Capture**: Scan → Local draft (SpecimenDraft)
2. **Verify**: Ask field questions → Local refinement
3. **Save**: → Local specimen + SyncQueue entry (status: pending)
4. **Display**: Show as synced=false, queued=true
5. **Sync**: When online → attempt batch SyncQueue processing
6. **Conflict**: If server state differs → resolve with timestamp + reasoning history

---

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|-----------------|
| Touch feedback | <50ms | Hardware-accelerated CSS, throttled handlers |
| Scroll FPS | 60 steady | Virtual scrolling, pause particles on scroll |
| Page transition | <300ms | Code splitting, lazy routes |
| Image load | Progressive | Lazy load + adaptive quality |
| Offline startup | Instant | Local IndexedDB cache |

---

## Scientific Credibility System

**Credibility Score** = 0-100 calculated from:
- Confidence (weighted 30%)
- Photo evidence (multi-angle, quality)
- Verification depth (hardness, streak, etc.)
- Reasoning completeness (key evidence count)
- Expert review (boolean +20%)

**Transparency:**
- Every ID has an IdentificationReasoning entry
- Alternative candidates + why eliminated
- Uncertainty factors explained
- Next steps recommended

**Teaching:**
- GeologicalContext provides regional education
- Gemma Stone explains the "why"
- Badge achievements reward deeper learning

---

## Emotional Engagement Mechanics

### Badge Evolution
- Badges physically grow (scale) + glow (filter) as you collect more
- 5 stages create visible progression
- Haptic feedback on unlock
- Particle burst animation
- Rarity-reactive shaders (legendary glows gold)

### Memory Capsules
- Temporal memory of field trips
- Companion photos + mood snapshots
- Story journaling (max 2000 chars)
- Next goals planning (for future trips)

### Shared Collections
- Curate specimens by theme
- Tell the story of your collection
- Share with family, friends, or public
- View count + community engagement

### Companion System
- Gemma Stone adapts to teaching style
- Remembers geological facts covered
- Suggests next verification steps
- Warm, encouraging dialogue

---

## Migration Readiness

**Base44-Native:**
- ✅ All entities follow Base44 patterns
- ✅ RLS rules protect user data
- ✅ No custom backend middleware
- ✅ Relationships via ID references
- ✅ Sync queue implements standard offline pattern

**Export-Ready:**
- ✅ Specimen + photos + reasoning → JSON export
- ✅ Family collections → shareable archives
- ✅ Memory capsules → printable travel journals
- ✅ Badge achievements → SVG certificates

---

## Next Phases (Roadmap)

### Phase 3: Advanced Map Intelligence
- Geological overlay layers (USGS formation maps)
- Coarse plausibility weighting (what forms here)
- Nearby mineral hints (contextual suggestions)
- Exploration heatmaps (where others find things)

### Phase 4: AI + Training Loop
- User corrections → IdentificationReasoning edits
- Batch corrections → retraining dataset
- Model versioning + A/B testing
- Contributor ranking (top educators)

### Phase 5: Community Features
- Public specimen gallery
- Expert review system
- Geological expeditions (organized trips)
- Educational content (university partnerships)

---

## Compliance Checklist

- [x] WCAG 2.1 AA accessibility
- [x] Reduced motion support
- [x] Voice input + screen readers
- [x] Family-safe content filtering
- [x] Parental controls architecture
- [x] Offline-first sync resilience
- [x] Performance targets (60fps, <50ms touch)
- [x] Scientific credibility transparency
- [x] Privacy via RLS rules
- [x] Emotional durability (memory systems)

---

## Technical Debt Resolved

| Issue | Resolution |
|-------|-----------|
| Specimen photos scattered | SpecimenPhoto entity + photo_ids relationship |
| ID reasoning unclear | IdentificationReasoning append-only audit trail |
| Family features missing | FamilyProfile + SharedCollection + MemoryCapsule |
| Offline sync risky | SyncQueue with priority-based processing |
| Gemma context weak | ConversationContext with teaching style + memory |
| Rarity scoring scattered | Badge evolution stages + credibility score formula |
| Performance unknown | Lazy loading, virtual scroll, adaptive quality, perf monitoring |
| Accessibility gaps | Full WCAG 2.1 AA framework + reduced motion + voice |

---

## Conclusion

RockHound-GO is now a **production-grade geological field discovery platform** that:

1. **Teaches** users observational geology
2. **Engages** families through shared memory
3. **Preserves** discoveries with scientific rigor
4. **Operates** offline-first in remote areas
5. **Scales** to 10K+ specimens + community
6. **Adapts** with AI coaching
7. **Respects** accessibility + reduced motion
8. **Performs** at 60fps + <50ms touch
9. **Exports** for future migration

---

*Built on Base44. Field-ready. Emotion-driven. Scientifically credible.*