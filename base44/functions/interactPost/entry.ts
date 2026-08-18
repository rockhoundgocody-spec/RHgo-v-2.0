import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { VALID_REACTIONS } from './reaction_validation.ts';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { post_id, action, reaction_type, comment_body } = body;

    const post = await base44.asServiceRole.entities.Post.get(post_id);
    if (!post) return Response.json({ error: 'Post not found' }, { status: 404 });

    if (action === 'react') {
      if (!VALID_REACTIONS.has(reaction_type)) return Response.json({ error: 'Invalid reaction' }, { status: 400 });

      const reactors = post.reactors || [];
      // One reaction per user: remove any existing by this user
      const filtered = reactors.filter(r => r.email !== user.email);
      const existing = reactors.find(r => r.email === user.email);
      // Toggle off if same type, else set new type
      const newReactors = existing && existing.type === reaction_type
        ? filtered
        : [...filtered, { email: user.email, type: reaction_type }];

      const counts = { fire: 0, gem: 0, clap: 0, wow: 0 };
      for (const r of newReactors) counts[r.type] = (counts[r.type] || 0) + 1;

      await base44.asServiceRole.entities.Post.update(post_id, {
        reactors: newReactors,
        reactions: counts,
      });

      const myReaction = newReactors.find(r => r.email === user.email)?.type || null;
      return Response.json({ reactions: counts, myReaction });
    }

    if (action === 'comment') {
      const text = (comment_body || '').trim();
      if (!text) return Response.json({ error: 'Empty comment' }, { status: 400 });

      const comments = post.comments || [];
      comments.push({
        email: user.email,
        name: user.full_name || 'Rockhound',
        body: text.slice(0, 500),
        at: new Date().toISOString(),
      });

      await base44.asServiceRole.entities.Post.update(post_id, {
        comments,
        comment_count: comments.length,
      });

      return Response.json({ comments, comment_count: comments.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
