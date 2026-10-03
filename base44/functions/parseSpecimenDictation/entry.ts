import { handleParseSpecimenDictation } from './parseDictation.ts';

/**
 * Parses a spoken/typed dictation into structured Specimen fields using the LLM.
 * Optionally creates the Specimen record (which triggers the enrichSpecimen
 * automation for weather + lunar data).
 *
 * Payload: { transcript: string, create?: boolean, lat?: number, lng?: number }
 * Returns: { fields, created? }
 */
Deno.serve((req) => handleParseSpecimenDictation(req));
