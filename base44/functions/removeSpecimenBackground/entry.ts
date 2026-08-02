/**
 * removeSpecimenBackground — produces a clean cut-out of a specimen photo.
 *
 * POST { image_url }  →  { success, cutout_url }
 * Best-effort: on any failure the caller keeps the original photo.
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { image_url } = await req.json();
    if (!image_url) return Response.json({ error: 'image_url is required' }, { status: 400 });

    // Only process images we host. Without this, any authenticated user could
    // point this at an arbitrary external URL and burn image-generation credits.
    let host = '';
    try { host = new URL(image_url).hostname; } catch { /* invalid URL */ }
    const allowed = host.endsWith('base44.app') || host.endsWith('base44.com') || host.endsWith('amazonaws.com');
    if (!allowed) {
      return Response.json({ error: 'image_url must be an uploaded app file' }, { status: 400 });
    }

    const res = await base44.integrations.Core.GenerateImage({
      prompt:
        'Isolate the rock or mineral specimen from this photograph and remove the background entirely. ' +
        'Keep the specimen pixel-for-pixel faithful — do not restyle, recolor, smooth, sharpen, reshape, ' +
        'or invent any surface detail; preserve its exact texture, banding, inclusions, luster and lighting. ' +
        'Delete everything around it (hands, sand, table, grass, water, shadows) and replace the surroundings ' +
        'with a flat, perfectly uniform neutral studio backdrop. Centered, full specimen in frame, no props, no text.',
      existing_image_urls: [image_url],
    });

    const cutout_url = res?.url || null;
    if (!cutout_url) return Response.json({ success: false, cutout_url: null });

    return Response.json({ success: true, cutout_url });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
});