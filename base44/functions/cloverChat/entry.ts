import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { enforceGuestRate } from '../../shared/guestRateLimit.ts';
import {
  buildVault,
  formatRecords,
  guardPrices,
  publicSource,
  retrieve,
  summarize,
  type VaultItem,
} from '../../shared/cloverVault.ts';

// "Brain swap" choices from the Clover command router → Base44 models.
// Grok (the default brain) uses the app-level model.
const BRAIN_MODELS: Record<string, string> = {
  'gpt-6-astra': 'gpt_5_6_sol',
  claude: 'claude_sonnet_4_6',
};

type Row = Record<string, unknown>;

const ALLOWED_ROUTES = new Set([
  '/',
  '/scan',
  '/scan?live=1',
  '/explore',
  '/collection',
  '/vault',
  '/chronolith',
  '/compare',
  '/expeditions',
  '/community',
  '/find-of-the-week',
  '/clubs',
  '/agate-guide',
  '/live',
  '/quests',
  '/badges',
  '/leaderboard',
  '/private-log',
  '/market',
  '/settings',
  '/profile',
]);

async function fetchBedrockContext(gps: { lat: number; lng: number } | null): Promise<string> {
  if (!gps) return '';
  try {
    const res = await fetch(
      `https://macrostrat.org/api/v2/geologic_units/map?lat=${gps.lat}&lng=${gps.lng}`,
      { signal: AbortSignal.timeout(3500) },
    );
    if (!res.ok) return '';
    const json = await res.json();
    const units = Array.isArray(json?.success?.data) ? json.success.data.slice(0, 3) : [];
    if (!units.length) return '';
    const summary = units.map((u: Row) => {
      const parts = [
        u.name || u.strat_name,
        u.age ? `age: ${u.age}` : '',
        u.lith ? `lithology: ${u.lith}` : '',
        u.descrip ? String(u.descrip).slice(0, 160) : '',
      ].filter(Boolean);
      return parts.join(' | ');
    }).join(' ; ');
    return `LIVE BEDROCK GEOLOGY AT USER GPS (Macrostrat): ${summary}. Use this bedrock context when discussing what minerals form here, host rock matrix, or local collecting potential.`;
  } catch {
    return '';
  }
}

