import React, { useState, useEffect, useRef } from 'react';
import { shareAchievement } from '@/lib/shareAchievement';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, Settings, LogOut, Heart, TrendingUp, Award, Camera, Loader2, Swords, Trophy, Share2, Check, AlertCircle } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SkillsSection from '@/components/profile/SkillsSection.jsx';
import Top3BadgesStrip from '@/components/badges/Top3BadgesStrip.jsx';
import LiquidMineralBadge from '@/components/badges/LiquidMineralBadge.jsx';
import { useBadgeAwarder } from '@/lib/useBadgeAwarder';
import RarityBadgeShowcase from '@/components/profile/RarityBadgeShowcase.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ findings: 0, badges: 0, rarityCounts: { common: 0, uncommon: 0, rare: 0, legendary: 0 } });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [battleHistory, setBattleHistory] = useState([]);
  const [shareState, setShareState] = useState(null); // null | 'copied' | 'error'
  const { earnedCodes, allBadges } = useBadgeAwarder();
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [specimens, badges, profiles] = await Promise.all([
        base44.entities.Specimen.filter({ created_by: u.email }),
        base44.entities.Badge.filter({ owner_email: u.email }),
        base44.entities.PlayerProfile.filter({ owner_email: u.email }, '-created_date', 1),
      ]);
      const rarityCounts = { common: 0, uncommon: 0, rare: 0, legendary: 0 };
      for (const x of specimens) { if (rarityCounts[x.rarity] != null) rarityCounts[x.rarity]++; }
      setStats({ findings: specimens.length, badges: badges.length, rarityCounts });
      if (profiles[0]?.avatar_url) setAvatarUrl(profiles[0].avatar_url);
      const battles = await base44.entities.BattleResult.filter({ owner_email: u.email }, '-created_date', 10).catch(() => []);
      setBattleHistory(battles);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setAvatarUrl(file_url);
      const me = await base44.auth.me();
      const profiles = await base44.entities.PlayerProfile.filter({ owner_email: me.email }, '-created_date', 1);
      if (profiles[0]) {
        await base44.entities.PlayerProfile.update(profiles[0].id, { avatar_url: file_url });
      }
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  const handleShareProfile = async () => {
    // Fetch XP from PlayerProfile for accurate rank
    let xp = 0;
    let rank = 'Rockhound';
    try {
      const profiles = await base44.entities.PlayerProfile.filter({ owner_email: user?.email }, '-created_date', 1);
      if (profiles[0]?.total_xp != null) xp = profiles[0].total_xp;
      const LEVEL_TITLES = ['Pebble Scout','Crystal Apprentice','Geode Guardian','Titan Rockhound','Legendary Specimen Hunter','Mythic Earth Wizard'];
      const level = Math.min(Math.floor(xp / 1200), LEVEL_TITLES.length - 1);
      rank = LEVEL_TITLES[level];
    } catch {}
    const result = await shareAchievement({ rank, xp, extra: `${stats.findings} finds · ${stats.badges} badges` });
    if (result === 'clipboard') { setShareState('copied'); setTimeout(() => setShareState(null), 2400); }
    else if (result === 'error') { setShareState('error'); setTimeout(() => setShareState(null), 2400); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-amethyst/20 border-t-amethyst-glow rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">
      {/* Profile header */}
      <div className="mb-8">
        <GlassPanel className="p-5 flex items-center gap-4">
          {/* Avatar with upload */}
          <div className="relative flex-shrink-0">
            <label
              className={`w-14 h-14 rounded-full bg-amethyst/15 border border-amethyst/30 flex items-center justify-center overflow-hidden relative group focus-within:outline-none focus-within:ring-2 focus-within:ring-amethyst-glow ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              aria-label="Upload avatar"
            >
              <input ref={fileInputRef} type="file" accept="image/*" className="sr-only" onChange={handleAvatarUpload} aria-label="Avatar file input" disabled={uploading} />
              {avatarUrl ? (
                <img src={avatarUrl} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <User size={24} className="text-amethyst-glow" />
              )}
              <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                {uploading
                  ? <Loader2 size={16} className="animate-spin text-white" />
                  : <Camera size={16} className="text-white" />}
              </div>
            </label>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{user?.full_name || 'Rockhound'}</h1>
            <p className="text-white/40 text-xs truncate mt-0.5">{user?.email}</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-[10px] text-amethyst-glow/70 hover:text-amethyst-glow mt-1 transition"
            >
              {uploading ? 'Uploading…' : 'Change avatar'}
            </button>
          </div>
        </GlassPanel>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <GlassPanel className="p-5 text-center">
          <div className="text-3xl font-bold text-amethyst-glow tabular-nums">{stats.findings}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1.5">Finds</div>
        </GlassPanel>
        <GlassPanel className="p-5 text-center cursor-pointer hover:bg-white/5 transition" onClick={() => navigate('/badges')}>
          <div className="text-3xl font-bold text-emerald-400 tabular-nums">{stats.badges}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1.5">Badges</div>
        </GlassPanel>
        <GlassPanel className="p-5 text-center">
          <div className="text-[13px] font-bold text-hud-cyan tracking-widest mt-1">{user?.role === 'admin' ? 'ADMIN' : 'MEMBER'}</div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-white/35 mt-1.5">Role</div>
        </GlassPanel>
      </div>

      {/* Rarity collection badges */}
      <RarityBadgeShowcase earnedCodes={earnedCodes} rarityCounts={stats.rarityCounts} />

      {/* Share challenge button */}
      <button
        onClick={handleShareProfile}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-bold uppercase tracking-wider transition active:scale-95 mb-8"
        style={{
          background: 'linear-gradient(135deg, hsla(195,80%,16%,0.7), hsla(265,60%,14%,0.7))',
          border: '1px solid hsla(195,80%,50%,0.3)',
          color: 'hsl(195,100%,82%)',
        }}
      >
        {shareState === 'copied'
          ? <><Check size={13} /> Challenge copied — paste it anywhere</>
          : shareState === 'error'
          ? <><AlertCircle size={13} /> Share failed — try again</>
          : <><Share2 size={13} /> Challenge a Friend</>}
      </button>

      {/* Menu */}
      <GlassPanel className="mb-8 divide-y divide-white/8">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 px-5 py-4 text-white/80 hover:text-white hover:bg-white/5 transition text-sm text-left rounded-t-2xl"
        >
          <Settings size={16} className="text-white/40 flex-shrink-0" />
          <span>Settings & Preferences</span>
        </button>
        <button className="w-full flex items-center gap-3 px-5 py-4 text-white/80 hover:text-white hover:bg-white/5 transition text-sm text-left">
          <Heart size={16} className="text-white/40 flex-shrink-0" />
          <span>Saved Sites & Favorites</span>
        </button>
        <button className="w-full flex items-center gap-3 px-5 py-4 text-white/80 hover:text-white hover:bg-white/5 transition text-sm text-left">
          <TrendingUp size={16} className="text-white/40 flex-shrink-0" />
          <span>Marketplace Activity</span>
        </button>
        <Link to="/badges" className="w-full flex items-center gap-3 px-5 py-4 text-white/80 hover:text-white hover:bg-white/5 transition text-sm text-left rounded-b-2xl">
          <Award size={16} className="text-white/40 flex-shrink-0" />
          <span>Achievements & Badges</span>
        </Link>
      </GlassPanel>

      {/* Achievements — 3D collectible badge grid */}
      <div className="mb-8">
        <style>{`
          @keyframes badge-float-spin {
            0%   { transform: translateY(0px)   rotateY(0deg); }
            25%  { transform: translateY(-5px)  rotateY(90deg); }
            50%  { transform: translateY(-2px)  rotateY(180deg); }
            75%  { transform: translateY(-6px)  rotateY(270deg); }
            100% { transform: translateY(0px)   rotateY(360deg); }
          }
          @keyframes badge-float-locked {
            0%,100% { transform: translateY(0px); }
            50%      { transform: translateY(-3px); }
          }
          @keyframes badge-pulse-glow {
            0%,100% { opacity: 0.4; transform: scale(0.9); }
            50%      { opacity: 0.9; transform: scale(1.25); }
          }
          @keyframes badge-halo-spin {
            from { transform: scale(1.5) rotate(0deg); }
            to   { transform: scale(1.5) rotate(360deg); }
          }
          .badge-collectible { perspective: 600px; }
          .badge-collectible-inner {
            transform-style: preserve-3d;
            transition: transform 0.3s ease, filter 0.3s ease;
          }
          .badge-collectible-inner.earned {
            animation: badge-float-spin 8s linear infinite;
          }
          .badge-collectible-inner.locked {
            animation: badge-float-locked 4s ease-in-out infinite;
          }
          .badge-collectible:active .badge-collectible-inner {
            transform: scale(0.92) !important;
          }
        `}</style>

        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/50">Liquid Mineral Codex</span>
          <Link to="/badges" className="text-[10px] text-amethyst-glow/70 hover:text-amethyst-glow transition">
            View all →
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {allBadges.map((b) => {
            const earned = earnedCodes.has(b.code);
            // Rarity-specific glow color
            const glowMap = {
              common: 'hsla(215,40%,65%,0.55)',
              uncommon: 'hsla(152,80%,50%,0.6)',
              rare: 'hsla(195,100%,60%,0.65)',
              epic: 'hsla(270,90%,72%,0.7)',
              legendary: 'hsla(45,100%,60%,0.8)',
            };
            const glowColor = glowMap[b.rarity] || glowMap.common;
            const animDelay = `${(allBadges.indexOf(b) % 5) * 0.6}s`;

            return (
              <Link
                key={b.code}
                to="/badges"
                className="badge-collectible flex flex-col items-center gap-2"
              >
                {/* Glow halo behind badge */}
                {earned && (
                  <div className="relative">
                    {/* Pulsing radial glow */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: `radial-gradient(circle, ${glowColor} 0%, transparent 65%)`,
                        animation: `badge-pulse-glow ${2.8 + (allBadges.indexOf(b) % 3) * 0.5}s ${animDelay} ease-in-out infinite`,
                      }}
                    />
                    {/* Spinning conic halo ring */}
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        background: `conic-gradient(from 0deg, transparent 60%, ${glowColor} 80%, transparent 100%)`,
                        animation: `badge-halo-spin ${3 + (allBadges.indexOf(b) % 3)}s linear infinite`,
                        opacity: 0.6,
                      }}
                    />
                    <div
                      className="badge-collectible-inner earned"
                      style={{
                        animationDelay: animDelay,
                        filter: `drop-shadow(0 0 10px ${glowColor}) drop-shadow(0 4px 16px ${glowColor})`,
                      }}
                    >
                      <LiquidMineralBadge badge={b} size={80} locked={false} />
                    </div>
                  </div>
                )}
                {!earned && (
                  <div
                    className={`badge-collectible-inner locked`}
                    style={{ animationDelay: animDelay }}
                  >
                    <LiquidMineralBadge badge={b} size={80} locked={true} />
                  </div>
                )}
                <div className="text-center">
                  <div className={`text-[9px] font-semibold leading-tight line-clamp-1 ${earned ? 'text-white/70' : 'text-white/25'}`}>
                    {b.title}
                  </div>
                  {earned && (
                    <div className="text-[8px] uppercase tracking-widest mt-0.5" style={{ color: glowColor }}>
                      earned ✓
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <SkillsSection />

      {/* Battle History */}
      <GlassPanel className="mb-8">
        <div className="flex items-center gap-3 px-5 pt-4 pb-3 border-b border-white/8">
          <Swords size={15} className="text-red-400 flex-shrink-0" />
          <span className="font-bold text-white text-sm">Battle History</span>
          <span className="ml-auto text-[10px] text-white/30">{battleHistory.length} battles</span>
        </div>
        {battleHistory.length === 0 ? (
          <div className="px-5 py-6 text-center">
            <p className="text-white/40 text-sm font-semibold">No battle records etched yet.</p>
            <p className="text-white/25 text-xs mt-1">Enable Chaos Mode on the Hub to start mineral battles.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {battleHistory.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3">
                <div className="w-8 h-8 rounded-full bg-red-900/30 border border-red-400/20 flex items-center justify-center flex-shrink-0">
                  <Trophy size={13} className="text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-semibold truncate">
                    {b.winner_mineral} <span className="text-white/30">beat</span> {b.opponent_mineral}
                  </div>
                  <div className="text-white/30 text-[10px] mt-0.5">
                    {b.battle_date ? new Date(b.battle_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                  </div>
                </div>
                <div className="text-yellow-400 text-xs font-bold">+{b.xp_awarded} XP</div>
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/25 text-rose-400/80 hover:text-rose-300 hover:bg-rose-500/8 transition text-sm font-medium"
      >
        <LogOut size={15} /> Sign out
      </button>
    </div>
  );
}