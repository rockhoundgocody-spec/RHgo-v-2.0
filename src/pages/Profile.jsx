import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, Settings, LogOut, Heart, TrendingUp, Award } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SkillsSection from '@/components/profile/SkillsSection.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ findings: 0, badges: 0 });

  useEffect(() => {
    base44.auth.me().then(async (u) => {
      setUser(u);
      const [specimens, badges] = await Promise.all([
        base44.entities.Specimen.filter({ created_by: u.email }),
        base44.entities.Badge.filter({ owner_email: u.email }),
      ]);
      setStats({ findings: specimens.length, badges: badges.length });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

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
          <div className="w-14 h-14 rounded-full bg-amethyst/15 border border-amethyst/30 flex items-center justify-center flex-shrink-0">
            <User size={24} className="text-amethyst-glow" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-white truncate">{user?.full_name || 'Rockhound'}</h1>
            <p className="text-white/40 text-xs truncate mt-0.5">{user?.email}</p>
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

      <SkillsSection />

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