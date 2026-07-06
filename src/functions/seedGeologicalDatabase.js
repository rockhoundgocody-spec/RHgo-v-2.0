/* eslint-disable */
// deno-lint-ignore-file
/**
 * Seed RockHound-GO with geological reference data
 * Sources: USGS MRDS, Mindat.org, USGS Commodity Summaries
 * Run via: base44.functions.invoke('seedGeologicalDatabase', { phase: 1-4 })
 */

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

// Core mineral reference data (10 minerals for MVP)
const CORE_MINERALS = [
  {
    name: 'Quartz',
    formula: 'SiO₂',
    crystal_system: 'hexagonal',
    hardness: '7',
    color: 'varied (clear, purple, brown, pink)',
    luster: 'vitreous',
    streak: 'white',
    description: 'Most common mineral. Forms in pegmatites, hydrothermal veins, detrital sand.',
    rarity: 'common',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    category: 'silicate',
  },
  {
    name: 'Feldspar (Orthoclase)',
    formula: 'KAlSi₃O₈',
    crystal_system: 'monoclinic',
    hardness: '6',
    color: 'pink, white, gray',
    luster: 'vitreous to pearly',
    streak: 'white',
    description: 'Primary component of granites and pegmatites. Second most abundant mineral.',
    rarity: 'common',
    image_url: 'https://images.unsplash.com/photo-1611080626919-48cf44f84181?w=400',
    category: 'silicate',
  },
  {
    name: 'Mica (Muscovite)',
    formula: 'KAl₂(AlSi₃O₁₀)(OH)₂',
    crystal_system: 'monoclinic',
    hardness: '2.5-3',
    color: 'colorless to pale brown',
    luster: 'vitreous to pearly',
    streak: 'white',
    description: 'Splits into thin, flexible sheets. Major pegmatite mineral.',
    rarity: 'common',
    image_url: 'https://images.unsplash.com/photo-1533460803829-37b3e6ba6f5f?w=400',
    category: 'silicate',
  },
  {
    name: 'Tourmaline',
    formula: 'Na(Li,Mg,Al)₃Al₆(Si₆O₁₈)(BO₃)₃(OH)₃OH',
    crystal_system: 'hexagonal',
    hardness: '7-7.5',
    color: 'black, pink, blue, multicolored',
    luster: 'vitreous',
    streak: 'white',
    description: 'Prized by collectors. Pegmatite gem with pleochroism.',
    rarity: 'uncommon',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    category: 'silicate',
  },
  {
    name: 'Beryl',
    formula: 'Be₃Al₂Si₆O₁₈',
    crystal_system: 'hexagonal',
    hardness: '7.5-8',
    color: 'green (emerald), blue (aquamarine), colorless, pink',
    luster: 'vitreous',
    streak: 'white',
    description: 'Important gem mineral. Pegmatite deposit indicator.',
    rarity: 'uncommon',
    image_url: 'https://images.unsplash.com/photo-1535632066927-ab7e9ab60908?w=400',
    category: 'silicate',
  },
  {
    name: 'Pyrite',
    formula: 'FeS₂',
    crystal_system: 'cubic',
    hardness: '6-6.5',
    color: 'brass yellow',
    luster: 'metallic',
    streak: 'greenish-black',
    description: '"Fool\'s gold." Cubic crystals characteristic. May contain trace gold.',
    rarity: 'common',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    category: 'sulfide',
  },
  {
    name: 'Magnetite',
    formula: 'Fe₃O₄',
    crystal_system: 'cubic',
    hardness: '5.5-6.5',
    color: 'black',
    luster: 'metallic',
    streak: 'black',
    description: 'Magnetic iron oxide. Important ore mineral. Responds to magnets.',
    rarity: 'common',
    image_url: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400',
    category: 'oxide',
  },
  {
    name: 'Fluorite',
    formula: 'CaF₂',
    crystal_system: 'cubic',
    hardness: '4',
    color: 'purple, green, blue, colorless, multicolored',
    luster: 'vitreous',
    streak: 'white',
    description: 'Colorful cubic crystals. Fluoresces under UV. Collector favorite.',
    rarity: 'uncommon',
    image_url: 'https://images.unsplash.com/photo-1599043513187-f0b217e1ee4d?w=400',
    category: 'halide',
  },
  {
    name: 'Calcite',
    formula: 'CaCO₃',
    crystal_system: 'hexagonal',
    hardness: '3',
    color: 'varied (clear, pink, yellow, orange)',
    luster: 'vitreous',
    streak: 'white',
    description: 'Dissolves in dilute HCl (fizzes). Limestone/marble component.',
    rarity: 'common',
    image_url: 'https://images.unsplash.com/photo-1599043513187-f0b217e1ee4d?w=400',
    category: 'carbonate',
  },
  {
    name: 'Malachite',
    formula: 'Cu₂(CO₃)(OH)₂',
    crystal_system: 'monoclinic',
    hardness: '3.5-4',
    color: 'bright green, banded',
    luster: 'silky to adamantine',
    streak: 'green',
    description: 'Striking green color. Secondary mineral. Often with azurite.',
    rarity: 'uncommon',
    image_url: 'https://images.unsplash.com/photo-1543722530-d2c3201371e7?w=400',
    category: 'carbonate',
  },
];

