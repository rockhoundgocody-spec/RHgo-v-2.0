import React, { useEffect, useRef, useState } from 'react';
import { Fingerprint } from 'lucide-react';
import GlassPanel from '@/components/visuals/GlassPanel.jsx';
import SectionHeader from './SectionHeader.jsx';
import { useToast } from '@/components/ui/use-toast';
import {
  isNoiseGateEnabled, isVoiceLockEnabled, setNoiseGateEnabled, setVoiceLockEnabled,
} from '@/lib/cloverWake';
import {
  bandVector, buildPrint, clearVoicePrint, createNoiseGate, hasVoicePrint, saveVoicePrint,
} from '@/lib/voicePrint';
import { createLevelSampler } from '@/lib/micBars';

const RECORD_MS = 4000;
const SAMPLE_MS = 60;
const micSupported = typeof navigator !== 'undefined' && !!navigator.mediaDevices?.getUserMedia;

function SwitchRow({ label, hint, checked, disabled, onToggle, ariaLabel }) {
  return (
    <div className="ml-9 mt-3 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[12px] text-white/75">{label}</p>
        <p className="text-[11px] text-white/40 leading-relaxed">{hint}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel}
        disabled={disabled}
        onClick={onToggle}
        className="relative w-11 h-6 rounded-full shrink-0 transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]/70"
        style={{ background: checked ? '#9FE8D0' : 'hsla(0,0%,100%,0.12)' }}
      >
        <span
          className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full transition-transform"
          style={{ background: checked ? '#0a0a14' : 'hsla(0,0%,100%,0.7)', transform: checked ? 'translateX(20px)' : 'none' }}
        />
      </button>
    </div>
  );
}

/**
 * CloverEarsCard — how her ears decide. The noise gate rejects wakes that were
 * only a noisy room; the voice profile rejects wakes that were somebody else.
 * Enrolment records four seconds of you saying the phrase, keeps the frames
 * that carried speech, and stores the fingerprint on this device only.
 */
export default function CloverEarsCard() {
  const { toast } = useToast();
  const [noiseGate, setNoiseGate] = useState(isNoiseGateEnabled);
  const [voiceLock, setVoiceLock] = useState(isVoiceLockEnabled);
  const [enrolled, setEnrolled] = useState(hasVoicePrint);
  const [recording, setRecording] = useState(false);
  const [status, setStatus] = useState('');
  const timerRef = useRef(null);

  useEffect(() => () => clearInterval(timerRef.current), []);

  const enroll = async () => {
    if (recording || !micSupported) return;
    setRecording(true);
    setStatus('Say "Hey Clover" a few times now, in your normal voice.');

    let stream = null;
    let ctx = null;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        video: false,
      });
      const Ctx = window.AudioContext || window.webkitAudioContext;
      ctx = new Ctx();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.5;
      ctx.createMediaStreamSource(stream).connect(analyser);

      const bins = new Uint8Array(analyser.frequencyBinCount);
      const level = createLevelSampler();
      const gate = createNoiseGate();
      const speechFrames = [];

      await new Promise((resolve) => {
        const startedAt = Date.now();
        timerRef.current = setInterval(() => {
          analyser.getByteFrequencyData(bins);
          if (gate.push(level.sample(analyser))) speechFrames.push(bandVector(bins));
          if (Date.now() - startedAt >= RECORD_MS) {
            clearInterval(timerRef.current);
            timerRef.current = null;
            resolve();
          }
        }, SAMPLE_MS);
      });

      const print = buildPrint(speechFrames);
      if (!print) {
        setStatus('I only caught a moment of speech. Move somewhere quieter and record again.');
      } else {
        saveVoicePrint(print);
        setEnrolled(true);
        setVoiceLock(true);
        setVoiceLockEnabled(true);
        setStatus(`Voice saved from ${print.frameCount} frames of speech. Clover now wakes for you only.`);
        toast({ title: 'Voice profile saved', description: 'She will ignore other voices at the wake word.' });
      }
    } catch {
      setStatus('Microphone unavailable — allow mic access for this site, then record again.');
    } finally {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (ctx && ctx.state !== 'closed') { try { ctx.close().catch(() => {}); } catch { /* closing */ } }
      setRecording(false);
    }
  };

  const forget = () => {
    clearVoicePrint();
    setEnrolled(false);
    setVoiceLock(false);
    setVoiceLockEnabled(false);
    setStatus('Voice profile deleted. Any voice can wake her again.');
  };

  return (
    <div className="mb-6">
      <GlassPanel className="p-4">
        <SectionHeader
          icon={Fingerprint}
          iconColor="text-[#9FE8D0]"
          title="Clover's ears"
          subtitle="She listens hands-free, and only for the phrase spoken out loud — in your voice."
        />

        <SwitchRow
          label="Background noise filter"
          hint="Learns the noise floor of wherever you are and ignores wakes buried in it. Keep this on in the field."
          checked={noiseGate}
          onToggle={() => {
            const next = !noiseGate;
            setNoiseGate(next);
            setNoiseGateEnabled(next);
          }}
          ariaLabel="Background noise filter"
        />

        <SwitchRow
          label="Only my voice"
          hint={enrolled
            ? 'Wakes only when the phrase is spoken in your enrolled voice.'
            : 'Record your voice below to lock the wake phrase to you.'}
          checked={voiceLock && enrolled}
          disabled={!enrolled}
          onToggle={() => {
            const next = !voiceLock;
            setVoiceLock(next);
            setVoiceLockEnabled(next);
          }}
          ariaLabel="Only wake for my voice"
        />

        <div className="ml-9 mt-4 flex items-center gap-2 flex-wrap">
          <button
            type="button"
            disabled={recording || !micSupported}
            onClick={enroll}
            className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.14em] transition disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9FE8D0]/70"
            style={{ background: 'hsla(160,70%,55%,0.16)', border: '1px solid hsla(160,70%,55%,0.4)', color: '#9FE8D0' }}
          >
            {recording ? 'Recording…' : enrolled ? 'Re-record my voice' : 'Record my voice'}
          </button>
          {enrolled && !recording && (
            <button
              type="button"
              onClick={forget}
              className="px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.14em] text-white/50 transition hover:text-white/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
              style={{ border: '1px solid hsla(0,0%,100%,0.14)' }}
            >
              Forget my voice
            </button>
          )}
        </div>

        <p className="ml-9 mt-2 text-[11px] text-white/40 leading-relaxed">
          {!micSupported
            ? 'This browser cannot record a voice profile. Wake word still works with the noise filter.'
            : status || (enrolled
              ? 'Your voice fingerprint is stored on this device only — no audio is uploaded or kept.'
              : 'Four seconds, a few repeats of "Hey Clover". No audio is stored, only the fingerprint.')}
        </p>
      </GlassPanel>
    </div>
  );
}