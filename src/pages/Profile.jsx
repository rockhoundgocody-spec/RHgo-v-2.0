import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings, Shield, HelpCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout('/');
  };

  const menuItems = [
    { label: 'Settings', icon: Settings, action: () => navigate('/settings') },
    { label: 'Safety & Privacy', icon: Shield, action: () => {} },
    { label: 'Help & Feedback', icon: HelpCircle, action: () => navigate('/contact') },
  ];

  return (
    <div className="min-h-screen px-4 pt-6 pb-24 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-8">Profile</h1>

      {user && (
        <GlassPanel className="p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-amethyst/20 border border-amethyst/40 flex items-center justify-center">
              <span className="text-lg font-bold text-amethyst-glow">{user.full_name?.[0] || '?'}</span>
            </div>
            <div>
              <div className="text-lg font-bold text-white">{user.full_name}</div>
              <div className="text-sm text-white/60">{user.email}</div>
              <div className="text-xs text-amethyst/60 uppercase tracking-wide mt-1">{user.role}</div>
            </div>
          </div>
        </GlassPanel>
      )}

      {/* Menu */}
      <div className="space-y-2 mb-8">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition text-left"
            >
              <Icon size={16} className="text-amethyst/60" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition font-medium"
      >
        <LogOut size={16} /> Logout
      </button>

      {/* Legal */}
      <div className="mt-8 pt-6 border-t border-white/10 space-y-2 text-center text-xs text-white/40">
        <div><a href="#" className="hover:text-white/60 transition">Terms of Service</a></div>
        <div><a href="#" className="hover:text-white/60 transition">Privacy Policy</a></div>
        <div className="text-white/20 pt-2">Version 1.0 • Built for Field Intelligence</div>
      </div>
    </div>
  );
}