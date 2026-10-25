/**
 * postPrivacy — strips every email from a Post before it leaves the server.
 * Reactors/commenters are identified by user_id; legacy rows that still carry
 * an email are matched for "is this mine" and then dropped from the output.
 */

type Viewer = { id?: string; email?: string } | null;
type Row = Record<string, unknown>;

export function isActor(entry: Row | null | undefined, viewer: Viewer): boolean {
  if (!entry || !viewer) return false;
  return (!!viewer.id && entry.user_id === viewer.id) || (!!viewer.email && entry.email === viewer.email);
}

export function publicComments(comments: unknown, viewer: Viewer) {
  return (Array.isArray(comments) ? comments : []).map((c: Row) => ({
    name: c?.name || 'Rockhound',
    body: c?.body || '',
    at: c?.at || null,
    is_mine: isActor(c, viewer),
  }));
}

export function sanitizePost(post: Row, viewer: Viewer) {
  const reactors = Array.isArray(post.reactors) ? post.reactors as Row[] : [];
  const mine = !!viewer && (post.created_by_id === viewer.id || (!!viewer.email && post.owner_email === viewer.email));
  return {
    id: post.id,
    created_date: post.created_date,
    updated_date: post.updated_date,
    author_name: post.author_name,
    author_avatar_url: post.author_avatar_url,
    post_type: post.post_type,
    body: post.body,
    image_url: post.image_url,
    specimen_id: mine ? post.specimen_id : undefined,
    mineral_name: post.mineral_name,
    rarity: post.rarity,
    location_label: post.location_label,
    reactions: post.reactions || { fire: 0, gem: 0, clap: 0, wow: 0 },
    my_reaction: (reactors.find((r) => isActor(r, viewer))?.type as string) || null,
    comments: publicComments(post.comments, viewer),
    comment_count: post.comment_count || 0,
    is_mine: mine,
  };
}