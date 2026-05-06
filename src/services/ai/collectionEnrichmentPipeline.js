import { registerPipeline } from './pipelineRegistry';

async function collectionEnrichmentPipeline(input) {
  const candidate = input.scanResult?.topCandidate;

  return {
    task: 'collection-enrichment',
    status: 'success',
    findingRecord: {
      id: `finding_${Date.now()}`,
      mineralId: candidate?.mineralId || null,
      name: candidate?.name || 'Unknown specimen',
      scientificName: candidate?.scientificName || null,
      photoUrl: input.photoUrl || null,
      foundLocation: input.foundLocation || null,
      foundAt: input.timestamp || new Date().toISOString(),
      userNotes: input.userNotes || '',
      confidence: candidate?.confidence || 0,
      verificationStatus: 'field_id_pending'
    },
    tags: [
      candidate?.classType || 'unknown',
      candidate?.properties?.luster || 'unverified',
      'field-scan'
    ],
    rarityEstimate: 'pending',
    missingFields: [
      'confirmed locality',
      'hardness test',
      'streak test',
      'weight/size',
      'provenance notes'
    ],
    suggestedFollowUpTests: [
      'hardness',
      'streak',
      'UV response if relevant',
      'specific gravity if needed'
    ]
  };
}

registerPipeline('collection-enrichment', collectionEnrichmentPipeline);