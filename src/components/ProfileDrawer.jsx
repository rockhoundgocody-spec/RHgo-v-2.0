import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { User, Settings, LogOut, ChevronRight, X } from 'lucide-react';
import { useFocusTrap } from '@/lib/useFocusTrap';

function DrawerHeader({ onClose }) {
  return (
    <div className="flex items-center justify-between p-6 border-b border-white/10">
      <h2 id="profile-drawer-title" className="text-lg font-bold text-white">Account</h2>
      <button
        type="button"
        data-profile-drawer-close
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-lg transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
        aria-label="Close drawer"
      >
        <X size={18} className="text-white/60" />
      </button>
    </div>
  );
}

function UserInfoSection({ user }) {
  if (!user) return null;

  return (
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
  );
}

function MenuList({ menuItems }) {
  return (
    <div className="p-4 border-b border-white/10 space-y-1">
      {menuItems.map((item) => {
        const Icon = item.icon;
        return (
          <button
            key={item.label}
            type="button"
            onClick={item.action}
            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition text-white/80 hover:text-white group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
          >
            <div className="flex items-center gap-3">
              <Icon size={18} className="text-amethyst-glow" />
              <span className="font-medium text-sm">{item.label}</span>
            </div>
            <ChevronRight size={16} className="text-white/40 group-hover:text-white/80 transition" />
          </button>
        );
      })}
    </div>
  );
}

function LogoutButton({ onLogout }) {
  return (
    <div className="p-4">
      <button
        type="button"
        onClick={onLogout}
        className="w-full flex items-center gap-3 p-3 rounded-lg text-rose-400 hover:bg-rose-500/10 transition font-medium text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
      >
        <LogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
}

export default function ProfileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const drawerRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    let active = true;
    base44.auth
      .me()
      .then((data) => {
        if (active) setUser(data);
      })
      .catch(() => {
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);

  useFocusTrap(drawerRef, {
    active: isOpen,
    onClose: () => setIsOpen(false),
    onDeactivate: () => {
      triggerRef.current?.focus?.() || document.getElementById('profile-drawer-trigger')?.focus?.();
    },
  });

  const handleLogout = async () => {
    setIsOpen(false);
    await base44.auth.logout('/');
  };

  const menuItems = [
    {
      label: 'Profile',
      icon: User,
      action: () => {
        navigate('/profile');
        setIsOpen(false);
      },
    },
    {
      label: 'Settings',
      icon: Settings,
      action: () => {
        navigate('/settings');
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Drawer trigger button */}
      <button
        ref={triggerRef}
        id="profile-drawer-trigger"
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-10 h-10 rounded-full flex items-center justify-center bg-amethyst/20 border border-amethyst/40 text-amethyst-glow hover:bg-amethyst/30 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hud-cyan/50"
        title={user?.full_name}
        aria-label="Open account menu"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        aria-controls="profile-drawer"
      >
        <User size={18} />
      </button>

      {/* Drawer overlay and panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={drawerRef}
            id="profile-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-drawer-title"
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-sm bg-gradient-to-b from-amethyst-deep/40 to-black border-l border-amethyst/20 shadow-2xl"
          >
            <DrawerHeader onClose={() => setIsOpen(false)} />
            <UserInfoSection user={user} />
            <MenuList menuItems={menuItems} />
            <LogoutButton onLogout={handleLogout} />
          </div>
        </>
      )}
    </>
  );
}
