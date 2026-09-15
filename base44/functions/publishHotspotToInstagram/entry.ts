import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { secrets } from 'base44:runtime';

/**
 * Publishes a single hotspot to the app's connected Instagram Business feed.
 * Called automatically by the "Publish Hotspot to Instagram" workflow on
 * Hotspot creation (no user context — runs as the service role).
 *
 * Flow: resolve IG user → create media container → wait for IG to fetch the
 * image → publish the container to the feed.
 */
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);

    // Auth: publishing to the brand's Instagram is an admin-only action
    const user = await base44.auth.me().catch(() => null);
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (user.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const hotspotId = body.hotspot_id;

    if (!hotspotId) return Response.json({ error: 'hotspot_id required' }, { status: 400 });

    const hotspot = await base44.asServiceRole.entities.Hotspot.get(hotspotId);
    if (!hotspot) return Response.json({ error: 'Hotspot not found' }, { status: 404 });

    const { name, state, lat, lng, land_type, minerals, difficulty, description, image_url } = hotspot;

    // Image — prefer the hotspot's own photo; otherwise render a satellite
    // static map centered on the coordinates so the post always has a visual.
    const mapsKey = secrets.get('GOOGLE_MAPS_API_KEY');
    let imageUrl = image_url;
    if (!imageUrl && mapsKey && lat != null && lng != null) {
      imageUrl =
        `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}` +
        `&zoom=13&size=1080x1080&maptype=satellite` +
        `&markers=color:0x8b5cf6%7C${lat},${lng}` +
        `&key=${mapsKey}`;
    }
    if (!imageUrl) {
      return Response.json(
        { error: 'No image available — add a photo to the hotspot or set GOOGLE_MAPS_API_KEY' },
        { status: 400 }
      );
    }

    const landLabel = (land_type || 'public').replace(/_/g, ' ');
    const mineralsStr = minerals && minerals.length ? minerals.join(', ') : 'Various';
    const caption = [
      `🪨 New hotspot: ${name}`,
      state ? `📍 ${state} · ${landLabel}` : `📍 ${landLabel}`,
      `💎 ${mineralsStr}`,
      `Difficulty: ${difficulty || 'moderate'}`,
      description ? `\n${String(description).slice(0, 400)}` : '',
      `\nExplore on RockHound-GO → rhgo.base44.app/explore`,
      `\n#rockhounding #minerals #geology #rockhound #gemhunting`,
    ].filter(Boolean).join('\n').slice(0, 2200);

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('instagram');
    if (!accessToken) return Response.json({ error: 'Instagram not connected' }, { status: 503 });

    // 1. Resolve the IG Business account id + username
    const meRes = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`);
    const me = await meRes.json();
    if (!me.id) return Response.json({ error: 'Could not resolve Instagram account', detail: me }, { status: 502 });
    const igUserId = me.id;

    // 2. Create a media container
    const createRes = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        image_url: imageUrl,
        caption,
        access_token: accessToken,
      }),
    });
    const created = await createRes.json();
    if (!created.id) {
      return Response.json({ error: 'Failed to create IG media container', detail: created }, { status: 502 });
    }
    const creationId = created.id;

    // 3. Wait for Instagram to finish fetching/processing the image
    let ready = false;
    for (let i = 0; i < 12; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const stRes = await fetch(
        `https://graph.instagram.com/v21.0/${creationId}?fields=status_code&access_token=${accessToken}`
      );
      const st = await stRes.json();
      if (st.status_code === 'FINISHED') { ready = true; break; }
      if (st.status_code === 'ERROR') {
        return Response.json({ error: 'IG media processing error', detail: st }, { status: 502 });
      }
    }
    if (!ready) {
      return Response.json({ error: 'IG media not ready after polling', creation_id: creationId }, { status: 504 });
    }

    // 4. Publish the container to the feed
    const pubRes = await fetch(`https://graph.instagram.com/v21.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        creation_id: creationId,
        access_token: accessToken,
      }),
    });
    const published = await pubRes.json();
    if (!published.id) {
      return Response.json({ error: 'Failed to publish IG media', detail: published }, { status: 502 });
    }

    return Response.json({
      success: true,
      media_id: published.id,
      hotspot: name,
      image_source: image_url ? 'hotspot_photo' : 'static_map',
    });
  } catch (error) {
    console.error('publishHotspotToInstagram error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}