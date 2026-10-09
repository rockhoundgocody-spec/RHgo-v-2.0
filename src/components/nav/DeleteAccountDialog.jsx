import React, { useRef, useState } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useFocusTrap } from '@/lib/useFocusTrap';
import { deleteAccountRecords, clearDeletedAccountDeviceData } from '@/lib/deleteAccountFlow';
import { pauseAccountSync } from '@/lib/offlineQueue';
export const deleteUserData = deleteAccountRecords;

export default function DeleteAccountDialog({ onClose }) {
  const [step, setStep] = useState(1); // 1=info, 2=confirm
  const [confirming, setConfirming] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [retentionAcknowledged, setRetentionAcknowledged] = useState(false);
  const [progress, setProgress] = useState('');
  const dialogRef = useRef(null);

  const close = () => { if (!confirming) onClose(); };
  useFocusTrap(dialogRef, { onClose: close });

  const handleDelete = async () => {
    if (confirming || confirmText !== 'DELETE' || !retentionAcknowledged) return;
    setConfirming(true);
    setError('');
    let user;
    let deleted = false;
    try {
      user = await base44.auth.me();
      await pauseAccountSync(user.id);
      await deleteUserData(base44, result => setProgress(`Removing account data… ${result.removed || 0} records processed in this batch.`));
      deleted = true;
      setProgress('Your app account and records were removed. Uploaded files are not erased by this operation.');
      try { await clearDeletedAccountDeviceData(user); }
      catch { setError('Your account was removed, but local cleanup could not finish. Clear this browser’s RockHound GO site data after signing out.'); }
      await base44.auth.logout('/');
    } catch (error) {
      setError(deleted ? 'Your account was removed. Close this window and sign out to finish.' : 'Deletion paused and may have partially completed. Your account remains available; retry to finish.');
      if (user && !deleted) pauseAccountSync(user.id, false);
    } finally { setConfirming(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={close}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-hidden />
      <div
        ref={dialogRef}
        className="relative w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'hsl(240 20% 8%)' }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-account-title"
        aria-describedby="delete-account-description"
        tabIndex={-1}
      >
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center">
                <Trash2 size={18} className="text-rose-400" />
              </div>
              <div>
                <h2 id="delete-account-title" className="text-white font-bold text-lg">Delete Account</h2>
                <p id="delete-account-description" className="text-white/40 text-xs">This cannot be undone</p>
              </div>
            </div>
            <button type="button" onClick={close} aria-label="Close" className="rounded text-white/40 hover:text-white transition select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400">
              <X size={20} />
            </button>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2.5">
                <AlertTriangle size={16} className="shrink-0 mt-0.5" />
                <span>Deleting removes your RockHound GO app membership, owned records, and personal references in community records. Active recurring subscriptions are cancelled before account removal.</span>
              </div>
              <p className="text-xs text-white/60 leading-relaxed">
                Uploaded files are not erased by this operation. Older public photo links may remain accessible, and saved copies or backups cannot be recalled. For uploaded-file removal, contact support.
              </p>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={close}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs transition shadow-lg shadow-rose-500/20"
                >
                  Continue
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-xs text-white/70">
                To confirm deletion, type <span className="font-mono text-rose-400 font-bold">DELETE</span> below:
              </p>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-rose-500/50"
              />
              <label className="flex gap-2 text-xs text-foreground items-start">
                <input type="checkbox" checked={retentionAcknowledged} onChange={event => setRetentionAcknowledged(event.target.checked)} disabled={confirming} />
                <span>I understand uploaded files are not erased and older public photo links may remain accessible.</span>
              </label>
              {error && <p role="alert" className="text-xs text-destructive">{error}</p>}
              {progress && <p role="status" className="text-xs text-muted-foreground">{progress}</p>}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 font-medium text-xs transition"
                  disabled={confirming}
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={confirmText !== 'DELETE' || !retentionAcknowledged || confirming}
                  className="flex-1 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white font-bold text-xs transition shadow-lg shadow-rose-500/20"
                >
                  {confirming ? 'Deleting...' : 'Permanently Delete'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}