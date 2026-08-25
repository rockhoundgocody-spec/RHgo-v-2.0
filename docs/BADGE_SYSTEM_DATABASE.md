# Liquid Mineral Badges — Database Schema & Integration Guide

The **Liquid Mineral Badges** system tracks user field achievements in RockHound GO. Each badge is represented by a photorealistic 3D octagonal medallion constructed from 6 distinct materials (Liquid Glass, Natural Stone, Metallic Inlay, Crystal Core, Geo Topo Lines, Ambient Particles).

---

## 1. Schema Specifications

### Base44 Entity Schema (`Badge.jsonc`) & Neon Postgres Table (`public.badges`)

| Column / Field | Data Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` / `STRING` | Primary key identifier |
| `code` | `VARCHAR(64)` | Unique badge code (e.g. `crystal_whisperer`, `apex_hunter`) |
| `title` | `VARCHAR(128)` | Display title (e.g. "Crystal Whisperer") |
| `description` | `TEXT` | Unlocking condition description |
| `rarity` | `VARCHAR(32)` | Rarity tier (`common`, `uncommon`, `rare`, `epic`, `legendary`) |
| `material` | `VARCHAR(32)` | Core material (`liquid_glass`, `natural_stone`, `metallic_inlay`, `crystal_core`, `geo_topo`) |
| `color_scheme` | `VARCHAR(32)` | Palette (`amethyst`, `gold`, `emerald`, `teal`, `violet`, `amber`, `ruby`, `cyan`, `copper`, `slate`, `jade`, `ocean`) |
| `icon` | `VARCHAR(32)` | Lucide icon symbol key (e.g. `Gem`, `Footprints`, `Globe`) |
| `progress_current` | `INTEGER` | Current progress count toward completion |
| `progress_target` | `INTEGER` | Target count needed for unlock |
| `earned_at` | `TIMESTAMPTZ` | Timestamp when unlocked (NULL if in progress) |
| `owner_email` | `VARCHAR(255)` | User email who owns the badge |
| `created_at` | `TIMESTAMPTZ` | Record creation date |

---

## 2. PostgreSQL DDL SQL (Neon Database)

```sql
CREATE TABLE IF NOT EXISTS public.badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) NOT NULL,
  title VARCHAR(128) NOT NULL,
  description TEXT,
  rarity VARCHAR(32) DEFAULT 'common',
  material VARCHAR(32) DEFAULT 'crystal_core',
  color_scheme VARCHAR(32) DEFAULT 'amethyst',
  icon VARCHAR(32) DEFAULT 'Gem',
  progress_current INT DEFAULT 0,
  progress_target INT DEFAULT 1,
  earned_at TIMESTAMPTZ,
  owner_email VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_owner_badge UNIQUE (owner_email, code)
);

CREATE INDEX IF NOT EXISTS idx_badges_owner ON public.badges(owner_email);
CREATE INDEX IF NOT EXISTS idx_badges_rarity ON public.badges(rarity);
```

---

## 3. The 15 Unique Badges

1. **Crystal Whisperer** (`crystal_whisperer`): Find your first rare crystal (Common · Liquid Glass)
2. **Trailblazer** (`trailblazer`): Explore 25 sites (Uncommon · Geo Topo)
3. **Pathfinder** (`pathfinder`): Explore 50 sites (Rare · Liquid Glass)
4. **Master of Stone** (`master_of_stone`): Collect 250 specimens (Rare · Crystal Core)
5. **Sharp Eye** (`sharp_eye`): Identify 10 rocks correctly (Common · Natural Stone)
6. **Rare Seeker** (`rare_seeker`): Find 5 rare specimens (Rare · Metallic Inlay)
7. **Shared Adventure** (`shared_adventure`): Complete your first family trip (Rare · Natural Stone)
8. **Vein Tracker** (`vein_tracker`): Follow 3 mineral veins (Uncommon · Geo Topo)
9. **Perfect Strike** (`perfect_strike`): 10 correct identifications in a row (Epic · Liquid Glass)
10. **Memory Builder** (`memory_builder`): Create 5 memory capsules (Uncommon · Natural Stone)
11. **Pocket Finder** (`pocket_finder`): Find 20 pocket gems (Common · Metallic Inlay)
12. **Earth Chosen** (`earth_chosen`): Find your first legendary specimen (Legendary · Crystal Core)
13. **Cartographer** (`cartographer`): Explore 100 sites (Epic · Geo Topo)
14. **Apex Hunter** (`apex_hunter`): Complete a 7-day streak (Epic · Metallic Inlay)
15. **Legend of the Lode** (`legend_of_lode`): Discover a new mineral variant (Legendary · Geo Topo)

---

## 4. 5-Step Unlock Animation Sequence

1. **Initiate**: Unpowered obsidian stone octagon floating in dark space with ambient dust motes.
2. **Charge**: Subsurface purple energy veins build and concentric energy rings contract inward.
3. **Burst**: Crystal explosion, particle bloom scatter, and camera flash shake.
4. **Reveal**: Full 3D medallion materialises with glowing caustics and sweep-in text reveal.
5. **Complete**: Soft ambient chime visual indicator, floating golden particles settle, share & material breakdown available.
