import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * seedSpecimenImages — searches the web for wet + dry raw field photos
 * for each mineral in the library and stores them as TrainingCandidate records.
 * Run from admin or on a schedule. Skips minerals that already have enough images.
 */

const MIN_IMAGES_PER_MINERAL = 6; // 3 wet + 3 dry per mineral target

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Admin only' }, { status: 403 });

    // Fetch all minerals
    const minerals = await base44.asServiceRole.entities.Mineral.list();
    if (!minerals?.length) return Response.json({ error: 'No minerals found' }, { status: 404 });

    // Count existing training candidates per mineral
    const existing = await base44.asServiceRole.entities.TrainingCandidate.list();
    const existingCounts = {};
    for (const tc of existing) {
      const lbl = (tc.predicted_label || tc.user_label || '').toLowerCase();
      existingCounts[lbl] = (existingCounts[lbl] || 0) + 1;
    }

    const results = { seeded: 0, skipped: 0, errors: [] };
    const conditions = ['wet raw field specimen', 'dry raw field specimen'];

    // Process up to 5 minerals per call to avoid timeouts — schedule repeatedly
    const toProcess = minerals
      .filter(m => (existingCounts[(m.name || '').toLowerCase()] || 0) < MIN_IMAGES_PER_MINERAL)
      .slice(0, 5);

    for (const mineral of toProcess) {
      const name = mineral.name;
      for (const condition of conditions) {
        try {
          const searchPrompt = `Search mindat.org, wikimedia commons, and geology photo databases for real field photograph URLs of ${name} mineral specimens (${condition}). I need actual direct image URLs (.jpg .jpeg .png .webp) — not page links. Prioritize mindat.org photo gallery images, Wikimedia Commons mineral photos, and verified geology forums. Return 3 direct image URLs.`;

          const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: searchPrompt,
            add_context_from_internet: true,
            model: 'gemini_3_flash',
            response_json_schema: {
              type: 'object',
              properties: {
                image_urls: { type: 'array', items: { type: 'string' } },
              },
            },
          });

          const urls = res?.image_urls || [];
          const isWet = condition.includes('wet');

          for (const url of urls.slice(0, 2)) {
            if (!url || !url.startsWith('http')) continue;
            await base44.asServiceRole.entities.TrainingCandidate.create({
              image_url: url,
              predicted_label: name,
              user_label: name,
              user_notes: `Auto-seeded: ${isWet ? 'wet' : 'dry'} field specimen`,
              status: 'pending',
              model_version: 'gemini_3_flash_seed',
              predicted_confidence: 0.7,
            });
            results.seeded++;
          }
        } catch (e) {
          results.errors.push(`${name} (${condition}): ${e.message}`);
        }
      }
    }

    results.skipped = minerals.length - toProcess.length;
    return Response.json({ success: true, ...results, total_minerals: minerals.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});