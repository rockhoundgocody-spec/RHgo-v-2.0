import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAuth } from "@/lib/AuthContext";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import GoogleIcon from "@/components/GoogleIcon";
import { clearGateChoice } from "@/lib/gateStorage";
import { getPostAuthPath, persistBase44Session, readIntendedPath, withNext } from "@/lib/authRedirect";

export default function Register() {
  const navigate = useNavigate();
  const { checkUserAuth } = useAuth();
  useEffect(() => {
    clearGateChoice();
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const intended = readIntendedPath();
  const target = getPostAuthPath(intended);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password needs 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.register({ email: email.trim(), password });
      if (displayName.trim()) {
        try {
          localStorage.setItem("rhgo_user_name", displayName.trim());
        } catch {
          /* optional */
        }
      }
      setShowOtp(true);
    } catch (err) {
      setError(err?.message || "Could not register. Try a different email.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await base44.auth.verifyOtp({ email: email.trim(), otpCode });
      if (result?.access_token) persistBase44Session(base44, result.access_token, true);
      const name = displayName.trim() || (typeof localStorage !== "undefined" ? localStorage.getItem("rhgo_user_name") : "");
      if (name && name !== "Explorer" && base44.auth.updateMe) {
        try {
          await base44.auth.updateMe({ full_name: name });
        } catch {
          /* optional */
        }
      }
      await checkUserAuth();
      clearGateChoice();
      navigate(target, { replace: true });
    } catch (err) {
      setError(err?.message || "Code did not match. Check the email and try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      await base44.auth.resendOtp(email.trim());
    } catch (err) {
      setError(err?.message || "Could not resend. Wait a minute and try again.");
    }
  };

  const handleGoogle = () => {
    base44.auth.loginWithProvider("google", target);
  };

  if (showOtp) {
    return (
      <AuthLayout
        title="Check your kit bag."
        subtitle={`Six-digit code sent to ${email}.`}
        footer={
          <>
            Already in?{" "}
            <Link to={withNext("/login")} className="text-[#2EE6A6] font-semibold">
              Sign in
            </Link>
          </>
        }
      >
        {error && (
          <div className="mb-3 p-3 rounded-xl bg-[rgba(240,163,163,0.1)] border border-[rgba(240,163,163,0.35)] text-[#F0A3A3] text-sm">
            {error}
          </div>
        )}
        <input
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          value={otpCode}
          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          className="w-full h-12 rounded-xl px-3 mb-3 tracking-[0.4em] text-center bg-white/5 border border-[rgba(232,238,242,0.14)] text-[#E8EEF2]"
          aria-label="Email code"
        />
        <button
          type="button"
          onClick={handleVerify}
          disabled={loading || otpCode.length < 6}
          className="w-full min-h-12 rounded-full font-bold text-[#04140e] disabled:opacity-38"
          style={{ background: "linear-gradient(180deg,#2EE6A6,#1DBF7A)" }}
        >
          {loading ? "Checking code" : "Open the vault"}
        </button>
        <button type="button" onClick={handleResend} className="w-full mt-3 text-sm text-[#9AA8B0]">
          Resend code
        </button>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Take a field name."
      subtitle="Email, a password, and the name your finds wear."
      footer={
        <>
          Already in?{" "}
          <Link to={withNext("/login")} className="text-[#2EE6A6] font-semibold">
            Sign in
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
          Display name
          <input
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="mt-1.5 w-full h-12 rounded-xl px-3 bg-white/5 border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] outline-none focus:border-[#2EE6A6]"
          />
        </label>
        <label className="block text-[12px] uppercase tracking-[0.12em] text-[#5C6B74]">
          Email
          <input
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1.5 w-full h-12 rounded-xl px-3 bg-white/5 border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] outline-none focus:border-[#2EE6A6]"
          />
        </label>
        <label className="block text-[12px] uppercase tracking-[0.12em] text-[#5C6B74]">
          Password
          <input
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full h-12 rounded-xl px-3 bg-white/5 border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] outline-none focus:border-[#2EE6A6]"
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full min-h-12 rounded-full font-bold text-[#04140e] disabled:opacity-38"
          style={{ background: "linear-gradient(180deg,#2EE6A6,#1DBF7A)" }}
        >
          {loading ? (
            <span className="inline-flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Making the name
            </span>
          ) : (
            "Create field name"
          )}
        </button>
      </form>
      <button
        type="button"
        onClick={handleGoogle}
        className="w-full min-h-11 mt-3 rounded-full border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] text-sm font-semibold inline-flex items-center justify-center gap-2"
      >
        <GoogleIcon className="w-4 h-4" />
        Sign in with Google
      </button>
    </AuthLayout>
  );
}
