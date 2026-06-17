import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Gem, Zap, Map, Shield, Star, X, Flame, Crown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';

const FREE_FEATURES = [
  'AI mineral identification (5/day)',
  'Basic hotspot map',
  'Personal collection (up to 50)',
  'Daily quests',
];

const PRO_FEATURES = [
  { icon: Zap,    text: 'Unlimited AI mineral ID' },
  { icon: Map,    text: 'Full hotspot access — 1,200+ sites' },
  { icon: Gem,    text: 'Unlimited collection entries' },
  { icon: Star,   text: 'Exclusive rare mineral quests' },
  { icon: Flame,  text: 'Streak bonuses & XP multipliers' },
  { icon: Shield, text: 'Offline map packs' },
  { icon: Crown,  text: 'Pro badge on your profile' },
];

const PLANS = [
  { id: 'monthly', label: 'Monthly', price: '$4.99', period: '/mo', badge: null },
  { id: 'annual',  label: 'Annual',  price: '$2.99', period: '/mo', badge: 'Best Value · Save 40%' },
];

export default function Paywall() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState('annual');
  const [loading, setLoading]   = useState(false);

  const handleUpgrade = async () => {
    setLoading(true);
    base44.analytics.track({ eventName: 'paywall_upgrade_tapped', properties: { plan: selected } });
    // Placeholder — wire to your payment provider here
    setTimeout(() => {
      setLoading(false);
      alert('Payment integration coming soon! Check back shortly.');
    }, 800);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-4 pt-6 pb-16 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at top, hsl(265,55%,30%) 0%, hsl(250,28%,16%) 50%, hsl(245,22%,10%) 100%)' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle at 25% 70%, hsla(280,100%,55%,0.14) 0%, transparent 55%), radial-gradient(circle at 80% 20%, hsla(45,100%,60%,0.1) 0%, transparent 45%)' }} />

      {/* Close / back */}
      <div className="w-full max-w-md flex justify-end mb-2">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/35 hover:text-white/70 transition"
          style={{ background: 'hsla(255,30%,18%,0.6)', border: '1px solid hsla(255,30%,35%,0.25)' }}>
          <X size={16} />
        </button>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="text-center mb-8 max-w-md">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl mb-4"
          style={{ background: 'linear-gradient(135deg, hsla(45,100%,55%,0.25), hsla(40,90%,45%,0.15))', border: '1px solid hsla(45,100%,60%,0.4)', boxShadow: '0 0 32px hsla(45,100%,55%,0.2)' }}>
          <Crown size={28} style={{ color: 'hsl(45,100%,65%)' }} />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">
          Go <span style={{ color: 'hsl(45,100%,65%)', textShadow: '0 0 20px hsla(45,100%,55%,0.5)' }}>Pro</span>
        </h1>
        <p className="text-white/45 text-sm leading-relaxed">
          Unlock the full RockHound-GO experience — unlimited AI IDs, every hotspot, and exclusive quests.
        </p>
      </motion.div>

      {/* Plan toggle */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
        className="w-full max-w-md space-y-3 mb-6">
        {PLANS.map(plan => (
          <button key={plan.id} onClick={() => setSelected(plan.id)}
            className="w-full flex items-center justify-between px-5 py-4 rounded-2xl transition-all text-left"
            style={{
              background: selected === plan.id
                ? 'linear-gradient(135deg, hsla(45,100%,28%,0.4), hsla(40,90%,20%,0.5))'
                : 'hsla(255,28%,14%,0.7)',
              border: selected === plan.id
                ? '2px solid hsla(45,100%,58%,0.7)'
                : '1px solid hsla(255,30%,30%,0.25)',
              boxShadow: selected === plan.id ? '0 0 24px hsla(45,100%,55%,0.15)' : 'none',
            }}>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  border: selected === plan.id ? '2px solid hsl(45,100%,62%)' : '2px solid hsla(255,30%,40%,0.4)',
                  background: selected === plan.id ? 'hsl(45,100%,62%)' : 'transparent',
                }}>
                {selected === plan.id && <div className="w-2 h-2 rounded-full bg-black" />}
              </div>
              <div>
                <div className="text-white font-bold text-sm">{plan.label}</div>
                {plan.badge && (
                  <div className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full mt-0.5 inline-block"
                    style={{ background: 'hsla(45,100%,55%,0.2)', color: 'hsl(45,100%,68%)', border: '1px solid hsla(45,100%,55%,0.35)' }}>
                    {plan.badge}
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <span className="text-white font-black text-xl">{plan.price}</span>
              <span className="text-white/40 text-xs">{plan.period}</span>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Pro features */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }}
        className="w-full max-w-md rounded-3xl p-5 mb-6"
        style={{ background: 'hsla(255,28%,12%,0.8)', border: '1px solid hsla(270,50%,40%,0.2)' }}>
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/30 mb-4">Everything in Pro</div>
        <div className="space-y-3">
          {PRO_FEATURES.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: 'hsla(280,70%,50%,0.18)', border: '1px solid hsla(280,70%,55%,0.25)' }}>
                <Icon size={13} style={{ color: 'hsl(280,85%,78%)' }} />
              </div>
              <span className="text-white/80 text-sm">{text}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Free tier comparison */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, delay: 0.3 }}
        className="w-full max-w-md mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/20 mb-3 text-center">Free tier includes</div>
        <div className="grid grid-cols-2 gap-2">
          {FREE_FEATURES.map(f => (
            <div key={f} className="flex items-start gap-2 text-white/35 text-xs">
              <Check size={11} className="mt-0.5 shrink-0 text-white/25" />
              {f}
            </div>
          ))}
        </div>
      </motion.div>

      {/* CTA */}
      <div className="w-full max-w-md space-y-3 sticky bottom-6">
        <Button onClick={handleUpgrade} disabled={loading}
          className="w-full h-14 font-black text-base rounded-2xl text-white tracking-wide"
          style={{
            background: 'linear-gradient(135deg, hsl(45,100%,50%), hsl(35,100%,45%))',
            boxShadow: '0 8px 32px -4px hsla(45,100%,50%,0.5)',
          }}>
          {loading ? 'Processing…' : `Unlock Pro · ${PLANS.find(p => p.id === selected)?.price}/mo`}
        </Button>
        <Link to="/" className="block text-center text-white/25 text-xs hover:text-white/45 transition">
          Continue with free plan
        </Link>
        <p className="text-center text-white/15 text-[10px]">
          Cancel anytime · Secure payment · No hidden fees
        </p>
      </div>
    </div>
  );
}