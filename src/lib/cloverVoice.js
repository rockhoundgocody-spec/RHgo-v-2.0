/**
 * cloverVoice — the accuracy layer for talking to Clover.
 *
 * Every utterance passes through here before it reaches the command router or
 * the server brain: filler is stripped, field words the speech engines
 * mis-hear are repaired, and the engine's own confidence score decides whether
 * the utterance is good enough to act on.
 *
 * Pure — no DOM, no React. Unit-tested in cloverVoice.test.js.
 */

// Speech engines report a 0..1 confidence per result. Chrome very often reports
// exactly 0, which means "no opinion", not "unreliable" — so the gate only
// rejects when a real score comes back below the floor.
export const CONFIDENCE_THRESHOLD = 0.45;
// Between the floor and this, the transcript is accepted but marked soft so
// Clover asks a short question instead of confidently guessing.
export const SOFT_CONFIDENCE = 0.7;

// Thinking noises the engines write down as words.
const FILLER_HEAD = /^(?:(?:uh+|um+|er+|ah+|eh+|hmm+|mm+|like|so|well|okay|ok|y'?know)\b[,\s]*)+/i;
const FILLER_TAIL = /(?:[,\s]*\b(?:uh+|um+|er+|ah+|eh+|hmm+|mm+)\b)+$/i;

/**
 * Field words the engines split, drop or swap. Left side is how it arrives,
 * right side is what it should become. Deliberately limited to shapes that are
 * not ordinary English, so a real sentence is never rewritten.
 */
const REPAIRS = [
  [/\bc\s*l\s*o\s*[vwb]\s*e\s*r\b/gi, 'Clover'],
  [/\bmind\s*at\b(?:\.com|\.org)?/gi, 'Mindat'],
  [/\bb\s*l\s*m\b/gi, 'BLM'],
  [/\bbureau of land management\b/gi, 'BLM'],
  [/\bg\s*p\s*s\b/gi, 'GPS'],
  [/\bred\s+(?:bar+el|bear\s*ill|burl|bury\s*l)\b/gi, 'red beryl'],
  [/\b(?:road|rod|rode)\s*(?:oh|o|a)\s*chrome\s*(?:site|sight|cite)\b/gi, 'rhodochrosite'],
  [/\blabrador\s*(?:night|nite)\b/gi, 'labradorite'],
  [/\bam\s*a?\s*thist\b/gi, 'amethyst'],
  [/\b(?:chal|cal)\s*(?:sidney|cedony|sedony)\b/gi, 'chalcedony'],
  [/\bthunder\s*eggs?\b/gi, 'thunderegg'],
  [/\bob\s*sidian\b/gi, 'obsidian'],
  [/\bherk\s*a\s*mer\b/gi, 'herkimer'],
  [/\bherkheimer\b/gi, 'herkimer'],
  [/\bzee\s*o\s*lite\b/gi, 'zeolite'],
  [/\bkite\s*nite\b/gi, 'kyanite'],
  [/\bge[eo]\s*ode\b/gi, 'geode'],
  [/\bpetrified\s+would\b/gi, 'petrified wood'],
  [/\bflorescent\b/gi, 'fluorescent'],
  [/\blustre\b/gi, 'luster'],
  [/\bmoh'?s\b/gi, 'Mohs'],
  [/\bfloor\s*ite\b/gi, 'fluorite'],
  [/\bcal\s*site\b/gi, 'calcite'],
  [/\bpie\s*right\b/gi, 'pyrite'],
  [/\bmal\s*a\s*kite\b/gi, 'malachite'],
  [/\bazure\s*ite\b/gi, 'azurite'],
  [/\bsell\s*a\s*night\b/gi, 'selenite'],
  [/\bfeld\s*spar\b/gi, 'feldspar'],
  [/\bgarnett\b/gi, 'garnet'],
  [/\btoe\s*paz\b/gi, 'topaz'],
  [/\bleave\s*her\s*right\b/gi, 'leaverite'],
  [/\bleaver\s*right\b/gi, 'leaverite'],
  [/\bdrew\s*zee\b/gi, 'druzy'],
  [/\bbot\s*ree\s*oil\b/gi, 'botryoidal'],
  [/\bpeg\s*ma\s*tight\b/gi, 'pegmatite'],
  [/\bsue\s*doe\s*morph\b/gi, 'pseudomorph'],
  [/\ben\s*high\s*dro\b/gi, 'enhydro'],
  [/\bcon\s*coy\s*dull\b/gi, 'conchoidal'],
  [/\bcab\s*a\s*shawn\b/gi, 'cabochon'],
  [/\bsag\s*a\s*night\b/gi, 'sagenite'],
  [/\bsep\s*tarian\b/gi, 'septarian'],
];

const SPEECH_PRONUNCIATIONS = [
  [/SiO₂/g, 'silica'],
  [/CaCO₃/g, 'calcium carbonate'],
  [/FeS₂/g, 'iron sulfide'],
  [/CaF₂/g, 'calcium fluoride'],
  [/CaSO₄·2H₂O/g, 'hydrated calcium sulfate'],
  [/Be₃Al₂Si₆O₁₈(?::Mn³⁺)?/g, 'beryllium aluminum silicate'],
  [/\b365\s*nm\b/gi, '365 nanometer'],
  [/\b254\s*nm\b/gi, '254 nanometer'],
  [/\bMohs\b/g, 'Moze'],
  [/\bdruzy\b/gi, 'droozy'],
  [/\bbotryoidal\b/gi, 'bot-ree-oydal'],
  [/\bchatoyancy\b/gi, 'sha-toy-an-see'],
  [/\bconchoidal\b/gi, 'kon-koy-dal'],
  [/\bmiarolitic\b/gi, 'my-ar-oh-litic'],
  [/\bleaverite\b/gi, 'leaver-ite'],
  [/\bgossan\b/gi, 'goss-an'],
  [/\bcabochon\b/gi, 'cab-oh-shon'],
];

/**
 * Prepares Clover's reply text for natural, melodic voice synthesis:
 * strips emojis/markdown, expands chemical formulas, and guides mineral pronunciation.
 */
export function prepareTextForSpeech(raw) {
  if (!raw || typeof raw !== 'string') return '';
  let out = raw
    // Strip markdown bold/italic/code markers
    .replace(/[*_`~#]+/g, '')
    // Strip emojis & pictographs so TTS never reads "four leaf clover emoji"
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, '')
    // Convert numeric ranges like "6.5 – 7.0" to "6.5 to 7.0"
    .replace(/(\d+(?:\.\d+)?)\s*[–—-]\s*(\d+(?:\.\d+)?)/g, '$1 to $2')
    // Convert em-dashes and slash separators into natural breath pauses
    .replace(/\s*[—–]\s*/g, ', ')
    .replace(/\b([A-Za-z]+)\s*\/\s*([A-Za-z]+)\b/g, '$1 or $2');

  for (const [pattern, spoken] of SPEECH_PRONUNCIATIONS) {
    out = out.replace(pattern, spoken);
  }

  return out.replace(/\s{2,}/g, ' ').trim();
}

/** Drops the thinking noises the engine wrote down at the edges. */
export function stripFillers(text) {
  return String(text || '')
    .replace(FILLER_HEAD, '')
    .replace(FILLER_TAIL, '')
    .trim();
}

/** Repairs field words the engines mis-hear. */
export function repairFieldTerms(text) {
  let out = String(text || '');
  for (const [pattern, replacement] of REPAIRS) out = out.replace(pattern, replacement);
  return out;
}

/** Full cleanup applied to a final transcript before it is acted on. */
export function cleanTranscript(raw) {
  let text = String(raw || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  text = stripFillers(text);
  text = repairFieldTerms(text);
  return text.replace(/\s+([,.?!])/g, '$1').replace(/\s{2,}/g, ' ').trim();
}

/**
 * The confidence gate. `confidence` is the engine's own score, or null/0 when
 * it declined to report one.
 *
 * → { ok, text, confidence, reported, soft, reason }
 *   reason: 'ok' | 'empty' | 'too_short' | 'low_confidence'
 */
export function assessTranscript(raw, confidence) {
  const text = cleanTranscript(raw);
  const score = Number(confidence);
  const reported = Number.isFinite(score) && score > 0;
  const base = { text, confidence: reported ? score : null, reported };

  if (!text) return { ...base, ok: false, soft: false, reason: 'empty' };
  if (text.replace(/[^A-Za-z0-9]/g, '').length < 2) {
    return { ...base, ok: false, soft: false, reason: 'too_short' };
  }
  if (reported && score < CONFIDENCE_THRESHOLD) {
    return { ...base, ok: false, soft: false, reason: 'low_confidence' };
  }
  return { ...base, ok: true, soft: reported && score < SOFT_CONFIDENCE, reason: 'ok' };
}

const RETRY_LINES = {
  too_short: "I caught a syllable, not a sentence — say that one again?",
  low_confidence: 'The wind took that one. Say it again for me?',
};

/** What Clover says when she refuses an utterance. Silence for a non-utterance. */
export function rejectionLine(reason) {
  return RETRY_LINES[reason] || null;
}