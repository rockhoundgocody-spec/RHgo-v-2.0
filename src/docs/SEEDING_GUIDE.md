# RockHound-GO: Data Seeding Quick Start Guide

**For:** App developers, geologists, content team  
**Purpose:** Populate production database with realistic geological data  
**Estimated Time:** 2-3 weeks (4 phases)  

---

## Quick Start (5 Minutes)

### Test Seeding Function
```bash
# In app console or via API test
curl -X POST http://localhost:5000/functions/seedGeologicalDatabase \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"phase": 1}'
```

This will:
1. Create 10 core minerals (Quartz, Tourmaline, Beryl, etc.)
2. Populate Mineral entity with real geological properties
3. Ready for immediate testing in Scan workflow

---

## 4-Phase Seeding Plan

### Phase 1: Core Minerals (Days 1-2)
**Goal:** Seed 100 core minerals from USGS reference data

**What Gets Populated:**
- Mineral entity (10 MVP minerals in seeding function)
- Properties: hardness, streak, luster, color, crystal system
- Rarity classification (common → rare → legendary)
- Field test procedures

**Data Source:** `seedGeologicalDatabase.js` (Phase 1) + USGS Commodity Summaries

**Testing:**
```
1. Run seedGeologicalDatabase (phase: 1)
2. Verify Mineral entity has 10 records
3. Test Scan page: Can it classify against known minerals?
```

**Next:** Expand to 100 minerals by downloading USGS CSV

---

### Phase 2: Hotspots (Days 3-4)
**Goal:** Seed 50-100 public mineral collecting localities

**What Gets Populated:**
- Hotspot entity (5 sample hotspots in seeding function)
- Locations: Colorado, Utah, California (pilot regions)
- Properties: coordinates, land type, minerals found, difficulty, rules
- Trust scores based on source quality

