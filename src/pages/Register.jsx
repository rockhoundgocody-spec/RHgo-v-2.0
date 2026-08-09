import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gem, Mail, Lock, Loader2 } from "lucide-react";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import FacebookIcon from "@/components/FacebookIcon";
import { toast } from "@/components/ui/use-toast";
import { appParams } from "@/lib/app-params";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) {
      setError("Passwords don't match — try again");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email, password });
      setShowOtp(true);
    } catch (err) {
      setError(err.message || "Registration failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email, otpCode });
      if (result?.access_token) {
        base44.auth.setToken(result.access_token);
      }
      window.location.href = "/onboarding";
    } catch (err) {
      setError(err.message || "Invalid code — check your email and try again");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email);
      toast({ title: "Code resent", description: "Check your inbox (and spam folder)." });
    } catch (err) {
      setError(err.message || "Failed to resend code");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", appParams.fromUrl);
  };

  if (showOtp) {
    return (
      <AuthLayout
        icon={Mail}
        title="Check your email"
        subtitle={`We sent a 6-digit code to ${email}`}
        footer={
          <>
            Already have an account?{" "}
            <Link to="/login" className="text-amethyst-glow font-semibold hover:underline">Log in</Link>
          </>
        }
      >
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
            {error}
          </div>
        )}
        <p className="text-white/40 text-xs text-center mb-4">Enter the code below to activate your account</p>
        <div className="flex justify-center mb-5">
          <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode} autoFocus autoComplete="one-time-code">
            <InputOTPGroup>
              <InputOTPSlot index={0} />
              <InputOTPSlot index={1} />
              <InputOTPSlot index={2} />
              <InputOTPSlot index={3} />
              <InputOTPSlot index={4} />
              <InputOTPSlot index={5} />
            </InputOTPGroup>
          </InputOTP>
        </div>
        <Button
          className="w-full h-11 font-bold rounded-xl"
          style={{
            background: 'linear-gradient(135deg, hsl(265,70%,55%), hsl(280,90%,65%))',
            boxShadow: '0 4px 20px -4px hsla(270,80%,60%,0.5)',
          }}
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
        >
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Verifying...</> : "Activate Account →"}
        </Button>
        <p className="text-center text-sm text-white/30 mt-4">
          Didn't get it?{" "}
          <button onClick={handleResend} className="text-amethyst-glow hover:underline font-medium">
            Resend code
          </button>
        </p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      icon={Gem}
      title="Start your journey"
      subtitle="Free forever — no credit card needed"
      footer={
        <>
          Already a Rockhound?{" "}
          <Link to="/login" className="text-amethyst-glow font-semibold hover:underline">
            Log in →
          </Link>
        </>
      }
    >
      {/* Social proof nudge */}
      <div className="flex items-center justify-center gap-1.5 mb-5 text-xs text-white/30">
        <span>🪨</span>
        <span>Join thousands of rockhounds already exploring</span>
      </div>

      <Button
        variant="outline"
        className="w-full h-11 text-sm font-semibold mb-5 border-white/15 bg-white/5 hover:bg-white/10 text-white"
        onClick={handleGoogle}
      >
        <GoogleIcon className="w-4 h-4 mr-2" />
        Sign up with Google
      </Button>

      <Button
        variant="outline"
        className="w-full h-11 text-sm font-semibold mb-5 -mt-2 border-white/15 bg-white/5 hover:bg-white/10 text-white"
        onClick={() => base44.auth.loginWithProvider("facebook", appParams.fromUrl)}
      >
        <FacebookIcon className="w-4 h-4 mr-2" />
        Sign up with Facebook
      </Button>

      <div className="relative mb-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="px-3 text-white/30">or with email</span>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
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
          <Label htmlFor="password" className="text-white/60 text-xs uppercase tracking-wider">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amethyst/60 rounded-xl"
              required
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm" className="text-white/60 text-xs uppercase tracking-wider">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <Input
              id="confirm"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="pl-10 h-11 bg-white/5 border-white/15 text-white placeholder:text-white/25 focus:border-amethyst/60 rounded-xl"
              required
            />
          </div>
        </div>
        <Button
          type="submit"
          className="w-full h-11 font-bold text-sm rounded-xl !mt-4"
          style={{
            background: 'linear-gradient(135deg, hsl(265,70%,55%), hsl(280,90%,65%))',
            boxShadow: '0 4px 20px -4px hsla(270,80%,60%,0.5)',
          }}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating account...</>
          ) : (
            "Create Free Account →"
          )}
        </Button>
      </form>

      <p className="text-center text-[10px] text-white/20 mt-4">
        By signing up you agree to our Terms & Privacy Policy
      </p>
    </AuthLayout>
  );
}