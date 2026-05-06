# RockHound-GO System Architecture Diagram

## Entity Relationship Map

```
┌─────────────────────────────────────────────────────────────────────┐
│                          USER (Built-in)                           │
├─────────────────────────────────────────────────────────────────────┤
│ email, full_name, role, created_date, updated_date                 │
└────────────┬──────────────────────────────────────────────┬─────────┘
             │                                              │
             ▼                                              ▼
    ┌──────────────────┐                        ┌───────────────────────┐
    │  Companion       │                        │   FamilyProfile       │
    ├──────────────────┤                        ├───────────────────────┤
    │ owner_email      │                        │ owner_email           │
    │ name             │                        │ name                  │
    │ level, xp        │                        │ member_emails[]       │
    │ mood             │                        │ child_emails[]        │
    │ streak_days      │                        │ discovery_mode        │
    └──────────────────┘                        │ shared_collections[]  │
                                                │ family_streak_days    │
                                                │ total_family_finds    │
                                                └───────┬───────────────┘
                                                        │
                                    ┌───────────────────┼───────────────────┐
                                    │                   │                   │
                                    ▼                   ▼                   ▼
                        ┌──────────────────────┐  ┌─────────────────┐  ┌─────────────────┐
                        │  SharedCollection    │  │   MemoryCapsule │  │  Specimen       │
                        ├──────────────────────┤  ├─────────────────┤  ├─────────────────┤
                        │ creator_email        │  │ owner_email     │  │ created_by      │
                        │ title, description   │  │ expedition_name │  │ mineral_name    │
                        │ specimen_ids[]       │  │ expedition_date │  │ common_name     │
                        │ visibility           │  │ location_name   │  │ photo_ids[]     │
                        │ theme                │  │ specimen_ids[]  │  ├─────────────────┤
                        │ story                │  │ companion_emails│  │ lat, lng        │
                        │ cover_image_url      │  │ mood_snapshot   │  │ found_date      │
                        │ featured_specimen_id │  │ story           │  │ notes           │
                        │ allow_commenting     │  │ weather_snapshot│  ├─────────────────┤
                        │ view_count           │  │ next_goals      │  │ ai_confidence   │
                        └──────────────────────┘  │ sealed_date     │  │ rarity          │
                                                   └─────────────────┘  │ verified        │
                                                                        │ verification_cnt│
                    ┌───────────────────────────────────────────────────┼──────────────┐
                    │                                                   │              │
                    ▼                                                   ▼              ▼
        ┌────────────────────────┐                        ┌──────────────────────┐  ┌──────────────────┐
        │    SpecimenPhoto       │                        │  GeologicalContext   │  │  Badge           │
        ├────────────────────────┤                        ├──────────────────────┤  ├──────────────────┤
        │ specimen_id            │                        │ mineral_name         │  │ code             │
        │ draft_id               │                        │ region               │  │ title            │
        │ file_url               │                        │ host_rock            │  │ rarity           │
        │ thumbnail_url          │                        │ geological_period    │  │ owner_email      │
        ├────────────────────────┤                        │ formation_process    │  │ earned_at        │
        │ capture_angle          │                        │ rarity_geology       │  │ level (1-5)      │
        │   (macro/frontal/..)   │                        │ educational_summary  │  │ glow_intensity   │
        │ quality_score          │                        │ verification_tests[] │  └──────────────────┘
        │ capture_timestamp      │                        │ lookalike_minerals[] │
        │ lighting_condition     │                        │ safety_hazards[]     │
        │ notes                  │                        └──────────────────────┘
        │ is_primary             │
        └────────────────────────┘
                    ▲
                    │
        ┌───────────┴────────────────────────────┐
        │                                        │
        ▼                                        ▼
┌────────────────────────────┐    ┌──────────────────────────────┐
│ IdentificationReasoning    │    │  ConversationContext         │
├────────────────────────────┤    ├──────────────────────────────┤
│ specimen_id                │    │ owner_email                  │
│ draft_id                   │    │ session_id                   │
│ reasoning_type             │    │ active_specimen_id           │
│ model_or_agent             │    │ active_hotspot_id            │
├────────────────────────────┤    ├──────────────────────────────┤
│ primary_candidate          │    │ conversation_messages[]      │
│ confidence                 │    │   {role, text, intent, tags} │
│ key_evidence[]             │    │ teaching_style               │
│ alternative_candidates[]   │    │ geological_facts_covered[]   │
│ uncertainty_factors[]      │    │ recommended_next_steps[]     │
│ next_verification_steps[]  │    │ confidence_boosters[]        │
│ geological_context_applied │    └──────────────────────────────┘
│ created_at                 │
└────────────────────────────┘
        ▲
        │
        └──── (append-only audit trail)
```

