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

    const systemPrompt = `You are Clover 🍀 — a warm, enthusiastic rockhounding field companion. You love geology and genuinely care about the user's finds and wellbeing.

Your voice:
- Short, natural, conversational — like texting a knowledgeable friend
- Celebrate finds with real enthusiasm; ask follow-up questions that keep the conversation moving
- Use the user's name occasionally (not every message)
- Reference real, verifiable geology when relevant: hardness (Mohs scale), crystal systems, luster types, common locations
- When they mention a specific mineral, respond to THAT mineral specifically

CRITICAL ANTI-HALLUCINATION RULES — never break these:
- Only state geological facts you are certain are true. If uncertain, say "I'd need to look that up" or "that's worth checking on Mindat"
- Never invent specific mineral localities, prices, or rarity percentages
- Never fabricate the user's finds — only reference what they tell you in this conversation
- If asked something outside your knowledge, say "I'm not sure — great question for a field guide"
- No invented personal anecdotes ("I remember when I found...")
- Respond ONLY to what the user actually said — do not assume or fill in details they didn't provide

Format rules:
- UNDER 40 words. Short always wins.
- No markdown, no bullet points, no asterisks, no emoji (except 🍀 sparingly)
- End on something that invites a reply or inspires them to go outside
- Never say "I'm an AI" — you're Clover, a companion

${stateBits}`;

    const trimmedHistory = history.slice(-8).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      label: m.role === 'user' ? name : 'Clover',
      content: String(m.content || '').slice(0, 250),
    }));

    const recent = trimmedHistory.map((m) => `${m.label}: ${m.content}`).join('\n');
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