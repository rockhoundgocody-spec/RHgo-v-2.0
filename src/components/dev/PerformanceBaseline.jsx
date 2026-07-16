/**
 * PerformanceBaseline — runs a one-shot diagnostic sweep and displays
 * loading, speed, and latency baselines in a HUD panel.
 *
 * Measures:
 *   LOADING  — Navigation Timing: TTFB, DOMContentLoaded, load complete
 *   SPEED    — Paint API: FCP, LCP, TBT estimate, JS heap size
 *   LATENCY  — live round-trip to base44 backend (3 sequential API calls)
 *   JANK     — 2-second FPS sample via requestAnimationFrame
 */
import React, { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, Gauge, Zap, Clock, Cpu, RefreshCw } from 'lucide-react';

const RUNTIME = 2; // seconds for FPS sample

function getNavTiming() {
  const nav = performance.getEntriesByType('navigation')[0];
  if (!nav) return null;
  return {
    ttfb: Math.round(nav.responseStart - nav.requestStart),
    domComplete: Math.round(nav.domComplete),
    loadComplete: Math.round(nav.loadEventEnd || nav.domComplete),
    transferSize: nav.transferSize,
    decodedSize: nav.decodedBodySize,
    duration: Math.round(nav.duration),
  };
}

function getPaintMetrics() {
  const paints = performance.getEntriesByType('paint');
  const fcp = paints.find(p => p.name === 'first-contentful-paint');
  const lcpEntries = performance.getEntriesByType('largest-contentful-paint');
  const lcp = lcpEntries[lcpEntries.length - 1];
  return {
    fcp: fcp ? Math.round(fcp.startTime) : null,
    lcp: lcp ? Math.round(lcp.startTime) : null,
  };
}

function getMemory() {
  if (performance.memory) {
    return {
      usedJS: Math.round(performance.memory.usedJSHeapSize / 1048576),
      totalJS: Math.round(performance.memory.totalJSHeapSize / 1048576),
      limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
    };
  }
  return null;
}

async function measureLatency() {
  // Three sequential real API calls — establishes round-trip baseline
  const calls = [];
  for (let i = 0; i < 3; i++) {
    const t0 = performance.now();
    try {
      await base44.entities.Mineral.list('-created_date', 1);
      calls.push({ ms: Math.round(performance.now() - t0), ok: true });
    } catch {
      calls.push({ ms: Math.round(performance.now() - t0), ok: false });
    }
  }
  const ok = calls.filter(c => c.ok);
  return {
    calls,
    avg: ok.length ? Math.round(ok.reduce((s, c) => s + c.ms, 0) / ok.length) : null,
    min: ok.length ? Math.min(...ok.map(c => c.ms)) : null,
    max: ok.length ? Math.max(...ok.map(c => c.ms)) : null,
  };
}

function measureFPS(duration = RUNTIME) {
  return new Promise((resolve) => {
    let frames = 0;
    let raf;
    const start = performance.now();
    const tick = () => {
      frames++;
      if (performance.now() - start < duration * 1000) {
        raf = requestAnimationFrame(tick);
      } else {
        cancelAnimationFrame(raf);
        const fps = Math.round((frames / duration));
        resolve({ fps, frames, duration });
      }
    };
    raf = requestAnimationFrame(tick);
  });
}

function Metric({ icon: Icon, label, value, unit, hint, color = 'text-hud-cyan' }) {
  return (
    <div className="flex items-start gap-2.5 py-1.5">
      <Icon size={13} className={color + ' mt-0.5 flex-shrink-0'} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[11px] text-white/50">{label}</span>
          <span className="text-sm font-mono font-bold text-white tabular-nums">
            {value}<span className="text-[10px] text-white/40 ml-0.5">{unit}</span>
          </span>
        </div>
        {hint && <p className="text-[9px] text-white/25 mt-0.5 leading-snug">{hint}</p>}
      </div>
    </div>
  );
}

function SectionTitle({ icon: Icon, children, color }) {
  return (
    <div className={`flex items-center gap-1.5 mb-1.5 pb-1.5 border-b border-white/8 ${color}`}>
      <Icon size={11} />
      <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{children}</span>
    </div>
  );
}