---

## Data Flow: Scan to Verification

```
                    USER SCANS MINERAL
                           │
                           ▼
            ┌──────────────────────────────┐
            │   SpecimenDraft (local)      │
            │  - capture_angle: macro      │
            │  - images_url[]              │
            │  - lat, lng (GPS)            │
            │  - revision: 0               │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  AI Quick Classification     │
            │  (gemini-flash)              │
            │  - primary_name: Amethyst    │
            │  - confidence: 0.68          │
            │  - candidates[]              │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  Fetch GeologicalContext     │
            │  - host_rock: pegmatite      │
            │  - lookalikes: quartz, etc   │
            │  - verification_tests[]      │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  Gemma Stone Coaching        │
            │  "Let's verify with hardness│
            │   test—Amethyst is ~7"      │
            │                              │
            │  → Create IdentificationRsng│
            │    (reasoning_type: initial) │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  User Runs Field Tests       │
            │  - Hardness: 7 ✓             │
            │  - Streak: white ✓           │
            │                              │
            │  → Save to SpecimenDraft     │
            │  → Append IdentificationRsng │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  Multi-Image Capture         │
            │  - Create SpecimenPhoto      │
            │    (angle: frontal)          │
            │  - Create SpecimenPhoto      │
            │    (angle: macro)            │
            │  - quality_score: 0.92       │
            │  - Link photo_ids → Specimen │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  OFFLINE: Queue for Sync     │
            │  - Create SyncQueue          │
            │    status: pending           │
            │    priority: 10 (specimen)   │
            │  - Local specimen: synced=no │
            └──────────────┬───────────────┘
                           │
                  (user goes online)
                           │
                           ▼
            ┌──────────────────────────────┐
            │  Sync Queue Processor (auto) │
            │  - Validate specimen         │
            │  - Check conflicts           │
            │  - Save to cloud DB          │
            │  - Update SyncQueue: synced  │
            │  - Refresh local cache       │
            └──────────────┬───────────────┘
                           │
                           ▼
            ┌──────────────────────────────┐
            │  Specimen Now Verified       │
            │  - verified: true            │
            │  - verification_count: 3     │
            │  - synced: true              │
            │  - Credentials ready for     │
            │    export / sharing          │
            └──────────────────────────────┘
```

---

