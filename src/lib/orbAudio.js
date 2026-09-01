/**
 * orbAudio.js — Ethereal crystal sound synthesis, haptics, and daily resonance.
 * Uses the Web Audio API to synthesize singing bowl harmonics on-the-fly (zero external audio files).
 */

let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx || audioCtx.state === 'closed') {
    audioCtx = new AudioContextClass();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays an ethereal crystal singing bowl harmonic chord.
 * Frequencies correspond to harmonic solfeggio / crystal healing ratios (432Hz, 528Hz, 639Hz, 741Hz, 852Hz).
 */
export function playOrbChime(frequency = 528, duration = 1.6) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const osc3 = ctx.createOscillator();
    const gain = ctx.createGain();

    // Fundamental tone (pure sine wave)
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(frequency, now);

    // Harmonic overtone: Perfect fifth (1.5x) with subtle vibrato
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(frequency * 1.5, now);

    // Shimmer octave (2.0x) soft triangle
    osc3.type = 'triangle';
    osc3.frequency.setValueAtTime(frequency * 2.0, now);

    // Bell-like exponential envelope
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.14, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc1.connect(gain);
    osc2.connect(gain);
    osc3.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc3.start(now);

    osc1.stop(now + duration);
    osc2.stop(now + duration);
    osc3.stop(now + duration);
  } catch {
    // Audio contexts can fail gracefully on un-interacted browsers
  }
}

/**
 * Triggers device haptic feedback pulse patterns.
 */
export function triggerOrbHaptic(pattern = 'tap') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    if (pattern === 'tap') navigator.vibrate(12);
    else if (pattern === 'pulse') navigator.vibrate([15, 30, 20]);
    else if (pattern === 'blessing') navigator.vibrate([20, 40, 25, 50, 30]);
    else if (pattern === 'radar') navigator.vibrate([10, 20, 10, 20, 15]);
  } catch {}
}

const LUCKY_MINERALS = [
  {
    name: 'Lake Superior Agate',
    element: 'Mesoproterozoic Basalt',
    rarity: 'Uncommon',
    color: '#f97316',
    buff: '+15% Fortification Banding Luck',
    tip: 'Hunt gravel pits and wave-washed cobble beaches facing the morning sun.',
  },
  {
    name: 'Yooperlite (Syenite)',
    element: 'Sodalite / Fluorescent',
    rarity: 'Rare',
    color: '#38bdf8',
    buff: '365nm UV Resonance Active',
    tip: 'Search Lake Superior shorelines at dusk with a 365nm filtered blacklight torch.',
  },
  {
    name: 'Petoskey Stone',
    element: 'Hexagonaria Coral',
    rarity: 'Uncommon',
    color: '#34d399',
    buff: 'Calcite Wet-Look Detection',
    tip: 'Look for subtle honeycomb patterns; wet down dry shoreline stones to reveal the eyes.',
  },
  {
    name: 'Amethyst Geode',
    element: 'Ferric Silica Cavity',
    rarity: 'Rare',
    color: '#a855f7',
    buff: 'Vesicular Matrix Sense',
    tip: 'Target rusty, spherical volcanic rinds with hollow crystal-lined cavities.',
  },
  {
    name: 'Celestine Crystal',
    element: 'Strontium Sulfate',
    rarity: 'Rare',
    color: '#60a5fa',
    buff: 'Pale Blue Sky Luster',
    tip: 'Inspect limestone vugs and dolomite quarry spoil piles for tabular blue crystals.',
  },
  {
    name: 'Banded Carnelian',
    element: 'Iron Oxide Chalcedony',
    rarity: 'Uncommon',
    color: '#ea580c',
    buff: 'Translucent Amber Glow',
    tip: 'Hold suspects up to the sunlight — carnelian fires a rich warm red through translucent edges.',
  },
  {
    name: 'Pyrite Sun',
    element: 'Iron Disulfide Disk',
    rarity: 'Legendary',
    color: '#eab308',
    buff: 'Metallic Radiance Multiplier',
    tip: 'Found sandwiched inside coal mine shale beds as flat, radiating golden disks.',
  },
];

/**
 * Returns the daily lucky mineral based on the current calendar day.
 */
export function getLuckyMineralOfTheDay() {
  const now = new Date();
  const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
  const mineral = LUCKY_MINERALS[dayOfYear % LUCKY_MINERALS.length];
  return {
    ...mineral,
    dateKey: now.toISOString().slice(0, 10),
  };
}
