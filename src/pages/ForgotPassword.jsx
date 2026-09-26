import React, { useState } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";
import { withNext } from "@/lib/authRedirect";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await base44.auth.resetPasswordRequest(email.trim());
    } catch {
      /* always show the same line */
    } finally {
      setLoading(false);
      setSent(true);
    }
  };

  return (
    <AuthLayout
      title="Reset the lock."
      subtitle="We email a Base44 reset link. Same trail, new key."
      footer={
        <Link to={withNext("/login")} className="text-[#2EE6A6] font-semibold">
          Back to sign in
        </Link>
      }
    >
      {sent ? (
        <p className="text-sm text-[#E8EEF2]">
          If that email has an account, a reset link is on the way. Check spam if the field is quiet.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-3">
          <label className="block text-[12px] uppercase tracking-[0.12em] text-[#5C6B74]">
            Email
            <input
              type="email"
              autoComplete="email"
              autoFocus
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full h-12 rounded-xl px-3 bg-white/5 border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] outline-none focus:border-[#2EE6A6]"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !email}
            className="w-full min-h-12 rounded-full font-bold text-[#04140e] disabled:opacity-38"
            style={{ background: "linear-gradient(180deg,#2EE6A6,#1DBF7A)" }}
          >
            {loading ? (
              <span className="inline-flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Sending
              </span>
            ) : (
              "Send reset mail"
            )}
          </button>
        </form>
      )}
    </AuthLayout>
  );
}