## Offline-First Sync Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        LOCAL DEVICE                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               IndexedDB Local Cache                       │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Specimen (synced=true)                                    │  │
│  │ SpecimenPhoto (all local captures)                        │  │
│  │ SpecimenDraft (in-progress scans)                         │  │
│  │ Companion (last state)                                    │  │
│  │ GeologicalContext (preloaded regions)                     │  │
│  └──────────┬────────────────────────────────────────────────┘  │
│             │                                                    │
│             ▼                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │          SyncQueue (Pending Changes)                      │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ {                                                          │  │
│  │   entity_type: "Specimen",                               │  │
│  │   entity_id: "spec_123",                                 │  │
│  │   operation: "update",                                   │  │
│  │   status: "pending",                                     │  │
│  │   priority: 10,                                          │  │
│  │   payload: { verified: true, notes: "..." }             │  │
│  │ }                                                          │  │
│  │ {                                                          │  │
│  │   entity_type: "SpecimenPhoto",                          │  │
│  │   operation: "create",                                   │  │
│  │   status: "pending",                                     │  │
│  │   priority: 5,                                           │  │
│  │   payload: { file_url: "...", quality_score: 0.92 }    │  │
│  │ }                                                          │  │
│  └──────────┬────────────────────────────────────────────────┘  │
│             │                                                    │
│             │ (when online: batch sort by priority)             │
│             ▼                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  processSyncQueue()                                       │  │
│  │  - Sort by priority (highest first)                       │  │
│  │  - Retry with exponential backoff                         │  │
│  │  - Mark synced on success                                 │  │
│  │  - Mark conflict if server state differs                  │  │
│  └──────────┬────────────────────────────────────────────────┘  │
│             │                                                    │
└─────────────┼────────────────────────────────────────────────────┘
              │
              │ NETWORK REQUEST
              │ (Firebase Realtime)
              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUD BACKEND                               │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │               Base44 Database                             │  │
│  ├───────────────────────────────────────────────────────────┤  │
│  │ Specimen collection (RLS: user owns)                      │  │
│  │ SpecimenPhoto collection (linked to Specimen)            │  │
│  │ IdentificationReasoning (audit trail)                    │  │
│  │ GeologicalContext (shared reference data)                 │  │
│  │ Badge, Companion, etc.                                    │  │
│  └──────────┬────────────────────────────────────────────────┘  │
│             │                                                    │
│             ▼                                                    │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │        Conflict Resolution (if needed)                    │  │
│  │  - Timestamp comparison (server wins)                     │  │
│  │  - IdentificationReasoning merge (append both)           │  │
│  │  - SpecimenPhoto dedup (by hash)                         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## AI Processing Pipeline

```
User Input (scan, voice, question)
        │
        ▼
┌─────────────────────────┐
│   Intent Detection      │
│  - verify / explain     │
│  - next-step / safety   │
│  - value / general      │
└────────────┬────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Fetch Context                          │
│  - GeologicalContext (region data)      │
│  - ConversationContext (teaching style) │
│  - IdentificationReasoning (history)    │
└────────────┬────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Build System Prompt                 │
│  - Geological context                │
│  - Previous topics (avoid repeat)    │
│  - Intent guide (verify/explain)     │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────┐
│  Invoke LLM (Gemini Flash)          │
│  - Warm, scientific tone             │
│  - Concise response                  │
│  - Clear next step                   │
└────────────┬─────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Parse Response + Create IdentificationRsng
│  - Text: conversation output            │
│  - teaching_point: what user learned    │
│  - next_step: verification suggestion   │
│  - confidence: high/moderate/low         │
└────────────┬─────────────────────────────┘
             │
             ▼
┌──────────────────────────────────────────┐
│  Update ConversationContext               │
│  - Append message to history              │
│  - Tag with intent + teaching point       │
│  - Update last_interaction timestamp      │
└──────────────────────────────────────────┘
```

---

## Performance Monitoring Loop

```
User Action (scroll, scan, submit)
        │
        ▼
┌─────────────────────────────┐
│  Measure Performance        │
│  - Touch latency (<50ms)    │
│  - Frame rate (60fps)       │
│  - API response time        │
│  - Memory usage             │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Optimize if Needed         │
│  - Throttle scroll handler  │
│  - Pause particle effects   │
│  - Degrade image quality    │
│  - Use virtual scroll       │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Log Metrics                │
│  - performance.mark()       │
│  - Aggregate for trends     │
│  - Alert on degradation     │
└─────────────────────────────┘
```

---

*Architecture is optimized for field resilience, emotional engagement, and scientific credibility.*