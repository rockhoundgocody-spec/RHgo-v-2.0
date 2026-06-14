import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, CheckCircle2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * CorrectionModal — lets a user fix a misidentified specimen. Writes a
 * TrainingCandidate row via the existing `submitCorrection` backend
 * function. No new entities, no new dependencies.
 */
export default function CorrectionModal({
  open,
  onClose,
  predictedLabel,
  predictedConfidence,
  modelVersion = 'gemini-flash',
  imageUrl,
  specimenId,
}) {
  const [userLabel, setUserLabel] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const submit = async () => {
    if (!userLabel.trim()) return;
    setSubmitting(true);
    try {
      await base44.functions.invoke('submitCorrection', {
        image_url: imageUrl,
        predicted_label: predictedLabel,
        predicted_confidence: predictedConfidence,
        user_label: userLabel.trim(),
        user_notes: notes.trim() || undefined,
        model_version: modelVersion,
        specimen_id: specimenId,
      });
      toast.success('Correction recorded — helps improve future models');
      setUserLabel('');
      setNotes('');
      onClose();
    } catch (e) {
      toast.error('Could not save correction. Try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'hsla(240,40%,3%,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}
    >
      <div
        className="glass-panel relative w-full max-w-md rounded-2xl p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-white/50 hover:text-white"
          aria-label="Close"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <CheckCircle2 size={14} className="text-amethyst-glow" />
          <span className="text-[11px] font-mono uppercase tracking-[0.3em] text-amethyst-glow">
            Correct Identification
          </span>
        </div>
        <p className="text-white/60 text-xs mb-4">
          Predicted:{' '}
          <span className="text-white/90 font-medium">{predictedLabel || 'Unknown'}</span>
          {predictedConfidence != null && (
            <span className="text-white/40 ml-1">
              ({(predictedConfidence * 100).toFixed(0)}%)
            </span>
          )}
        </p>

        <label htmlFor="user-label" className="block text-[10px] font-mono uppercase tracking-[0.3em] text-white/50 mb-1.5">
          What is it really?
        </label>
        <Input
          id="user-label"
          autoFocus
          value={userLabel}
          onChange={(e) => setUserLabel(e.target.value)}
          placeholder="e.g. Smoky Quartz"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 mb-3"
        />

        <label htmlFor="correction-notes" className="block text-[10px] font-mono uppercase tracking-[0.3em] text-white/50 mb-1.5">
          Notes (optional)
        </label>
        <Textarea
          id="correction-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything helpful for the model — locality, distinctive features…"
          className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-20 mb-4"
        />

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/20 text-white/80 hover:bg-white/5"
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!userLabel.trim() || submitting}
            className="flex-1 bg-amethyst-deep hover:bg-amethyst text-white border border-amethyst/40"
          >
            {submitting ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                Saving…
              </>
            ) : (
              'Submit'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}