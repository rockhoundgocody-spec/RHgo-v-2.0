import React, { useEffect, useState } from 'react';
import { Wind, Droplets, Eye, Waves, X, CloudRain, Sun, Cloud, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const WMO_LABELS = {
  0: { label: 'Clear', icon: Sun, color: '#fcd34d' },
  1: { label: 'Mostly Clear', icon: Sun, color: '#fcd34d' },
  2: { label: 'Partly Cloudy', icon: Cloud, color: '#94a3b8' },
  3: { label: 'Overcast', icon: Cloud, color: '#64748b' },
  45: { label: 'Foggy', icon: Cloud, color: '#94a3b8' },
  51: { label: 'Drizzle', icon: CloudRain, color: '#7dd3fc' },
  61: { label: 'Rain', icon: CloudRain, color: '#38bdf8' },
  71: { label: 'Snow', icon: Cloud, color: '#e2e8f0' },
  80: { label: 'Rain Showers', icon: CloudRain, color: '#38bdf8' },
  95: { label: 'Thunderstorm', icon: Zap, color: '#facc15' },
  99: { label: 'Severe Storm', icon: Zap, color: '#f87171' },
};

function getWeatherInfo(code) {
  return WMO_LABELS[code] || WMO_LABELS[Object.keys(WMO_LABELS).reverse().find(k => code >= +k)] || WMO_LABELS[0];
}

function beachHuntScore(wind, rain, wmo) {
  // Post-storm is prime hunting — moderate wind, no active rain
  if (wmo >= 95) return { score: 'Storm', color: '#f87171', tip: 'Active storm — stay safe, great tomorrow!' };
  if (wmo >= 61) return { score: 'Avoid', color: '#fb923c', tip: 'Active rain — wait for clearing.' };
  if (wind >= 25) return { score: 'Post-Storm', color: '#34d399', tip: 'High waves incoming — excellent beach finds!' };
  if (wind >= 12) return { score: 'Good', color: '#a3e635', tip: 'Breezy — fresh material on the shore.' };
  return { score: 'Prime', color: '#c084fc', tip: 'Calm & clear — ideal for scanning.' };
}

export default function WeatherPanel({ userLocation, hudMode, onClose }) {
  const [wx, setWx] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userLocation) return;
    setLoading(true);
    const { lat, lng } = userLocation;
    fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,wind_speed_10m,precipitation,weather_code,relative_humidity_2m,visibility&temperature_unit=fahrenheit&wind_speed_unit=mph`)
      .then(r => r.json())
      .then(d => { setWx(d.current); setLoading(false); })
      .catch(() => setLoading(false));
  }, [userLocation]);

  const panelBg = hudMode
    ? 'linear-gradient(135deg,hsla(215,80%,10%,.97),hsla(220,70%,7%,.99))'
    : 'linear-gradient(135deg,hsla(245,35%,10%,.97),hsla(240,28%,7%,.99))';
  const borderColor = hudMode ? 'hsla(195,100%,60%,.5)' : 'hsla(280,60%,55%,.4)';
  const accent = hudMode ? '#22d3ee' : '#c084fc';

  const wmoInfo = wx ? getWeatherInfo(wx.weather_code) : null;
  const hunt = wx ? beachHuntScore(wx.wind_speed_10m, wx.precipitation, wx.weather_code) : null;
  const WeatherIcon = wmoInfo?.icon || Cloud;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.22 }}
      className="rounded-2xl overflow-hidden"
      style={{
        background: panelBg,
        border: `1px solid ${borderColor}`,
        backdropFilter: 'blur(24px)',
        boxShadow: `0 8px 32px ${hudMode ? 'hsla(195,100%,50%,.15)' : 'hsla(265,80%,30%,.25)'}`,
      }}
    >
      <div className="px-4 py-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Waves size={13} style={{ color: accent }} />
            <span className="text-[10px] font-mono uppercase tracking-[.3em]" style={{ color: accent }}>
              Beach Conditions
            </span>
          </div>
          <button onClick={onClose} aria-label="Close" className="text-white/30 hover:text-white/60 transition focus-visible:ring-2 focus-visible:outline-none focus-visible:ring-white/50 rounded-sm">
            <X size={14} />
          </button>
        </div>

        {loading && (
          <div className="flex items-center gap-2 py-2">
            <div className="w-4 h-4 rounded-full border border-t-transparent animate-spin" style={{ borderColor: `${accent}40`, borderTopColor: accent }} />
            <span className="text-[11px] text-white/40">Fetching conditions…</span>
          </div>
        )}

        {!loading && !userLocation && (
          <p className="text-[11px] text-white/40 py-2">Enable location to see beach conditions.</p>
        )}

        {wx && wmoInfo && hunt && (
          <>
            {/* Main condition row */}
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${wmoInfo.color}18`, border: `1px solid ${wmoInfo.color}40` }}>
                <WeatherIcon size={20} style={{ color: wmoInfo.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-white font-bold text-base leading-tight">
                  {Math.round(wx.temperature_2m)}°F
                </div>
                <div className="text-[10px] text-white/40">{wmoInfo.label}</div>
              </div>
              {/* Hunt score pill */}
              <div className="text-center px-3 py-1.5 rounded-xl"
                style={{ background: `${hunt.color}15`, border: `1px solid ${hunt.color}40` }}>
                <div className="text-[8px] uppercase tracking-[.2em] text-white/40 mb-0.5">Hunt</div>
                <div className="text-[11px] font-bold" style={{ color: hunt.color }}>{hunt.score}</div>
              </div>
            </div>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <Metric icon={Wind} label="Wind" value={`${Math.round(wx.wind_speed_10m)} mph`} color={accent} />
              <Metric icon={Droplets} label="Humidity" value={`${Math.round(wx.relative_humidity_2m)}%`} color={accent} />
              <Metric icon={Eye} label="Visibility" value={`${(wx.visibility / 1609).toFixed(1)} mi`} color={accent} />
            </div>

            {/* Tip */}
            <div className="rounded-xl px-3 py-2" style={{ background: `${hunt.color}0e`, border: `1px solid ${hunt.color}22` }}>
              <p className="text-[10px] leading-relaxed" style={{ color: hunt.color }}>
                🪨 {hunt.tip}
              </p>
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}

function Metric({ icon: Icon, label, value, color }) {
  return (
    <div className="rounded-lg py-2 px-2 text-center" style={{ background: 'hsla(255,30%,12%,.6)', border: '1px solid hsla(255,30%,25%,.2)' }}>
      <Icon size={11} className="mx-auto mb-1" style={{ color }} />
      <div className="text-[11px] font-semibold text-white leading-none">{value}</div>
      <div className="text-[8px] text-white/35 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}