import React, { useEffect, useState } from 'react';
import { CloudLightning, Wind, X, Waves } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useBannerSlot } from '@/lib/bannerMutex';

const GL_BEACHES = [
  { name: 'Whitefish Point', lat: 46.77, lng: -84.96 },
  { name: 'Grand Marais', lat: 46.67, lng: -85.98 },
  { name: 'Eagle River Beach', lat: 47.41, lng: -88.31 },
  { name: 'Petoskey', lat: 45.37, lng: -84.95 },
  { name: 'Leland', lat: 45.03, lng: -85.76 },
  { name: 'Sleeping Bear Dunes', lat: 44.87, lng: -86.03 },
  { name: 'Ludington', lat: 43.95, lng: -86.45 },
];

const STORAGE_KEY = 'rh_storm_dismissed';

export default function StormWindowBanner() {
  const [alert, setAlert] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const { tryAcquire, release } = useBannerSlot('storm');

  useEffect(() => {
    // Check if dismissed today
    const last = localStorage.getItem(STORAGE_KEY);
    if (last && new Date() - new Date(last) < 86400000) {
      setDismissed(true);
      return;
    }

    // Get user location, find nearest GL beach
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;

        // Find nearest beach within ~200km
        let nearest = null;
        let minDist = Infinity;
        for (const beach of GL_BEACHES) {
          const dist = Math.sqrt((beach.lat - lat) ** 2 + (beach.lng - lng) ** 2);
          if (dist < minDist) { minDist = dist; nearest = beach; }
        }
        if (!nearest || minDist > 3) return; // ~200km threshold

        // Fetch Open-Meteo weather (free, no key needed)
        try {
          const url = `https://api.open-meteo.com/v1/forecast?latitude=${nearest.lat}&longitude=${nearest.lng}&current=wind_speed_10m,weather_code&wind_speed_unit=mph`;
          const res = await fetch(url);
          const data = await res.json();
          const wind = data?.current?.wind_speed_10m || 0;
          const code = data?.current?.weather_code || 0;

          // Storm codes: 51-82 (precipitation), 95-99 (thunderstorm)
          const isStormy = (code >= 51 && code <= 82) || code >= 95 || wind >= 20;
          // Recent storm = codes 0-3 (clear) but wind still elevated post-storm
          const isPostStorm = (code <= 3 && wind >= 15);

          if (isStormy || isPostStorm) {
            const acquired = tryAcquire();
            if (!acquired) return; // another banner is showing
            setAlert({
              beach: nearest.name,
              wind: Math.round(wind),
              type: isStormy ? 'active' : 'post',
              message: isStormy
                ? `Storm conditions at ${nearest.name} — fresh specimens washing up now`
                : `Post-storm window open at ${nearest.name} — prime hunting conditions`,
            });
          }
        } catch {}
      },
      () => {},
      { timeout: 8000 }
    );
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    release();
    setDismissed(true);
  };

  if (dismissed || !alert) return null;

  const isActive = alert.type === 'active';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -12, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-md mx-auto px-4 mb-3"
      >
        <div className="relative rounded-2xl px-4 py-3 flex items-start gap-3"
          style={{
            background: isActive
              ? 'linear-gradient(135deg, hsla(195,80%,12%,0.95), hsla(210,70%,8%,0.98))'
              : 'linear-gradient(135deg, hsla(145,60%,10%,0.95), hsla(150,55%,7%,0.98))',
            border: `1px solid ${isActive ? 'hsla(195,100%,55%,0.35)' : 'hsla(145,70%,50%,0.3)'}`,
            boxShadow: `0 0 24px ${isActive ? 'hsla(195,100%,50%,0.12)' : 'hsla(145,80%,50%,0.1)'}`,
          }}>
          {/* Icon */}
          <div className="mt-0.5 flex-shrink-0">
            {isActive
              ? <CloudLightning size={18} style={{ color: 'hsl(195,100%,70%)' }} />
              : <Waves size={18} style={{ color: 'hsl(145,80%,65%)' }} />
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold uppercase tracking-[0.15em]"
              style={{ color: isActive ? 'hsl(195,100%,72%)' : 'hsl(145,80%,65%)' }}>
              {isActive ? '⚡ Storm Window Alert' : '🌊 Post-Storm Hunt Window'}
            </div>
            <p className="text-[11px] text-white/55 mt-0.5 leading-relaxed">{alert.message}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[9px] text-white/30 uppercase tracking-[0.15em]">
                <Wind size={9} /> {alert.wind} mph
              </span>
              <span className="text-[9px] text-white/25 uppercase tracking-[0.15em]">
                Agate · Basalt · Copper ore primed
              </span>
            </div>
          </div>

          <button onClick={dismiss} className="flex-shrink-0 text-white/20 hover:text-white/50 transition-colors mt-0.5">
            <X size={14} />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}