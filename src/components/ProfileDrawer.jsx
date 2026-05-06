import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, Settings, LogOut, ChevronRight, X } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function ProfileDrawer() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then((u) => setUser(u));
  }, []);

  const handleLogout = async () => {
    setIsOpen(false);
    await base44.auth.logout('/');
  };

  const menuItems = [
    { label: 'Profile', icon: User, action: () => { navigate('/profile'); setIsOpen(false); } },
    { label: 'Settings', icon: Settings, action: () => { navigate('/settings'); setIsOpen(false); } },
  ];

  return (
    <>
      {/* Drawer trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-amethyst/20 border border-amethyst/40 text-amethyst-glow hover:bg-amethyst/30 transition"
        title={user?.full_name}
      >
        <User size={18} />
      </button>

      {/* Drawer overlay and panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-gradient-to-b from-amethyst-deep/40 to-black border-l border-amethyst/20 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
              <h2 className="text-lg font-bold text-white">Account</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-lg transition"
              >
                <X size={18} className="text-white/60" />
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="p-6 border-b border-white/10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-amethyst/20 border border-amethyst/40 flex items-center justify-center">
                    <User size={20} className="text-amethyst-glow" />
                  </div>
                  <div>
                    <div className="font-semibold text-white">{user.full_name}</div>
                    <div className="text-xs text-white/50">{user.email}</div>
                  </div>
                </div>
                {user.role && (
                  <div className="inline-block px-3 py-1 rounded-full bg-amethyst/20 border border-amethyst/30 text-xs text-amethyst-glow font-mono uppercase tracking-wider">
                    {user.role}
                  </div>
                )}
              </div>
            )}

            {/* Menu items */}
            <div className="p-4 space-y-2">
              {menuItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={i}
                    onClick={item.action}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/10 transition text-white group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon size={18} className="text-amethyst/60 group-hover:text-amethyst" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </div>
                    <ChevronRight size={16} className="text-white/30 group-hover:text-white/60" />
                  </button>
                );
              })}
            </div>

            {/* Logout */}
            <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 transition font-semibold text-sm"
              >
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}