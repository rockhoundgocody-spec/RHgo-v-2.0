import re

with open('src/pages/Scan.jsx', 'r') as f:
    content = f.read()

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

old_save_with_choice = re.compile(r"  const saveWithChoice = async \(choice\) => \{.*?    if \(choice\.geoPrivacy !== 'private'\) setTimeout\(\(\) => setShareMapOpen\(true\), 800\);\n  \};\n", re.DOTALL)

content = old_save_with_choice.sub(save_with_choice_new + "\\n", content)

with open('src/pages/Scan.jsx', 'w') as f:
    f.write(content)
