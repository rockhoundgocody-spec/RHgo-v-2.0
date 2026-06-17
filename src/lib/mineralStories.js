/**
 * Story cards for Great Lakes minerals — shown on first find.
 * Each entry has a backstory, an era, a discovery tip, and a fun unlock.
 */

export const MINERAL_STORIES = {
  'Lake Superior Agate': {
    era: '1.1 billion years ago',
    story: 'Born from ancient lava flows that flooded the Lake Superior basin. Iron-rich groundwater slowly filled the gas bubbles with silica, layer by layer, over millions of years. The red banding comes from iron oxide — basically ancient rust — making each agate a time capsule of Precambrian Earth.',
    field_tip: 'Hunt after a northeast blow when fresh specimens wash up. Look for the waxy luster and translucent edge — hold it up to sunlight.',
    unlock_badge: 'agate_hunter',
    emoji: '🔴',
    color: '#e45c3a',
  },
  'Petoskey Stone': {
    era: '350 million years ago',
    story: 'This is a fossil — the hexagonal pattern is the skeleton of Hexagonaria percarinata, a coral that lived in a warm tropical sea that covered Michigan. After a storm is the best time to hunt: the wave action polishes the surface and the coral pattern jumps out when wet.',
    field_tip: 'Wet it with lake water. The honeycomb pattern will appear. Dry stones often look like plain grey limestone.',
    unlock_badge: 'coral_keeper',
    emoji: '🪸',
    color: '#7fb3d3',
  },
  'Charlevoix Stone': {
    era: '350 million years ago',
    story: 'Charlevoix Stones are fossilized horn corals, Petoskey\'s cousin. Where Petoskey shows honeycombs, Charlevoix shows single white dots on a grey background — like a domino. They formed in the same ancient sea but from a different coral species.',
    field_tip: 'Look for white dots on grey. Found on the same beaches as Petoskeys, often right next to each other.',
    unlock_badge: 'coral_keeper',
    emoji: '⚫',
    color: '#9db8c8',
  },
  'Leland Blue': {
    era: '1800s industrial era',
    story: 'Not a mineral at all — it\'s slag glass from the old Leland iron smelter, discarded into Lake Michigan in the 1800s. A century of wave action polished it into smooth blue-green gems. Miners called it waste; rockhounds call it treasure.',
    field_tip: 'Found almost exclusively near Leland and Sleeping Bear Dunes. Vivid blue-green color is unmistakable, especially wet.',
    unlock_badge: 'industrial_gem',
    emoji: '🔵',
    color: '#3a9fbf',
  },
  'Yooperlite': {
    era: '1.1 billion years ago',
    story: 'Discovered in 2017 by Erik Rintamaki on a Lake Superior beach — he noticed rocks glowing orange under UV light. They turned out to be syenite rich in fluorescent sodalite, likely transported from Canada by glaciers. The UP now has a new tourism industry because of one flashlight.',
    field_tip: 'Looks like an ordinary grey rock in daylight. Bring a 365nm UV flashlight at night — the orange glow is unmistakable.',
    unlock_badge: 'uv_hunter',
    emoji: '🟠',
    color: '#ff7b2e',
  },
  'Native Copper': {
    era: '1.1 billion years ago',
    story: 'The Keweenaw Peninsula holds the largest deposit of native copper on Earth. Ancient peoples hammered it into tools 7,000 years ago — the first metalworking in North America. The copper filled fractures in the ancient basalt lava flows and was glacially scattered across the Great Lakes.',
    field_tip: 'Distinctively heavy for its size. Look for reddish-orange metallic color, often with green patina. Found mostly on Keweenaw beaches.',
    unlock_badge: 'copper_country',
    emoji: '🟤',
    color: '#b87333',
  },
  'Chlorastrolite (Greenstone)': {
    era: '1.1 billion years ago',
    story: 'Michigan\'s official state gem. Found almost exclusively on Isle Royale and the Keweenaw Peninsula. The green turtleback pattern — called chatoyancy — is caused by radiating fibers of the mineral pumpellyite. Collectors have been hunting it since the 1840s.',
    field_tip: 'Very rare and small — most specimens are thumbnail-sized. The green mosaic pattern is distinctive even when dry.',
    unlock_badge: 'state_gem',
    emoji: '💚',
    color: '#3d8b4e',
  },
  'Thomsonite': {
    era: '1.1 billion years ago',
    story: 'A zeolite mineral that crystallized inside gas bubbles in Lake Superior basalt. The "eye" pattern — pink or salmon colored rings in white — forms as radiating crystals grow concentrically. Grand Marais has an entire beach named Thomsonite Beach after it.',
    field_tip: 'Look for salmon-pink eyes in white matrix. Wet specimens show the pattern most clearly. Very collectible and increasingly rare.',
    unlock_badge: 'zeolite_spotter',
    emoji: '👁️',
    color: '#d4917a',
  },
  'Pudding Stone': {
    era: '2 billion years ago',
    story: 'One of Michigan\'s oldest rocks — a Proterozoic conglomerate where ancient river pebbles of red jasper are cemented in white quartzite matrix. It looks like a plum pudding and is found mainly in the Lower Peninsula. The red pebbles are older than the rock holding them together.',
    field_tip: 'Unmistakable: round red blobs in white stone. Bigger specimens are very collectible. Found on inland shores and Lake Michigan beaches.',
    unlock_badge: 'pudding_finder',
    emoji: '🍮',
    color: '#c44d2e',
  },
  'Jacobsville Sandstone': {
    era: '1 billion years ago',
    story: 'The signature red rock of the Keweenaw. Ancient riverbeds of oxidized sand hardened into this brick-red sandstone, which was quarried for building the historic lighthouses and town halls of the UP. The white veins are quartz that filled later cracks.',
    field_tip: 'Brick red with white veins or spots. Ranges from fine-grained to cobbly. Common on Keweenaw and Marquette beaches.',
    unlock_badge: 'keweenaw_kid',
    emoji: '🧱',
    color: '#a03520',
  },
};

/**
 * Get story for a mineral name (case-insensitive partial match).
 */
export function getMineralStory(mineralName) {
  if (!mineralName) return null;
  const lower = mineralName.toLowerCase();
  for (const [key, story] of Object.entries(MINERAL_STORIES)) {
    if (lower.includes(key.toLowerCase()) || key.toLowerCase().includes(lower.split(' ')[0])) {
      return { mineral: key, ...story };
    }
  }
  return null;
}