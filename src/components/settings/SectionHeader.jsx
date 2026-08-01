import React from 'react';

export default function SectionHeader({ icon: Icon, title, subtitle, iconColor = 'text-white/60', badge }) {
  return (
    <div className="flex items-start gap-3 mb-4">
      <Icon size={18} className={iconColor} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className="font-bold text-white">{title}</h3>
          {badge && (
            <span className="text-[9px] font-bold uppercase tracking-[0.15em] px-2 py-0.5 rounded-full"
              style={badge.style}>{badge.text}</span>
          )}
        </div>
        {subtitle && <p className="text-white/35 text-xs mt-0.5 leading-relaxed">{subtitle}</p>}
      </div>
    </div>
  );
}
