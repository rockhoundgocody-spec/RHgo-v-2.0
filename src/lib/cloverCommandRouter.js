/**
 * cloverCommandRouter.js — Clover command brain for rhgo.me (RHgo-v-2.0).
 * Name is Clover only. Do not change HeroOrb / companion visuals.
 * Pure. No DOM.
 */

export const BRAINS = Object.freeze(["grok", "gpt-6-astra", "claude"]);

export const INTENTS = Object.freeze({
  WAKE: "wake",
  BRAIN_SWAP: "brain_swap",
  PULL: "pull",
  RESEARCH: "research",
  EYES: "eyes",
  DIG_LOCK: "dig_lock",
  DIG_UNLOCK: "dig_unlock",
  PAPERWORK: "paperwork",
  TELEGRAM: "telegram",
  ASK: "ask",
  STAND_DOWN: "stand_down",
  UNKNOWN: "unknown",
});

const WAKE_RE = /^(hey\s+)?clover[,.]?\s*/i;

export function stripWake(raw) {
  const text = String(raw || "").trim();
  if (!text) return { woke: false, rest: "" };
  const m = text.match(WAKE_RE);
  if (!m) return { woke: false, rest: text };
  return { woke: true, rest: text.slice(m[0].length).trim() };
}

export function parseCloverCommand(raw, state = {}) {
  const { woke, rest } = stripWake(raw);
  const q = rest.toLowerCase();

  if (!rest) return pack(INTENTS.WAKE, woke, rest, { reply: "Here." });

  if (/stand\s*down|stop listening|go idle/.test(q)) {
    return pack(INTENTS.STAND_DOWN, woke, rest, { reply: "Standing down." });
  }

  const brain = matchBrain(q);
  if (brain) {
    return pack(INTENTS.BRAIN_SWAP, woke, rest, {
      brain,
      reply: `${labelBrain(brain)} online.`,
    });
  }

  const pull = q.match(/^(pull|open|show|find)\s+(?:up\s+)?(?:the\s+)?(.+)$/);
  if (pull) {
    const target = pull[2].replace(/\s+for me.*$/, "").trim();
    return pack(INTENTS.PULL, woke, rest, {
      target,
      route: routeForTarget(target),
      reply: target ? `Pulling ${target}.` : "Name the specimen or site.",
    });
  }

  if (/^(research|look up|search|what's the rule|blm)\b/.test(q) || /\balternative to\b/.test(q)) {
    const query = rest
      .replace(/^(research|look up|search online|search)\s+(online\s+)?(and\s+)?(find\s+out\s+)?/i, "")
      .trim();
    return pack(INTENTS.RESEARCH, woke, rest, {
      query: query || rest,
      reply: query ? `Researching ${query}.` : "What am I researching?",
    });
  }

  if (/\b(what do you see|eyes on|look at (this|my)|camera)\b/.test(q)) {
    return pack(INTENTS.EYES, woke, rest, {
      reply: "Eyes on. Show me the specimen.",
      usesScanCamera: true,
    });
  }

  if (/\b(dig lock|focus lock|lock (on|this)|keep me on)\b/.test(q)) {
    return pack(INTENTS.DIG_LOCK, woke, rest, {
      minutes: 30,
      tab: state.activeTab || "current",
      reply: "Dig lock on. 30 minutes. Stay on the work, hound.",
    });
  }

  if (/\b(unlock|end lock|cancel lock)\b/.test(q)) {
    return pack(INTENTS.DIG_UNLOCK, woke, rest, { reply: "Lock off." });
  }

  if (/\b(invoice|coa|listing|write the (ebay|ig|instagram) listing)\b/.test(q)) {
    return pack(INTENTS.PAPERWORK, woke, rest, {
      kind: /\binvoice\b/.test(q) ? "invoice" : /\bcoa\b/.test(q) ? "coa" : "listing",
      reply: "Drafting from the vault card.",
    });
  }

  if (/\btelegram\b/.test(q)) {
    return pack(INTENTS.TELEGRAM, woke, rest, {
      reply: "Telegram bridge is stubbed. Use Clover here.",
    });
  }

  return pack(INTENTS.ASK, woke, rest, { reply: null, useVault: true });
}

export function routeCommand(cmd, ctx = {}) {
  const brain = ctx.brain || "grok";
  const lock = ctx.digLock || null;
  if (cmd.intent === INTENTS.BRAIN_SWAP) return { ...cmd, brain: cmd.brain, nextBrain: cmd.brain };
  if (cmd.intent === INTENTS.DIG_LOCK) {
    return { ...cmd, digLock: { on: true, startedAt: ctx.now || 0, minutes: 30, tab: cmd.tab, drifts: 0 } };
  }
  if (cmd.intent === INTENTS.DIG_UNLOCK || cmd.intent === INTENTS.STAND_DOWN) {
    return { ...cmd, digLock: null };
  }
  if (lock && cmd.intent !== INTENTS.WAKE && ctx.hidden) {
    return { ...cmd, drifted: true, digLock: { ...lock, drifts: (lock.drifts || 0) + 1 }, reply: driftLine(lock.drifts || 0) };
  }
  return { ...cmd, brain, digLock: lock };
}

export function pullFromVault(target, vault = []) {
  const t = String(target || "").toLowerCase();
  if (!t) return [];
  return vault.filter((n) => {
    const hay = `${n.label || ""} ${n.group || ""} ${n.excerpt || ""}`.toLowerCase();
    return t.split(/\s+/).every((w) => hay.includes(w));
  });
}

export function answerFromVault(question, vault = []) {
  const words = String(question || "").toLowerCase().split(/\W+/).filter((w) => w.length > 2);
  if (!words.length || !vault.length) {
    return { answer: "Not in the vault. Don't invent a locality or a price.", sources: [] };
  }
  const scored = vault.map((n) => {
    const hay = `${n.label || ""} ${n.excerpt || ""}`.toLowerCase();
    const score = words.reduce((s, w) => s + (hay.includes(w) ? 1 : 0), 0);
    return { n, score };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score);
  if (!scored.length) {
    return { answer: "Vault is quiet on that. Field-check hardness, streak, UV.", sources: [] };
  }
  const top = scored.slice(0, 3).map((x) => x.n);
  return {
    answer: top[0].excerpt ? top[0].excerpt.slice(0, 220) : `Best hit: ${top[0].label}.`,
    sources: top.map((n) => n.label),
  };
}

export function tickDigLock(lock, { hidden, now }) {
  if (!lock || !lock.on) return lock;
  const elapsed = (now - (lock.startedAt || 0)) / 60000;
  if (elapsed >= (lock.minutes || 30)) return { ...lock, on: false, expired: true };
  if (hidden) return { ...lock, drifts: (lock.drifts || 0) + 1 };
  return lock;
}

function pack(intent, woke, rest, extra) {
  return { intent, woke, rest, address: "hound", ...extra };
}

function matchBrain(q) {
  if (/gpt[\s-]*6|astra/.test(q)) return "gpt-6-astra";
  if (/\bclaude\b/.test(q)) return "claude";
  if (/\bgrok\b/.test(q) && /switch|brain|use/.test(q)) return "grok";
  if (/switch (your )?brain/.test(q) && /gpt|astra|claude|grok/.test(q)) {
    if (/claude/.test(q)) return "claude";
    if (/grok/.test(q)) return "grok";
    return "gpt-6-astra";
  }
  return null;
}

function labelBrain(id) {
  if (id === "gpt-6-astra") return "GPT-6 Astra";
  if (id === "claude") return "Claude";
  return "Grok";
}

function routeForTarget(target) {
  const t = target.toLowerCase();
  if (/invoice|listing|coa/.test(t)) return "/Marketplace";
  if (/site|wash|claim|hotspot|map/.test(t)) return "/Map";
  if (/trip|itinerary/.test(t)) return "/FieldTrip";
  return "/Collection";
}

function driftLine(prev) {
  if (prev === 0) return "That's a drift. Back to the lock, hound.";
  return `Drift ${prev + 1}. Instagram can wait.`;
}
