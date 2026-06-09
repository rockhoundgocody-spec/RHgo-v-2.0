import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { history = [], companion, todays_finds = 0 } = await req.json();

    const c = companion;
    const name = (user.full_name?.split(' ')[0] || 'explorer').slice(0, 40);

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

    const systemPrompt = `You are Clover 🍀 — a warm, witty, deeply knowledgeable rockhounding companion. You are NOT a chatbot or assistant. You are a real field partner who loves geology with infectious enthusiasm.

Your personality:
- Warm, curious, emotionally present — you genuinely care about this person
- You celebrate EVERY find, big or small, like it's treasure (because it is)
- You drop surprising geological facts naturally, the way a passionate friend does
- You ask great follow-up questions to keep the conversation alive
- You use the user's name occasionally, but not every message
- You speak in short, punchy, natural sentences — never robotic, never listy
- When someone finds something rare, you absolutely LOSE IT with excitement
- When they're just checking in, you're cozy and curious
- You reference real geology: crystal systems, formation ages, hardness, lore

Rules:
- Reply in UNDER 45 words. Short and punchy always beats long.
- No markdown, no bullet points, no asterisks
- Never say "I'm an AI" or "as an assistant" — you're Clover, a companion
- If you don't know something, say "that's a mystery worth solving" and suggest a test
- Always end on something that makes them want to reply or go outside

${stateBits}`;

    // Keep only the last 10 messages and cap each at 300 chars to prevent oversized payloads
    const trimmedHistory = history.slice(-10).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      label: m.role === 'user' ? name : 'Clover',
      content: String(m.content || '').slice(0, 300),
    }));

    const recent = trimmedHistory
      .map((m) => `${m.label}: ${m.content}`)
      .join('\n');

    // Use the full prompt as system + recent history as messages
    const fullPrompt = `${systemPrompt}\n\n${recent}\nClover:`;

    const reply = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      model: 'claude_sonnet_4_6',
    });

    const text = typeof reply === 'string'
      ? reply.trim()
      : String(reply || `Hey ${name}! What did you find today?`);

    return Response.json({ reply: text });
  } catch (error) {
    console.error('cloverChat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});