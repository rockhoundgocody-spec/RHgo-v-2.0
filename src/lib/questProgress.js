import { base44 } from '@/api/base44Client';

/**
 * Increments progress on all active quests that match a newly-saved specimen.
 * When a quest reaches its target_count, marks it 'completed', sets completed_at,
 * and awards XP via the idempotent awardXP function.
 *
 * @param {Object} specimen — the Specimen record just saved
 * @param {string} userEmail — owner email
 * @returns {Promise<Array>} — newly completed Quest records (empty if none)
 */
export async function progressQuestsForSpecimen(specimen, userEmail) {
  if (!userEmail || !specimen) return [];

  let activeQuests = [];
  try {
    activeQuests = await base44.entities.Quest.filter({
      owner_email: userEmail,
      status: 'active',
    });
  } catch {
    return [];
  }

  const completed = [];

  for (const quest of activeQuests) {
    // Skip expired quests
    if (quest.expires_at && new Date(quest.expires_at).getTime() < Date.now()) continue;

    // Check if this specimen qualifies for this quest
    if (!questMatchesSpecimen(quest, specimen)) continue;

    const newProgress = (quest.progress || 0) + 1;
    const reachedTarget = newProgress >= (quest.target_count || 1);

    const updates = { progress: newProgress };
    if (reachedTarget) {
      updates.status = 'completed';
      updates.completed_at = new Date().toISOString();
    }

    try {
      await base44.entities.Quest.update(quest.id, updates);
    } catch {
      continue;
    }

    if (reachedTarget) {
      // Award XP idempotently — keyed to the quest so retries can't double-grant
      try {
        await base44.functions.invoke('awardXP', {
          amount: quest.xp_reward || 0,
          reason: `Quest complete: ${quest.title}`,
          idempotency_key: `quest:${quest.id}`,
        });
      } catch { /* best-effort — quest is still marked complete */ }
      completed.push({ ...quest, progress: newProgress, status: 'completed', completed_at: updates.completed_at });
    }
  }

  return completed;
}

/**
 * Determines whether a specimen counts toward a quest's progress.
 */
function questMatchesSpecimen(quest, specimen) {
  // Rarity-gated quest (e.g. "Rare Hunter") — only rare/legendary count
  if (quest.target_rarity) {
    const target = quest.target_rarity.toLowerCase();
    const specRarity = (specimen.rarity || '').toLowerCase();
    if (target === 'rare' && !['rare', 'legendary'].includes(specRarity)) return false;
    if (target === 'legendary' && specRarity !== 'legendary') return false;
  }

  // Mineral-specific quest
  if (quest.target_mineral) {
    const target = quest.target_mineral.toLowerCase();
    const specMineral = (specimen.mineral_name || '').toLowerCase();
    if (!specMineral.includes(target) && !target.includes(specMineral)) return false;
  }

  return true;
}