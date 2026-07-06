/**
 * Specimen Performance & Caching Utilities
 * Handles:
 * - Image lazy loading + progressive rendering
 * - Pagination for large collections
 * - Local cache + sync queue prioritization
 * - Geological context preloading
 */

export const IMAGE_CACHE_KEY = 'rockhound_specimen_images';

/**
 * Lazy load specimen photos with quality estimation
 */
export function lazyLoadSpecimenPhotos(specimenId, maxPhotos = 4) {
  return async (base44) => {
    const photos = await base44.entities.SpecimenPhoto.filter(
      { specimen_id: specimenId },
      '-is_primary',
      maxPhotos
    );

    // Sort by quality, prioritize macro/close-up
    return photos.sort((a, b) => {
      const qualityDiff = (b.quality_score || 0) - (a.quality_score || 0);
      if (qualityDiff !== 0) return qualityDiff;
      
      const angleOrder = { 'macro': 1, 'frontal': 2, 'side': 3 };
      return (angleOrder[a.capture_angle] || 999) - (angleOrder[b.capture_angle] || 999);
    });
  };
}

/**
 * Paginate specimens with efficient filtering
 */
export async function paginateSpecimens(
  base44,
  filters = {},
  pageSize = 20,
  pageNum = 0,
  sortField = '-created_date'
) {
  const skip = pageNum * pageSize;
  const specimens = await base44.entities.Specimen.filter(
    filters,
    sortField,
    pageSize + 1,
    skip
  );

  return {
    items: specimens.slice(0, pageSize),
    hasMore: specimens.length > pageSize,
    pageNum,
    pageSize,
  };
}

/**
 * Preload geological context for a specimen
 */
export async function preloadGeologicalContext(base44, specimenId) {
  const specimen = await base44.entities.Specimen.get(specimenId);
  
  if (!specimen.geological_context_id) return null;

  const context = await base44.entities.GeologicalContext.get(
    specimen.geological_context_id
  );

  // Cache in IndexedDB for offline access
  const cache = await caches.open(IMAGE_CACHE_KEY);
  await cache.put(
    `geo-context-${specimen.geological_context_id}`,
    new Response(JSON.stringify(context))
  );

  return context;
}

/**
 * Identify sync priority (offline-first batching)
 * Higher priority = sync first
 */
export const SYNC_PRIORITY = {
  BADGE: 1,
  NOTES: 2,
  PHOTOS: 5,
  SPECIMENS: 10,
  FAMILY: 15,
};

/**
 * Check if offline + queue sync
 */
export async function queueSpecimenSync(base44, specimenId, operation = 'update') {
  const isOnline = navigator.onLine;

  if (!isOnline) {
    // Create SyncQueue entry
    await base44.entities.SyncQueue.create({
      entity_type: 'Specimen',
      entity_id: specimenId,
      operation,
      priority: SYNC_PRIORITY.SPECIMENS,
      status: 'pending',
    });

    return { queued: true, synced: false };
  }

  // Online: sync immediately
  return { queued: false, synced: true };
}

/**
 * Render optimization: only load reasoning history on demand
 */
export async function loadIdentificationHistory(base44, specimenId) {
  return base44.entities.IdentificationReasoning.filter(
    { specimen_id: specimenId },
    '-created_at',
    100
  );
}

/**
 * Calculate specimen scientific credibility score
 * Factors: photo count, reasoning depth, verification steps
 */
export function calculateCredibilityScore(specimen, reasoningHistory = []) {
  let score = 0;

  // Confidence baseline
  score += (specimen.ai_confidence || 0) * 30;

  // Photo evidence
  const photoCount = specimen.photo_ids?.length || 0;
  score += Math.min(photoCount * 10, 25);

  // Verification depth
  score += (specimen.verification_count || 0) * 5;

  // Reasoning completeness
  const deepReasoning = reasoningHistory.filter(
    (r) => r.key_evidence?.length > 2
  ).length;
  score += Math.min(deepReasoning * 8, 20);

  // Expert review
  if (specimen.verified) score += 20;

  return Math.min(Math.round(score), 100);
}

/**
 * Batch update sync queue (efficient offline reconciliation)
 */
export async function processSyncQueue(base44, maxAttempts = 3) {
  const queue = await base44.entities.SyncQueue.filter(
    { status: { $in: ['pending', 'failed'] } },
    '-priority',
    50
  );

  const results = { synced: 0, failed: 0, queued: 0 };

  const syncTasks = queue.map(async (item) => {
    if (item.attempt_count >= maxAttempts) {
      await base44.entities.SyncQueue.update(item.id, { status: "conflict" });
      return "failed";
    }

    try {
      const entity = base44.entities[item.entity_type];
      
      if (item.operation === "create") {
        await entity.create(item.payload);
      } else if (item.operation === "update") {
        await entity.update(item.entity_id, item.payload);
      } else if (item.operation === "delete") {
        await entity.delete(item.entity_id);
      }

      await base44.entities.SyncQueue.update(item.id, {
        status: "synced",
        attempt_count: item.attempt_count + 1,
      });
      return "synced";
    } catch (error) {
      await base44.entities.SyncQueue.update(item.id, {
        status: "failed",
        attempt_count: item.attempt_count + 1,
        error_message: error.message,
      });
      return "queued";
    }
  });

  const outcomes = await Promise.allSettled(syncTasks);

  outcomes.forEach((outcome) => {
    if (outcome.status === "fulfilled") {
      results[outcome.value]++;
    } else {
      results.failed++;
    }
  });
  return results;
}