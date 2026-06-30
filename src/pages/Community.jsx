import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Users } from 'lucide-react';
import PostCard from '@/components/community/PostCard.jsx';
import PostComposer from '@/components/community/PostComposer.jsx';

const PAGE = 15;

export default function Community() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [myEmail, setMyEmail] = useState(null);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      const me = await base44.auth.me();
      if (me?.email) setMyEmail(me.email);
      const batch = await base44.entities.Post.list('-created_date', PAGE);
      const arr = batch || [];
      setPosts(arr);
      setHasMore(arr.length === PAGE);
    } catch {
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback(async () => {
    if (!posts.length) return;
    setLoadingMore(true);
    const oldest = posts[posts.length - 1]?.created_date;
    try {
      const batch = await base44.entities.Post.filter(
        { created_date: { $lt: oldest } },
        '-created_date',
        PAGE
      );
      const arr = batch || [];
      setPosts(prev => [...prev, ...arr]);
      setHasMore(arr.length === PAGE);
    } catch {
      setHasMore(false);
    } finally {
      setLoadingMore(false);
    }
  }, [posts]);

  useEffect(() => { loadInitial(); }, [loadInitial]);

  return (
    <div className="min-h-screen px-4 pt-6 pb-28 max-w-2xl mx-auto">
      <div className="flex items-center gap-2 mb-5">
        <Users size={20} className="text-amethyst-glow" />
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Community</h1>
          <p className="text-white/35 text-[10px] uppercase tracking-[0.18em]">Share finds · React · Connect</p>
        </div>
      </div>

      <div className="mb-4">
        <PostComposer onPosted={loadInitial} />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-amethyst-glow/50" />
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-4xl mb-3">🪨</div>
          <p className="text-white/50 text-sm font-semibold">No posts yet</p>
          <p className="text-white/30 text-xs mt-1">Be the first to share a find!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map(p => <PostCard key={p.id} post={p} myEmail={myEmail} />)}
          {hasMore && (
            <button onClick={loadMore} disabled={loadingMore}
              className="w-full py-3 text-center text-[11px] font-semibold text-amethyst-glow/70 hover:text-amethyst-glow transition">
              {loadingMore ? <Loader2 size={14} className="animate-spin inline" /> : 'Load more'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}