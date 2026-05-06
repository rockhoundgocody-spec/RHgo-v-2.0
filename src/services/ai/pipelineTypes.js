import './specimenPipeline';
import './fieldNotePipeline';
import './collectionEnrichmentPipeline';
import './listingPipeline';

export const PIPELINE_TASKS = {
  SPECIMEN_IDENTIFICATION: 'specimen-identification',
  FIELD_NOTE_GENERATION: 'field-note-generation',
  COLLECTION_ENRICHMENT: 'collection-enrichment',
  MARKETPLACE_LISTING_HELPER: 'marketplace-listing-helper'
};

export { runPipeline } from './pipelineRegistry';