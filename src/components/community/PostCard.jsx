import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Loader2, Send } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const REACTIONS = [
  { type: 'fire', emoji: '🔥' },
  { type: 'gem', emoji: '💎' },
  { type: 'clap', emoji: '👏' },
  { type: 'wow', emoji: '🤯' },
];

const RARITY_COLORS = {
  common: 'hsl(215,35%,65%)',
  uncommon: 'hsl(152,70%,52%)',
  rare: 'hsl(195,100%,68%)',
  legendary: 'hsl(45,100%,62%)',
};

// Posts may embed machine tags like §topic:crystalsystem§ — never show them raw.
const TOPIC_RE = /§topic:([\w-]+)§/gi;
function parseBody(body) {
  if (!body) return { text: '', topics: [] };
  const topics = [];
  const text = body.replace(TOPIC_RE, (_, t) => { topics.push(t); return ''; }).replace(/\s{2,}/g, ' ').trim();
  return { text, topics };
}

function timeAgo(dateStr) {
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export default function PostCard({ post, myEmail }) {
  const [reactions, setReactions] = useState(post.reactions || { fire: 0, gem: 0, clap: 0, wow: 0 });
  const [myReaction, setMyReaction] = useState(
    (post.reactors || []).find(r => r.email === myEmail)?.type || null
  );
  const [comments, setComments] = useState(post.comments || []);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [busy, setBusy] = useState(false);

  const react = async (type) => {
    if (busy) return;
    setBusy(true);
    const prevR = { ...reactions };
    const prevMy = myReaction;
    // optimistic
    if (myReaction === type) {
      setReactions(r => ({ ...r, [type]: Math.max(0, (r[type] || 0) - 1) }));
      setMyReaction(null);
    } else {
      if (myReaction) setReactions(r => ({ ...r, [myReaction]: Math.max(0, (r[myReaction] || 0) - 1) }));
      setReactions(r => ({ ...r, [type]: (r[type] || 0) + 1 }));
      setMyReaction(type);
    }
    try {
      const res = await base44.functions.invoke('interactPost', {
        post_id: post.id, action: 'react', reaction_type: type,
      });
      setReactions(res.data.reactions);
      setMyReaction(res.data.myReaction);
    } catch {
      setReactions(prevR);
      setMyReaction(prevMy);
    } finally {
      setBusy(false);
    }
  };

  const submitComment = async () => {
    const text = commentText.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      const res = await base44.functions.invoke('interactPost', {
        post_id: post.id, action: 'comment', comment_body: text,
      });
      setComments(res.data.comments);
      setCommentText('');
    } finally {
      setBusy(false);
    }
  };

  const isFind = post.post_type === 'find_share';
  const rarityColor = RARITY_COLORS[post.rarity] || RARITY_COLORS.common;
  const { text: bodyText, topics } = parseBody(post.body);

  return (
    <GlassPanel className="p-0 overflow-hidden">
      {/* Author */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
          style={{ background: 'hsla(270,60%,40%,0.3)', border: '1px solid hsla(270,60%,60%,0.3)', color: 'hsl(280,80%,88%)' }}>
          {(post.author_name || 'R')[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white truncate">{post.author_name}</div>
          <div className="text-[10px] text-white/35">
            {timeAgo(post.created_date)} ago{post.location_label ? ` · ${post.location_label}` : ''}
          </div>
        </div>
        {isFind && (
          <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full"
            style={{ color: rarityColor, border: `1px solid ${rarityColor}44`, background: `${rarityColor}11` }}>
            {post.rarity}
          </span>
        )}
      </div>

      {bodyText && (
        <p className="px-4 pb-3 text-sm text-white/75 leading-relaxed whitespace-pre-wrap">{bodyText}</p>
      )}

      {topics.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pb-3">
          {topics.map((t) => (
            <span key={t} className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-1 rounded-full"
              style={{ color: 'hsl(195,100%,75%)', background: 'hsla(195,80%,40%,0.12)', border: '1px solid hsla(195,80%,55%,0.25)' }}>
              #{t}
            </span>
          ))}
        </div>
      )}

      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.mineral_name ? `${post.mineral_name} find` : `Post image by ${post.author_name || 'community member'}`}
          className="w-full max-h-96 object-cover"
        />
      )}

      {isFind && post.mineral_name && (
        <div className="mx-4 mb-3 p-3 rounded-xl flex items-center gap-3"
          style={{ background: `${rarityColor}0d`, border: `1px solid ${rarityColor}33` }}>
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg" style={{ background: `${rarityColor}1a` }}>
            <span aria-hidden="true">🪨</span>
          </div>
          <div>
            <div className="text-sm font-bold text-white">{post.mineral_name}</div>
            <div className="text-[10px] text-white/40">Shared find</div>
          </div>
        </div>
      )}

      {/* Reactions */}
      <div className="flex items-center gap-1.5 px-4 pb-3">
        {REACTIONS.map(r => {
          const count = reactions[r.type] || 0;
          const active = myReaction === r.type;
          return (
            <button
              key={r.type}
              type="button"
              onClick={() => react(r.type)}
              disabled={busy}
              aria-pressed={active}
              aria-label={`React with ${r.type}${count > 0 ? `, ${count} reaction${count === 1 ? '' : 's'}` : ''}`}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
              style={{
                background: active ? `${rarityColor}22` : 'hsla(255,20%,20%,0.5)',
                border: `1px solid ${active ? `${rarityColor}66` : 'hsla(255,20%,40%,0.2)'}`,
              }}
            >
              <span aria-hidden="true" className="text-sm">{r.emoji}</span>
              {count > 0 && <span className="text-[10px] font-bold text-white/60">{count}</span>}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setShowComments(s => !s)}
          aria-expanded={showComments}
          aria-label={`${comments.length} comment${comments.length === 1 ? '' : 's'}. ${showComments ? 'Hide' : 'Show'} comments`}
          className="ml-auto flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-white/50 hover:text-white/80 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
          style={{ background: 'hsla(255,20%,20%,0.5)', border: '1px solid hsla(255,20%,40%,0.2)' }}
        >
          <MessageCircle size={13} />
          <span className="text-[10px] font-bold">{comments.length}</span>
        </button>
      </div>

      {/* Comments */}
      {showComments && (
        <div className="px-4 pb-4 space-y-2 border-t border-white/5 pt-3">
          {comments.map((c, i) => (
            <div key={i} className="flex gap-2">
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0"
                style={{ background: 'hsla(195,60%,40%,0.3)', color: 'hsl(195,100%,82%)' }}>
                {(c.name || 'R')[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-[11px] font-bold text-white/80">{c.name}</span>
                <span className="text-[11px] text-white/70 ml-1.5">{c.body}</span>
              </div>
            </div>
          ))}
          <div className="flex items-center gap-2 pt-1">
            <input value={commentText} onChange={e => setCommentText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitComment()}
              placeholder="Add a comment…" disabled={busy}
              className="flex-1 text-[11px] text-white/80 placeholder-white/25 outline-none px-2 py-1.5 rounded-lg"
              style={{ background: 'hsla(255,20%,18%,0.6)', border: '1px solid hsla(255,20%,40%,0.2)' }} />
            <button
              type="button"
              onClick={submitComment}
              disabled={busy || !commentText.trim()}
              aria-label="Send comment"
              className="text-amethyst-glow disabled:opacity-30 transition active:scale-90 p-1.5 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
            >
              {busy ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
            </button>
          </div>
        </div>
      )}
    </GlassPanel>
  );
}