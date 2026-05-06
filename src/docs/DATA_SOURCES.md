# RockHound-GO: Data Sources & Seeding Guide

**Status:** Production data sources identified & documented  
**Last Updated:** May 6, 2026

---

## Executive Summary

RockHound-GO requires **geological intelligence, field education content, and specimen provenance data** to enrich the AI coaching system, train the identification model, and populate discovery hotspots. This document catalogs **free, high-quality public data sources** prioritized for launch.

---

## Tier 1: Core Mineral & Hotspot Data

### 1. **USGS Mineral Resources Data System (MRDS)**
**Status:** ✅ Primary source for mine locations & formations  
**Coverage:** Global (1.6M mineral deposits)  
**Format:** CSV, Shapefile, WFS/WMS APIs  

**Key Data:**
- Deposit name, location (lat/lng), commodities
- Geological characteristics, host rock, formation age
- Production history, reserve estimates
- Quality grades A-E (A = high detail)

**Download:**
- CSV (flattened): https://mrdata.usgs.gov/mrds/mrds-csv.zip (23 MB)
- WFS API: https://mrdata.usgs.gov/services/wfs/mrds
- Filtered by quality: https://mrdata.usgs.gov/mrds/find-mrds-graded.php

**Integration Path:**
```
MRDS → Extract (lat, lng, mineral, host_rock, formation) 
      → Map to Hotspot entity
      → Link to GeologicalContext
      → Populate "known_formations" for each region
```

**Sample Query Fields:**
- Site name, longitude, latitude, deposit type
- Commodities (coded: Au=gold, Cu=copper, etc.)
- Host rock, country/state, grade

---

### 2. **Mindat.org Mineral Database**
**Status:** ✅ World's largest mineral locality database  
**Coverage:** 417K+ localities, 6.2K mineral species, 1.6M occurrences  
**API:** Limited (no direct API; web scraping + reference)  

**Key Data:**
- Mineral properties (hardness, streak, luster, density, crystal system)
- Localities with photos (1.4M+ community-submitted)
- Mineral associations (what forms together)
- Specimen values (collector interest)

**Access Methods:**
- **Search Interface:** https://www.mindat.org/fullsearch.php
- **Manual Downloads:** Category files (feldspar, quartz, oxides, etc.)
- **Learning Center:** https://www.mindat.org/a/learn

**Integration Path:**
```
Mindat → Extract mineral properties (hardness, color, streak, crystal_system)
      → Map to Mineral entity
      → Add to GeologicalContext (lookalike_minerals, verification_tests)
      → Seed common field test procedures
```

**Recommended Initial Load (100 core minerals):**
- Quartz family (quartz, amethyst, citrine)
- Feldspar group (orthoclase, plagioclase)
- Mica family (muscovite, biotite)
- Common oxides (magnetite, hematite)
- Sulfides (pyrite, galena, chalcopyrite)
- Carbonates (calcite, dolomite)
- Gemstones (tourmaline, beryl, topaz, corundum)
- Secondary minerals (malachite, azurite, limonite)

---

### 3. **USGS Mineral Commodity Summaries**
**Status:** ✅ Annual reference for mineral economics & properties  
**Coverage:** 90+ minerals, global production & prices  
**Format:** CSV, PDF reports  

**Key Data:**
- U.S. production, reserves, world production (2020-2024)
- Mine locations by state (especially useful for Western USA)
- Rarity rankings, end-uses
- Geological occurrence (host rocks, mineralogy)

**Download:**
- Data Release (CSV): https://doi.org/10.5066/P13XCP3R
- Full Reports: https://www.usgs.gov/programs/mineral-resources-program/publications

**Integration Path:**
```
Summaries → Extract rarity ranking (common → rare → strategic)
          → Map to Specimen.rarity enum
          → Create value_guides for marketplace
          → Populate geological_period + host_rock data
```

---

## Tier 2: Field Identification & Education

