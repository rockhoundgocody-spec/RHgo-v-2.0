import React, { useEffect, useRef, useState } from 'react';
import HudFrame from '@/components/visuals/HudFrame.jsx';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';
import ProcessingPulse from './ProcessingPulse.jsx';

const STEPS = [
  'Uploading captures',
  'Aligning viewpoints',
  'Estimating depth',
  'Fusing point cloud',
  'Building mesh',
  'Querying mineralogy AI',
];

/**
 * ReconstructionStage — visual loading state while the backend stitches
 * captures into a 3D model and runs AI identification. Pure UI for now;
 * progress is timed/staged. Calls onDone() when finished or onError(e).
 *
 * `runner` is an async function that performs the actual work and resolves
 * with the result payload. We advance the visual steps in parallel.
 */
export default function ReconstructionStage({ runner, onDone, onError }) {
  const [step, setStep] = useState(0);
  const startedRef = React.useRef(false);
  const runnerRef = React.useRef(runner);
  const onDoneRef = React.useRef(onDone);
  const onErrorRef = React.useRef(onError);
  runnerRef.current = runner;
  onDoneRef.current = onDone;
  onErrorRef.current = onError;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    let cancelled = false;
    let stepTimer;

    const advance = () => {
      setStep((s) => (s >= STEPS.length - 1 ? s : s + 1));
      stepTimer = setTimeout(advance, 1400);
    };
    stepTimer = setTimeout(advance, 1200);

    (async () => {
      try {
        const result = await runnerRef.current();
        if (cancelled) return;
        setStep(STEPS.length - 1);
        setTimeout(() => onDoneRef.current?.(result), 600);
      } catch (e) {
        console.error('Reconstruction failed:', e);
        if (!cancelled) onErrorRef.current?.(e);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(stepTimer);
    };
  }, []);

  return (
    <HudFrame label="3D Reconstruction · In Progress">
      <div className="relative aspect-square w-full rounded-md overflow-hidden hud-grid-bg flex flex-col items-center justify-center">
        <ProcessingPulse active />
        <div className="relative z-10">
          <AmethystOrb size={140} speaking />
        </div>

        <div className="mt-6 w-full px-6">
          {STEPS.map((s, i) => {
            const state = i < step ? 'done' : i === step ? 'active' : 'pending';
            return (
              <div
                key={s}
                className="flex items-center gap-2 py-1 text-[10px] font-mono uppercase tracking-[0.25em]"
                style={{
                  color:
                    state === 'done'
                      ? 'hsl(145 80% 65%)'
                      : state === 'active'
                        ? 'hsl(280 100% 80%)'
                        : 'hsla(0,0%,100%,0.3)',
                }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    background:
                      state === 'done'
                        ? 'hsl(145 90% 55%)'
                        : state === 'active'
                          ? 'hsl(280 100% 70%)'
                          : 'hsla(0,0%,100%,0.2)',
                    boxShadow:
                      state === 'active'
                        ? '0 0 10px hsla(280,100%,70%,0.7)'
                        : 'none',
                    animation: state === 'active' ? 'amethyst-pulse 1.2s ease-in-out infinite' : 'none',
                  }}
                />
                {s}
                {state === 'active' && <span className="ml-auto opacity-70">…</span>}
                {state === 'done' && <span className="ml-auto opacity-70">✓</span>}
              </div>
            );
          })}
        </div>
      </div>
    </HudFrame>
  );
}