// Sample hotspots for Colorado, Utah, California
const SAMPLE_HOTSPOTS = [
  {
    name: 'Florissant Pegmatite, Colorado',
    state: 'Colorado',
    country: 'USA',
    lat: 38.9039,
    lng: -105.2844,
    land_type: 'public',
    minerals: ['Quartz', 'Feldspar', 'Mica', 'Tourmaline'],
    difficulty: 'easy',
    description: 'Classic pegmatite locality. Excellent quartz and tourmaline finds.',
    rules: 'BLM rockhounding allowed. Up to 20 lbs per person per day. No machinery.',
    trust_score: 0.9,
    source: 'USGS MRDS',
  },
  {
    name: 'Lake George Pegmatite District, Colorado',
    state: 'Colorado',
    country: 'USA',
    lat: 38.8961,
    lng: -105.2772,
    land_type: 'public',
    minerals: ['Beryl', 'Quartz', 'Feldspar', 'Amazonite'],
    difficulty: 'moderate',
    description: 'Pegmatite with excellent beryl and amazonite specimens.',
    rules: 'BLM public lands. Rockhounding permitted.',
    trust_score: 0.85,
    source: 'USGS MRDS',
  },
  {
    name: 'Mesa County Pegmatites, Colorado',
    state: 'Colorado',
    country: 'USA',
    lat: 39.1625,
    lng: -108.5428,
    land_type: 'blm',
    minerals: ['Quartz', 'Feldspar', 'Tourmaline', 'Beryl'],
    difficulty: 'moderate',
    description: 'Large pegmatite bodies with documented quartz and tourmaline.',
    rules: 'BLM lands. Standard rockhounding rules apply.',
    trust_score: 0.8,
    source: 'USGS MRDS',
  },
  {
    name: 'Tintic Mining District, Utah',
    state: 'Utah',
    country: 'USA',
    lat: 39.7369,
    lng: -111.8975,
    land_type: 'public',
    minerals: ['Pyrite', 'Magnetite', 'Fluorite', 'Quartz'],
    difficulty: 'hard',
    description: 'Historic mining district. Secondary minerals from oxidation.',
    rules: 'Check with local BLM office. Some areas may have restrictions.',
    trust_score: 0.75,
    source: 'USGS MRDS',
  },
  {
    name: 'Beehive District Pegmatites, Utah',
    state: 'Utah',
    country: 'USA',
    lat: 38.7411,
    lng: -112.1956,
    land_type: 'forest_service',
    minerals: ['Tourmaline', 'Beryl', 'Quartz', 'Feldspar'],
    difficulty: 'moderate',
    description: 'Pegmatite deposits with tourmaline and beryl.',
    rules: 'National Forest. Rockhounding generally allowed.',
    trust_score: 0.8,
    source: 'USGS MRDS',
  },
];

