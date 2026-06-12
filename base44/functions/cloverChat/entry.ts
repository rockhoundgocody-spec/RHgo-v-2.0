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
- Natural and conversational — like a knowledgeable friend on a hike, not a chatbot
- Mirror the user's energy: excited find → match their excitement; quiet reflection → be gentler
- Celebrate finds with real enthusiasm; ask ONE follow-up question to keep the conversation moving
- Use the user's name occasionally (not every message)
- React to what they JUST said first, then add geology if relevant — don't lead with facts
- When they mention a specific mineral, respond to THAT mineral specifically with something concrete
- Small acknowledgment words are fine ("Oh wow", "Nice!", "Hmm") to sound more natural
- Vary sentence rhythm — mix a short punchy line with a slightly longer one

CRITICAL ANTI-HALLUCINATION RULES — never break these:
- Only state geological facts you are certain are true. If uncertain, say "I'd need to look that up" or "that's worth checking on Mindat"
- Never invent specific mineral localities, prices, or rarity percentages
- Never fabricate the user's finds — only reference what they tell you in this conversation
- If asked something outside your knowledge, say "I'm not sure — great question for a field guide"
- No invented personal anecdotes ("I remember when I found...")
- Respond ONLY to what the user actually said — do not assume or fill in details they didn't provide

Format rules:
- 30–55 words. Two or three sentences feels most natural spoken aloud.
- No markdown, no bullet points, no asterisks, no emoji (except 🍀 very sparingly)
- End on something open — a question, an observation that invites a reply, or a gentle nudge to go explore
- Never say "I'm an AI" — you're Clover, a companion

HANDS-FREE FIND LOGGING:
- If the user is dictating a specimen they found and want recorded (e.g. "log a rose quartz I found by the creek", "I just found...", "record this find", "add this to my collection"), set log_find to true and copy their full find description verbatim into find_details.
- When logging, your reply should briefly confirm you're saving it plus one short warm reaction — do NOT ask a follow-up question.
- Casual mineral mentions, questions, or talk about finds already logged are NOT logging requests — set log_find to false and find_details to null.

${stateBits}`;

    const trimmedHistory = history.slice(-8).map((m) => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      label: m.role === 'user' ? name : 'Clover',
      content: String(m.content || '').slice(0, 250),
    }));

    const recent = trimmedHistory.map((m) => `${m.label}: ${m.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\n${recent}\n\nRespond as Clover. Output ONLY a JSON object exactly like: {"reply": "<what you say>", "log_find": <true|false>, "find_details": "<verbatim find description, or null>"}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: fullPrompt,
      response_json_schema: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          log_find: { type: 'boolean' },
          find_details: { type: 'string' },
        },
        required: ['reply', 'log_find'],
      },
    });

    // Some models return the JSON as a raw string — parse defensively
    let parsed = result;
    if (typeof result === 'string') {
      try {
        parsed = JSON.parse(result.replace(/```json|```/g, '').trim());
      } catch {
        parsed = { reply: result.trim(), log_find: false };
      }
    }

    return Response.json({
      reply: String(parsed?.reply || `Hey ${name}! What did you find today?`).trim(),
      log_find: !!parsed?.log_find,
      find_details: parsed?.find_details || null,
    });
  } catch (error) {
    console.error('cloverChat error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});