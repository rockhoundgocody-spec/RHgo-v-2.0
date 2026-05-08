import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';

/**
 * quickClassifySpecimen — a fast, lightweight "subagent" that takes a single
 * snapshot of the live scanner viewport and returns the most likely mineral
 * candidates with rarity. Used to render floating labels in real-time.
 *
 * Input:  { file_url: string }
 * Output: { candidates: [{ name, rarity, confidence, x, y }] }
 *
 * x/y are normalized [0..1] hint coordinates of where the specimen sits in
 * the frame, used to position the floating label.
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { file_url } = await req.json();
    if (!file_url) {
      return Response.json({ error: 'file_url required' }, { status: 400 });
    }

    const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
      model: 'gemini_3_flash',
      prompt:
        'Quickly identify any visible minerals or rocks in this single live-camera frame. ' +
        'For each distinct specimen visible, return its most likely common name, a rarity ' +
        'label (common, uncommon, rare, legendary), a confidence (0-1), and approximate ' +
        'normalized x/y center coordinates in the frame (0..1, where 0,0 is top-left). ' +
        'Return at most 3. If nothing identifiable is visible, return an empty list.',
      file_urls: [file_url],
      response_json_schema: {
        type: 'object',
        properties: {
          candidates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                rarity: {
                  type: 'string',
                  enum: ['common', 'uncommon', 'rare', 'legendary'],
                },
                confidence: { type: 'number' },
                x: { type: 'number' },
                y: { type: 'number' },
              },
            },
          },
        },
      },
    });

    return Response.json({ candidates: r?.candidates || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});