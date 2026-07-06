/**
 * Pricing.jsx — RockHound-GO Subscription Tiers
 *
 * Stripe configuration (set these in environment variables / secrets):
 *   VITE_STRIPE_FIELD_PRO_MONTHLY_PRICE_ID  — e.g. price_1XxxxxFieldProMonthly
 *   VITE_STRIPE_FAMILY_MONTHLY_PRICE_ID     — e.g. price_1XxxxxFamilyMonthly
 *   VITE_STRIPE_SUCCESS_URL                 — e.g. https://rhgo.base44.app/settings?upgrade=success
 *   VITE_STRIPE_CANCEL_URL                  — e.g. https://rhgo.base44.app/pricing
 *
 * When Stripe is connected: replace the handleUpgrade placeholder below with
 *   a call to your createCheckoutSession backend function.
 *
 * Cross-domain: rhgo.base44.app and rhgo2.base44.app share the same backend.
 * Subscriptions stored in the Subscription entity are accessible on both.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { appParams } from '@/lib/app-params';

// ─── STRIPE PRICE IDs ─────────────────────────────────────────────────────
const STRIPE_CONFIG = {
  fieldPro:  { priceId: appParams.stripeFieldProPriceId, label: 'Field Pro' },
  family:    { priceId: appParams.stripeFamilyPriceId, label: 'Family' },
  successUrl: appParams.stripeSuccessUrl,
  cancelUrl:  appParams.stripeCancelUrl,
};
// ─────────────────────────────────────────────────────────────────────────

const TIERS = [
  {
    id: 'free',
    name: 'Free Explorer',
    price: '$0',
    period: 'forever free',
    tagline: 'Start discovering.',
    color: '#94a3b8',
    bg: 'hsla(215,20%,14%,0.7)',
    border: 'hsla(215,20%,35%,0.25)',
    cta: 'Start Free',
    ctaStyle: { background: 'hsla(215,20%,25%,0.7)', border: '1px solid hsla(215,20%,45%,0.3)', color: '#94a3b8' },
    features: [
      'AI mineral ID — 5 per day',
      'Basic hotspot map',
      'Save up to 50 specimens',
      'Daily quests',
      'Liquid Mineral Codex (basic)',
      'Public community feed',
    ],
  },
  {
    id: 'field_pro',
    name: 'Field Pro Companion',
    price: '$4.99',
    period: '/month',
    tagline: 'Built for serious rockhounds.',
    color: 'hsl(280,85%,78%)',
    bg: 'linear-gradient(135deg,hsla(265,60%,18%,0.85),hsla(280,70%,14%,0.9))',
    border: 'hsla(280,70%,58%,0.4)',
    badge: 'Most Popular',
    cta: 'Upgrade to Field Pro',
    ctaStyle: { background: 'linear-gradient(135deg,hsl(265,70%,52%),hsl(280,90%,62%))', boxShadow: '0 6px 28px -4px hsla(270,80%,60%,0.5)', color: '#fff' },
    features: [
      'Unlimited AI mineral ID',
      'Full hotspot access — 1,200+ sites',
      'Unlimited collection entries',
      'Saved private map pins',
      'Offline field cache (smart pre-download)',
      'Field journal export (PDF)',
      'Advanced privacy controls + Stealth Mode',
      'Premium Codex rewards & rarity unlocks',
      'XP multipliers + streak bonuses',
      'Pro badge on your profile',
      'Priority Clover voice sessions',
    ],
  },
  {
    id: 'family',
    name: 'Family / Expedition',
    price: '$8.99',
    period: '/month',
    tagline: 'For the whole crew.',
    color: 'hsl(160,80%,65%)',
    bg: 'linear-gradient(135deg,hsla(160,55%,14%,0.85),hsla(145,45%,12%,0.9))',
    border: 'hsla(160,70%,50%,0.35)',
    badge: 'Best for Families',
    cta: 'Start Family Expedition',
    ctaStyle: { background: 'linear-gradient(135deg,hsl(155,65%,38%),hsl(165,70%,44%))', boxShadow: '0 6px 28px -4px hsla(160,80%,40%,0.45)', color: '#fff' },
    features: [
      'Everything in Field Pro',
      'Up to 5 family member accounts',
      'Kid-safe mode (COPPA compliant)',
      'Parental controls dashboard',
      'Shared expedition planning',
      'Group field missions & quests',
      'Shared collection view',
      'Premium geology education modules',
      'Real-time family location sharing (opt-in)',
    ],
  },
];

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upgrading, setUpgrading] = useState(null);

  const handleUpgrade = async (tier) => {
    if (tier.id === 'free') { navigate('/'); return; }

    base44.analytics.track({ eventName: 'pricing_upgrade_tapped', properties: { tier: tier.id } });

    const priceId = tier.id === 'field_pro' ? STRIPE_CONFIG.fieldPro.priceId : STRIPE_CONFIG.family.priceId;

    // Checkout must run outside the Base44 preview iframe.
    if (typeof window !== 'undefined' && window.self !== window.top) {
      alert('Checkout only works from the published app — open it in a new tab to upgrade.');
      return;
    }

    setUpgrading(tier.id);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        priceId,
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl: STRIPE_CONFIG.cancelUrl,
        tier: tier.id,
        customerEmail: user?.email || null,
      });
      const url = res?.data?.url;
      if (!url) throw new Error('No checkout URL returned');
      window.location.href = url;
    } catch {
      alert('Unable to start checkout — please try again shortly.');
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 pb-24 relative overflow-hidden"
      style={{ background: 'radial-gradient(ellipse at top,hsl(265,55%,28%) 0%,hsl(250,28%,14%) 55%,hsl(245,22%,9%) 100%)' }}>

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none -z-10"
        style={{ background: 'radial-gradient(circle at 20% 70%,hsla(280,100%,55%,0.12) 0%,transparent 50%), radial-gradient(circle at 80% 20%,hsla(160,80%,50%,0.09) 0%,transparent 45%)' }} />

      {/* Back */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition"
          style={{ background: 'hsla(255,30%,14%,0.7)', border: '1px solid hsla(255,30%,30%,0.25)' }}>
          <ArrowLeft size={16} />
        </button>
        <span className="text-white/30 text-sm">Back</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="text-center mb-10 max-w-xl mx-auto">
        <div className="flex items-center justify-center gap-2 mb-3">
          <span className="text-3xl">🪨</span>
          <span className="text-white font-black text-2xl">RockHound<span style={{ color: 'hsl(280,85%,82%)' }}>GO</span></span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-3">Choose Your Plan</h1>
        <p className="text-white/45 text-sm leading-relaxed">
          Your finds, pins, and progress are always saved — no matter which tier you're on.
        </p>
      </motion.div>

      {/* Tier cards */}
      <div className="max-w-2xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        {TIERS.map((tier, i) => (
          <motion.div key={tier.id}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.08 }}
            className="relative rounded-3xl p-5 flex flex-col"
            style={{ background: tier.bg, border: `1px solid ${tier.border}`, boxShadow: tier.badge ? `0 8px 40px -8px ${tier.color}40` : 'none' }}>

            {tier.badge && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap"
                style={{ background: tier.color, color: '#0d0d1a' }}>
                {tier.badge}
              </div>
            )}

            <div className="mb-4">
              <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: tier.color }}>
                {tier.name}
              </div>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-3xl font-black text-white">{tier.price}</span>
                <span className="text-white/35 text-xs mb-1">{tier.period}</span>
              </div>
              <p className="text-white/40 text-xs">{tier.tagline}</p>
            </div>

            <div className="flex-1 space-y-2 mb-5">
              {tier.features.map(f => (
                <div key={f} className="flex items-start gap-2">
                  <Check size={11} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                  <span className="text-white/65 text-xs leading-relaxed">{f}</span>
                </div>
              ))}
            </div>

            <button onClick={() => handleUpgrade(tier)}
              disabled={upgrading === tier.id}
              className="w-full py-3 rounded-2xl font-bold text-sm transition active:scale-95 disabled:opacity-60"
              style={tier.ctaStyle}>
              {upgrading === tier.id ? 'Redirecting…' : tier.cta}
            </button>
          </motion.div>
        ))}
      </div>

      {/* Trust row */}
      <div className="max-w-xl mx-auto text-center space-y-2">
        <p className="text-white/20 text-[11px]">
          Cancel anytime · Secure payment via Stripe · Your data is yours forever
        </p>
        <p className="text-white/12 text-[10px]">
          Funds route to Hidden Gem Rockhounding (Cody) via the connected Stripe account.
        </p>
        {!user && (
          <p className="text-white/30 text-xs mt-4">
            <Link to="/auth" className="text-amethyst-glow hover:underline">Sign in</Link> to manage your subscription.
          </p>
        )}
      </div>
    </div>
  );
}