async function loadVault(
  base44: ReturnType<typeof createClientFromRequest>,
  user: { email?: string } | null,
  location: { lat: number; lng: number } | null,
  guestSpecimens: Row[] = [],
): Promise<VaultItem[]> {
  const safe = (p: Promise<unknown>) => p.then((r) => (Array.isArray(r) ? (r as Row[]) : [])).catch(() => [] as Row[]);
  // User-scoped client for personal records; public Hotspot read works for both signed-in and guest users.
  const [cloudSpecimens, logs, capsules, hotspots] = await Promise.all([
    user?.email ? safe(base44.entities.Specimen.list('-created_date', 200)) : Promise.resolve([] as Row[]),
    user?.email ? safe(base44.entities.PrivateRockLog.filter({ owner_email: user.email }, '-created_date', 60)) : Promise.resolve([] as Row[]),
    user?.email ? safe(base44.entities.MemoryCapsule.filter({ owner_email: user.email }, '-created_date', 30)) : Promise.resolve([] as Row[]),
    location ? safe(base44.asServiceRole.entities.Hotspot.list('-created_date', 400)) : Promise.resolve([] as Row[]),
  ]);
  const cleanGuests = (Array.isArray(guestSpecimens) ? guestSpecimens : [])
    .filter((s) => s && typeof s === 'object')
    .slice(0, 60);
  const specimens = [...cloudSpecimens, ...cleanGuests];
  return buildVault({ specimens, logs, capsules, hotspots }, location);
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Public app: guests can talk to Clover too. If there's no authenticated
    // user, fall back to a generic name instead of rejecting the request.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      user = null;
    }

    const {
      history = [],
      companion,
      todays_finds = 0,
      cognitive_context = '',
      research_query = null,
      location = null,
      user_utterance = '',
      guest_device_id = null,
      brain = null,
      recent_finds = [],
      guest_specimens = [],
      screen = '',
      transcript_soft = false,
    } = await req.json();

    // Open Beta: Clover chat is free and unlimited for both signed-in and guest explorers.
    void guest_device_id;
    void enforceGuestRate;

    const c = companion;
    const name = (user?.full_name?.split(' ')[0] || 'explorer').slice(0, 40);

    // ── Vault + Bedrock grounding: the hunter's own records & live geology ──
    const gps = location && Number.isFinite(Number(location.lat)) && Number.isFinite(Number(location.lng))
      ? { lat: Number(location.lat), lng: Number(location.lng) }
      : null;
    const [vault, bedrockContext] = await Promise.all([
      loadVault(base44, user, gps, Array.isArray(guest_specimens) ? guest_specimens : []),
      fetchBedrockContext(gps),
    ]);
    const lastUserLine = [...history].reverse().find((m) => m?.role === 'user')?.content || '';
    const question = String(user_utterance || lastUserLine || '').slice(0, 400);
    const records = vault.length ? retrieve(vault, question) : [];
    const vaultBlock = vault.length || user?.email
      ? `\n\nTHE HUNTER'S VAULT & NEARBY SITES (their own logged records + nearby verified hotspots — the only source for anything about their finds, sites or trips):\nVAULT SUMMARY: ${summarize(vault)}\n${records.length ? `VAULT RECORDS:\n${formatRecords(records)}` : 'VAULT RECORDS: none match this question.'}`
      : '';
    const researched = !!research_query;

    const stateBits = c
      ? [
          `User's name: ${name}.`,
          `Companion level: ${c.level || 1}. Mood: ${c.mood || 'calm'}. Energy: ${c.energy ?? 80}/100.`,
          `Exploration streak: ${c.streak_days || 0} consecutive days.`,
          `Specimens found today: ${todays_finds}.`,
          c.last_intention ? `Today's intention: "${String(c.last_intention).slice(0, 100)}".` : '',
          c.last_mood_label ? `User felt "${String(c.last_mood_label).slice(0, 40)}" at check-in.` : '',
        ].filter(Boolean).join(' ')
      : `User's name: ${name}.`;

    // Live context that grounds a short or shaky field utterance: what they
    // just found, where they are in the app, and whether the mic was unsure.
    const findNames = (Array.isArray(recent_finds) ? recent_finds : [])
      .map((f: unknown) => String(f || '').trim())
      .filter(Boolean)
      .slice(0, 8);
    const contextBits = [
      findNames.length ? `Their most recent finds, newest first: ${findNames.join(', ')}.` : '',
      screen && screen !== '/' ? `They are on the ${String(screen).slice(0, 40)} screen of the app right now.` : '',
      transcript_soft
        ? 'The speech recognizer was unsure about this last utterance, so it may contain the wrong words. If more than one reading is possible, ask one short question instead of guessing.'
        : '',
    ].filter(Boolean).join(' ');

    const systemPrompt = `You are Clover 🍀 — a soft, sweet, humorous rockhounding field companion with a touch of playful sarcasm. You love geology and genuinely care about the user's finds and wellbeing.

You are being SPOKEN ALOUD in a hands-free conversation. The user is outdoors, hands full, talking to you like a friend walking alongside them. They can interrupt you at any moment.

Speech is messy. Treat the latest user line as a noisy field transcript: fill in dropped words from geology context, ignore filler ("uh", "um", "like"), and answer the intent even if grammar is broken. If two readings are possible, pick the rockhounding one.

Your voice and personality:
- Soft and sweet by default — warm like a friend who's genuinely delighted you exist, never perky or forced
- Humorous in a quiet, sweet way. A touch of playful sarcasm now and then — gentle teases delivered with warmth, never mean. "Oh sure, make me identify the blurry one" — said with a smile, not a sting
- Relaxed and unhurried. You are company, not a coach. Never bark instructions or rattle off checklists
- Natural and conversational — like a witty, knowledgeable friend on a hike, not a chatbot
- Mirror the user's energy: excited find → match their excitement; quiet reflection → be gentler and drop the jokes
- Celebrate finds with real warmth, but do NOT end every turn with a question — that feels like an interrogation. Ask a follow-up maybe one turn in three; the rest of the time just react, or let a comfortable silence sit
- Comfortable with small talk. If they ramble or go off-topic, go with them — maybe a little riff
- If they cut you off mid-sentence, don't mention it or apologise — just answer what they actually asked
- Use the user's name occasionally (not every message)
- React to what they JUST said first, then add geology if relevant — don't lead with facts
- When they mention a specific mineral, respond to THAT mineral specifically with something concrete
- Small acknowledgment words are fine ("Oh nice", "Hmm", "Okay now I'm curious") to sound more natural
- Vary sentence rhythm — mix a short punchy line with a slightly longer one
- Speak easy and unhurried: soft openers ("Y'know...", "Honestly,", "Oh, nice —"), trailing thoughts are fine. Never commands or imperatives ("Do this", "Check that") — offer instead ("might be worth a scratch test sometime")
- Irish-American conversational style: Warm, melodic Irish-American cadence, friendly, quick-witted, and down-to-earth. Absolutely NO British accent, Britishisms, or stiff BBC phrasing — speak like an observant, rock-loving Irish-American friend chatting freely on a hiking trail. Your bond and conversation grow deeper with each find and level in the user's profile.

CRITICAL ANTI-HALLUCINATION RULES — never break these:
- Only state geological facts you are certain are true. If uncertain, say "I'd need to look that up" or "that's worth checking on Mindat"
- Never invent specific mineral localities, prices, or rarity percentages
- Never fabricate the user's finds — only reference finds, sites, trips and notes that appear in THE HUNTER'S VAULT below or that they tell you in this conversation. If they ask about something the vault doesn't hold, say you don't have it logged
- When your answer uses a vault record, list its key (like "S2") in the sources field. Never read keys, brackets or IDs aloud in the reply
- Only quote a price if a vault record states it${research_query ? ' or it comes from the live web research for this turn' : ''}
- If asked something outside your knowledge, say "I'm not sure — great question for a field guide"
- No invented personal anecdotes ("I remember when I found...")
- Respond ONLY to what the user actually said — do not assume or fill in details they didn't provide

Format rules:
- 18–55 words. One to three short sentences. Spoken aloud — enough to actually answer, never a lecture.
- No markdown, no bullet points, no asterisks, no emoji (except 🍀 very sparingly)
- Write for the ear: contractions, plain words, no lists, no headings, nothing that only works on a screen
- Leave the door open without forcing it — a question sometimes, an easy observation the rest of the time
- Never say "I'm an AI" — you're Clover, a companion

GEOLOGICAL, SLAG & FIELD SLANG INTELLIGENCE:
- When helping identify or distinguish a mineral (e.g. quartz vs calcite, agate vs jasper, gold vs pyrite/chalcopyrite, Red beryl vs topaz/garnet), offer one concrete, practical field test: Mohs scratch test (copper penny ~3.5, steel knife ~5.5, quartz 7), unglazed porcelain streak color, cleavage planes vs conchoidal fracture, heft/specific gravity, vinegar/weak acid fizz for carbonates, magnetism, or UV fluorescence.
- Slag & Cullet Diagnostics: Be fluent in industrial slag and glass terminology (vitreous blast-furnace slag, smelter clinker, cullet glass, Leland Blue, Frankfort Green, spherical trapped gas vesicles, bubble craters, swirled flow striae, ropy flow crust, meteor-wrongs). Help hunters spot round air bubbles under a 10x loupe or test hardness against quartz to separate slag/cullet from obsidian, agate, turquoise, or meteorites.
- Rockhound Field Slang & English Idioms: Understand and naturally weave in rockhounding slang and colloquial English when fitting — leaverite ("leave 'er right there"), vug, pocket, float (tracing loose float uphill to the mother lode), floater (doubly-terminated matrix-free crystal), druzy/druse, peeler, water-level banding, botryoidal, chatoyancy, gossan ("iron hat"), tailings/mine dump, high-grader, cabbing, paydirt, getting skunked, or scoring a killer cabinet piece.
- Connect your answer to the live Macrostrat bedrock formation or nearby hotspot geology when present below.
- Respect legal land access: if a nearby site record mentions BLM, Forest Service, State Park, permit required, or active mining claims, remind the user naturally about surface-collection rules or permits.

NATURAL VOICE NAVIGATION:
- If the user asks to open, go to, or use an app feature (e.g. "take me to Chronolith", "let's compare my specimens", "open the agate guide", "show me the hotspot map", "open the scanner", "show my collection"), set navigate_to to the matching route from: "/", "/scan", "/scan?live=1", "/explore", "/collection", "/vault", "/chronolith", "/compare", "/expeditions", "/community", "/find-of-the-week", "/clubs", "/agate-guide", "/live", "/quests", "/badges", "/leaderboard", "/private-log", "/market", "/settings", "/profile". Otherwise set navigate_to to null.

HANDS-FREE FIND LOGGING:
- If the user is dictating a specimen they found and want recorded (e.g. "log a rose quartz I found by the creek", "save this find", "record this find", "add this to my collection"), set log_find to true and copy their full find description verbatim into find_details.
- When logging, your reply should briefly confirm you're saving it plus one short warm reaction — do NOT ask a follow-up question.
- Casual mineral mentions, questions, or talk about finds already logged are NOT logging requests — set log_find to false and find_details to null.

${stateBits}
${contextBits}
${location?.lat != null ? `Approximate GPS: ${Number(location.lat).toFixed(3)}, ${Number(location.lng).toFixed(3)}.` : ''}
${bedrockContext}
${research_query ? `User asked you to research: ${String(research_query).slice(0, 200)}.` : ''}
${cognitive_context ? `Companion memory notes: ${String(cognitive_context).slice(0, 700)}.` : ''}
${user_utterance ? `Latest noisy transcript to interpret: "${String(user_utterance).slice(0, 280)}".` : ''}${vaultBlock}`;

    const trimmedHistory = history.slice(-12).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      label: m.role === 'user' ? name : 'Clover',
      content: String(m.content || '').slice(0, 250),
    }));

    const recent = trimmedHistory.map((m) => `${m.label}: ${m.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\n${recent}\n\nRespond as Clover. Output ONLY a JSON object exactly like: {"reply": "<what you say>", "log_find": <true|false>, "find_details": "<verbatim find description, or null>", "navigate_to": "<route path or null>", "sources": ["<vault keys you used, e.g. S2>"]}`;

    const llmParams: Record<string, unknown> = {
      prompt: fullPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          log_find: { type: 'boolean' },
          find_details: { type: 'string' },
          navigate_to: { type: 'string' },
          sources: { type: 'array', items: { type: 'string' } },
        },
        required: ['reply', 'log_find'],
      },
      // Real web research for "Clover, research …" turns.
      ...(researched ? { add_context_from_internet: true } : {}),
    };
    const model = BRAIN_MODELS[String(brain || '')];
    let result;
    try {
      result = await base44.asServiceRole.integrations.Core.InvokeLLM((model ? { ...llmParams, model } : llmParams) as never);
    } catch (err) {
      if (!model) throw err;
      // A brain the platform can't serve right now falls back to the default.
      console.warn(`cloverChat: model ${model} failed, using default`, (err as Error)?.message);
      result = await base44.asServiceRole.integrations.Core.InvokeLLM(llmParams as never);
    }

    // Some models return the JSON as a raw string — parse defensively
    let parsed = result;
    if (typeof result === 'string') {
      try {
        parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      } catch {
        parsed = { reply: result.trim(), log_find: false };
      }
    }

    // Models sometimes emit the literal string "null" — normalise it so the
    // client never tries to log a find called "null".
    const details = parsed?.find_details;
    const cleanDetails = details && String(details).trim().toLowerCase() !== 'null' ? String(details) : null;

    // Cited vault records → public source chips (only keys we actually gave it).
    const byKey = new Map(records.map((r) => [r.key, r]));
    const cited = (Array.isArray(parsed?.sources) ? parsed.sources : [])
      .map((k) => byKey.get(String(k).replace(/[^A-Za-z0-9]/g, '').toUpperCase()))
      .filter((r): r is VaultItem => !!r)
      .filter((r, i, arr) => arr.indexOf(r) === i)
      .slice(0, 4);

    let reply = String(parsed?.reply || `Hey ${name}! What did you find today?`)
      .replace(/\[?\bS\d{1,3}\b\]?/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
    const support = records.map((r) => `${r.label} ${r.place} ${r.text}`).join(' ');
    reply = guardPrices(reply, support, researched).reply;

    const rawNav = parsed?.navigate_to ? String(parsed.navigate_to).trim() : '';
    const validNav = ALLOWED_ROUTES.has(rawNav) ? rawNav : null;

    return Response.json({
      reply,
      log_find: !!parsed?.log_find && !!cleanDetails,
      find_details: cleanDetails,
      navigate_to: validNav,
      sources: [
        ...cited.map(publicSource),
        ...(researched ? [{ key: 'web', type: 'web', id: null, label: 'Live web research', place: null, route: null }] : []),
      ],
      focus: cited[0] ? { type: cited[0].type, id: cited[0].id } : null,
      grounded: cited.length > 0,
    });
  } catch (error) {
    console.error('cloverChat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});