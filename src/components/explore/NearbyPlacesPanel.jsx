import React, { useState } from 'react';
import { Fuel, Tent, Utensils, ShoppingBag, Hospital, ExternalLink } from 'lucide-react';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';

const CATEGORIES = [
  { type: 'gas_station', label: 'Gas',     icon: Fuel,        query: 'gas station' },
  { type: 'campground',  label: 'Camp',    icon: Tent,        query: 'campground' },
  { type: 'restaurant',  label: 'Food',    icon: Utensils,    query: 'restaurant' },
  { type: 'store',       label: 'Supply',  icon: ShoppingBag, query: 'hardware store' },
  { type: 'hospital',    label: 'Medical', icon: Hospital,    query: 'hospital urgent care' },
];

export default function NearbyPlacesPanel({ lat, lng }) {
  const [active, setActive] = useState('gas_station');

  const cat = CATEGORIES.find(c => c.type === active);

  // Build a Google Maps search URL — opens in browser, no API key needed
  const searchUrl = lat && lng
    ? `https://www.google.com/maps/search/${encodeURIComponent(cat.query)}/@${lat},${lng},13z`
    : `https://www.google.com/maps/search/${encodeURIComponent(cat.query)}`;

  return (
    <GlassPanel variant="hud">
      <HudFrame label="Nearby Resources">
        <div className="flex flex-wrap gap-1.5 mb-4">
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = c.type === active;
            return (
              <button
                key={c.type}
                onClick={() => setActive(c.type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] uppercase tracking-wider border transition ${
                  isActive
                    ? 'bg-hud-cyan/25 border-hud-cyan/60 text-hud glow-hud'
                    : 'bg-black/40 border-white/10 text-white/70 hover:text-white'
                }`}
              >
                <Icon size={12} />
                {c.label}
              </button>
            );
          })}
        </div>

        <a
          href={searchUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl border border-hud-cyan/40 bg-hud-cyan/10 text-hud-cyan text-xs uppercase tracking-[0.25em] hover:bg-hud-cyan/20 transition"
        >
          <ExternalLink size={13} />
          Search {cat.label} on Maps
        </a>

        {!lat && (
          <p className="text-white/40 text-[10px] text-center mt-2">
            Enable location for better results
          </p>
        )}
      </HudFrame>
    </GlassPanel>
  );
}