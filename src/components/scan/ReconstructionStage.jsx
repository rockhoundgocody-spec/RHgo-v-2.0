import React, { useEffect, useRef, useState } from 'react';
import AmethystOrb from '@/components/visuals/AmethystOrb.jsx';

const STEPS = [
  'Uploading captures',
  'Aligning viewpoints',
  'Estimating depth',
  'Fusing point cloud',
  'Querying mineralogy AI',
  'Analysis complete',
];

/**
 * ReconstructionStage — runs the async `runner` and shows a progress list.
 * Steps advance on a timer ONLY while the runner is still working.
 * Once the runner resolves, we jump to the final step and call onDone.
 * The timer is always cleared before calling onDone to prevent regression.
 */
export default function ReconstructionStage({ runner, onDone, onError }) {
  const [step, setStep] = useState(0);
  const startedRef = useRef(false);
  const doneRef = useRef(false);
  const timerRef = useRef(null);
  const runnerRef = useRef(runner);
  const onDoneRef = useRef(onDone);
  const onErrorRef = useRef(onError);
  runnerRef.current = runner;
  onDoneRef.current = onDone;
  onErrorRef.current = onError;

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const MAX_AUTO_STEP = STEPS.length - 2; // never auto-advance to the last step

    const scheduleNext = (currentStep) => {
      if (doneRef.current) return;
      if (currentStep >= MAX_AUTO_STEP) return; // hold at second-to-last while waiting
      // Slow down near the end so it doesn't "spin" at the finish
      const delay = currentStep >= MAX_AUTO_STEP - 1 ? 4000 : 1600;
      timerRef.current = setTimeout(() => {
        if (doneRef.current) return;
        setStep((s) => {
          const next = Math.min(s + 1, MAX_AUTO_STEP);
          scheduleNext(next);
          return next;
        });
      }, delay);
    };

    scheduleNext(0);

    (async () => {
      try {
        const result = await runnerRef.current();
        // Kill the auto-advance timer FIRST, then finalize
        doneRef.current = true;
        clearTimeout(timerRef.current);
        setStep(STEPS.length - 1); // jump to "Analysis complete"
        setTimeout(() => onDoneRef.current?.(result), 700);
      } catch (e) {
        doneRef.current = true;
        clearTimeout(timerRef.current);
        console.error('Reconstruction failed:', e);
        onErrorRef.current?.(e);
      }
    })();

    return () => {
      doneRef.current = true;
      clearTimeout(timerRef.current);
    };
  }, []);

  const pct = Math.round((step / (STEPS.length - 1)) * 100);

  return (
    <div className="rounded-2xl overflow-hidden"
      style={{ background: 'hsla(265,40%,4%,0.95)', border: '1px solid hsla(280,60%,40%,0.25)', boxShadow: '0 0 40px hsla(280,80%,30%,0.2)' }}>

      {/* Orb + header */}
      <div className="flex flex-col items-center pt-8 pb-4 px-6"
        style={{ borderBottom: '1px solid hsla(280,40%,25%,0.2)', background: 'hsla(270,50%,5%,0.6)' }}>
        <AmethystOrb size={100} orbState="thinking" />
        <div className="mt-4 text-white/80 text-sm font-semibold">Analyzing Specimen…</div>
        <div className="text-white/35 text-[11px] mt-1">AI mineralogy running</div>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-mono uppercase tracking-[0.25em] text-white/40">Progress</span>
          <span className="text-[10px] font-mono text-amethyst-glow">{pct}%</span>
        </div>
        <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: 'linear-gradient(90deg, hsl(270,80%,50%), hsl(280,100%,75%))',
              boxShadow: '0 0 10px hsla(280,100%,65%,0.6)',
              transition: 'width 0.6s ease-out',
            }}
          />
        </div>
      </div>

      {/* Step list */}
      <div className="px-6 pt-4 pb-6 space-y-2">
        {STEPS.map((s, i) => {
          const state = i < step ? 'done' : i === step ? 'active' : 'pending';
          return (
            <div key={s} className="flex items-center gap-3">
              {/* Indicator */}
              <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{
                  background: state === 'done' ? 'hsla(145,80%,40%,0.3)' : state === 'active' ? 'hsla(280,80%,40%,0.3)' : 'hsla(220,30%,15%,0.4)',
                  border: `1px solid ${state === 'done' ? 'hsl(145,80%,55%)' : state === 'active' ? 'hsl(280,100%,70%)' : 'hsla(220,30%,35%,0.4)'}`,
                }}>
                {state === 'done' && <span className="text-[9px]" style={{ color: 'hsl(145,80%,65%)' }}>✓</span>}
                {state === 'active' && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amethyst-glow animate-pulse block"
                    style={{ boxShadow: '0 0 6px hsla(280,100%,70%,0.8)' }} />
                )}
              </div>

              <span className="text-[11px] font-mono uppercase tracking-[0.2em]"
                style={{
                  color: state === 'done' ? 'hsl(145,80%,65%)' : state === 'active' ? 'hsl(280,100%,82%)' : 'hsla(0,0%,100%,0.25)',
                }}>
                {s}
              </span>

              {state === 'active' && (
                <span className="ml-auto text-[10px] text-amethyst-glow/50 font-mono animate-pulse">running</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}