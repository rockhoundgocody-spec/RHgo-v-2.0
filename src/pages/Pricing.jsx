/**
 * Pricing.jsx — RockHound GO Field Kit Tiers (Open Beta + Optional Supporter Tiers)
 *
 * Every tier is $0 / Free during Open Beta — no login wall, no scan limits.
 * Collectors can optionally pledge a Supporter tier via Stripe to back ongoing field data & AI development.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft, Heart, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';
import { useSeoRobots } from '@/lib/useSeoRobots';
import { useSeoMeta } from '@/lib/useSeoMeta';
import { isNativeApp } from '@/lib/isNativeApp';

const STRIPE_CONFIG = {
  successUrl: typeof window !== 'undefined' ? `${window.location.origin}/settings?upgrade=success` : '',
  cancelUrl:  typeof window !== 'undefined' ? `${window.location.origin}/pricing` : '',
};

const TIERS = [
  {
    id: 'free',
    name: 'Field',
    price: '$0',
    originalPrice: null,
    period: 'always free',
    tagline: 'Instant access — no account required.',
    color: '#94a3b8',
    bg: 'hsla(215,20%,14%,0.6)',
    border: 'hsla(215,20%,35%,0.2)',
    cta: 'Use Free Now',
    ctaStyle: { background: 'hsla(215,20%,25%,0.6)', border: '1px solid hsla(215,20%,45%,0.25)', color: '#e2e8f0' },
    features: [
      'Unlimited AI mineral scans',
      'Full geological field reports',
      'Public hotspots & land access status',
      'GeoDex collection & 3D Vault Galaxy',
      'Clover voice companion',
    ],
  },
  {
    id: 'season',
    name: 'Season',
    price: '$0',
    originalPrice: '$12.99 / 30 days',
    period: 'Free in Beta',
    tagline: 'Unlocked free for everyone · optional trip-window supporter.',
    color: '#9FE8D0',
    bg: 'hsla(160,40%,12%,0.6)',
    border: 'hsla(160,50%,40%,0.25)',
    badge: 'Unlocked Free',
    cta: 'Included Free — Open App',
    supporterLabel: 'Support Season ($12.99)',
    ctaStyle: { background: 'hsla(160,40%,20%,0.6)', border: '1px solid hsla(160,50%,45%,0.3)', color: '#9FE8D0' },
    features: [
      'Everything in Field',
      'Unlimited scans & live camera labels',
      'Exact hotspot pins',
      'BLM / USFS / NPS land overlay',
      'Offline county pack',
      'Trip route planner',
    ],
  },
  {
    id: 'hound',
    name: 'Hound',
    price: '$0',
    originalPrice: '$79 / yr',
    period: 'Free in Beta',
    tagline: 'The complete field kit — 100% free during beta, or pledge as a supporter.',
    color: '#9FE8D0',
    bg: 'linear-gradient(160deg, hsla(160,45%,14%,0.85), hsla(165,50%,10%,0.92))',
    border: 'hsla(160,60%,55%,0.45)',
    badge: 'All Features Unlocked Free',
    cta: 'Start Exploring Free',
    supporterLabel: 'Become a Hound Supporter ($79/yr)',
    ctaStyle: { background: '#9FE8D0', color: '#0a0a14', boxShadow: '0 6px 28px -4px rgba(159,232,208,0.45)' },
    features: [
      'Everything in Season — unlocked now',
      'Unlimited AI identifications all year',
      'Multi-angle + GPS stamp + provenance',
      'Rarity badges + sealed/sold/traded states',
      'Storm hunter push alerts',
      'Offline county packs (any county)',
      'CSV & KMZ Google Earth export',
    ],
  },
  {
    id: 'steward',
    name: 'Steward',
    price: '$0',
    originalPrice: '$149 / yr',
    period: 'Free in Beta',
    tagline: 'For dealers & collectors — free in beta, optional supporter tier.',
    color: '#c084fc',
    bg: 'hsla(265,40%,14%,0.6)',
    border: 'hsla(265,50%,45%,0.25)',
    small: true,
    cta: 'Use Free',
    supporterLabel: 'Support ($149/yr)',
    ctaStyle: { background: 'hsla(265,40%,25%,0.6)', border: '1px solid hsla(265,55%,50%,0.3)', color: '#c084fc' },
    features: [
      'Everything in Hound',
      'Collector-retail valuation tools',
      'Portfolio & provenance export',
      'Public trade listings',
    ],
  },
  {
    id: 'club',
    name: 'Club',
    price: '$0',
    originalPrice: '$199 / yr · 8 seats',
    period: 'Free in Beta',
    tagline: 'For rock & mineral clubs — free in beta, optional club sponsor.',
    color: '#fbbf24',
    bg: 'hsla(40,40%,12%,0.6)',
    border: 'hsla(40,50%,45%,0.25)',
    small: true,
    cta: 'Use Free',
    supporterLabel: 'Sponsor ($199/yr)',
    ctaStyle: { background: 'hsla(40,40%,20%,0.6)', border: '1px solid hsla(40,50%,45%,0.3)', color: '#fbbf24' },
    features: [
      'Club chapters & event RSVPs',
      'Club map + group hunts',
      'Shared legality notes',
      'Group expedition planning',
    ],
  },
];

function StoreAppNotice() {
  const navigate = useNavigate();
  useSeoRobots(false);
  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: '#0a0a14' }}>
      <div className="max-w-md text-center">
        <h1 className="text-xl font-black text-white tracking-tight">RockHound GO is 100% Free</h1>
        <p className="mt-2 text-white/60 text-sm leading-relaxed">
          All scans, maps, land access layers, and collection tools are unlocked for everyone with no login wall and no paid limits.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mt-6 h-10 px-5 rounded-xl font-bold text-sm transition active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{ background: '#9FE8D0', color: '#0a0a14' }}
        >
          Back to the field kit
        </button>
      </div>
    </main>
  );
}

export default function Pricing() {
  return isNativeApp() ? <StoreAppNotice /> : <PricingPage />;
}

function PricingPage() {
  useSeoRobots(true);
  useSeoMeta(
    'RockHound GO Pricing — Free Open Beta & Optional Supporter Tiers',
    'RockHound GO is 100% free during Open Beta — unlimited AI mineral scans, legal land access maps, and full GeoDex collection with optional supporter tiers.'
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upgrading, setUpgrading] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);
  const nativeApp = isNativeApp();

  const handleSupportCheckout = async (tier) => {
    if (tier.id === 'free' || nativeApp) {
      navigate('/');
      return;
    }

    base44.analytics.track({ eventName: 'pricing_upgrade_tapped', properties: { tier: tier.id } });

    if (!user?.email) {
      navigate(`/signin?from_url=${encodeURIComponent('/pricing')}`);
      return;
    }

    const isFramed = typeof window !== 'undefined' && window.self !== window.top;
    const checkoutTab = isFramed ? window.open('', '_blank') : null;
    if (isFramed && !checkoutTab) {
      setCheckoutError({ tier: tier.id, message: 'Allow popups to continue to supporter checkout.' });
      return;
    }
    if (checkoutTab) checkoutTab.opener = null;

    setUpgrading(tier.id);
    setCheckoutError(null);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl: STRIPE_CONFIG.cancelUrl,
        tier: tier.id,
      });
      const url = res?.data?.url;
      if (!url) throw new Error('No checkout URL returned');
      if (checkoutTab) {
        checkoutTab.location.replace(url);
      } else {
        window.location.assign(url);
      }
    } catch (err) {
      checkoutTab?.close();
      const code = err?.data?.code || err?.code || err?.response?.data?.code;
      const message = code === 'plan_unconfigured' || code === 'price_inactive'
        ? `${tier.name} supporter checkout isn't active yet — enjoy all features free in the meantime!`
        : code === 'auth_required'
          ? 'Please sign in again to pledge support.'
          : 'Unable to start supporter checkout right now — all features remain unlocked for free.';
      setCheckoutError({ tier: tier.id, message });
    } finally {
      setUpgrading(null);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 pb-24 relative overflow-hidden"
      style={{ background: '#0a0a14' }}>

      {/* Back */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          aria-label="Back"
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition"
          style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.08)' }}>
          <ArrowLeft size={16} />
        </button>
        <span className="text-white/30 text-sm">Back</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="text-center mb-6 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-3"
          style={{ background: 'hsla(160,60%,45%,0.15)', color: '#9FE8D0', border: '1px solid hsla(160,60%,55%,0.35)' }}>
          <Sparkles size={11} /> 100% Free in Open Beta
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Every Feature Unlocked at $0</h1>
        <p className="text-white/55 text-sm leading-relaxed">
          All tiers are <span className="text-[#9FE8D0] font-semibold">$0 / Free during Open Beta</span> with no login wall and no scan limits. Want to help fund field data and AI servers? Pick an optional supporter tier below.
        </p>
      </motion.div>

      {/* Tier cards */}
      <div className="max-w-2xl mx-auto space-y-3 mb-10">
        {TIERS.map((tier, i) => (
          <motion.div key={tier.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
            className={`relative rounded-2xl p-5 flex ${tier.small ? 'flex-col sm:flex-row sm:items-center' : 'flex-col'}`}
            style={{ background: tier.bg, border: `1px solid ${tier.border}`, boxShadow: tier.badge ? `0 8px 40px -8px ${tier.color}30` : 'none' }}>

            {tier.badge && (
              <div className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ background: tier.color, color: '#0a0a14' }}>
                {tier.badge}
              </div>
            )}

            {/* Left: name + price */}
            <div className={tier.small ? 'sm:w-44 shrink-0 sm:mr-4 mb-3 sm:mb-0' : 'mb-4'}>
              <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: tier.color }}>
                {tier.name}
              </div>
              <div className="flex items-baseline gap-2 mb-0.5 flex-wrap">
                <span className="text-2xl font-black text-white">{tier.price}</span>
                <span className="text-[#9FE8D0] text-[11px] font-bold">{tier.period}</span>
                {tier.originalPrice && (
                  <span className="text-white/30 text-[11px] line-through">{tier.originalPrice}</span>
                )}
              </div>
              <p className="text-white/45 text-xs">{tier.tagline}</p>
            </div>

            {/* Right: features + CTA */}
            <div className={tier.small ? 'flex-1' : ''}>
              {!tier.small && (
                <div className="space-y-1.5 mb-5">
                  {tier.features.map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={11} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                      <span className="text-white/70 text-xs leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {tier.small && (
                <div className="mb-3">
                  <p className="text-white/55 text-[11px] leading-relaxed">{tier.features.join(' · ')}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="flex-1 py-2.5 px-4 rounded-xl font-bold text-sm transition active:scale-95"
                  style={tier.ctaStyle}
                >
                  {tier.cta}
                </button>
                {!nativeApp && tier.supporterLabel && (
                  <button
                    type="button"
                    onClick={() => handleSupportCheckout(tier)}
                    disabled={upgrading === tier.id}
                    className="py-2.5 px-4 rounded-xl font-semibold text-xs transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-1.5 text-white/80 hover:text-white"
                    style={{ background: 'hsla(0,0%,100%,0.05)', border: '1px solid hsla(0,0%,100%,0.14)' }}
                  >
                    <Heart size={12} style={{ color: tier.color }} />
                    <span>{upgrading === tier.id ? 'Redirecting…' : tier.supporterLabel}</span>
                  </button>
                )}
              </div>

              {checkoutError?.tier === tier.id && (
                <p role="alert" className="mt-2 text-[11px] leading-snug text-amber-200/80">
                  {checkoutError.message}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust row */}
      <div className="max-w-xl mx-auto text-center space-y-2">
        <p className="text-white/40 text-[11px]">
          Every feature is free to use without signing in. Optional supporter pledges help keep RockHound GO ad-free.
        </p>
        {!user && (
          <p className="text-white/35 text-xs mt-4">
            Want cloud backup across devices? <Link to="/signin" className="text-[#9FE8D0] hover:underline">Sign in</Link> anytime (optional).
          </p>
        )}
      </div>
    </div>
  );
}