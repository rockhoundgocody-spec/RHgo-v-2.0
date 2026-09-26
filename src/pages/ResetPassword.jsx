import React, { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Loader2 } from "lucide-react";
import AuthLayout from "@/components/AuthLayout";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const resetToken = searchParams.get("token");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 8) {
      setError("Password needs 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Those two passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      await base44.auth.resetPassword({ resetToken, newPassword });
      window.location.href = "/login";
    } catch (err) {
      setError(err?.message || "Reset failed. Request a new link.");
    } finally {
      setLoading(false);
    }
  };

  if (!resetToken) {
    return (
      <AuthLayout
        title="Link is dead."
        subtitle="This reset URL has no token."
        footer={
          <Link to="/forgot-password" className="text-[#2EE6A6] font-semibold">
            Request a new link
          </Link>
        }
      >
        <p className="text-sm text-[#9AA8B0]">Ask for another mail from the forgot-password desk.</p>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Cut a new key."
      subtitle="Base44 reset. Then sign in on this trail."
    >
      {error && (
        <div className="mb-3 p-3 rounded-xl bg-[rgba(240,163,163,0.1)] border border-[rgba(240,163,163,0.35)] text-[#F0A3A3] text-sm">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <label className="block text-[12px] uppercase tracking-[0.12em] text-[#5C6B74]">
          New password
          <input
            type="password"
            autoComplete="new-password"
            autoFocus
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="mt-1.5 w-full h-12 rounded-xl px-3 bg-white/5 border border-[rgba(232,238,242,0.14)] text-[#E8EEF2] outline-none focus:border-[#2EE6A6]"
          />
        </label>
        <label className="block text-[12px] uppercase tracking-[0.12em] text-[#5C6B74]">
          Confirm password
          <input
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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
              <Loader2 className="w-4 h-4 animate-spin" /> Saving key
            </span>
          ) : (
            "Save new password"
          )}
        </button>
      </form>
    </AuthLayout>
  );
}
