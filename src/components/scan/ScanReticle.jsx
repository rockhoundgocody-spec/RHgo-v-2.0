import React, { useEffect, useRef } from 'react';

/**
 * ScanReticle — animated targeting ring that reacts to scan state.
 * States: idle | scanning | processing | locked
 */
export default function ScanReticle({ state = 'idle', signal = 0, size = 220 }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(null);
  const tRef = useRef(0);
  const stateRef = useRef(state);
  const signalRef = useRef(signal);
  stateRef.current = state;
  signalRef.current = signal;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const cx = size / 2;
    const cy = size / 2;

    const COLORS = {
      idle:       { main: 'hsla(280,80%,70%,0.55)',  arc: 'hsla(280,100%,75%,0.9)',  glow: 'hsla(280,100%,65%,0.5)' },
      scanning:   { main: 'hsla(280,100%,75%,0.7)', arc: 'hsl(280,100%,85%)',        glow: 'hsla(280,100%,70%,0.7)' },
      processing: { main: 'hsla(195,100%,70%,0.7)', arc: 'hsl(195,100%,80%)',        glow: 'hsla(195,100%,60%,0.7)' },
      locked:     { main: 'hsla(145,80%,55%,0.8)',   arc: 'hsl(145,80%,70%)',         glow: 'hsla(145,80%,55%,0.8)' },
    };

    const draw = (ts) => {
      tRef.current = ts / 1000;
      const t = tRef.current;
      const s = stateRef.current;
      const sig = signalRef.current;
      const col = COLORS[s] || COLORS.idle;

      ctx.clearRect(0, 0, size, size);

      const R1 = size * 0.42; // outer ring
      const R2 = size * 0.30; // inner ring
      const R3 = size * 0.18; // core

      // ── Outer spinning dashes (idle + scanning) ──
      if (s === 'idle' || s === 'scanning') {
        const speed = s === 'scanning' ? 1.2 : 0.4;
        const dashCount = 24;
        const gap = (Math.PI * 2) / dashCount;
        ctx.save();
        ctx.strokeStyle = col.main;
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        for (let i = 0; i < dashCount; i++) {
          const a = i * gap + t * speed;
          const alpha = 0.3 + 0.5 * Math.abs(Math.sin(i * 0.9 + t * 2));
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(cx, cy, R1, a, a + gap * 0.4);
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.restore();
      }

      // ── Processing: spinning arcs ──
      if (s === 'processing') {
        for (let arc = 0; arc < 3; arc++) {
          const offset = (arc / 3) * Math.PI * 2;
          const arcLen = 0.6 + 0.3 * Math.sin(t * 1.5 + arc);
          const start = t * (1.5 + arc * 0.3) + offset;
          const grad = ctx.createLinearGradient(
            cx + Math.cos(start) * R1, cy + Math.sin(start) * R1,
            cx + Math.cos(start + arcLen) * R1, cy + Math.sin(start + arcLen) * R1
          );
          grad.addColorStop(0, 'transparent');
          grad.addColorStop(0.5, col.arc);
          grad.addColorStop(1, 'transparent');
          ctx.save();
          ctx.strokeStyle = grad;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = col.glow;
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(cx, cy, R1, start, start + arcLen);
          ctx.stroke();
          ctx.restore();
        }
      }

      // ── Locked: full glowing ring ──
      if (s === 'locked') {
        const pulse = 0.75 + 0.25 * Math.sin(t * 3);
        ctx.save();
        ctx.strokeStyle = col.arc;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = pulse;
        ctx.shadowColor = col.glow;
        ctx.shadowBlur = 16;
        ctx.beginPath();
        ctx.arc(cx, cy, R1, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }

      // ── Progress arc (signal fill) ──
      const fillAngle = sig * Math.PI * 2;
      ctx.save();
      ctx.strokeStyle = col.arc;
      ctx.lineWidth = 2;
      ctx.shadowColor = col.glow;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(cx, cy, R2, -Math.PI / 2, -Math.PI / 2 + fillAngle);
      ctx.stroke();
      ctx.restore();

      // ── Track ring (always) ──
      ctx.save();
      ctx.strokeStyle = 'hsla(270,40%,50%,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, R2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      // ── Corner tick marks at 4 cardinal positions ──
      const corners = [0, Math.PI / 2, Math.PI, Math.PI * 1.5];
      corners.forEach((angle) => {
        const ax = cx + Math.cos(angle) * R1;
        const ay = cy + Math.sin(angle) * R1;
        const bx = cx + Math.cos(angle) * (R1 + 10);
        const by = cy + Math.sin(angle) * (R1 + 10);
        ctx.save();
        ctx.strokeStyle = col.main;
        ctx.lineWidth = 2;
        ctx.shadowColor = col.glow;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.restore();
      });

      // ── Core dot ──
      const coreR = R3 * (0.5 + 0.15 * Math.sin(t * (s === 'processing' ? 4 : 2)));
      ctx.save();
      ctx.fillStyle = col.main;
      ctx.shadowColor = col.glow;
      ctx.shadowBlur = 20;
      ctx.globalAlpha = s === 'idle' ? 0.5 : 0.85;
      ctx.beginPath();
      ctx.arc(cx, cy, coreR, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameRef.current);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: size, height: size, pointerEvents: 'none' }}
    />
  );
}