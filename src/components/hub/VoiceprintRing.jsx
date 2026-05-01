import React, { useEffect, useRef } from 'react';

/**
 * VoiceprintRing — circular waveform that wraps the orb's well rim.
 * Reads from getAmplitude/getSpectrum every frame and traces a polar
 * waveform on a 2D canvas. When listening to mic input, modulates with
 * separate liveLevel value.
 *
 * Pure canvas — zero React re-renders.
 */
export default function VoiceprintRing({
  size = 280,
  active = false,
  getAmplitude,
  getSpectrum,
  getMicLevel, // optional () => 0..1
  speaking = false,
  listening = false,
}) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    ctx.scale(dpr, dpr);

    const N = 96; // samples around ring
    const history = new Array(N).fill(0);
    let raf;

    const tick = () => {
      ctx.clearRect(0, 0, size, size);
      if (!active) {
        raf = requestAnimationFrame(tick);
        return;
      }

      const amp = getAmplitude ? getAmplitude() || 0 : 0;
      const spec = getSpectrum ? getSpectrum() : { bass: 0, mid: 0, treble: 0 };
      const mic = getMicLevel ? getMicLevel() || 0 : 0;
      const energy = speaking ? amp : listening ? mic : 0.05;

      // shift history and seed new sample
      history.shift();
      const t = performance.now() * 0.002;
      const bandJitter =
        (spec.bass || 0) * Math.sin(t) +
        (spec.mid || 0) * Math.sin(t * 2.3) +
        (spec.treble || 0) * Math.sin(t * 5.7);
      history.push(energy * 0.7 + bandJitter * 0.4 + Math.random() * 0.05);

      const cx = size / 2;
      const cy = size / 2;
      const baseR = size * 0.46;

      ctx.lineWidth = 1.5;
      ctx.strokeStyle = speaking
        ? 'hsla(280, 100%, 75%, 0.85)'
        : listening
        ? 'hsla(155, 90%, 65%, 0.85)'
        : 'hsla(265, 70%, 70%, 0.5)';
      ctx.shadowBlur = 12;
      ctx.shadowColor = speaking ? 'hsla(280,100%,70%,0.8)' : 'hsla(155,90%,60%,0.7)';

      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const v = history[i];
        const r = baseR + v * 26;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();

      // inner echo ring — half opacity, slightly inside
      ctx.lineWidth = 0.8;
      ctx.globalAlpha = 0.4;
      ctx.beginPath();
      for (let i = 0; i < N; i++) {
        const a = (i / N) * Math.PI * 2 - Math.PI / 2;
        const v = history[i] * 0.5;
        const r = baseR - 6 + v * 12;
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [size, active, getAmplitude, getSpectrum, getMicLevel, speaking, listening]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 m-auto pointer-events-none"
      style={{ width: size, height: size }}
    />
  );
}