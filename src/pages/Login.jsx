import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogIn, Mail, Lock, Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import FacebookIcon from "@/components/FacebookIcon";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      window.location.href = "/";
    } catch (err) {
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", "/");
  };

  return (
    <AuthLayout
      icon={LogIn}
      title="Welcome back, Rockhound"
      subtitle="Your collection is waiting"
      footer={
        <>
          New to RockHound GO?{" "}
          <Link to="/register" className="text-amethyst-glow font-semibold hover:underline">
            Join for free →
          </Link>
        </>
      }
    >
      <Button
        variant="outline"
        className="w-full h-11 text-sm font-semibold mb-5 border-white/15 bg-white/5 hover:bg-white/10 text-white"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-4 h-4 mr-2" />
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full h-11 text-sm font-semibold mb-5 -mt-2 border-white/15 bg-white/5 hover:bg-white/10 text-white"
        onClick={() => base44.auth.loginWithProvider("facebook", "/")}
      >
        <FacebookIcon className="w-4 h-4 mr-2" />
        Continue with Facebook
      </Button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-3 text-white/30" style={{ background: 'transparent' }}>or</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-white/60 text-xs uppercase tracking-wider">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amethyst/60 rounded-xl"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
            <Link to="/forgot-password" className="text-xs text-white/35 hover:text-amethyst-glow transition">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amethyst/60 rounded-xl"
              required
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full h-11 font-bold text-sm rounded-xl mt-1"
          style={{
            background: 'linear-gradient(135deg, hsl(265,70%,55%), hsl(280,90%,65%))',
            boxShadow: '0 4px 20px -4px hsla(270,80%,60%,0.5)',
          }}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Logging in...</>
          ) : (
            "Log in →"
          )}
        </Button>
      </form>
    </AuthLayout>
  );
}