import React, { useEffect, useRef } from 'react';

const BAR_COUNT = 26;

/**
 * VoiceWaveform — the live voice waveform.
 *
 * Drawn on canvas from inside its own animation frame, so a moving waveform
 * never re-renders React. Reading the level is pull-based: getBars(out) fills
 * the bar heights for this frame only.
 */
export default function VoiceWaveform({ active, getBars, color = '#9FE8D0', height = 30 }) {
  const canvasRef = useRef(null);
  const barsRef = useRef(new Float32Array(BAR_COUNT));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const ctx = canvas.getContext('2d');
    let raf = 0;
    let phase = 0;

    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const w = canvas.clientWidth || 240;
      const h = canvas.clientHeight || height;
      const pw = Math.round(w * dpr);
      const ph = Math.round(h * dpr);
      if (canvas.width !== pw || canvas.height !== ph) { canvas.width = pw; canvas.height = ph; }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      const bars = barsRef.current;
      if (active && getBars) getBars(bars);
      else bars.fill(0);

      phase += 0.085;
      const gap = 2;
      const bw = Math.max(2, (w - gap * (BAR_COUNT - 1)) / BAR_COUNT);
      const mid = h / 2;

      ctx.fillStyle = color;
      for (let i = 0; i < BAR_COUNT; i++) {
        // With no live level (mic refused, quiet room) the bars breathe gently
        // so the indicator still reads as open and waiting.
        const breathe = active ? 0.09 + Math.sin(phase + i * 0.55) * 0.05 : 0.04;
        const level = Math.max(bars[i], breathe);
        const bh = Math.max(2, level * (h - 4));
        const x = i * (bw + gap);
        const r = Math.min(bw / 2, bh / 2);
        ctx.globalAlpha = 0.3 + Math.min(0.7, level * 1.6);
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, mid - bh / 2, bw, bh, r);
        else ctx.rect(x, mid - bh / 2, bw, bh);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      if (active) raf = requestAnimationFrame(draw);
    };

    draw();
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [active, getBars, color, height]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="block w-full"
      style={{ height }}
    />
  );
}