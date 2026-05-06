import { registerPipeline } from './pipelineRegistry';

async function listingPipeline(input) {
  const finding = input.finding || {};

  return {
    task: 'marketplace-listing-helper',
    status: 'success',
    title: `${finding.name || 'Unverified Mineral Specimen'} - Field Collected`,
    shortDescription: `Field-collected specimen identified as possible ${finding.name || 'unknown mineral'}. Verification status: ${finding.verificationStatus || 'pending'}.`,
    scientificDescription: `Specimen record includes AI-assisted field identification, user notes, and photo documentation. Buyer should review photos and verification status before purchase.`,
    conditionSummary: input.conditionNotes || 'Condition not fully documented.',
    provenanceStatement: input.provenance || 'Provenance pending. Exact collection location may be private.',
    suggestedCategory: 'Minerals & Crystals',
    pricingDisclaimer: 'Suggested pricing must be based on confirmed identity, condition, size, aesthetics, locality, provenance, and recent sold comps.',
    complianceWarning: 'Do not list specimens collected from restricted, protected, or unauthorized land.'
  };
}

registerPipeline('marketplace-listing-helper', listingPipeline);