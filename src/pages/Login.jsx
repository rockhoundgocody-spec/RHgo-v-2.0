import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, Lock, Loader2, Gem, Compass, Zap, Flame } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import FacebookIcon from "@/components/FacebookIcon";
import { motion } from "framer-motion";

const FEATURES = [
  { icon: Gem,     label: 'AI Mineral ID',   desc: 'Instant identification' },
  { icon: Compass, label: 'Hotspot Maps',    desc: '1,200+ dig sites' },
  { icon: Zap,     label: 'XP & Badges',     desc: 'Level up your finds' },
];

export default function Login() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [error, setError]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [oauthLoading, setOauthLoading] = useState(null);
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      await checkUserAuth();
      const next = new URLSearchParams(window.location.search).get('from_url') || '/';
      navigate(next.startsWith('/') ? next : '/');
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = (provider) => {
    if (oauthLoading || loading) return;
    setOauthLoading(provider);
    const next = new URLSearchParams(window.location.search).get('from_url') || '/';
    base44.auth.loginWithProvider(provider, next.startsWith('/') ? next : '/');
  };

  return (
    <div className="min-h-full flex flex-col lg:flex-row overflow-y-auto">

      {/* ── LEFT HERO PANEL (desktop only) ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden"
        style={{ background: 'radial-gradient(ellipse at 40% 40%, hsl(265,55%,32%) 0%, hsl(250,30%,16%) 60%, hsl(245,25%,10%) 100%)' }}>
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 30% 60%, hsla(280,100%,55%,0.18) 0%, transparent 55%), radial-gradient(circle at 75% 25%, hsla(195,100%,60%,0.12) 0%, transparent 45%)' }} />
        {/* Grid */}
        <div className="absolute inset-0 pointer-events-none hud-grid-bg opacity-20" />

        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}
          className="relative z-10 text-center max-w-sm">
          {/* Logo */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <span className="text-5xl">🪨</span>
            <div className="text-left">
              <div className="text-white font-black text-4xl tracking-tight leading-none">RockHound</div>
              <div className="font-black text-4xl tracking-tight leading-none glow-amethyst"
                style={{ color: 'hsl(280,85%,82%)' }}>GO</div>
            </div>
          </div>

          <p className="text-white/50 text-base mb-10 leading-relaxed">
            The field companion for rockhounds, fossil hunters, and mineral collectors.
          </p>

          <div className="space-y-3">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-center gap-4 px-5 py-3.5 rounded-2xl text-left"
                style={{ background: 'hsla(255,30%,14%,0.7)', border: '1px solid hsla(270,40%,40%,0.2)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: 'hsla(280,70%,50%,0.2)', border: '1px solid hsla(280,70%,55%,0.3)' }}>
                  <Icon size={16} style={{ color: 'hsl(280,85%,78%)' }} />
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{label}</div>
                  <div className="text-white/35 text-xs">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          <p className="text-white/20 text-xs uppercase tracking-[0.3em] mt-10">
            Discover · Identify · Collect
          </p>
        </motion.div>
      </div>

      {/* ── RIGHT FORM PANEL ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-5 py-10 relative"
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

          <div className="mb-7 text-center lg:text-left">
            <h1 className="text-2xl font-black text-white tracking-tight">Welcome back</h1>
            <p className="text-white/45 text-sm mt-1">Your collection is waiting for you.</p>
          </div>

          {/* 🔥 Guest Demo — top of form, most prominent */}
          <button
            onClick={() => navigate('/demo')}
            className="w-full h-12 rounded-xl font-black text-white text-sm flex items-center justify-center gap-2 mb-5 transition active:scale-95"
            style={{
              background: 'linear-gradient(135deg, hsl(20,90%,45%), hsl(35,100%,52%))',
              boxShadow: '0 4px 24px -4px hsla(25,100%,55%,0.55)',
            }}
          >
            <Flame size={15} /> Try Full Demo (No Sign-Up)
          </button>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/10" /></div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 text-white/30 bg-transparent">or sign in</span>
            </div>
          </div>

          {/* OAuth buttons */}
          <div className="space-y-3 mb-6">
            <Button variant="outline" className="w-full h-11 text-sm font-semibold border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl"
              disabled={!!oauthLoading} onClick={() => handleOAuth("google")}>
              {oauthLoading === 'google'
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <GoogleIcon className="w-4 h-4 mr-2" />}
              {oauthLoading === 'google' ? 'Connecting…' : 'Continue with Google'}
            </Button>
            <Button variant="outline" className="w-full h-11 text-sm font-semibold border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl"
              disabled={!!oauthLoading} onClick={() => handleOAuth("facebook")}>
              {oauthLoading === 'facebook'
                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                : <FacebookIcon className="w-4 h-4 mr-2" />}
              {oauthLoading === 'facebook' ? 'Connecting…' : 'Continue with Facebook'}
            </Button>
          </div>

          <div className="relative mb-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="px-3 text-white/30 bg-transparent">or sign in with email</span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-white/55 text-xs uppercase tracking-wider">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input id="email" type="email" autoComplete="email"
                  placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amethyst/60 rounded-xl" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-white/55 text-xs uppercase tracking-wider">Password</Label>
                <Link to="/forgot-password" className="text-xs text-white/35 hover:text-amethyst-glow transition">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <Input id="password" type="password" autoComplete="current-password"
                  placeholder="••••••••" value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amethyst/60 rounded-xl" required />
              </div>
            </div>

            <Button type="submit" disabled={loading || !email || !password}
              className="w-full h-12 font-bold text-sm rounded-xl mt-1 text-white disabled:opacity-40 disabled:saturate-50"
              style={{
                background: 'linear-gradient(135deg, hsl(265,70%,52%), hsl(280,90%,62%))',
                boxShadow: '0 4px 24px -4px hsla(270,80%,60%,0.55)',
              }}>
              {loading
                ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Signing in…</>
                : 'Sign In →'}
            </Button>
          </form>

          <p className="text-center text-sm text-white/35 mt-6">
            New to RockHound GO?{" "}
            <Link to="/register" className="text-amethyst-glow font-semibold hover:underline">
              Join for free →
            </Link>
          </p>

          {/* Privacy + Terms — accessible without account */}
          <div className="flex items-center justify-center gap-3 mt-4 text-white/25 text-[11px]">
            <Link to="/privacy-policy" className="hover:text-white/50 transition">Privacy Policy</Link>
            <span className="text-white/15">·</span>
            <Link to="/terms" className="hover:text-white/50 transition">Terms of Service</Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}