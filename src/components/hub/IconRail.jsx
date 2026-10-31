import React from 'react';
import { Link } from 'react-router-dom';
import { ScanLine, Map, Gem, Target, Users, Mic } from 'lucide-react';

const ITEMS = {
  left: [
    { icon: ScanLine, label: 'Scan', to: '/scan' },
    { icon: Map, label: 'Map', to: '/explore' },
    { icon: Gem, label: 'Geo-DEX', to: '/collection' },
  ],
  right: [
    { icon: Target, label: 'Quests', to: '/quests' },
    { icon: Users, label: 'Community', to: '/community' },
    { icon: Mic, label: 'Clover', to: '/companion' },
  ],
};

export default function IconRail({ side }) {
  return (
    <nav aria-label={`${side} shortcuts`} className="flex flex-col items-center justify-center gap-4 h-full w-full relative z-10">
      {ITEMS[side].map(({ icon: Icon, label, to }) => (
        <Link key={to} to={to}
          className="group flex flex-col items-center gap-1.5 w-[88px] py-3 rounded-2xl backdrop-blur-md transition-all hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#9FE8D0]"
          style={{ background: 'hsla(240,30%,10%,0.6)', border: '1px solid rgba(159,232,208,0.2)' }}>
          <span className="w-11 h-11 rounded-xl flex items-center justify-center transition-shadow group-hover:shadow-[0_0_18px_rgba(159,232,208,.45)]"
            style={{ background: 'rgba(159,232,208,0.1)', border: '1px solid rgba(159,232,208,0.35)' }}>
            <Icon className="w-5 h-5" style={{ color: '#9FE8D0' }} />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/80">{label}</span>
        </Link>
      ))}
    </nav>
  );
}