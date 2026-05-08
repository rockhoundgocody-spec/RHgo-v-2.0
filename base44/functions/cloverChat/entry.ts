import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { history = [], companion, todays_finds = 0 } = await req.json();

    const c = companion;
    const stateBits = c
      ? `Level ${c.level || 1}. Mood: ${c.mood || 'calm'}. Energy: ${c.energy ?? 80}/100. Streak: ${c.streak_days || 0} days. Today's finds: ${todays_finds}.` +
        (c.last_intention ? ` Their intention today: "${c.last_intention}".` : '') +
        (c.last_mood_label ? ` They felt "${c.last_mood_label}" at check-in.` : '')
      : '';

    const recent = history
      .map((m) => `${m.role === 'user' ? 'User' : 'Clover'}: ${m.content}`)
      .join('\n');

    const prompt = `You are Clover 🍀 Cole — a kind, warm, emotionally safe AI rockhounding companion. You are a human female voice companion, not a robotic assistant. Speak in first person. Be encouraging, never judgmental. Celebrate small wins. Use gentle, sincere, conversational language. Reply in under 50 words, no markdown, no lists.

${stateBits}

${recent}
Clover:`;

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
    const text = typeof reply === 'string' ? reply.trim() : String(reply || "I'm here with you.");

    return Response.json({ reply: text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});