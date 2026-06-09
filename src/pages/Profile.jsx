import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, Settings, LogOut, Heart, TrendingUp, Award, Camera, Loader2, Swords, Trophy } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SkillsSection from '@/components/profile/SkillsSection.jsx';
import ProfileBadgeStrip from '@/components/badges/ProfileBadgeStrip.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ findings: 0, badges: 0 });
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [battleHistory, setBattleHistory] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [specimens, badges, profiles] = await Promise.all([
        base44.entities.Specimen.filter({ created_by: u.email }),
        base44.entities.Badge.filter({ owner_email: u.email }),
        base44.entities.PlayerProfile.filter({ owner_email: u.email }, '-created_date', 1),
      ]);
      setStats({ findings: specimens.length, badges: badges.length });
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
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-14 h-14 rounded-full bg-amethyst/15 border border-amethyst/30 flex items-center justify-center overflow-hidden relative group"
              aria-label="Upload avatar"
            >
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
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} aria-label="Avatar file input" />
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
      <div className="grid grid-cols-3 gap-3 mb-8">
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

      {/* Liquid Mineral Badges strip */}
      <div className="mb-8">
        <ProfileBadgeStrip />
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
          <div className="px-5 py-5 text-center text-white/30 text-xs">
            No battles yet — enable Chaos Mode on the Hub to fight!
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