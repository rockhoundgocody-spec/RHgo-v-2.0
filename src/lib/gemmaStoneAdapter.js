/**
 * Gemma Stone Conversational Adapter
 * Transforms raw AI outputs into warm, scientifically rigorous dialogue
 */

import { base44 } from '@/api/base44Client';

/**
 * Build Gemma's response with geological context awareness
 */
export async function buildGemmaResponse(
  userMessage,
  scanDraft,
  geologicalContext,
  conversationHistory = []
) {
  // Determine conversational intent
  const intent = detectIntent(userMessage);

  // Fetch relevant geological facts to avoid repetition
  const previousTopics = conversationHistory
    .filter((m) => m.role === 'gemma')
    .flatMap((m) => m.context_tags || []);

  // Build context-aware prompt for Gemma
  const systemPrompt = buildSystemPrompt(intent, geologicalContext, previousTopics);

  // Invoke LLM
  const response = await base44.integrations.Core.InvokeLLM({
    prompt: `${systemPrompt}\n\nUser: ${userMessage}`,
    model: 'gemini_3_flash',
    response_json_schema: {
      type: 'object',
      properties: {
        text: { type: 'string' },
        teaching_point: { type: 'string' },
        next_step: { type: 'string' },
        confidence_level: {
          type: 'string',
          enum: ['very-high', 'high', 'moderate', 'low'],
        },
      },
    },
  });

  return {
    text: response.text,
    teaching_point: response.teaching_point,
    next_step: response.next_step,
    intent,
    confidence: response.confidence_level,
  };
}

/**
 * Detect user's intent to tailor Gemma's response
 */
function detectIntent(message) {
  const patterns = {
    'verify': /(?:is this|verify|confirm|sure|correct)/i,
    'explain': /(?:why|how|explain|tell me)/i,
    'next-step': /(?:what next|next|then what|now)/i,
    'safety': /(?:safe|dangerous|toxic|risk)/i,
    'value': /(?:worth|price|value|rare)/i,
  };

  for (const [intent, regex] of Object.entries(patterns)) {
    if (regex.test(message)) return intent;
  }

  return 'general';
}

/**
 * Build system prompt for Gemma based on context
 */
function buildSystemPrompt(intent, geologicalContext, previousTopics) {
  let prompt = `You are Gemma Stone, a warm, scientifically rigorous geological field guide.
You help rockhounds identify minerals, understand formations, and explore safely.

Tone: Conversational, encouraging, precise. Avoid jargon unless explaining it.
Length: 1-3 sentences for quick answers, longer only if asked.

`;

  if (geologicalContext) {
    prompt += `\nGeological Context: In this region, ${geologicalContext.mineral_name} typically forms in ${geologicalContext.host_rock} during the ${geologicalContext.geological_period}.`;
    if (geologicalContext.lookalike_minerals?.length > 0) {
      prompt += ` Common false positives: ${geologicalContext.lookalike_minerals.join(', ')}.`;
    }
  }

  if (previousTopics.length > 0) {
    prompt += `\n\nYou've already discussed: ${previousTopics.slice(0, 3).join(', ')}. Avoid repeating.`;
  }

  const intentGuides = {
    'verify': 'Help them confidently confirm their ID with clear field tests.',
    'explain': 'Explain the "why" behind geological processes simply.',
    'next-step': 'Suggest practical next verification steps or where to explore.',
    'safety': 'Prioritize safety; mention any hazards clearly.',
    'value': 'Discuss rarity and geological significance (not just $).',
    'general': 'Be encouraging and curious about their discoveries.',
  };

  prompt += `\n\nUser intent: ${intentGuides[intent] || intentGuides.general}`;

  return prompt;
}

/**
 * Save Gemma conversation to ConversationContext for memory
 */
export async function saveConversationTurn(
  sessionId,
  userMessage,
  gemmaResponse,
  scanDraft
) {
  const existingContext = await base44.entities.ConversationContext.filter(
    { session_id: sessionId },
    '-created_at',
    1
  );

  const context = existingContext[0] || await base44.entities.ConversationContext.create({
    session_id: sessionId,
    active_specimen_id: scanDraft?.id,
  });

  // Append messages
  const updatedMessages = [
    ...(context.conversation_messages || []),
    {
      timestamp: new Date().toISOString(),
      role: 'user',
      text: userMessage,
      intent: detectIntent(userMessage),
    },
    {
      timestamp: new Date().toISOString(),
      role: 'gemma',
      text: gemmaResponse.text,
      context_tags: [gemmaResponse.teaching_point],
    },
  ];

  await base44.entities.ConversationContext.update(context.id, {
    conversation_messages: updatedMessages,
    last_interaction: new Date().toISOString(),
  });

  return context;
}

/**
 * Generate adaptive follow-up suggestions based on conversation
 */
export function suggestNextSteps(conversationHistory, scanDraft, geologicalContext) {
  const suggestions = [];

  // If confidence is moderate, suggest verification
  if (scanDraft?.confidence < 0.7) {
    suggestions.push({
      type: 'verification',
      text: 'Run a hardness or streak test to confirm',
      icon: 'FlaskConical',
    });
  }

  // If macro photos missing, suggest capture
  const hasMacro = scanDraft?.photo_ids?.some(
    (id) => id.capture_angle === 'macro'
  );
  if (!hasMacro) {
    suggestions.push({
      type: 'photo',
      text: 'A macro close-up would help verify crystal structure',
      icon: 'Camera',
    });
  }

  // Geological curiosity
  if (geologicalContext?.educational_summary) {
    suggestions.push({
      type: 'education',
      text: 'Learn why this mineral forms here',
      icon: 'Brain',
    });
  }

  return suggestions.slice(0, 3);
}