### 4. **USGS Open-Access Geology Field Guides**
**Status:** ✅ Public domain educational PDFs  
**Coverage:** Regional field guides, rock/mineral identification  

**Key Resources:**
- Rock & Mineral Identification for Engineers: https://www.fhwa.dot.gov/pavement/pccp/fhwahi91205.pdf
- Field Geology Handouts: Multiple regional guides
- USGS Circular publications (ore deposits, gemstones)

**Integration Path:**
```
Field Guides → Extract identification keys
             → Create ConversationContext teaching facts
             → Populate GeologicalContext.educational_summary
             → Build SpecimenVerificationWorkflow test sequences
```

**Example: Quartz Identification**
```json
{
  "mineral_name": "Quartz",
  "field_tests": [
    { "test": "Hardness", "procedure": "Scratch with steel nail (hardness 6.5). Quartz (7) will not scratch.", "expected": "Resistant to scratching" },
    { "test": "Streak", "procedure": "Scratch on ceramic plate. Note color.", "expected": "White" },
    { "test": "Luster", "procedure": "Observe surface reflection.", "expected": "Vitreous (glassy)" },
    { "test": "Form", "procedure": "Look for six-sided crystals or hexagonal termination.", "expected": "Hexagonal crystals" }
  ],
  "common_colors": ["Clear", "Purple (amethyst)", "Brown (smoky)", "Pink (rose)"],
  "lookalikes": ["Feldspar (softer, ~6)", "Glass (man-made)"],
  "formation_context": "Forms in pegmatites, hydrothermal veins, and as detrital sand. Extremely common."
}
```

---

### 5. **BLM Public Lands Data (Land Ownership & Access)**
**Status:** ✅ Critical for legal hotspot verification  
**Coverage:** 245M acres of U.S. public land  
**Format:** Shapefile, WMS, REST APIs  

**Key Data:**
- Land ownership (BLM, National Forest, State, Private)
- Designated recreation areas, wilderness areas
- Mineral claim records (MLRS database)
- Approved collection regulations per region

**Access:**
- GIS Hub: https://gbp-blm-egis.hub.arcgis.com/
- MLRS Reports: https://reports.blm.gov/reports/MLRS
- Mineral & Land Records: REST API available

**Integration Path:**
```
BLM Data → Extract (land_type, rules, coordinates)
        → Validate Hotspot coordinates (is it public/BLM?)
        → Add land_type enum (public, blm, forest_service, state_park, private)
        → Store in Hotspot.rules (e.g., "BLM: Rockhounding allowed <20 lbs")
```

**Example Rule Storage:**
```json
{
  "hotspot_name": "Big Creek Colorado Quartz Locality",
  "land_type": "blm",
  "rules": "BLM rockhounding: Up to 20 lbs of common minerals per person per day. No machinery. Permit required for commercial.",
  "regulations_url": "https://www.blm.gov/programs/public-land-statistics",
  "trust_score": 0.95
}
```

---

## Tier 3: AI Training Data & Voice/Personality

### 6. **Geological Education Content (Open Access)**
**Status:** ✅ Seed for Gemma Stone teaching personality  
**Sources:** Published academic papers, USGS circulars, Smithsonian collections  

**Key Content:**
- Mineral formation processes (pegmatite, hydrothermal, detrital)
- Crystal structure explanations (cubic, hexagonal, orthorhombic)
- Economic geology (why minerals matter)
- Geological time scale + regional history

**Integration Path:**
```
Education Content → Extract key facts
                 → Encode as ConversationContext.geological_facts_covered
                 → Build teaching progressions (novice → expert)
                 → Create Gemma Stone personality with:
                    - Warm, encouraging tone
                    - Avoid repetition (track facts_covered)
                    - Suggest next_steps based on difficulty
```

