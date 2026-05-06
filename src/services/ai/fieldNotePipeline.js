import { registerPipeline } from './pipelineRegistry';

async function fieldNotePipeline(input) {
  const candidate = input.scanResult?.topCandidate;

  if (!candidate) {
    return {
      task: 'field-note-generation',
      status: 'failed',
      error: 'No candidate available for note generation.'
    };
  }

  return {
    task: 'field-note-generation',
    status: 'success',
    shortNote: `Possible ${candidate.name} found during field scan.`,
    scientificNote: `${candidate.name} (${candidate.scientificName}) candidate. Suggested verification: hardness, streak, luster, cleavage/fracture, and locality comparison.`,
    collectionLabel: `${candidate.name} - field ID pending verification`,
    safetyNote: 'Confirm site access and collecting rules before removing material.',
    accessReminder: 'Exact coordinates should remain private unless intentionally shared.'
  };
}

registerPipeline('field-note-generation', fieldNotePipeline);