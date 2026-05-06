import { registerPipeline } from './pipelineRegistry';

const MOCK_MINERALS = [
  {
    mineralId: 'MIN001',
    name: 'Quartz',
    scientificName: 'Silicon Dioxide',
    classType: 'mineral',
    confidence: 87,
    properties: {
      color: ['clear', 'white', 'pink', 'purple'],
      luster: 'vitreous',
      streak: 'white',
      hardness: '7',
      crystalSystem: 'hexagonal',
      cleavage: 'none',
      fracture: 'conchoidal'
    }
  },
  {
    mineralId: 'MIN004',
    name: 'Calcite',
    scientificName: 'Calcium Carbonate',
    classType: 'mineral',
    confidence: 74,
    properties: {
      color: ['white', 'clear', 'yellow', 'orange'],
      luster: 'vitreous to pearly',
      streak: 'white',
      hardness: '3',
      crystalSystem: 'trigonal',
      cleavage: 'perfect rhombohedral',
      fracture: 'conchoidal'
    }
  },
  {
    mineralId: 'MIN005',
    name: 'Fluorite',
    scientificName: 'Calcium Fluoride',
    classType: 'mineral',
    confidence: 68,
    properties: {
      color: ['purple', 'green', 'yellow', 'blue'],
      luster: 'vitreous',
      streak: 'white',
      hardness: '4',
      crystalSystem: 'cubic',
      cleavage: 'perfect octahedral',
      fracture: 'subconchoidal'
    }
  }
];

async function specimenIdentificationPipeline(input, options = {}) {
  const mode = options.mode || input.mode || 'quick';

  // TODO: Replace with backend API call, Hugging Face endpoint, or local model
  // For now: mock classification
  const sorted = [...MOCK_MINERALS].sort((a, b) => b.confidence - a.confidence);
  const topCandidate = sorted[0];

  const lowConfidence = topCandidate.confidence < 80;

  return {
    task: 'specimen-identification',
    status: lowConfidence ? 'low_confidence' : 'success',
    source: 'mock',
    mode,
    topCandidate,
    candidates: sorted,
    matchReasons: [
      `Visual structure appears consistent with ${topCandidate.name}.`,
      `Surface appearance suggests ${topCandidate.properties.luster} luster.`,
      `Candidate properties align with common ${topCandidate.name} field traits.`
    ],
    recommendedTests: [
      'Run hardness test.',
      'Check streak color.',
      'Inspect cleavage/fracture under bright light.',
      'Add locality context for stronger confidence.'
    ],
    cautionFlags: [
      'Photo-only identification is not final.',
      'Do not use this result for legal, safety, or high-value decisions without field verification.'
    ]
  };
}

registerPipeline('specimen-identification', specimenIdentificationPipeline);