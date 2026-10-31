import React from 'react';
import { Mic, MicOff, Square, Loader2, Zap } from 'lucide-react';
import VoiceWaveform from './VoiceWaveform.jsx';

const LABEL = {
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'Speaking',
  resting: 'Paused',
  idle: 'Ready',
};

const TONE = {
  listening: '#9FE8D0',
  thinking: '#7dd3fc',
  speaking: '#c084fc',
  resting: 'rgba(255,255,255,0.45)',
  idle: 'rgba(255,255,255,0.35)',
};

/**
 * CloverVoiceControls — the state of Clover's ears: a live status light, the
 * input waveform, and the two controls a hands-full user needs (mute, stop).
 */
export default function CloverVoiceControls({
  phase, muted, onToggleMute, onStop, onListen, getWaveBars,
  onOpenAbilities, resonanceClaimed,
}) {
  const listening = phase === 'listening' && !muted;
  const speaking = phase === 'speaking';
  const status = muted ? 'Muted' : LABEL[phase] || LABEL.idle;
  const tone = muted ? 'rgba(255,255,255,0.4)' : TONE[phase] || TONE.idle;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            {listening && (
              <span
                className="absolute inline-flex h-full w-full rounded-full animate-ping"
                style={{ background: tone, opacity: 0.55 }}
              />
            )}
            <span
              className="relative inline-flex h-2.5 w-2.5 rounded-full"
              style={{ background: tone, boxShadow: `0 0 10px ${tone}` }}
            />
          </span>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: tone }}>
            {status}
          </span>
          {speaking && <Loader2 size={11} className="animate-spin" style={{ color: tone }} />}
        </span>

        {phase === 'resting' && !muted && (
          <button
            type="button"
            onClick={() => onListen?.()}
            className="text-[10px] font-semibold text-amethyst-glow rounded px-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
          >
            Tap to talk
          </button>
        )}
      </div>

      <VoiceWaveform
        active={listening || speaking}
        getBars={getWaveBars}
        color={tone}
        height={30}
      />

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onToggleMute?.()}
          aria-pressed={!!muted}
          aria-label={muted ? 'Unmute microphone' : 'Mute microphone'}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amethyst-glow/50"
          style={muted
            ? { background: 'hsla(0,70%,45%,0.28)', border: '1px solid hsla(0,70%,60%,0.45)', color: 'hsl(0,80%,85%)' }
            : { background: 'hsla(255,30%,20%,0.7)', border: '1px solid hsla(0,0%,100%,0.16)', color: 'rgba(255,255,255,0.75)' }}
        >
          {muted ? <MicOff size={12} /> : <Mic size={12} />}
          {muted ? 'Unmute' : 'Mute'}
        </button>

        <button
          type="button"
          onClick={() => onStop?.()}
          aria-label="Stop the conversation"
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white/85 transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60"
          style={{ background: 'hsla(350,60%,30%,0.5)', border: '1px solid hsla(350,70%,60%,0.4)' }}
        >
          <Square size={11} fill="currentColor" /> Stop
        </button>

        {onOpenAbilities && (
          <button
            type="button"
            onClick={() => onOpenAbilities()}
            aria-label="Daily Challenge"
            className="shrink-0 w-8 h-7 flex items-center justify-center rounded-lg transition active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60"
            style={{
              background: resonanceClaimed ? 'hsla(45,40%,18%,0.6)' : 'hsla(45,80%,30%,0.5)',
              border: '1px solid hsla(45,90%,60%,0.4)',
              color: resonanceClaimed ? 'hsl(45,60%,70%)' : '#fde68a',
            }}
          >
            <Zap size={13} />
          </button>
        )}
      </div>
    </div>
  );
}