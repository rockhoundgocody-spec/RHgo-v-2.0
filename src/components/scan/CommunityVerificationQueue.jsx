import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Users, ThumbsUp, ThumbsDown, HelpCircle, ChevronRight, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  buildCommunityVoteUpdate,
  SUGGESTION_MAX_LENGTH,
  TIP_MAX_LENGTH,
} from './communityVerification';

/**
 * Shows low-confidence finds that need community votes.
 * Voters see the image and AI guess; tap agree / disagree / suggest alternate.
 */
export default function CommunityVerificationQueue({ userEmail }) {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState(null);
  const [suggestion, setSuggestion] = useState('');
  const [tip, setTip] = useState('');
  const [voted, setVoted] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [voteError, setVoteError] = useState('');
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (!userEmail) return;
    base44.entities.SpecimenVerification
      .filter({ status: 'pending' }, '-created_date', 10)
      .then((items) => {
        // Don't show user their own specimens
        setQueue(items.filter((i) => i.owner_email !== userEmail));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [userEmail]);

  const handleVote = async (item, voteType) => {
    if (voted[item.id] || submittingId) return;

    setSubmittingId(item.id);
    setVoteError('');
    try {
      const vote = buildCommunityVoteUpdate({ item, userEmail, voteType, suggestion, tip });
      await base44.entities.SpecimenVerification.update(item.id, vote.update);
      setVoted((current) => ({ ...current, [item.id]: vote.voteType }));
      setSuggestion('');
      setTip('');
      setActiveId(null);
      setTimeout(() => setQueue((current) => current.filter((entry) => entry.id !== item.id)), 600);
    } catch {
      setVoteError('Your vote could not be saved. Please try again.');
    } finally {
      setSubmittingId(null);
    }
  };

  if (loading) return null;
  if (!queue.length) return null;

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, hsla(215,60%,12%,0.9), hsla(220,55%,8%,0.95))',
        border: '1px solid hsla(195,100%,60%,0.2)',
      }}>
      {/* Header */}
      <div className="flex items-center gap-2.5 px-4 py-3"
        style={{ borderBottom: '1px solid hsla(195,100%,60%,0.1)' }}>
        <Users size={14} style={{ color: 'hsl(195,100%,70%)' }} />
        <div>
          <div className="text-[11px] font-bold tracking-[0.15em] uppercase text-hud-cyan">
            Community Verification
          </div>
          <div className="text-[9px] text-white/30">{queue.length} find{queue.length !== 1 ? 's' : ''} need your eyes</div>
        </div>
      </div>

      {/* Queue items */}
      <div className="divide-y divide-white/5">
        {queue.slice(0, 3).map((item) => (
          <div key={item.id} className="p-4">
            <div className="flex gap-3">
              {/* Specimen image */}
              {item.specimen_image_url && (
                <img
                  src={item.specimen_image_url}
                  alt="Specimen"
                  loading="lazy"
                  decoding="async"
                  className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  style={{ border: '1px solid hsla(195,80%,50%,0.2)' }}
                />
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[12px] font-semibold text-white/80 truncate">{item.original_ai_guess}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-[9px] text-white/30 uppercase tracking-[0.15em]">AI Confidence</span>
                  <span className="text-[10px] font-mono text-amber-400/70">
                    {item.original_confidence ? `${Math.round(item.original_confidence * 100)}%` : '—'}
                  </span>
                </div>
                {item.beach_name && (
                  <div className="text-[9px] text-white/25 mt-0.5">{item.beach_name}</div>
                )}
                {item.wet_dry && (
                  <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[8px] uppercase tracking-wider"
                    style={{
                      background: item.wet_dry === 'wet' ? 'hsla(195,80%,40%,0.2)' : 'hsla(40,80%,45%,0.2)',
                      color: item.wet_dry === 'wet' ? 'hsl(195,100%,70%)' : 'hsl(40,100%,70%)',
                      border: `1px solid ${item.wet_dry === 'wet' ? 'hsla(195,100%,60%,0.3)' : 'hsla(40,100%,60%,0.3)'}`,
                    }}>
                    {item.wet_dry}
                  </span>
                )}
              </div>
            </div>

            {/* Vote buttons */}
            <AnimatePresence>
              {voted[item.id] ? (
                <motion.div
                  role="status"
                  initial={reducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }}
                  className="mt-3 flex items-center gap-2 text-[11px] text-emerald-400/70"
                >
                  <CheckCircle size={13} /> Vote recorded — thanks!
                </motion.div>
              ) : activeId === item.id ? (
                <motion.div
                  id={`verification-vote-${item.id}`}
                  aria-busy={submittingId === item.id}
                  initial={reducedMotion ? false : { opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                  className="mt-3 space-y-2"
                >
                  <input
                    type="text"
                    aria-label="Suggested mineral name"
                    maxLength={SUGGESTION_MAX_LENGTH}
                    autoComplete="off"
                    placeholder="Suggest mineral name (optional)"
                    value={suggestion}
                    onChange={(e) => setSuggestion(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[11px] text-white/70 bg-white/5 border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
                  />
                  <input
                    type="text"
                    aria-label="Community field tip"
                    maxLength={TIP_MAX_LENGTH}
                    autoComplete="off"
                    placeholder="Field tip for the community (optional)"
                    value={tip}
                    onChange={(e) => setTip(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-[11px] text-white/70 bg-white/5 border border-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
                  />
                  <div className="flex gap-2">
                    <button type="button" disabled={Boolean(submittingId)} onClick={() => handleVote(item, 'agree')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-emerald-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
                      style={{ background: 'hsla(145,70%,40%,0.15)', border: '1px solid hsla(145,70%,50%,0.3)' }}>
                      <ThumbsUp size={12} /> Agree
                    </button>
                    <button type="button" disabled={Boolean(submittingId)} onClick={() => handleVote(item, 'disagree')}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-semibold uppercase tracking-wider text-rose-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
                      style={{ background: 'hsla(0,70%,50%,0.12)', border: '1px solid hsla(0,70%,55%,0.3)' }}>
                      <ThumbsDown size={12} /> Disagree
                    </button>
                    <button type="button" disabled={Boolean(submittingId)} onClick={() => handleVote(item, 'unsure')}
                      aria-label="Unsure or need more information"
                      className="flex items-center justify-center px-2.5 py-2 rounded-lg text-amber-400 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
                      style={{ background: 'hsla(40,80%,50%,0.12)', border: '1px solid hsla(40,80%,55%,0.3)' }}>
                      <HelpCircle size={12} />
                    </button>
                  </div>
                </motion.div>
              ) : (
                <button
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  aria-expanded={activeId === item.id}
                  aria-controls={`verification-vote-${item.id}`}
                  className="mt-3 w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[10px] font-semibold uppercase tracking-[0.18em] text-hud-cyan/70 hover:text-hud-cyan transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
                  style={{ background: 'hsla(195,80%,40%,0.1)', border: '1px solid hsla(195,100%,60%,0.15)' }}>
                  Vote on this find <ChevronRight size={11} />
                </button>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
      {voteError && <p role="alert" className="px-4 pb-3 text-xs text-rose-300">{voteError}</p>}
    </div>
  );
}
