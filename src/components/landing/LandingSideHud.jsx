import React from 'react';
import { motion } from 'framer-motion';
import { ScanLine, MapPin, Gem, ShieldCheck, Mic, WifiOff } from 'lucide-react';

const SIDES = {
  left: [
    { icon: ScanLine, title: 'AI Scan', body: 'Photo in, field report out. Candidates ranked with honest confidence.' },
    { icon: ShieldCheck, title: 'Land Check', body: 'See land type and access rules before you pick anything up.' },
    { icon: WifiOff, title: 'Offline Field Kit', body: 'Maps and logging keep working when signal drops.' },
  ],
  right: [
    { icon: Gem, title: 'Geo-DEX', body: 'Every find logged with place, date, weather and moon phase.' },
    { icon: MapPin, title: 'Hotspots', body: 'Mapped collecting sites with permits, seasons and difficulty.' },
    { icon: Mic, title: 'Clover', body: 'Your voice field partner. Say "Hey Clover" and keep your hands free.' },
  ],
};

function HudCard({ icon: Icon, title, body, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: [0, -4, 0] }}
      transition={{ opacity: { duration: .6, delay }, y: { duration: 6, delay, repeat: Infinity, ease: 'easeInOut' } }}
      className="relative overflow-hidden rounded-2xl p-5 backdrop-blur-md"
      style={{ background: 'hsla(240,30%,10%,0.55)', border: '1px solid rgba(159,232,208,0.18)', boxShadow: '0 20px 50px -25px rgba(0,0,0,.9), inset 0 1px 0 rgba(255,255,255,.06)' }}
    >
      <motion.div aria-hidden className="absolute inset-x-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(159,232,208,.7), transparent)' }}
        animate={{ top: ['0%', '100%'] }} transition={{ duration: 4, delay, repeat: Infinity, ease: 'linear' }} />
      <div className="flex items-center gap-3 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(159,232,208,0.1)', border: '1px solid rgba(159,232,208,0.3)' }}>
          <Icon className="w-4 h-4" style={{ color: '#9FE8D0' }} />
        </div>
        <div className="text-white font-bold text-sm uppercase tracking-[0.18em]">{title}</div>
      </div>
      <p className="text-white/70 text-[13px] leading-relaxed">{body}</p>
    </motion.div>
  );
}

export default function LandingSideHud({ side }) {
  return (
    <aside className="flex flex-col justify-center gap-4 w-full relative z-10">
      {SIDES[side].map((c, i) => <HudCard key={c.title} {...c} delay={i * .4 + (side === 'right' ? .2 : 0)} />)}
    </aside>
  );
}