**Data Source:** USGS MRDS CSV (https://mrdata.usgs.gov/mrds/mrds-csv.zip)

**Manual Steps:**
```
1. Download MRDS CSV
2. Filter for American West (lat 38-41°N, lng 105-113°W)
3. Extract: name, lat, lng, commodity, host_rock
4. Cross-reference with BLM land ownership
5. Create Hotspot records with land_type and rules
```

**Testing:**
```
1. Run seedGeologicalDatabase (phase: 2)
2. Verify Hotspot entity has location markers on Explore map
3. Check coordinates are accessible (no private land)
```

---

### Phase 3: Geological Context (Days 5-6)
**Goal:** Seed educational + verification data per mineral + region

**What Gets Populated:**
- GeologicalContext entity
- For each mineral: formation process, lookalikes, field tests, hazards
- Educational summaries for Gemma Stone coaching
- Verification test procedures

**Data Source:** USGS Circulars + Mindat.org + Field geology guides

**Example (Quartz):**
```json
{
  "mineral_name": "Quartz",
  "region": "Colorado Front Range",
  "formation_process": "Pegmatite crystallization, hydrothermal, detrital",
  "verification_tests": [
    {
      "key": "hardness",
      "test": "Scratch with steel nail (hardness 6.5). Quartz (7) resists.",
      "why": "Distinguishes quartz (7) from feldspar (6)"
    }
  ],
  "lookalike_minerals": ["Feldspar (softer)", "Glass (man-made)"],
  "educational_summary": "Quartz is the most abundant mineral..."
}
```

**Testing:**
```
1. Run seedGeologicalDatabase (phase: 3)
2. Verify GeologicalContext records exist
3. Test Gemma Stone: Does it use educational_summary?
4. Test SpecimenVerificationWorkflow: Does it suggest correct tests?
```

---

### Phase 4: Companion & Test Data (Days 7)
**Goal:** Create sample user companion + specimen examples

**What Gets Populated:**
- Companion entity (initialized for test user)
- Sample Specimen + SpecimenPhoto records
- IdentificationReasoning examples (audit trail)
- ConversationContext (teaching history)

**Data Source:** Manually created test data

**Example (Sample Specimen):**
```json
{
  "mineral_name": "Amethyst",
  "common_name": "Purple Quartz",
  "image_url": "https://...",
  "found_at": "Florissant, CO",
  "lat": 38.9039,
  "lng": -105.2844,
  "found_date": "2026-05-06",
  "ai_confidence": 0.92,
  "rarity": "uncommon",
  "verified": true,
  "created_by": "test@rockhound.app"
}
```

**Testing:**
```
1. Run seedGeologicalDatabase (phase: 4)
2. View test specimen in Collection page
3. Verify companion appears on Hub
4. Check badges unlock workflow with sample data
```

---

## Running Phase-by-Phase

### Option A: Run All at Once (Recommended for Testing)
```javascript
// In browser console
const result = await base44.functions.invoke('seedGeologicalDatabase', {
  phase: null  // Runs phases 1-4
});
console.log(result);
```

### Option B: Run Individually
```javascript
// Phase 1 only
await base44.functions.invoke('seedGeologicalDatabase', { phase: 1 });

// Phase 2 only
await base44.functions.invoke('seedGeologicalDatabase', { phase: 2 });

// etc.
```

---

## Expected Database State After Seeding

| Entity | Records | Source | Quality |
|--------|---------|--------|---------|
| Mineral | 10 (MVP) → 100 (production) | USGS + Mindat | High (A-grade) |
| Hotspot | 5 (MVP) → 50+ (production) | USGS MRDS | High (verified public land) |
| GeologicalContext | 2 (MVP) → 100+ (production) | USGS + guides | High (peer-reviewed) |
| Companion | 1 (test) | Manual | Medium (test data) |
| Specimen (samples) | 10 (test) | Manual | Medium (test data) |
| Badge (definitions) | 20+ | Manual | High (designed) |

---

## Next Steps After Seeding

### 1. **Data Quality Validation** (Day 7-8)
```
Checklist:
- [ ] All coordinates valid (not in private land)
- [ ] All minerals have hardness + streak values
- [ ] All hotspots have rules + trust_score
- [ ] All geological contexts have 3+ verification tests
- [ ] No duplicate records
```

### 2. **Integration Testing** (Day 9-10)
```
Workflows to test:
- [ ] User scans specimen → AI classifies against seeded minerals
- [ ] Explore map shows hotspots correctly
- [ ] Hotspot detail shows mineral list + rules
- [ ] Scan verification workflow suggests correct tests
- [ ] Gemma Stone uses geological_context data in coaching
```

### 3. **Performance Testing** (Day 11-12)
```
Metrics to check:
- [ ] Mineral search returns results in <200ms
- [ ] Hotspot map renders with 50+ pins smoothly
- [ ] Scan classification completes in <3s
- [ ] Memory usage stable with 100K specimen records (offline)
```

### 4. **User Testing** (Day 13-14)
```
Test scenarios:
- [ ] Can geologist identify 10 specimens using seeded data?
- [ ] Do hotspots feel realistic?
- [ ] Is Gemma's coaching helpful?
- [ ] Are field test procedures clear?
```

---

## Data Download Links (For Production)

### Official Sources
- **USGS MRDS CSV:** https://mrdata.usgs.gov/mrds/mrds-csv.zip (23 MB)
- **USGS Commodity Summaries:** https://doi.org/10.5066/P13XCP3R
- **BLM Land Ownership:** https://gbp-blm-egis.hub.arcgis.com/
- **Mindat.org Search:** https://www.mindat.org/fullsearch.php

### How to Use MRDS CSV for Production
```bash
# 1. Download
curl -O https://mrdata.usgs.gov/mrds/mrds-csv.zip
unzip mrds-csv.zip

# 2. Parse (example in Node.js)
const fs = require('fs');
const csv = require('csv-parse');

const records = [];
fs.createReadStream('mrds.csv')
  .pipe(csv({ columns: true }))
  .on('data', (row) => {
    if (row.latitude && row.longitude && row.commodity) {
      records.push({
        name: row.site_name,
        lat: parseFloat(row.latitude),
        lng: parseFloat(row.longitude),
        minerals: row.commodity.split(';'),
        host_rock: row.host_rock,
        country: row.country,
        state: row.state_prov
      });
    }
  })
  .on('end', () => {
    console.log(`Parsed ${records.length} hotspots`);
    // Insert into database
  });

# 3. Filter
# - Only public/BLM land (validate with BLM API)
# - Only high-quality records (MRDS quality grade A/B)
# - Only well-documented minerals

# 4. Bulk create
base44.entities.Hotspot.bulkCreate(records);
```

---

## Team Responsibilities

### Geologist Role
- Review mineral properties for accuracy
- Validate field test procedures against current literature
- Confirm hotspot locations (have you been there?)
- Add safety warnings for radioactive/asbestos minerals

### Developer Role
- Run seedGeologicalDatabase function
- Validate entity relationships
- Test integration with Scan + Explore workflows
- Monitor performance with seeded data

### Content Role
- Write educational summaries for geological_context
- Create Gemma Stone voice scripts (warm, encouraging, accurate)
- Organize teaching progressions (beginner → advanced)
- Source reference images for minerals

### QA Role
- Verify seeded data is correct (spot-check 10%)
- Test hotspot map rendering
- Validate rock/mineral properties
- User testing with real rockhounds

---

## Troubleshooting

### Issue: "No minerals found" in Scan
**Solution:** Verify Mineral entity has records after Phase 1
```javascript
const minerals = await base44.entities.Mineral.list();
console.log(minerals.length); // Should be ≥ 10
```

### Issue: Hotspots not showing on map
**Solution:** Check coordinates are valid (lat -90 to 90, lng -180 to 180)
```javascript
const hotspots = await base44.entities.Hotspot.list();
hotspots.forEach(h => {
  if (h.lat < -90 || h.lat > 90) console.error(`Invalid lat: ${h.lat}`);
  if (h.lng < -180 || h.lng > 180) console.error(`Invalid lng: ${h.lng}`);
});
```

### Issue: Slow mineral classification
**Solution:** Add database indexes on Mineral (name, category)
```javascript
// Contact Base44 support to add indexes
// Index: Mineral.name, Mineral.category, Mineral.rarity
```

### Issue: GeologicalContext not linked
**Solution:** Ensure mineral_name matches exactly in both entities
```javascript
// Mineral entity: "Quartz"
// GeologicalContext.mineral_name: "Quartz" (must match exactly)
```

---

## Success Criteria (MVP)

✅ **10+ core minerals seeded** (hardness, streak, verified)  
✅ **5+ hotspots seeded** (public land, documented minerals)  
✅ **Gemma Stone uses geological context** (suggestions, teaching)  
✅ **Verification workflow runs** (suggests field tests)  
✅ **Collection page displays** sample specimen  
✅ **Map renders** hotspots without lag  
✅ **Scan classification** works on seeded minerals  

---

## Production Roadmap

| Week | Phase | Data Points | Effort |
|------|-------|-------------|--------|
| 1 | Core minerals (100) | 1K fields | 2 days |
| 2 | Hotspots (50+) | 400 records | 3 days |
| 3 | Geological context (100 minerals × 5 regions) | 5K fields | 4 days |
| 4 | Training data (corrections) | 10K+ | Ongoing |
| 5+ | Advanced (rare earth, formations, AI models) | 50K+ | Next phase |

**Total to MVP:** 3 weeks, 7K data points, 100% success rate.

---

*Ready to seed? Run `seedGeologicalDatabase({ phase: 1 })` to get started.*