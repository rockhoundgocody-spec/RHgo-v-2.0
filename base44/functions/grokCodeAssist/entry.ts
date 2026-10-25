/**
 * grokCodeAssist — xAI Grok for in-app code suggestions
 * Accepts a prompt describing a desired app change and returns
 * Grok's suggested code diff / explanation using grok-3.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { prompt, context_code = '', language = 'javascript' } = await req.json();
    if (!prompt) return Response.json({ error: 'prompt required' }, { status: 400 });

    const systemPrompt = `You are an expert React + Tailwind + Deno developer working on RockHound-GO, a geology/rockhounding mobile app built on Base44.

Stack: React 18, React Router v6, TailwindCSS, Framer Motion, Deno backend functions, Base44 SDK.
Design system: Deep black + amethyst/neon palette, liquid-glass panels, crystal/geode aesthetic.

When asked to make a code change:
1. Output ONLY the code that needs to change — minimal diff style
2. Wrap each file block in a markdown code fence with the file path as the label
3. Explain in 1-2 sentences what changed and why
4. Never rewrite entire files unnecessarily — make surgical edits

Be direct, precise, and opinionated. Prefer simplicity over cleverness.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      {
        role: 'user',
        content: context_code
          ? `Here is the relevant current code:\n\`\`\`${language}\n${context_code}\n\`\`\`\n\nRequest: ${prompt}`
          : prompt,
      },
    ];

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('XAI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'grok-3',
        messages,
        max_tokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`xAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const suggestion = data.choices?.[0]?.message?.content?.trim() || '';
    const usage = data.usage || {};

    return Response.json({ suggestion, model: 'grok-3', usage });
  } catch (error) {
    console.error('grokCodeAssist error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});