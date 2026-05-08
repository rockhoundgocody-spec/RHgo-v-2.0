import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

const INTENT_MAP = {
  scan: ['identify', 'scan', 'what is', 'what mineral', 'classify', 'analyze', 'look at', 'photo', 'camera'],
  explore: ['find', 'where', 'locate', 'navigate', 'route', 'nearby', 'hotspot', 'map', 'go to', 'directions', 'fluorite', 'quartz', 'agate', 'pegmatite', 'hydrothermal'],
  collection: ['collection', 'my finds', 'value', 'worth', 'estimate', 'catalog', 'specimens', 'inventory'],
  compare: ['compare', 'versus', 'vs', 'difference', 'similar', 'lookalike', 'same as'],
  verify: ['verify', 'confirm', 'progressive', 'certain', 'double check', 'test'],
  safety: ['safe', 'hazard', 'danger', 'flood', 'collapse', 'toxic', 'legal', 'allowed', 'permit', 'trespass'],
  docs: ['how to', 'learn', 'teach', 'explain', 'what does', 'geology', 'formation', 'crystal system', 'hardness', 'guide'],
};

function classifyIntent(text) {
  const lower = text.toLowerCase();
  let best = { intent: 'docs', score: 0 };
  for (const [intent, keywords] of Object.entries(INTENT_MAP)) {
    const score = keywords.filter(k => lower.includes(k)).length;
    if (score > best.score) best = { intent, score };
  }
  return best.intent;
}

const ROUTE_MAP = {
  scan: '/scan',
  explore: '/explore',
  collection: '/collection',
  compare: '/compare',
  verify: '/verify',
  safety: '/explore',
  docs: '/docs',
};

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { command, lat, lng, collection_count } = await req.json();
  if (!command?.trim()) return Response.json({ error: 'No command provided' }, { status: 400 });

  const intent = classifyIntent(command);
  const route = ROUTE_MAP[intent];

  const locationCtx = lat && lng
    ? `User is currently at coordinates ${lat.toFixed(4)}, ${lng.toFixed(4)}.`
    : 'User location is unknown.';
  const collectionCtx = collection_count ? `User has ${collection_count} specimens in their collection.` : '';

  const fullResponse = await base44.asServiceRole.integrations.Core.InvokeLLM({
    prompt: `You are the RockHound-GO Field Intelligence System — an expert field geologist and AI companion. You reason like a professional mineralogist with deep knowledge of mineral associations, geological formations, terrain analysis, and field collecting ethics.

${locationCtx} ${collectionCtx}
Detected intent: ${intent}. Route: ${route}.

User field command: "${command}"

Respond with:
- headline: 1 short line summarizing what the AI understood
- geological_brief: 2-3 sentences of expert geological context (formations, associations, terrain indicators)
- field_actions: 2-3 concrete next actions for the user in the field
- safety_note: brief safety/legal note if relevant, otherwise empty string
- confidence: high/moderate/speculative`,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        headline: { type: 'string' },
        geological_brief: { type: 'string' },
        field_actions: { type: 'array', items: { type: 'string' } },
        safety_note: { type: 'string' },
        confidence: { type: 'string', enum: ['high', 'moderate', 'speculative'] }
      }
    },
  });

  return Response.json({
    intent,
    route,
    result: fullResponse,
  });
});