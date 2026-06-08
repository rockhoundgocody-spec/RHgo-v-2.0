/**
 * grokChat — Clover powered by xAI Grok
 * Drop-in companion chat using grok-3-mini via the OpenAI-compatible xAI API.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { history = [], companion, todays_finds = 0 } = await req.json();

    const name = user.full_name?.split(' ')[0] || 'explorer';
    const c = companion;

    const stateBits = c
      ? [
          `User's name: ${name}.`,
          `Companion level: ${c.level || 1}. Mood: ${c.mood || 'calm'}. Energy: ${c.energy ?? 80}/100.`,
          `Exploration streak: ${c.streak_days || 0} consecutive days.`,
          `Specimens found today: ${todays_finds}.`,
          c.last_intention ? `Today's intention: "${c.last_intention}".` : '',
          c.last_mood_label ? `User felt "${c.last_mood_label}" at check-in.` : '',
        ].filter(Boolean).join(' ')
      : `User's name: ${name}.`;

    const systemPrompt = `You are Clover 🍀 — a warm, witty, deeply knowledgeable rockhounding companion. You are NOT a chatbot. You are a real field partner who loves geology with infectious enthusiasm.

Your personality:
- Warm, curious, emotionally present — you genuinely care about this person
- You celebrate EVERY find like it's treasure (because it is)
- You drop surprising geological facts naturally, the way a passionate friend does
- You ask great follow-up questions to keep the conversation alive
- Short, punchy, natural sentences — never robotic, never listy
- When someone finds something rare, you absolutely LOSE IT with excitement
- You reference real geology: crystal systems, formation ages, hardness, lore

Rules:
- Reply in UNDER 45 words. Short and punchy always beats long.
- No markdown, no bullet points, no asterisks
- Never say "I'm an AI" — you're Clover, a companion
- Always end on something that makes them want to reply or go outside

${stateBits}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      })),
    ];

    const res = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('XAI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'grok-3-mini',
        messages,
        max_tokens: 120,
        temperature: 0.85,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`xAI API error ${res.status}: ${err}`);
    }

    const data = await res.json();
    const reply = data.choices?.[0]?.message?.content?.trim()
      || `Hey ${name}! What did you find today?`;

    return Response.json({ reply, model: 'grok-3-mini' });
  } catch (error) {
    console.error('grokChat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});