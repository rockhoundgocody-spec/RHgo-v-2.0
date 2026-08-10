import React, { useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function DeleteAccountDialog({ onClose }) {
  const [step, setStep] = useState(1); // 1=info, 2=confirm
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const handleDelete = async () => {
    setConfirming(true);
    // Delete user's data entities
    try {
      const user = await base44.auth.me();
      const [specimens, companions, drafts, badges] = await Promise.all([
        base44.entities.Specimen.filter({ created_by: user.email }),
        base44.entities.Companion.filter({ owner_email: user.email }),
        base44.entities.SpecimenDraft.filter({ owner_email: user.email }),
        base44.entities.Badge.filter({ owner_email: user.email }),
      ]);
      await Promise.all([
        ...specimens.map((r) => base44.entities.Specimen.delete(r.id)),
        ...companions.map((r) => base44.entities.Companion.delete(r.id)),
        ...drafts.map((r) => base44.entities.SpecimenDraft.delete(r.id)),
        ...badges.map((r) => base44.entities.Badge.delete(r.id)),
      ]);
      base44.auth.logout('/');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
      <div
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'hsl(240 20% 8%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Trash2 size={18} className="text-rose-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-lg">Delete Account</h2>
                <p className="text-white/40 text-xs">This cannot be undone</p>
              </div>
            </div>
            <button onClick={onClose} aria-label="Close" className="text-white/40 hover:text-white transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 ring-offset-background rounded-sm">
              <X size={20} />
            </button>
          </div>

          {step === 1 && (
            <>
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/25 p-4 mb-5">
                <div className="flex items-start gap-2">
                  <AlertTriangle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                  <div className="text-sm text-rose-200/80 space-y-1.5">
                    <p className="font-semibold">The following will be permanently deleted:</p>
                    <ul className="list-disc list-inside text-rose-200/60 space-y-0.5 text-xs">
                      <li>All your specimen finds and photos</li>
                      <li>Your companion and XP progress</li>
                      <li>All scan drafts and identification history</li>
                      <li>Your badges and achievements</li>
                      <li>Your account profile and settings</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 ring-offset-background"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 py-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 font-semibold text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 ring-offset-background"
                >
                  Continue
                </button>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <p className="text-sm text-white/60 mb-3">
                Type <span className="text-white font-mono font-bold">DELETE</span> to confirm.
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/15 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-rose-500/50 focus:border-rose-500/60 mb-4 text-sm"
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 rounded-xl bg-white/10 text-white/70 font-semibold text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 ring-offset-background"
                >
                  Back
                </button>
                <button
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || confirming}
                  className="flex-1 py-3 rounded-xl bg-rose-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/50 focus-visible:ring-offset-2 ring-offset-background"
                >
                  {confirming ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}