// Geological context for each region
const GEOLOGICAL_CONTEXTS = [
  {
    mineral_name: 'Quartz',
    region: 'Colorado Front Range',
    host_rock: 'granite, pegmatite, hydrothermal veins',
    geological_period: 'precambrian to recent',
    formation_process: 'Pegmatite crystallization, hydrothermal, detrital',
    rarity: 'common',
    lookalike_minerals: ['Feldspar (softer)', 'Glass (man-made)'],
    verification_tests: [
      { key: 'hardness', test: 'Hardness 7 - resist nail scratch', why: 'Confirms quartz vs feldspar' },
      { key: 'streak', test: 'White streak on ceramic', why: 'Color may vary; streak is definitive' },
      { key: 'luster', test: 'Vitreous (glassy) luster', why: 'Characteristic appearance' },
      { key: 'form', test: 'Hexagonal crystals or termination', why: 'Distinguishes quartz geometry' },
    ],
    safety_hazards: 'None typical. Avoid silica dust when collecting.',
    educational_summary:
      'Quartz is the most abundant mineral on Earth. It forms in many environments: pegmatites (slow cooling magma), hydrothermal veins (hot groundwater), and as detrital sand. Its hardness (7) and vitreous luster make it instantly recognizable.',
  },
  {
    mineral_name: 'Tourmaline',
    region: 'Colorado Front Range',
    host_rock: 'pegmatite, granite',
    geological_period: 'precambrian',
    formation_process: 'Pegmatite crystallization',
    rarity: 'uncommon',
    lookalike_minerals: ['Black tourmaline vs magnetite (but tourmaline is hexagonal, magnetite is cubic)'],
    verification_tests: [
      { key: 'hardness', test: 'Hardness 7-7.5 - comparable to quartz', why: 'Confirms durability' },
      { key: 'color', test: 'Striped black & pink or solid colors', why: 'Tourmaline often multicolored' },
      { key: 'form', test: 'Hexagonal prism with striations', why: 'Characteristic habit' },
      { key: 'density', test: 'Feels heavier than quartz (3.0-3.2 g/cm³)', why: 'Boron-rich minerals are denser' },
    ],
    safety_hazards: 'None typical.',
    educational_summary:
      'Tourmaline is a borosilicate mineral prized by collectors. It forms in pegmatites during slow magma cooling. Color variation (pleochroism) means color changes with viewing angle. Often found with quartz and feldspar in Colorado pegmatites.',
  },
];

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { phase } = await req.json();

    let result = {};

    if (phase === 1 || !phase) {
      // Phase 1: Seed core minerals
      const mineralResults = await base44.entities.Mineral.bulkCreate(CORE_MINERALS);
      result.phase1 = {
        status: 'success',
        minerals_created: mineralResults.length,
        message: `Created ${mineralResults.length} core mineral records`,
      };
    }

    if (phase === 2 || !phase) {
      // Phase 2: Seed hotspots
      const hotspotResults = await base44.entities.Hotspot.bulkCreate(SAMPLE_HOTSPOTS);
      result.phase2 = {
        status: 'success',
        hotspots_created: hotspotResults.length,
        message: `Created ${hotspotResults.length} hotspot records`,
      };
    }

    if (phase === 3 || !phase) {
      // Phase 3: Seed geological contexts
      const contextResults = await base44.entities.GeologicalContext.bulkCreate(GEOLOGICAL_CONTEXTS);
      result.phase3 = {
        status: 'success',
        contexts_created: contextResults.length,
        message: `Created ${contextResults.length} geological context records`,
      };
    }

    if (phase === 4 || !phase) {
      // Phase 4: Create sample companion for testing
      const companionResult = await base44.entities.Companion.create({
        owner_email: user.email,
        name: 'Amethyst',
        level: 1,
        xp: 0,
        energy: 80,
        mood: 'calm',
        streak_days: 0,
      });
      result.phase4 = {
        status: 'success',
        companion_created: true,
        companion_id: companionResult.id,
        message: 'Created sample Companion record',
      };
    }

    return Response.json({
      status: 'success',
      message: 'Database seeding complete',
      phases_run: phase ? [phase] : [1, 2, 3, 4],
      results: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Seeding error:', error);
    return Response.json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
});