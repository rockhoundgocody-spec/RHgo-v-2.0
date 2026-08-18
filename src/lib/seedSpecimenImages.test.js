import { describe, it, expect } from 'vitest';

// Simulate sequential creation (baseline pattern in seedSpecimenImages)
async function persistResultsSequential(searchResults, mockBase44, urlsPerCondition = 2) {
  const results = { seeded: 0, errors: [] };
  let dbCallsCount = 0;

  for (const { job, urls, error } of searchResults) {
    if (error) {
      results.errors.push(`${job.name} (${job.condition}): ${error}`);
      continue;
    }
    const isWet = job.condition.includes('wet');
    for (const url of urls.slice(0, urlsPerCondition)) {
      if (!url || !url.startsWith('http')) continue;
      try {
        dbCallsCount++;
        await mockBase44.asServiceRole.entities.TrainingCandidate.create({
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

  return { results, dbCallsCount };
}

// Simulate bulk creation (optimized pattern)
async function persistResultsBulk(searchResults, mockBase44, urlsPerCondition = 2) {
  const results = { seeded: 0, errors: [] };
  let dbCallsCount = 0;

  const candidatesToCreate = [];
  for (const { job, urls, error } of searchResults) {
    if (error) {
      results.errors.push(`${job.name} (${job.condition}): ${error}`);
      continue;
    }
    const isWet = job.condition.includes('wet');
    for (const url of urls.slice(0, urlsPerCondition)) {
      if (!url || !url.startsWith('http')) continue;
      candidatesToCreate.push({
        image_url: url,
        predicted_label: job.name,
        user_label: job.name,
        user_notes: `Auto-seeded: ${isWet ? 'wet' : 'dry'} field specimen`,
        status: 'pending',
        model_version: 'gemini_3_flash_seed',
        predicted_confidence: 0.7,
      });
    }
  }

  if (candidatesToCreate.length > 0) {
    try {
      dbCallsCount++;
      const created = await mockBase44.asServiceRole.entities.TrainingCandidate.bulkCreate(candidatesToCreate);
      results.seeded += Array.isArray(created) ? created.length : candidatesToCreate.length;
    } catch (e) {
      results.errors.push(`Bulk create training candidates: ${e.message}`);
    }
  }

  return { results, dbCallsCount };
}

describe('seedSpecimenImages Database Operations Optimization', () => {
  const sampleSearchResults = [
    {
      job: { name: 'Quartz', condition: 'wet raw field specimen' },
      urls: ['http://example.com/q1.jpg', 'http://example.com/q2.jpg'],
      error: null,
    },
    {
      job: { name: 'Quartz', condition: 'dry raw field specimen' },
      urls: ['http://example.com/q3.jpg', 'http://example.com/q4.jpg'],
      error: null,
    },
    {
      job: { name: 'Feldspar', condition: 'wet raw field specimen' },
      urls: ['http://example.com/f1.jpg', 'http://example.com/f2.jpg'],
      error: null,
    },
    {
      job: { name: 'Feldspar', condition: 'dry raw field specimen' },
      urls: ['http://example.com/f3.jpg', 'http://example.com/f4.jpg'],
      error: null,
    },
    {
      job: { name: 'Mica', condition: 'wet raw field specimen' },
      urls: ['http://example.com/m1.jpg', 'http://example.com/m2.jpg'],
      error: null,
    },
    {
      job: { name: 'Mica', condition: 'dry raw field specimen' },
      urls: ['http://example.com/m3.jpg', 'http://example.com/m4.jpg'],
      error: null,
    },
  ];

  it('compares DB call counts between sequential creates (N+1) and bulkCreate', async () => {
    const mockBase44Sequential = {
      asServiceRole: {
        entities: {
          TrainingCandidate: {
            create: async (data) => data,
          },
        },
      },
    };

    const mockBase44Bulk = {
      asServiceRole: {
        entities: {
          TrainingCandidate: {
            bulkCreate: async (arr) => arr,
          },
        },
      },
    };

    const seq = await persistResultsSequential(sampleSearchResults, mockBase44Sequential);
    const bulk = await persistResultsBulk(sampleSearchResults, mockBase44Bulk);

    expect(seq.results.seeded).toBe(12);
    expect(bulk.results.seeded).toBe(12);

    expect(seq.dbCallsCount).toBe(12);
    expect(bulk.dbCallsCount).toBe(1);

    // Verify 91.7% reduction in database network requests (12 -> 1)
    const callReductionRatio = (seq.dbCallsCount - bulk.dbCallsCount) / seq.dbCallsCount;
    expect(callReductionRatio).toBeGreaterThan(0.9);
  });
});
