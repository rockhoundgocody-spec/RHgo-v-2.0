import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useSeoRobots } from "@/lib/useSeoRobots";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";
import GoogleIcon from "@/components/GoogleIcon";
import AuthLayout from "@/components/AuthLayout";
import { clearGateChoice } from "@/lib/gateStorage";
import { getPostAuthPath, persistBase44Session, readIntendedPath, withNext } from "@/lib/authRedirect";

export function getLoginRedirectUrl(rawFromUrl) {
  return getPostAuthPath(rawFromUrl);
}

export default function Login() {
  useSeoRobots(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const navigate = useNavigate();
  const { checkUserAuth, isAuthenticated, isLoadingAuth } = useAuth();
  const intended = readIntendedPath();
  const target = getPostAuthPath(intended);

  useEffect(() => {
    clearGateChoice();
  }, []);

  useEffect(() => {
    if (!isLoadingAuth && isAuthenticated && window.location.pathname !== target) {
      navigate(target, { replace: true });
    }
  }, [isAuthenticated, isLoadingAuth, navigate, target]);

  const finish = async (accessToken) => {
    persistBase44Session(base44, accessToken, remember);
    await checkUserAuth();
    clearGateChoice();
    if (window.location.pathname !== target) navigate(target, { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);
    try {
      const res = await base44.auth.loginViaEmailPassword(email.trim(), password);
      await finish(res?.access_token);
    } catch (err) {
      setError(err?.message || err?.data?.message || "Email or password did not match. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    if (oauthLoading || loading) return;
    setError("");
    setOauthLoading(true);
    try {
      await Promise.resolve(base44.auth.loginWithProvider("google", target));
    } catch (err) {
      setOauthLoading(false);
      setError(err?.message || "Google sign-in did not start. Use email.");
    }
  };

  return (
    <AuthLayout
      title="Back on the trail."
      subtitle="Sign in. Vault, map, and scans stay yours until you log out."
      footer={
        <>
          New here?{" "}
          <Link to={withNext("/register")} className="text-[#2EE6A6] font-semibold">
            Make a field name
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-[rgba(240,163,163,0.1)] border border-[rgba(240,163,163,0.35)] text-[#F0A3A3] text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-[12px] uppercase tracking-[0.12em] text-[#5C6B74]">
          Email
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full h-12 rounded-xl px-3 bg-white/5 border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] outline-none focus:border-[#2EE6A6]"
          />
        </label>
        <label className="block text-[12px] uppercase tracking-[0.12em] text-[#5C6B74]">
          Password
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full h-12 rounded-xl px-3 bg-white/5 border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] outline-none focus:border-[#2EE6A6]"
          />
        </label>

        <div className="flex items-center justify-between gap-3 pt-1">
          <label className="flex items-center gap-2 text-sm text-[#9AA8B0] min-h-11">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="w-4 h-4 accent-[#2EE6A6]"
            />
            Remember me
          </label>
          <Link to={withNext("/forgot-password")} className="text-sm text-[#9AA8B0]">
            Forgot password
          </Link>
        </div>

        <button
          type="submit"
          disabled={loading || !email || !password}
          className="w-full min-h-12 rounded-full font-bold text-[#04140e] disabled:opacity-38"
          style={{ background: "linear-gradient(180deg,#2EE6A6,#1DBF7A)" }}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Signing in
            </span>
          ) : (
            "Sign in"
          )}
        </button>
      </form>

      <button
        type="button"
        disabled={oauthLoading}
        onClick={handleGoogle}
        className="w-full min-h-11 mt-3 rounded-full border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] text-sm font-semibold inline-flex items-center justify-center gap-2"
      >
        {oauthLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon className="w-4 h-4" />}
        Sign in with Google
      </button>
    </AuthLayout>
  );
}
