/**
 * cloverRuntime.js — apply parsed Clover commands on rhgo.me.
 * Does not touch HeroOrb / AmethystOrb visuals.
 */

import {
  INTENTS,
  parseCloverCommand,
  routeCommand,
  pullFromVault,
  answerFromVault,
} from '@/lib/cloverCommandRouter';

const BRAIN_KEY = 'rhgo_clover_brain';
const LOCK_KEY = 'rhgo_clover_diglock';

export function getCloverBrain() {
  try {
    return localStorage.getItem(BRAIN_KEY) || 'grok';
  } catch {
    return 'grok';
  }
}

export function setCloverBrain(id) {
  try {
    localStorage.setItem(BRAIN_KEY, id);
  } catch {}
}

function readLock() {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLock(lock) {
  try {
    if (!lock) localStorage.removeItem(LOCK_KEY);
    else localStorage.setItem(LOCK_KEY, JSON.stringify(lock));
  } catch {}
}

function vaultFromCollection(specimens = []) {
  return specimens.slice(0, 40).map((s) => ({
    label: s.mineral_name || s.name || s.title || 'specimen',
    group: 'Finds',
    excerpt: [s.locality, s.notes, s.identification].filter(Boolean).join('. ').slice(0, 220),
  }));
}

/**
 * Intercept a user utterance before cloverChat.
 * handled:true → speak reply locally, skip Base44.
 */
export function applyCloverUtterance(raw, { pathname = '/', specimens = [] } = {}) {
  const vault = vaultFromCollection(specimens);
  const cmd = parseCloverCommand(raw, { activeTab: pathname });
  const routed = routeCommand(cmd, {
    brain: getCloverBrain(),
    digLock: readLock(),
    hidden: false,
    now: Date.now(),
  });

  if (routed.intent === INTENTS.BRAIN_SWAP && routed.brain) {
    setCloverBrain(routed.brain);
    return { handled: true, reply: routed.reply, brain: routed.brain };
  }

  if (routed.intent === INTENTS.DIG_LOCK) {
    writeLock(routed.digLock);
    return { handled: true, reply: routed.reply };
  }

  if (routed.intent === INTENTS.DIG_UNLOCK) {
    writeLock(null);
    return { handled: true, reply: routed.reply };
  }

  if (routed.intent === INTENTS.STAND_DOWN) {
    return { handled: true, reply: routed.reply, endSession: true };
  }

  if (routed.intent === INTENTS.WAKE) {
    return { handled: true, reply: routed.reply || 'Here.' };
  }

  if (routed.intent === INTENTS.EYES) {
    return { handled: true, reply: routed.reply, navigateTo: '/scan' };
  }

  if (routed.intent === INTENTS.PULL) {
    const hits = pullFromVault(routed.target, vault);
    const reply = hits.length
      ? `Pulled ${hits[0].label}. ${hits[0].excerpt || ''}`.trim()
      : routed.reply;
    return {
      handled: true,
      reply,
      navigateTo: routed.route || '/collection',
    };
  }

  if (routed.intent === INTENTS.PAPERWORK) {
    return { handled: true, reply: routed.reply, navigateTo: '/market' };
  }

  if (routed.intent === INTENTS.TELEGRAM) {
    return { handled: true, reply: routed.reply };
  }

  if (routed.intent === INTENTS.RESEARCH) {
    return {
      handled: false,
      reply: routed.reply,
      navigateTo: '/explore',
      researchQuery: routed.query,
      passToChat: true,
    };
  }

  if (routed.useVault) {
    const hit = answerFromVault(raw, vault);
    if (hit.sources.length) {
      return { handled: true, reply: hit.answer, sources: hit.sources };
    }
  }

  return {
    handled: false,
    passToChat: true,
    brain: getCloverBrain(),
  };
}