**Example Teaching Progression:**
```json
{
  "teaching_progression": [
    {
      "level": "beginner",
      "concepts": ["Mohs hardness scale", "Streak test", "Color vs streak"],
      "examples": ["Quartz (hard, clear)", "Feldspar (softer, cloudy)"],
      "gemma_voice": "Warm, encouraging, hands-on"
    },
    {
      "level": "intermediate",
      "concepts": ["Crystal systems", "Cleavage vs fracture", "Composition"],
      "examples": ["Cubic (galena), Hexagonal (quartz)", "Perfect cleavage (mica)"],
      "gemma_voice": "Educational, slightly technical"
    },
    {
      "level": "advanced",
      "concepts": ["Optical properties", "Formation environment", "Collector value"],
      "examples": ["Birefringence (calcite)", "Pegmatite formation", "Rare earth minerals"],
      "gemma_voice": "Scientific, specialized vocabulary welcome"
    }
  ]
}
```

---

### 7. **Voice Generation & Personality Data**
**Status:** ✅ Use Google TTS API (already configured)  
**Key Parameters:** Warm, educational tone + field-appropriate pacing  

**Gemma Stone Voice Specifications:**
```
Voice: Google TTS (en-US-Neural2-C or -F for warm female, -B for male)
Speaking Style:
  - Enthusiastic but not overwhelming
  - Clear articulation for field conditions
  - Pauses between sentences (readable even with wind noise)
  - Emoji + verbal cues ("Great!," "Interesting observation!")

Teaching Approach:
  - Ask questions before answering
  - Celebrate small discoveries
  - Connect to user's emotional journey
  - Avoid jargon unless user has shown knowledge
```

**Integration Path:**
```
Gemma Stone → buildGemmaResponse()
           → Select voice + speed (0.9x normal for field clarity)
           → Add personality (warm, curious, encouraging)
           → Cache synthesizeSpeech() results (TTS API is expensive)
           → Store voice ID + emotion in ConversationContext.mood
```

---

## Tier 4: Regional Data (By State/Region)

### Colorado (Pilot Region)
- **Pegmatite hotspots:** Florissant, Lake George, Mesa County
- **Minerals:** Amazonite, smoky quartz, orthoclase, beryl
- **Host rock:** Granite, gneiss, pegmatite
- **Trust source:** MRDS + USGS circulars on Colorado minerals

### Utah
- **Pegmatite hotspots:** Tintic Mining District, Beehive District
- **Minerals:** Tourmaline, topaz, beryl, fluorite
- **Host rock:** Pegmatite, hydrothermal veins
- **Trust source:** MRDS, Utah Geological Survey

### California
- **Diverse:** Gold, quartz, tourmaline, beryl, rare earths
- **Host rock:** Granite, pegmatite, metamorphic
- **Trust source:** USGS California mineral assessments

---

## Data Ingestion Workflow

### Phase 1: Core Mineral Library (Week 1)
```
1. Download USGS Mineral Commodity Summaries CSV
2. Extract 100 core minerals (hardness, streak, color, crystal system)
3. Cross-reference with Mindat.org for additional properties
4. Create Mineral entity records
5. Validate: 100 minerals × 6 properties = 600 data points
```

### Phase 2: Hotspot Seeding (Week 2)
```
1. Download MRDS CSV (filtered by commodity type)
2. Extract (lat, lng, mineral, host_rock, state)
3. Validate with BLM data (is it public land?)
4. Create Hotspot records
5. Link GeologicalContext (formation + verification tests)
6. Target: 50-100 hotspots in 3-5 core states
```

### Phase 3: Education & AI Coaching (Week 3)
```
1. Compile field identification keys (from USGS guides)
2. Create GeologicalContext teaching summaries
3. Encode ConversationContext teaching progressions
4. Record Gemma Stone voice samples (Google TTS)
5. Test: Can Gemma guide 5 different mineral identifications?
```

### Phase 4: Training Data (Week 4)
```
1. Collect IdentificationReasoning examples (reasoning audit trail)
2. Seed 50 sample Specimen + SpecimenPhoto records
3. Document key_evidence examples
4. Build retraining dataset template
5. Ready for user corrections → model improvement loop
```

---

## Data Quality Standards

