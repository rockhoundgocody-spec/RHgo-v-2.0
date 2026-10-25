import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { safeError } from '../../shared/httpErrors.ts';
import { sanitizePost } from '../../shared/postPrivacy.ts';

/** Public community feed. Raw Post reads are owner/admin only; everyone else gets email-free posts here. */
export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const viewer = await base44.auth.me().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(Math.max(Number(body?.limit) || 15, 1), 200);
    const query: Record<string, unknown> = {};
    if (body?.before_date && body?.before_id) {
      query.$or = [
        { created_date: { $lt: String(body.before_date) } },
        { created_date: String(body.before_date), id: { $ne: String(body.before_id) } },
      ];
    }
    const rows = await base44.asServiceRole.entities.Post.filter(query, '-created_date', limit);
    return Response.json({ posts: (rows || []).map((p: Record<string, unknown>) => sanitizePost(p, viewer)) });
  } catch (error) {
    return safeError('listPosts', error);
  }
}