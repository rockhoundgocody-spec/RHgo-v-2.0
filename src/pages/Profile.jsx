import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, Settings, LogOut, Heart, TrendingUp, Award } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

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
        <GlassPanel className="p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-amethyst/20 border-2 border-amethyst/40 flex items-center justify-center">
            <User size={28} className="text-amethyst-glow" />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{user?.full_name || 'User'}</h1>
            <p className="text-white/50 text-sm">{user?.email}</p>
          </div>
        </GlassPanel>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        <GlassPanel className="p-4 text-center">
          <div className="text-xl font-bold text-amethyst-glow">{stats.findings}</div>
          <div className="text-xs text-white/50 mt-1">Findings</div>
        </GlassPanel>
        <GlassPanel className="p-4 text-center">
          <div className="text-xl font-bold text-emerald-400">{stats.badges}</div>
          <div className="text-xs text-white/50 mt-1">Badges</div>
        </GlassPanel>
        <GlassPanel className="p-4 text-center">
          <div className="text-xl font-bold text-hud-cyan">{user?.role === 'admin' ? 'ADM' : 'USR'}</div>
          <div className="text-xs text-white/50 mt-1">Role</div>
        </GlassPanel>
      </div>

      {/* Menu */}
      <div className="space-y-2 mb-8">
        <button
          onClick={() => navigate('/settings')}
          className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition"
        >
          <Settings size={18} />
          <span>Settings & Preferences</span>
        </button>
        <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition">
          <Heart size={18} />
          <span>Saved Sites & Favorites</span>
        </button>
        <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition">
          <TrendingUp size={18} />
          <span>Marketplace Activity</span>
        </button>
        <button className="w-full flex items-center gap-3 p-4 rounded-xl border border-white/10 text-white hover:bg-white/5 transition">
          <Award size={18} />
          <span>Achievements & Badges</span>
        </button>
      </div>

      {/* Danger zone */}
      <GlassPanel className="p-6 border border-rose-500/20">
        <h3 className="text-sm font-bold text-rose-300 mb-3">Account</h3>
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition font-semibold"
        >
          <LogOut size={16} /> Logout
        </button>
      </GlassPanel>
    </div>
  );
}