### Mineral Properties
- **Source:** USGS Commodity Summaries + Mindat.org (corroborate both)
- **Hardness:** Mohs scale (1-10)
- **Streak:** Tested on ceramic (not visual color)
- **Crystal system:** IMA standard classification
- **Density:** When available (low priority)

### Hotspot Data
- **Coordinates:** Decimal degrees, ±0.1km accuracy
- **Land type:** Verified via BLM or state records
- **Trust score:** 0.7-1.0 based on source quality
- **Minerals:** Only if documented in MRDS grade A/B records
- **Rules:** Quote directly from land management authority

### Educational Content
- **Source:** Published peer-reviewed or USGS official
- **Accuracy:** Double-check field test procedures
- **Clarity:** Written for non-specialist rockhounds
- **Completeness:** Include lookalikes + why they're different

---

## Sample Seed Data (10 Core Minerals)

```json
[
  {
    "name": "Quartz",
    "formula": "SiO₂",
    "hardness": "7",
    "streak": "white",
    "luster": "vitreous",
    "color": "varied (clear, purple, brown, pink)",
    "crystal_system": "hexagonal",
    "rarity": "common",
    "description": "Most common mineral on Earth. Forms in pegmatites, hydrothermal veins, and as detrital sand.",
    "field_test": "Hardness 7 - won't scratch with steel nail. White streak on ceramic. Vitreous luster."
  },
  {
    "name": "Feldspar (Orthoclase)",
    "formula": "KAlSi₃O₈",
    "hardness": "6",
    "streak": "white",
    "luster": "vitreous to pearly",
    "color": "pink, white, gray",
    "crystal_system": "monoclinic",
    "rarity": "common",
    "description": "Second most abundant mineral. Primary component of granites and pegmatites.",
    "field_test": "Hardness 6 - scratches with nail, softer than quartz. Two cleavage directions at ~90°."
  },
  {
    "name": "Mica (Muscovite)",
    "formula": "KAl₂(AlSi₃O₁₀)(OH)₂",
    "hardness": "2.5-3",
    "streak": "white",
    "luster": "vitreous to pearly",
    "color": "colorless to pale brown",
    "crystal_system": "monoclinic",
    "rarity": "common",
    "description": "Splits into thin, flexible sheets. Major pegmatite mineral.",
    "field_test": "Splits into thin transparent sheets. Flexes without breaking. Very soft (scratches with fingernail)."
  },
  {
    "name": "Tourmaline",
    "formula": "Na(Li,Mg,Al)₃Al₆(Si₆O₁₈)(BO₃)₃(OH)₃OH",
    "hardness": "7-7.5",
    "streak": "white",
    "luster": "vitreous",
    "color": "black, pink, blue, multicolored",
    "crystal_system": "hexagonal",
    "rarity": "uncommon",
    "description": "Prized by collectors. Pegmatite gem. Pleochroic (color changes with viewing angle).",
    "field_test": "Hard (7). Hexagonal crystals. Often striped black & pink. Tourmaline weighs ~3.2 g/cm³."
  },
  {
    "name": "Beryl",
    "formula": "Be₃Al₂Si₆O₁₈",
    "hardness": "7.5-8",
    "streak": "white",
    "luster": "vitreous",
    "color": "green (emerald), blue (aquamarine), colorless, pink",
    "crystal_system": "hexagonal",
    "rarity": "uncommon",
    "description": "Important gem mineral. Pegmatite deposit indicator.",
    "field_test": "Hard (7.5-8). Hexagonal crystals. Green=emerald, blue=aquamarine. Often in granitic pegmatites."
  },
  {
    "name": "Pyrite",
    "formula": "FeS₂",
    "hardness": "6-6.5",
    "streak": "greenish-black",
    "luster": "metallic",
    "color": "brass yellow",
    "crystal_system": "cubic",
    "rarity": "common",
    "description": "'Fool's gold.' Cubic crystals characteristic. Contains trace gold in some deposits.",
    "field_test": "Metallic luster. Cubic crystals. Greenish-black streak (not golden!). Harder than gold."
  },
  {
    "name": "Magnetite",
    "formula": "Fe₃O₄",
    "hardness": "5.5-6.5",
    "streak": "black",
    "luster": "metallic",
    "color": "black",
    "crystal_system": "cubic",
    "rarity": "common",
    "description": "Magnetic iron oxide. Important ore mineral. Responds to magnets.",
    "field_test": "Magnetic (strong). Black metallic luster. Cubic or octahedral crystals. Black streak."
  },
  {
    "name": "Fluorite",
    "formula": "CaF₂",
    "hardness": "4",
    "streak": "white",
    "luster": "vitreous",
    "color": "purple, green, blue, colorless, multicolored",
    "crystal_system": "cubic",
    "rarity": "uncommon",
    "description": "Colorful cubic crystals. Fluoresces under UV. Collector favorite.",
    "field_test": "Perfect cubic cleavage (breaks into perfect cubes). Soft (scratches with blade). Purple is common."
  },
  {
    "name": "Calcite",
    "formula": "CaCO₃",
    "hardness": "3",
    "streak": "white",
    "luster": "vitreous",
    "color": "varied (clear, pink, yellow, orange)",
    "crystal_system": "hexagonal (trigonal)",
    "rarity": "common",
    "description": "Dissolves in dilute HCl (fizzes). Limestone/marble major component.",
    "field_test": "Soft (3 - scratches easily with blade). Fizzes in HCl. Rhombohedral crystals or massive."
  },
  {
    "name": "Malachite",
    "formula": "Cu₂(CO₃)(OH)₂",
    "hardness": "3.5-4",
    "streak": "green",
    "luster": "silky to adamantine",
    "color": "bright green, banded",
    "crystal_system": "monoclinic",
    "rarity": "uncommon",
    "description": "Copper carbonate. Striking green color. Secondary (oxidized) mineral.",
    "field_test": "Bright green. Banded patterns common. Soft (scratches with knife). Often with azurite (blue)."
  }
]
```

