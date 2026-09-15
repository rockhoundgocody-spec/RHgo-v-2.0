/**
 * Pricing.jsx — RockHound-GO Field Kit Tiers
 *
 * Field (free) · Season ($12.99/30 days) · Hound ($79/yr) · Steward ($149/yr) · Club ($199/yr)
 *
 * Hound annual is the target. Season is the escape hatch. Steward for dealers.
 * No weekly. No ads. No "V2.5" in the chrome.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, ArrowLeft } from 'lucide-react';
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
    period: 'free',
    tagline: 'First scan + public map teaser.',
    color: '#64748b',
    bg: 'hsla(215,20%,14%,0.6)',
    border: 'hsla(215,20%,35%,0.2)',
    cta: 'Start Free',
    ctaStyle: { background: 'hsla(215,20%,25%,0.6)', border: '1px solid hsla(215,20%,45%,0.25)', color: '#94a3b8' },
    features: [
      '5 AI scans / month',
      '1 full field report',
      'Public hotspots (blurred)',
      '15 GeoDex slots',
      'Species of the day',
      'Legal disclaimer (not legal map)',
    ],
  },
  {
    id: 'season',
    name: 'Season',
    price: '$12.99',
    period: '/ 30 days',
    tagline: 'One trip window.',
    color: '#9FE8D0',
    bg: 'hsla(160,40%,12%,0.6)',
    border: 'hsla(160,50%,40%,0.25)',
    cta: 'Start Season',
    ctaStyle: { background: 'hsla(160,40%,20%,0.6)', border: '1px solid hsla(160,50%,45%,0.3)', color: '#9FE8D0' },
    features: [
      'Everything in Field',
      'Unlimited scans for 30 days',
      'Exact hotspot pins',
      'BLM / USFS / NPS overlay',
      'Offline county pack',
      'Trip route planner',
    ],
  },
  {
    id: 'hound',
    name: 'Hound',
    price: '$79',
    period: '/ yr',
    tagline: 'The field kit. ~$6.60/mo.',
    color: '#9FE8D0',
    bg: 'linear-gradient(160deg, hsla(160,45%,14%,0.85), hsla(165,50%,10%,0.92))',
    border: 'hsla(160,60%,55%,0.45)',
    badge: 'Target',
    cta: 'Get Hound Annual',
    ctaStyle: { background: '#9FE8D0', color: '#0a0a14', boxShadow: '0 6px 28px -4px rgba(159,232,208,0.45)' },
    features: [
      'Everything in Season',
      'Unlimited scans all year',
      'Multi-angle + GPS stamp + provenance',
      'Rarity badges + sealed/sold/traded states',
      'Storm hunter push alerts',
      'Offline county packs (any county)',
      'Expert review (20-pack $29)',
      '14-day trial after first scan',
    ],
  },
  {
    id: 'steward',
    name: 'Steward',
    price: '$149',
    period: '/ yr',
    tagline: 'For dealers & clubs who sell.',
    color: '#c084fc',
    bg: 'hsla(265,40%,14%,0.6)',
    border: 'hsla(265,50%,45%,0.25)',
    small: true,
    cta: 'Get Steward',
    ctaStyle: { background: 'hsla(265,40%,25%,0.6)', border: '1px solid hsla(265,55%,50%,0.3)', color: '#c084fc' },
    features: [
      'Everything in Hound',
      'Collector-retail $ valuation',
      'eBay / IG listing block',
      'Portfolio $ chart + provenance PDF',
      'Send to expert ($8 each or 20-pack $29)',
      'Public trade listings',
    ],
  },
  {
    id: 'club',
    name: 'Club',
    price: '$199',
    period: '/ yr · 8 seats',
    tagline: 'For rock clubs.',
    color: '#fbbf24',
    bg: 'hsla(40,40%,12%,0.6)',
    border: 'hsla(40,50%,45%,0.25)',
    small: true,
    cta: 'Get Club',
    ctaStyle: { background: 'hsla(40,40%,20%,0.6)', border: '1px solid hsla(40,50%,45%,0.3)', color: '#fbbf24' },
    features: [
      '8 Hound seats',
      'Club map + group hunts',
      'Shared legality notes',
      'Group expedition planning',
      'Club event calendar',
    ],
  },
];

export default function Pricing() {
  useSeoRobots(true);
  useSeoMeta(
    'RockHound-GO Pricing — Field, Season, Hound, Steward & Club',
    'Free field kit with 5 scans/month. Hound annual $79/yr for unlimited scans, legal land overlay, and offline maps. Steward $149/yr for dealers. Club $199/yr for 8 seats.'
  );
  const navigate = useNavigate();
  const { user } = useAuth();
  const [upgrading, setUpgrading] = useState(null);
  const nativeApp = isNativeApp();

  const handleUpgrade = async (tier) => {
    if (tier.id === 'free') { navigate('/'); return; }
    if (nativeApp) return; // Digital subs not sold inside native app — subscribe on rhgo.me

    base44.analytics.track({ eventName: 'pricing_upgrade_tapped', properties: { tier: tier.id } });

    if (typeof window !== 'undefined' && window.self !== window.top) {
      alert('Checkout only works from the published app — open it in a new tab to upgrade.');
      return;
    }

    setUpgrading(tier.id);
    try {
      const res = await base44.functions.invoke('createCheckoutSession', {
        successUrl: STRIPE_CONFIG.successUrl,
        cancelUrl: STRIPE_CONFIG.cancelUrl,
        tier: tier.id,
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
      style={{ background: '#0a0a14' }}>

      {/* Back */}
      <div className="max-w-2xl mx-auto mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white/70 transition"
          style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.08)' }}>
          <ArrowLeft size={16} />
        </button>
        <span className="text-white/30 text-sm">Back</span>
      </div>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="text-center mb-10 max-w-xl mx-auto">
        <h1 className="text-3xl font-black text-white tracking-tight mb-2">Field Kit Pricing</h1>
        <p className="text-white/40 text-sm leading-relaxed">
          Not an AI rock app. A field kit that does not lie — honest ID, legal land, a collection you can sell later.
        </p>
      </motion.div>

      {/* Tier cards */}
      <div className="max-w-2xl mx-auto space-y-3 mb-10">
        {TIERS.map((tier, i) => (
          <motion.div key={tier.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: i * 0.06 }}
            className={`relative rounded-2xl p-5 flex ${tier.small ? 'flex-row items-center' : 'flex-col'}`}
            style={{ background: tier.bg, border: `1px solid ${tier.border}`, boxShadow: tier.badge ? `0 8px 40px -8px ${tier.color}30` : 'none' }}>

            {tier.badge && (
              <div className="absolute -top-2.5 left-6 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em]"
                style={{ background: tier.color, color: '#0a0a14' }}>
                {tier.badge}
              </div>
            )}

            {/* Left: name + price */}
            <div className={tier.small ? 'w-32 shrink-0 mr-4' : 'mb-4'}>
              <div className="text-[10px] uppercase tracking-[0.3em] mb-1" style={{ color: tier.color }}>
                {tier.name}
              </div>
              <div className="flex items-end gap-1 mb-0.5">
                <span className="text-2xl font-black text-white">{tier.price}</span>
                <span className="text-white/35 text-[11px] mb-1">{tier.period}</span>
              </div>
              {!tier.small && <p className="text-white/40 text-xs">{tier.tagline}</p>}
              {tier.small && <p className="text-white/35 text-[10px]">{tier.tagline}</p>}
            </div>

            {/* Right: features + CTA */}
            <div className={tier.small ? 'flex-1' : ''}>
              {!tier.small && (
                <div className="space-y-1.5 mb-5">
                  {tier.features.map(f => (
                    <div key={f} className="flex items-start gap-2">
                      <Check size={11} className="mt-0.5 shrink-0" style={{ color: tier.color }} />
                      <span className="text-white/60 text-xs leading-relaxed">{f}</span>
                    </div>
                  ))}
                </div>
              )}
              {tier.small && (
                <div className="mb-3">
                  <p className="text-white/45 text-[11px] leading-relaxed">{tier.features.slice(0, 3).join(' · ')}</p>
                </div>
              )}

              {nativeApp && tier.id !== 'free' ? (
                <div className="w-full py-2.5 rounded-xl text-center text-[11px] text-white/40"
                  style={{ background: 'hsla(0,0%,100%,0.04)', border: '1px solid hsla(0,0%,100%,0.08)' }}>
                  Plans available on the web
                </div>
              ) : (
                <button onClick={() => handleUpgrade(tier)}
                  disabled={upgrading === tier.id}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition active:scale-95 disabled:opacity-60"
                  style={tier.ctaStyle}>
                  {upgrading === tier.id ? 'Redirecting…' : tier.cta}
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Trust row */}
      <div className="max-w-xl mx-auto text-center space-y-2">
        <p className="text-white/25 text-[11px]">
          No weekly. No ads. Cancel anytime. 14-day Hound trial after your first scan.
        </p>
        {!user && (
          <p className="text-white/30 text-xs mt-4">
            <Link to="/login" className="text-white/60 hover:underline">Sign in</Link> to manage your subscription.
          </p>
        )}
      </div>
    </div>
  );
}