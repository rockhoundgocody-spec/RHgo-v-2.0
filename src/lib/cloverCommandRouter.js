/**
 * cloverCommandRouter.js — Clover command brain for rhgo.me (RHgo-v-2.0).
 * Name is Clover only. Do not change HeroOrb / companion visuals.
 * Pure. No DOM.
 */

export const INTENTS = Object.freeze({
  WAKE: "wake",
  BRAIN_SWAP: "brain_swap",
  PULL: "pull",
  NAVIGATE: "navigate",
  RESEARCH: "research",
  EYES: "eyes",
  DIG_LOCK: "dig_lock",
  DIG_UNLOCK: "dig_unlock",
  PAPERWORK: "paperwork",
  TELEGRAM: "telegram",
  MUTE: "mute",
  UNMUTE: "unmute",
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

  if (
    /\bstand\s*down\b/.test(q)
    || /^(?:stop|enough|that'?s all|that'?s enough|all done)$/.test(q)
    || /\b(?:stop listening|stop talking|be quiet|quiet down|shut up|hush)\b/.test(q)
  ) {
    return pack(INTENTS.STAND_DOWN, woke, rest, { reply: "Standing down." });
  }

  // Her own ears: "mute" closes the mic but keeps the conversation open.
  if (
    /^(?:mute|mute yourself|mute the mic|mute your mic)\b/.test(q)
    || /\bmute (?:yourself|the mic|your mic|it)\b/.test(q)
  ) {
    return pack(INTENTS.MUTE, woke, rest, { reply: "Muted. Tap the mic when you want me back." });
  }

  if (/\b(?:unmute|un-mute|un mute|listen again|start listening|can you hear me)\b/.test(q)) {
    return pack(INTENTS.UNMUTE, woke, rest, { reply: "I can hear you again." });
  }

  const brain = matchBrain(q);
  if (brain) {
    return pack(INTENTS.BRAIN_SWAP, woke, rest, {
      brain,
      reply: `${labelBrain(brain)} online.`,
    });
  }

  const isQuestion =
    q.endsWith("?") ||
    /\b(what|how|why|when|where|who|can|could|would|is|are|does|do|tell me|explain|mean|meaning|test|difference)\b/i.test(q);

  const pull = !isQuestion && q.match(/^(pull|open|show|find)\s+(?:up\s+)?(?:the\s+)?(.+)$/);
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

  if (/\b(what do you see|eyes on|look at (this|my)|camera|live scan|live eyes)\b/.test(q)) {
    return pack(INTENTS.EYES, woke, rest, {
      reply: "Eyes on. Show me the specimen.",
      usesScanCamera: true,
    });
  }

  const nav = matchNaturalNavigation(q);
  if (nav) {
    return pack(INTENTS.NAVIGATE, woke, rest, {
      route: nav.route,
      reply: nav.reply,
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

const NAV_VERBS = /^(?:go to|take me to|switch to|head to|bring up|launch|start|open|show me|view)\s+(?:the\s+|my\s+)?/i;

function matchNaturalNavigation(q) {
  if (q.endsWith("?") || /\b(what|how|why|when|where|explain|tell me|mean)\b/i.test(q)) {
    return null;
  }
  if (/^(?:scan a rock|scan this|identify this rock|open scan|open scanner|start a scan)$/.test(q)) {
    return { route: "/scan", reply: "Opening the scanner." };
  }
  if (/^(?:compare|compare specimens|compare rocks|side by side)$/.test(q)) {
    return { route: "/compare", reply: "Opening specimen comparison." };
  }
  if (/^(?:start a reality trial|run chronolith|open chronolith)$/.test(q)) {
    return { route: "/chronolith", reply: "Opening Chronolith." };
  }
  if (!NAV_VERBS.test(q)) return null;
  const target = q.replace(NAV_VERBS, "").replace(/\s+(?:page|screen|tab|view|please)$/i, "").trim();
  const mapped = directScreenRoute(target);
  return mapped;
}

function directScreenRoute(target) {
  const t = String(target || "").toLowerCase().trim();
  if (!t) return null;
  if (/^(?:scan|scanner|rock scanner|mineral scanner)$/.test(t)) return { route: "/scan", reply: "Opening the scanner." };
  if (/^(?:explore|map|hotspot map|hotspots|dig sites|collecting map)$/.test(t)) return { route: "/explore", reply: "Pulling up the hotspot map." };
  if (/^(?:collection|my collection|cabinet|geodex|specimens|my rocks|my finds)$/.test(t)) return { route: "/collection", reply: "Opening your collection." };
  if (/^(?:vault|vault galaxy|galaxy|3d vault)$/.test(t)) return { route: "/vault", reply: "Opening the Vault Galaxy." };
  if (/^(?:chronolith|reality trial|scientific court)$/.test(t)) return { route: "/chronolith", reply: "Opening Chronolith." };
  if (/^(?:compare|comparison|side by side)$/.test(t)) return { route: "/compare", reply: "Opening specimen comparison." };
  if (/^(?:expeditions?|trips?|trip planner|field trips?|memory capsules?)$/.test(t)) return { route: "/expeditions", reply: "Opening expeditions." };
  if (/^(?:community|social|feed|community feed)$/.test(t)) return { route: "/community", reply: "Opening the community feed." };
  if (/^(?:find of the week|weekly ballot|ballot)$/.test(t)) return { route: "/find-of-the-week", reply: "Opening Find of the Week." };
  if (/^(?:clubs?|rock clubs?|mineral clubs?|chapters?)$/.test(t)) return { route: "/clubs", reply: "Opening club chapters." };
  if (/^(?:agate guide|agates guide)$/.test(t)) return { route: "/agate-guide", reply: "Opening the Agate Guide." };
  if (/^(?:live|live streams?|broadcast)$/.test(t)) return { route: "/live", reply: "Opening live broadcasts." };
  if (/^(?:quests?|missions?|field missions?|daily quests?)$/.test(t)) return { route: "/quests", reply: "Opening field quests." };
  if (/^(?:badges?|achievements?)$/.test(t)) return { route: "/badges", reply: "Opening your badges." };
  if (/^(?:leaderboard|rankings?|top hunters?)$/.test(t)) return { route: "/leaderboard", reply: "Opening the leaderboard." };
  if (/^(?:private log|rock log|field notes|private rock log)$/.test(t)) return { route: "/private-log", reply: "Opening your private rock log." };
  if (/^(?:market|marketplace|shop)$/.test(t)) return { route: "/market", reply: "Opening the marketplace." };
  if (/^(?:settings|preferences)$/.test(t)) return { route: "/settings", reply: "Opening settings." };
  if (/^(?:profile|my profile|account)$/.test(t)) return { route: "/profile", reply: "Opening your profile." };
  if (/^(?:home|hub|main screen)$/.test(t)) return { route: "/", reply: "Back to the Hub." };
  return null;
}

export function routeForTarget(target) {
  const t = String(target || "").toLowerCase().trim();
  const screen = directScreenRoute(t);
  if (screen) return screen.route;
  if (/invoice|listing|coa/.test(t)) return "/market";
  if (/\b(map|hotspots?)\b/.test(t)) return "/explore";
  if (/trip|itinerary|expedition/.test(t)) return "/expeditions";
  if (/\bchronolith\b/.test(t)) return "/chronolith";
  if (/\bagate guide\b/.test(t)) return "/agate-guide";
  // Specimens, sites and anything else: open the Vault Galaxy on it.
  return `/vault?q=${encodeURIComponent(target)}`;
}

function driftLine(prev) {
  if (prev === 0) return "That's a drift. Back to the lock, hound.";
  return `Drift ${prev + 1}. Instagram can wait.`;
}