---

## Integration Checklist

- [ ] Download MRDS CSV + parse 50-100 hotspots
- [ ] Download USGS Mineral Commodity Summaries
- [ ] Create 100 core Mineral records
- [ ] Create 50+ Hotspot records (Colorado, Utah, California focus)
- [ ] Populate GeologicalContext for each region
- [ ] Seed ConversationContext teaching progressions
- [ ] Record Gemma Stone voice samples (Google TTS)
- [ ] Validate BLM land ownership for hotspots
- [ ] Create 20 sample Specimen + SpecimenPhoto records
- [ ] Test identification workflow with seeded data
- [ ] Load IdentificationReasoning examples

---

## Open Access Licensing

✅ All data sources are **public domain or CC-licensed:**
- USGS data: Public domain (https://www.usgs.gov/faqs/what-public-domain-science-and-policy)
- Mindat.org: CC-BY (with attribution)
- BLM data: Public domain (government data)

---

## Budget & Timeline

| Phase | Task | Duration | Data Points | Cost |
|-------|------|----------|-------------|------|
| 1 | Mineral library | 3-5 days | 100 minerals × 10 fields | $0 |
| 2 | Hotspot seeding | 5-7 days | 50-100 hotspots × 8 fields | $0 |
| 3 | Education content | 5-7 days | 100 teaching snippets | $50 TTS |
| 4 | Training data | 3-5 days | 50 specimen examples | $0 |
| **Total** | | **2-3 weeks** | **5K+ data points** | **$50** |

---

## Future Phases

- **Phase 5:** Real-time mineral price feeds (USGS Commodity Prices API)
- **Phase 6:** Weather data seeding (OpenWeatherMap for past conditions)
- **Phase 7:** Community corrections → retraining dataset
- **Phase 8:** Advanced ML (rare earth prediction, formation modeling)

---

*All data sources verified as of May 6, 2026. Prioritize MRDS + Mindat for production launch.*