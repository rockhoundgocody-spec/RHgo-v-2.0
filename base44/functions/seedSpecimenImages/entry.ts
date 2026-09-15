import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

/**
 * seedSpecimenImages — searches the web for wet + dry raw field photos
 * for each mineral in the library and stores them as TrainingCandidate records.
 * Run from admin or on a schedule. Skips minerals that already have enough images.
 *
 * Timeout fix: web-search LLM calls are the bottleneck. We now run every
 * search for the batch IN PARALLEL (Promise.all) and cap the batch to 3 minerals,
 * so wall-clock ≈ one LLM call (~10–15s) instead of 10 sequential calls.
 * Scheduled triggers have no user context, so auth.me() is optional.
 */

const MIN_IMAGES_PER_MINERAL = 6; // 3 wet + 3 dry per mineral target
const BATCH_SIZE = 3;              // minerals processed per invocation
const URLS_PER_CONDITION = 2;      // stored per wet/dry condition

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: admin only — prevents anonymous credit abuse and training-data pollution
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Fetch all minerals
    const minerals = await base44.asServiceRole.entities.Mineral.list();
    if (!minerals?.length) return Response.json({ error: 'No minerals found' }, { status: 404 });

    // Count existing training candidates per mineral (one pass)
    const existing = await base44.asServiceRole.entities.TrainingCandidate.list();
    const existingCounts = {};
    for (const tc of existing) {
      const lbl = (tc.predicted_label || tc.user_label || '').toLowerCase();
      existingCounts[lbl] = (existingCounts[lbl] || 0) + 1;
    }

    const toProcess = minerals
      .filter(m => (existingCounts[(m.name || '').toLowerCase()] || 0) < MIN_IMAGES_PER_MINERAL)
      .slice(0, BATCH_SIZE);

    if (!toProcess.length) {
      return Response.json({ success: true, seeded: 0, skipped: minerals.length, errors: [], total_minerals: minerals.length, note: 'All minerals already seeded' });
    }

    // Build all search jobs up front, then run them in parallel.
    const conditions = ['wet raw field specimen', 'dry raw field specimen'];
    const jobs = [];
    for (const mineral of toProcess) {
      for (const condition of conditions) {
        jobs.push({ name: mineral.name, condition });
      }
    }

    const searchResults = await Promise.all(
      jobs.map(async (job) => {
        try {
          const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
            prompt: `Search mindat.org, wikimedia commons, and geology photo databases for real field photograph URLs of ${job.name} mineral specimens (${job.condition}). I need actual direct image URLs (.jpg .jpeg .png .webp) — not page links. Prioritize mindat.org photo gallery images, Wikimedia Commons mineral photos, and verified geology forums. Return 3 direct image URLs.`,
            add_context_from_internet: true,
            model: 'gemini_3_flash',
            response_json_schema: {
              type: 'object',
              properties: {
                image_urls: { type: 'array', items: { type: 'string' } },
              },
            },
          });
          return { job, urls: res?.image_urls || [], error: null };
        } catch (e) {
          return { job, urls: [], error: e.message };
        }
      })
    );

    // Persist results — creates are fast, keep sequential to avoid write spikes.
    const results = { seeded: 0, skipped: minerals.length - toProcess.length, errors: [] };
    for (const { job, urls, error } of searchResults) {
      if (error) {
        results.errors.push(`${job.name} (${job.condition}): ${error}`);
        continue;
      }
      const isWet = job.condition.includes('wet');
      for (const url of urls.slice(0, URLS_PER_CONDITION)) {
        if (!url || !url.startsWith('http')) continue;
        try {
          await base44.asServiceRole.entities.TrainingCandidate.create({
            image_url: url,
            predicted_label: job.name,
            user_label: job.name,
            user_notes: `Auto-seeded: ${isWet ? 'wet' : 'dry'} field specimen`,
            status: 'pending',
            model_version: 'gemini_3_flash_seed',
            predicted_confidence: 0.7,
          });
          results.seeded++;
        } catch (e) {
          results.errors.push(`${job.name} (${job.condition}) create: ${e.message}`);
        }
      }
    }

    return Response.json({ success: true, ...results, total_minerals: minerals.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});