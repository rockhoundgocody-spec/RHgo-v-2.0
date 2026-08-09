/**
 * Auth.jsx — Unified sign-in / sign-up page for RockHound-GO.
 *
 * Cross-domain note:
 *   rhgo.base44.app and rhgo2.base44.app should both point to this same
 *   Base44 app backend. Users registered on one domain are immediately
 *   available on the other because they share the same database and auth.
 *   NEVER create a second separate Base44 project for rhgo2 — use custom
 *   domains on a single project to ensure unified accounts.
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { Mail, Lock, Loader2, Gem, Map, Zap, Shield } from 'lucide-react';
import GoogleIcon from '@/components/GoogleIcon';
import { motion } from 'framer-motion';
import { appParams } from '@/lib/app-params';

const PERKS = [
  { icon: Gem,    label: 'Your finds are saved forever', desc: 'Collection, pins & badges survive any device' },
  { icon: Map,    label: 'Private map pins', desc: 'Exact coords stored only to your account' },
  { icon: Zap,    label: 'XP & Codex progress', desc: 'Never lose a level or achievement' },
  { icon: Shield, label: 'Stealth Mode privacy', desc: 'You control what the world sees' },
];

export default function Auth() {
  const [tab, setTab] = useState('signin'); // 'signin' | 'signup'

  // Shared fields
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  // OTP step (sign-up only)
  const [showOtp, setShowOtp]   = useState(false);
  const [otpCode, setOtpCode]   = useState('');

  const switchTab = (t) => { setTab(t); setError(''); setShowOtp(false); setOtpCode(''); };

  const handleSignIn = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = appParams.fromUrl;
    } catch (err) {
      setError(err.message || 'Invalid email or password');
    } finally { setLoading(false); }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError("Passwords don't match");
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || 'Registration failed — try again');
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    setError(''); setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) base44.auth.setToken(result.access_token);
      window.location.href = '/onboarding';
    } catch (err) {
      setError(err.message || 'Invalid code — check your email');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    setError('');
    try { await base44.auth.resendOtp(email); }
    catch (err) { setError(err.message || 'Failed to resend'); }
  };

  const GoogleBtn = ({ label }) => (
    <Button variant="outline"
      className="w-full h-11 text-sm font-semibold border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl"
      onClick={() => base44.auth.loginWithProvider('google', appParams.fromUrl)}>
      <GoogleIcon className="w-4 h-4 mr-2" />
      {label}
    </Button>
  );

  const Divider = () => (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="px-3 text-white/30 bg-transparent">or with email</span>
      </div>
    </div>
  );

  const ErrorBanner = () => error ? (
    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">{error}</div>
  ) : null;

  // OTP verification screen
  if (showOtp) {
    return (
      <AuthShell>
        <div className="text-center mb-6">
          <div className="text-2xl mb-1">📬</div>
          <h2 className="text-xl font-black text-white">Check your email</h2>
          <p className="text-white/40 text-sm mt-1">6-digit code sent to <span className="text-white/70">{email}</span></p>
        </div>
        <ErrorBanner />
        <div className="flex justify-center mb-5">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button className="w-full h-12 font-bold rounded-xl text-white"
          style={{ background: 'linear-gradient(135deg,hsl(265,70%,52%),hsl(280,90%,62%))' }}
          onClick={handleVerify} disabled={loading || otpCode.length < 6}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying…</> : 'Activate Account →'}
        </Button>
        <p className="text-center text-sm text-white/30 mt-4">
          Didn't get it?{' '}
          <button onClick={handleResend} className="text-amethyst-glow hover:underline font-medium">Resend</button>
        </p>
      </AuthShell>
    );
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row overflow-hidden">
      {/* LEFT HERO — desktop only */}
      <div className="hidden lg:flex lg:w-5/12 flex-col items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 40% 40%, hsl(265,55%,32%) 0%, hsl(250,30%,16%) 60%, hsl(245,25%,10%) 100%)' }}>
        <div className="absolute inset-0 pointer-events-none hud-grid-bg opacity-20" />
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 30% 60%, hsla(280,100%,55%,0.15) 0%, transparent 55%)' }} />
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative z-10 max-w-sm w-full">
          <div className="flex items-center gap-3 mb-10">
            <span className="text-5xl">🪨</span>
            <div>
              <div className="text-white font-black text-4xl leading-none">RockHound</div>
              <div className="font-black text-4xl leading-none glow-amethyst" style={{ color: 'hsl(280,85%,82%)' }}>GO</div>
            </div>
          </div>
          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Your finds, pins, badges, and field notes are saved to your account — always waiting when you return.
          </p>
          <div className="space-y-3">
            {PERKS.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-3 px-4 py-3 rounded-2xl"
                style={{ background: 'hsla(255,30%,14%,0.7)', border: '1px solid hsla(270,40%,40%,0.2)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsla(280,70%,50%,0.2)', border: '1px solid hsla(280,70%,55%,0.3)' }}>
                  <Icon size={14} style={{ color: 'hsl(280,85%,78%)' }} />
                </div>
                <div>
                  <div className="text-white font-semibold text-xs">{label}</div>
                  <div className="text-white/35 text-[10px]">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* RIGHT FORM */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at top, hsl(265,55%,30%) 0%, hsl(250,28%,18%) 50%, hsl(245,22%,12%) 100%)' }}>

        {/* Mobile logo */}
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <span className="text-3xl">🪨</span>
          <div>
            <div className="text-white font-black text-2xl leading-none">RockHound</div>
            <div className="font-black text-2xl leading-none" style={{ color: 'hsl(280,85%,82%)' }}>GO</div>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          className="w-full max-w-sm">

          {/* Tab switcher */}
          <div className="flex rounded-2xl p-1 mb-7"
            style={{ background: 'hsla(255,30%,12%,0.8)', border: '1px solid hsla(270,30%,30%,0.3)' }}>
            {[{ id: 'signin', label: 'Sign In' }, { id: 'signup', label: 'Sign Up' }].map(t => (
              <button key={t.id} onClick={() => switchTab(t.id)}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all"
                style={tab === t.id
                  ? { background: 'linear-gradient(135deg,hsl(265,70%,52%),hsl(280,90%,62%))', color: '#fff', boxShadow: '0 2px 12px hsla(270,80%,55%,0.4)' }
                  : { color: 'hsla(0,0%,100%,0.35)' }}>
                {t.label}
              </button>
            ))}
          </div>

          <ErrorBanner />

          {tab === 'signin' ? (
            <>
              <GoogleBtn label="Continue with Google" />
              <Divider />
              <form onSubmit={handleSignIn} className="space-y-4">
                <Field id="email" label="Email" type="email" icon={Mail} autoComplete="email"
                  placeholder="you@example.com" value={email} onChange={setEmail} autoFocus />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-white/55 text-xs uppercase tracking-wider">Password</Label>
                    <Link to="/forgot-password" className="text-xs text-white/35 hover:text-amethyst-glow transition">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <Input type="password" autoComplete="current-password" placeholder="••••••••"
                      value={password} onChange={e => setPassword(e.target.value)}
                      className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amethyst/60 rounded-xl" required />
                  </div>
                </div>
                <Button type="submit" disabled={loading}
                  className="w-full h-12 font-bold text-sm rounded-xl text-white"
                  style={{ background: 'linear-gradient(135deg,hsl(265,70%,52%),hsl(280,90%,62%))', boxShadow: '0 4px 24px -4px hsla(270,80%,60%,0.55)' }}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Signing in…</> : 'Sign In →'}
                </Button>
              </form>
              <p className="text-center text-sm text-white/35 mt-5">
                No account?{' '}
                <button onClick={() => switchTab('signup')} className="text-amethyst-glow font-semibold hover:underline">
                  Sign up free →
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="flex items-center justify-center gap-1.5 mb-4 text-xs text-white/30">
                <span>🪨</span>
                <span>Free forever — no credit card needed</span>
              </div>
              <GoogleBtn label="Sign up with Google" />
              <Divider />
              <form onSubmit={handleSignUp} className="space-y-3">
                <Field id="reg-email" label="Email" type="email" icon={Mail} autoComplete="email"
                  placeholder="you@example.com" value={email} onChange={setEmail} autoFocus />
                <Field id="reg-pass" label="Password" type="password" icon={Lock} autoComplete="new-password"
                  placeholder="Min. 6 characters" value={password} onChange={setPassword} />
                <Field id="reg-confirm" label="Confirm Password" type="password" icon={Lock} autoComplete="new-password"
                  placeholder="••••••••" value={confirm} onChange={setConfirm} />
                <Button type="submit" disabled={loading}
                  className="w-full h-12 font-bold text-sm rounded-xl !mt-4 text-white"
                  style={{ background: 'linear-gradient(135deg,hsl(265,70%,52%),hsl(280,90%,62%))', boxShadow: '0 4px 24px -4px hsla(270,80%,60%,0.55)' }}>
                  {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Creating account…</> : 'Create Free Account →'}
                </Button>
              </form>
              <p className="text-center text-[10px] text-white/20 mt-3">
                By signing up you agree to our Terms & Privacy Policy
              </p>
              <p className="text-center text-sm text-white/35 mt-3">
                Already a Rockhound?{' '}
                <button onClick={() => switchTab('signin')} className="text-amethyst-glow font-semibold hover:underline">
                  Sign in →
                </button>
              </p>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// Reusable field widget
function Field({ id, label, type, icon: Icon, value, onChange, autoComplete, placeholder, autoFocus }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-white/55 text-xs uppercase tracking-wider">{label}</Label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <Input id={id} type={type} autoComplete={autoComplete} placeholder={placeholder}
          autoFocus={autoFocus} value={value}
          onChange={e => onChange(e.target.value)}
          className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amethyst/60 rounded-xl" required />
      </div>
    </div>
  );
}

// Minimal shell for OTP step (no dependency on AuthLayout)
function AuthShell({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center px-5 py-10"
      style={{ background: 'radial-gradient(ellipse at top,hsl(265,55%,30%) 0%,hsl(250,28%,18%) 50%,hsl(245,22%,12%) 100%)' }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <span className="text-3xl">🪨</span>
          <div>
            <div className="text-white font-black text-2xl leading-none">RockHound</div>
            <div className="font-black text-2xl leading-none" style={{ color: 'hsl(280,85%,82%)' }}>GO</div>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}