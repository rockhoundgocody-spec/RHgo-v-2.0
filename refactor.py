import re

with open('src/pages/Scan.jsx', 'r') as f:
    content = f.read()

# We need to insert the helper functions above the export default function Scan
helper_funcs = """// Geo privacy controls — exact, approximate (~1km), or private (no coords)
const applyGeoPrivacy = (gpsCoords, geoPrivacy) => {
  let lat = gpsCoords?.lat ?? null;
  let lng = gpsCoords?.lng ?? null;
  if (geoPrivacy === 'private') {
    return { lat: null, lng: null };
  } else if (geoPrivacy === 'approximate' && lat != null) {
    return {
      lat: Math.round(lat * 100) / 100,
      lng: Math.round(lng * 100) / 100,
    };
  }
  return { lat, lng };
};

const persistSpecimen = async (primaryUrl, result, choice, lat, lng, wetDry, beachName, rqs, xp) => {
  // Route through the backend identifySpecimen function with save=true
  // so all rich metadata (scientific name, formula, hardness, formation, value) gets persisted
  const res = await base44.functions.invoke('identifySpecimen', {
    image_url: primaryUrl,
    lat,
    lng,
    save: true,
    share_to_map: false,
    prefilled_result: result,
    wet_dry: wetDry,
    beach_name: beachName,
  });

  // Backend may return saved_specimen_id; fall back to direct creation if needed
  let specimenId = res?.data?.saved_specimen_id;
  let specimenObj = null;

  if (!specimenId) {
    // Fallback: save directly with full metadata from result
    const richNotes = [
      result.description,
      result.scientific_name ? `Scientific name: ${result.scientific_name}` : null,
      result.chemical_formula ? `Formula: ${result.chemical_formula}` : null,
      result.crystal_system ? `Crystal system: ${result.crystal_system}` : null,
      result.hardness_mohs != null ? `Hardness: ${result.hardness_mohs} Mohs` : null,
      result.formation ? `Formation: ${result.formation}` : null,
      result.value_estimate ? `Value: ${result.value_estimate}` : null,
      result.fun_fact ? `Fun fact: ${result.fun_fact}` : null,
    ].filter(Boolean).join('\\n\\n');

    const created = await base44.entities.Specimen.create({
      mineral_name:  result.top_match,
      common_name:   result.scientific_name || result.top_match,
      image_url:     primaryUrl,
      ai_confidence: result.confidence,
      ai_candidates: result.candidates,
      notes:         richNotes,
      rarity:        result.rarity,
      found_date:    new Date().toISOString().split('T')[0],
      ...(lat != null ? { lat, lng } : {}),
    });
    specimenId = created.id;
    specimenObj = created;
  } else {
    specimenObj = { id: specimenId, mineral_name: result.top_match, image_url: primaryUrl, ...result };
  }

  // Persist discovery-choice fields on the specimen
  await base44.entities.Specimen.update(specimenId, {
    disposition: choice.disposition,
    collected: choice.disposition === 'collected',
    left_in_place: choice.disposition === 'left_in_place',
    legal_status: 'user_confirmed',
    ethics_prompt_shown: true,
    user_confirmed_legal_access: true,
    geo_privacy: choice.geoPrivacy,
    rarity_quality_score: rqs,
    xp_awarded: xp,
  });

  return { specimenId, specimenObj };
};

const awardDiscoveryXPAndTrack = async (choice, xp) => {
  const me = await base44.auth.me().catch(() => null);
  if (!me?.email) return;

  // Award category XP — Collector for collecting, Steward for leaving in place
  const cat = choice.disposition === 'left_in_place' ? 'steward' : 'collector';
  const emptyCats = { collector: 0, steward: 0, scientist: 0, explorer: 0, mentor: 0 };
  const profs = await base44.entities.PlayerProfile.filter({ owner_email: me.email });

  if (profs[0]) {
    const cats = { ...emptyCats, ...(profs[0].xp_categories || {}) };
    cats[cat] += xp;
    await base44.entities.PlayerProfile.update(profs[0].id, {
      xp_categories: cats,
      total_xp: (profs[0].total_xp || 0) + xp,
    });
  } else {
    await base44.entities.PlayerProfile.create({
      owner_email: me.email,
      total_xp: xp,
      xp_categories: { ...emptyCats, [cat]: xp },
    });
  }

  // Track collected weight for Michigan legal limit
  if (choice.disposition === 'collected') {
    logCollectedWeight(me.email);
  }
};

export default function Scan({ voiceEnabled }) {"""

content = content.replace("export default function Scan({ voiceEnabled }) {", helper_funcs)

save_with_choice_new = """  const saveWithChoice = async (choice) => {
    setChoiceOpen(false);
    if (!result || !primaryUrl) return;

    const { lat, lng } = applyGeoPrivacy(gpsCoords, choice.geoPrivacy);

    const rarityWeight = { common: 1, uncommon: 2, rare: 3, legendary: 5 }[result.rarity] || 1;
    const rqs = Math.round(rarityWeight * (result.confidence || 0.5) * 20);
    const xp = choice.disposition === 'left_in_place' ? 40 : 25;

    const { specimenId, specimenObj } = await persistSpecimen(
      primaryUrl, result, choice, lat, lng, wetDry, beachName, rqs, xp
    );

    await awardDiscoveryXPAndTrack(choice, xp);

    setSavedId(specimenId);
    setSavedSpecimen(specimenObj);

    // Trigger rare mineral popup for rare/legendary saves
    if (['rare', 'legendary'].includes(result.rarity)) {
      // Briefly wait for badge refresh so we can attach it to the popup
      await refreshBadges();
      setRarePopup({ rarity: result.rarity, mineralName: result.top_match });
    } else {
      refreshBadges();
    }

    if (choice.geoPrivacy !== 'private') setTimeout(() => setShareMapOpen(true), 800);
  };"""

import re
old_save_with_choice = re.compile(r"  const saveWithChoice = async \(choice\) => \{.*?    if \(choice\.geoPrivacy !== 'private'\) setTimeout\(\(\) => setShareMapOpen\(true\), 800\);\n  \};\n", re.DOTALL)

content = old_save_with_choice.sub(save_with_choice_new + "\\n", content)

with open('src/pages/Scan.jsx', 'w') as f:
    f.write(content)
