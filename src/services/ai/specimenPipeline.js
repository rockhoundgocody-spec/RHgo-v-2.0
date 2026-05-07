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

async function specimenIdentificationPipeline(_input, _options = {}) {
  // NOT IMPLEMENTED: Use the quickClassifySpecimen or progressiveVerify backend functions instead.
  throw new Error('specimen-identification pipeline not implemented. Use base44.functions.invoke("quickClassifySpecimen", ...) directly.');
}

registerPipeline('specimen-identification', specimenIdentificationPipeline);