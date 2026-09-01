/**
 * ReferralEngine — "Invite to Evolve" gamified referral panel.
 * Generates a shareable referral code, shows referral stats,
 * and displays companion evolution milestones from successful invites.
 */
import React, { useState, useEffect, useCallback } from 'react';
import { base44 } from '@/api/base44Client';
import { Gift, Users, Sparkles, Copy, Check, TrendingUp, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ReferralEngine({ companion }) {
  const [referralCode, setReferralCode] = useState(null);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalXpAwarded: 0 });
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const res = await base44.functions.invoke('processReferral', { action: 'stats' });
      setStats(res.data || { total: 0, completed: 0, pending: 0, totalXpAwarded: 0 });
      if (res.data?.referrals?.length > 0) {
        setReferralCode(res.data.referrals[0].referral_code);
      }
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  const createReferral = async () => {
    setCreating(true);
    try {
      const res = await base44.functions.invoke('processReferral', { action: 'create' });
      if (res.data?.referral?.referral_code || res.data?.referralCode) {
        setReferralCode(res.data.referral?.referral_code || res.data.referralCode);
        loadStats();
      }
    } catch {}
    setCreating(false);
  };

  const copyLink = () => {
    if (!referralCode) return;
    const link = `${window.location.origin}/register?ref=${referralCode}`;
    navigator.clipboard?.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const companionLevel = companion?.level || 1;
  const nextMilestone = Math.ceil((companionLevel + 1) / 2) * 2; // every 2 referrals = 1 evolution
  const progressToNext = stats.completed > 0 ? (stats.completed % 2) / 2 * 100 : 0;

  return (
    <div className="rounded-2xl p-4"
      style={{
        background: 'linear-gradient(135deg, hsla(280,60%,20%,0.4) 0%, hsla(265,50%,12%,0.6) 100%)',
        border: '1px solid hsla(280,70%,60%,0.25)',
        boxShadow: '0 0 24px -8px hsla(280,80%,50%,0.2)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'hsla(280,80%,50%,0.2)', border: '1px solid hsla(280,80%,60%,0.3)' }}>
          <Gift size={15} className="text-amethyst-glow" />
        </div>
        <div>
          <h3 className="text-white font-bold text-sm">Invite to Evolve</h3>
          <p className="text-white/40 text-[10px]">Share Clover · grow your companion</p>
        </div>
      </div>

      {/* Companion evolution progress */}
      <div className="mb-3 px-3 py-2.5 rounded-xl"
        style={{ background: 'hsla(265,40%,15%,0.5)', border: '1px solid hsla(270,40%,40%,0.2)' }}>
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5">
            <Heart size={11} className="text-rose-400" />
            <span className="text-white/60 text-[10px] font-semibold">
              {companion?.name || 'Clover'} · Level {companionLevel}
            </span>
          </div>
          <span className="text-amethyst-glow text-[10px] font-mono">
            {stats.completed}/{nextMilestone} to evolve
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'hsla(255,30%,20%,0.6)' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressToNext}%` }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, hsl(280,80%,60%), hsl(295,90%,70%))' }}
          />
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <StatBox value={stats.completed} label="Invited" icon={Users} color="#34d399" />
        <StatBox value={stats.pending} label="Pending" icon={Sparkles} color="#fbbf24" />
        <StatBox value={stats.totalXpAwarded} label="XP Earned" icon={TrendingUp} color="#c084fc" />
      </div>

      {/* Referral code / share */}
      {referralCode ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
            style={{ background: 'hsla(255,20%,16%,0.6)', border: '1px solid hsla(255,20%,30%,0.3)' }}>
            <span className="text-amethyst-glow font-mono text-xs font-bold flex-1 truncate">{referralCode}</span>
            <button
              onClick={copyLink}
              aria-label="Copy referral link"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition active:scale-95"
              style={{ background: copied ? 'hsla(150,70%,40%,0.3)' : 'hsla(280,70%,50%,0.25)', color: copied ? '#34d399' : '#e0b0ff' }}
            >
              {copied ? <Check size={11} /> : <Copy size={11} />}
              {copied ? 'Copied' : 'Copy'}
            </button>
          </div>
          <p className="text-white/35 text-[10px] text-center leading-relaxed">
            Each friend who joins earns your companion <span className="text-amethyst-glow font-semibold">+50 XP</span> and a mood boost.
          </p>
        </div>
      ) : (
        <button
          onClick={createReferral}
          disabled={creating || loading}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition active:scale-95 disabled:opacity-50"
          style={{ background: 'linear-gradient(135deg, hsl(280,70%,50%), hsl(265,75%,45%))', boxShadow: '0 4px 16px hsla(280,80%,50%,0.25)' }}
        >
          {creating ? 'Generating…' : 'Generate Invite Link'}
        </button>
      )}
    </div>
  );
}

function StatBox({ value, label, icon: Icon, color }) {
  return (
    <div className="flex flex-col items-center py-2 rounded-xl"
      style={{ background: `${color}12`, border: `1px solid ${color}25` }}>
      <Icon size={12} style={{ color }} />
      <span className="text-base font-black mt-0.5" style={{ color }}>{value}</span>
      <span className="text-[8px] uppercase tracking-wider opacity-60" style={{ color }}>{label}</span>
    </div>
  );
}