export default function PerformanceBaseline({ onClose }) {
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(true);
  const [error, setError] = useState(null);
  const fpsRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Wait for load + paint to settle
        await new Promise(r => setTimeout(r, 300));

        const nav = getNavTiming();
        const paint = getPaintMetrics();
        const mem = getMemory();
        const latency = await measureLatency();
        const fps = await measureFPS();

        if (cancelled) return;

        // Resource summary — count JS/CSS bundles
        const resources = performance.getEntriesByType('resource');
        const jsResources = resources.filter(r => r.name.match(/\.js($|\?)/));
        const totalTransfer = resources.reduce((s, r) => s + (r.transferSize || 0), 0);

        setResults({
          nav,
          paint,
          mem,
          latency,
          fps,
          resourceCount: resources.length,
          jsCount: jsResources.length,
          totalTransferKB: Math.round(totalTransfer / 1024),
          measuredAt: new Date().toISOString(),
        });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setRunning(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const rerun = () => {
    setResults(null);
    setError(null);
    setRunning(true);
    // Re-trigger the effect
    setTimeout(() => {
      (async () => {
        try {
          await new Promise(r => setTimeout(r, 200));
          const nav = getNavTiming();
          const paint = getPaintMetrics();
          const mem = getMemory();
          const latency = await measureLatency();
          const fps = await measureFPS();
          const resources = performance.getEntriesByType('resource');
          setResults({
            nav, paint, mem, latency, fps,
            resourceCount: resources.length,
            jsCount: resources.filter(r => r.name.match(/\.js($|\?)/)).length,
            totalTransferKB: Math.round(resources.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
            measuredAt: new Date().toISOString(),
          });
        } catch (err) { setError(err.message); }
        finally { setRunning(false); }
      })();
    }, 100);
  };

  const fpsColor = !results ? 'text-white/40' :
    results.fps.fps >= 55 ? 'text-emerald-400' :
    results.fps.fps >= 40 ? 'text-amber-400' : 'text-rose-400';
  const lcpColor = !results?.paint?.lcp ? 'text-white/40' :
    results.paint.lcp < 2500 ? 'text-emerald-400' :
    results.paint.lcp < 4000 ? 'text-amber-400' : 'text-rose-400';

  return (
    <div
      className="fixed top-3 left-3 right-3 z-[100] max-w-md mx-auto rounded-2xl overflow-hidden"
      style={{
        background: 'hsla(220, 40%, 8%, 0.96)',
        border: '1px solid hsla(195, 100%, 60%, 0.35)',
        boxShadow: '0 8px 40px -8px hsla(195, 100%, 40%, 0.4)',
        backdropFilter: 'blur(20px)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/8"
        style={{ background: 'hsla(215, 70%, 20%, 0.5)' }}>
        <div className="flex items-center gap-2">
          <Gauge size={15} className="text-hud-cyan" />
          <span className="text-xs font-bold text-white tracking-wide">Performance Baseline</span>
          {running && (
            <span className="flex items-center gap-1 text-[10px] text-hud-cyan">
              <span className="w-1.5 h-1.5 rounded-full bg-hud-cyan animate-pulse" /> measuring…
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={rerun} disabled={running}
            className="text-white/40 hover:text-white/70 transition disabled:opacity-30">
            <RefreshCw size={13} className={running ? 'animate-spin' : ''} />
          </button>
          {onClose && (
            <button onClick={onClose} className="text-white/40 hover:text-white/70 transition text-xs">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-3 max-h-[70vh] overflow-y-auto">

        {error && (
          <div className="text-xs text-rose-400 p-2 rounded-lg bg-rose-500/10 border border-rose-500/20">
            {error}
          </div>
        )}

        {/* LOADING */}
        <div>
          <SectionTitle icon={Clock} color="text-hud-cyan" >Loading</SectionTitle>
          {results?.nav ? (
            <>
              <Metric icon={Zap} label="TTFB" value={results.nav.ttfb} unit="ms"
                hint="Server response time — first byte to browser" />
              <Metric icon={Clock} label="DOM Complete" value={results.nav.domComplete} unit="ms"
                hint="HTML parsed + DOM ready" />
              <Metric icon={Clock} label="Full Load" value={results.nav.loadComplete} unit="ms"
                hint="All resources (JS, CSS, images) loaded" />
              {results.nav.transferSize > 0 && (
                <Metric icon={Activity} label="HTML Transfer" value={Math.round(results.nav.transferSize / 1024)} unit="KB"
                  hint={`Decoded: ${Math.round(results.nav.decodedSize / 1024)} KB`} />
              )}
            </>
          ) : <p className="text-[10px] text-white/30 py-1">Gathering…</p>}
        </div>

        {/* SPEED / PAINT */}
        <div>
          <SectionTitle icon={Zap} color="text-amethyst-glow" >Speed & Paint</SectionTitle>
          {results?.paint ? (
            <>
              <Metric icon={Zap} label="FCP (First Paint)" value={results.paint.fcp ?? '—'} unit="ms"
                hint="First content appears on screen" />
              <Metric icon={Gauge} label="LCP (Largest Paint)" value={results.paint.lcp ?? '—'} unit="ms"
                hint="Largest element visible — Google targets < 2500ms"
                color={lcpColor} />
            </>
          ) : <p className="text-[10px] text-white/30 py-1">Gathering…</p>}

          {results?.mem && (
            <Metric icon={Cpu} label="JS Heap Used" value={results.mem.usedJS} unit={`MB / ${results.mem.totalJS}MB`}
              hint={`Heap limit: ${results.mem.limit}MB`} color="text-amber-400" />
          )}

          {results && (
            <>
              <Metric icon={Activity} label="Resources Loaded" value={results.resourceCount} unit={`(${results.jsCount} JS)`}
                hint={`Total transfer: ${results.totalTransferKB} KB`} />
            </>
          )}
        </div>

        {/* LATENCY */}
        <div>
          <SectionTitle icon={Activity} color="text-emerald-400" >API Latency</SectionTitle>
          {results?.latency ? (
            <>
              <Metric icon={Clock} label="Avg Round-Trip" value={results.latency.avg ?? '—'} unit="ms"
                hint="3 sequential Mineral.list calls to base44 backend" color="text-emerald-400" />
              <Metric icon={Activity} label="Min / Max" value={
                results.latency.min != null ? `${results.latency.min}–${results.latency.max}` : '—'
              } unit="ms" hint="Spread shows variance / cold-cache penalty" />
              <div className="flex items-center gap-1.5 mt-1">
                {results.latency.calls.map((c, i) => (
                  <div key={i} className="flex-1 text-center py-1 rounded text-[9px] font-mono"
                    style={{
                      background: c.ok ? 'hsla(145,70%,30%,0.15)' : 'hsla(0,70%,40%,0.15)',
                      border: `1px solid ${c.ok ? 'hsla(145,70%,40%,0.3)' : 'hsla(0,70%,50%,0.3)'}`,
                      color: c.ok ? 'hsl(145,80%,65%)' : 'hsl(0,80%,70%)',
                    }}>
                    {c.ms}ms
                  </div>
                ))}
              </div>
            </>
          ) : <p className="text-[10px] text-white/30 py-1">Gathering…</p>}
        </div>

        {/* JANK / FPS */}
        <div>
          <SectionTitle icon={Gauge} color={fpsColor} >Frame Rate (Jank)</SectionTitle>
          {results?.fps ? (
            <>
              <Metric icon={Gauge} label="Measured FPS" value={results.fps.fps} unit="fps"
                hint={`${results.fps.frames} frames in ${results.fps.duration}s — target 60fps`}
                color={fpsColor} />
              <div className="mt-1.5 h-8 rounded-lg overflow-hidden flex items-end gap-px"
                style={{ background: 'hsla(0,0%,0%,0.3)' }}>
                {Array.from({ length: 60 }).map((_, i) => {
                  const active = i < results.fps.fps;
                  return (
                    <div key={i} className="flex-1 h-full transition-all"
                      style={{
                        background: active
                          ? (i >= 55 ? 'hsl(145,80%,55%)' : i >= 40 ? 'hsl(45,90%,55%)' : 'hsl(0,80%,55%)')
                          : 'hsla(0,0%,100%,0.05)',
                      }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] text-white/30 mt-0.5 font-mono">
                <span>0</span><span>30</span><span>60</span>
              </div>
            </>
          ) : <p className="text-[10px] text-white/30 py-1">Sampling 2s…</p>}
        </div>

        {/* Summary */}
        {results && (
          <div className="pt-2 mt-1 border-t border-white/8">
            <p className="text-[9px] text-white/30 leading-relaxed font-mono">
              Measured {new Date(results.measuredAt).toLocaleTimeString()} · {navigator.userAgent.match(/Mobile|Android|iPhone/) ? 'Mobile' : 'Desktop'} · {navigator.hardwareConcurrency || '?'} cores
            </p>
          </div>
        )}
      </div>
    </div>
  );
}