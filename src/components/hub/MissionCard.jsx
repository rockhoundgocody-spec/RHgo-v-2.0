import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

export default function MissionCard({ to, code, title, desc, icon: Icon, accent }) {
  return (
    <Link to={to} className="group block" style={{ transformStyle: 'preserve-3d' }}>
      <GlassPanel className="h-full transition-transform group-hover:scale-[1.02] group-hover:-translate-y-0.5">
        <div className="p-5 h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div
              className={`w-12 h-12 rounded-xl bg-gradient-to-br ${accent} flex items-center justify-center border border-white/10 shadow-inner`}
              style={{ boxShadow: 'inset 0 0 18px hsla(280,80%,50%,0.25)' }}
            >
              <Icon className="text-white" size={22} />
            </div>
            <ArrowUpRight
              size={16}
              className="text-amethyst/50 group-hover:text-amethyst group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition"
            />
          </div>
          <div className="text-[10px] font-mono uppercase tracking-[0.3em] text-hud-cyan/70 mb-1">
            {code}
          </div>
          <div className="text-white font-semibold text-lg leading-tight mb-1">{title}</div>
          <div className="text-white/55 text-xs leading-relaxed">{desc}</div>
        </div>
      </GlassPanel>
    </Link>
  );
}