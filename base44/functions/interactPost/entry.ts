import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import { safeError } from '../../shared/httpErrors.ts';
import { isActor, publicComments } from '../../shared/postPrivacy.ts';

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
      const valid = ['fire', 'gem', 'clap', 'wow'];
      if (!valid.includes(reaction_type)) return Response.json({ error: 'Invalid reaction' }, { status: 400 });

      // Normalize legacy email rows to user ids; one reaction per user.
      const reactors = (post.reactors || []).filter(r => !isActor(r, user)).map(r => ({ user_id: r.user_id, type: r.type }));
      const existing = (post.reactors || []).find(r => isActor(r, user));
      const newReactors = existing && existing.type === reaction_type
        ? reactors
        : [...reactors, { user_id: user.id, type: reaction_type }];

      const counts = { fire: 0, gem: 0, clap: 0, wow: 0 };
      for (const r of newReactors) counts[r.type] = (counts[r.type] || 0) + 1;

      await base44.asServiceRole.entities.Post.update(post_id, { reactors: newReactors, reactions: counts });

      const myReaction = newReactors.find(r => r.user_id === user.id)?.type || null;
      return Response.json({ reactions: counts, myReaction });
    }

    if (action === 'comment') {
      const text = (comment_body || '').trim();
      if (!text) return Response.json({ error: 'Empty comment' }, { status: 400 });

      const comments = (post.comments || []).map(c => ({ user_id: c.user_id, name: c.name, body: c.body, at: c.at }));
      comments.push({
        user_id: user.id,
        name: user.full_name || 'Rockhound',
        body: text.slice(0, 500),
        at: new Date().toISOString(),
      });

      await base44.asServiceRole.entities.Post.update(post_id, { comments, comment_count: comments.length });

      return Response.json({ comments: publicComments(comments, user), comment_count: comments.length });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    return safeError('interactPost', error);
  }
});