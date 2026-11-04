/**
 * One liquid tempo for the whole app.
 *
 * The Hub backdrop (`.hub-iridescent` / `.hub-aurora` in src/index.css) drifts on
 * this exact cycle and diagonal. Clover's mercury skin reads the same numbers, so
 * the room and the shell flow as a single body of liquid.
 *
 * Keep these in step with --rhgo-flow-duration / --rhgo-flow-angle in src/index.css.
 */
export const FLOW_DURATION_S = 16;   // one full surge, out and back
export const FLOW_ANGLE_DEG = 34;    // travel line: down and to the right

/**
 * Where the liquid sits in its cycle at `seconds`.
 * x/y travel the flow diagonal from -1 → +1 → -1 (eased), swell eases 0 → 1 → 0.
 */
export function flowAt(seconds) {
  const cycle = ((seconds % FLOW_DURATION_S) + FLOW_DURATION_S) % FLOW_DURATION_S;
  const swing = Math.sin((cycle / FLOW_DURATION_S) * Math.PI * 2 - Math.PI / 2);
  const rad = (FLOW_ANGLE_DEG * Math.PI) / 180;
  return {
    x: Math.cos(rad) * swing,
    y: Math.sin(rad) * swing,
    swell: (swing + 1) / 2,
  };
}

/**
 * Independent inner-core tempo — non-harmonic period (9.4s) and cross-axis
 * angle (-52°) so the scene inside the orb's inner circle moves on its own
 * living Lissajous / orbital rhythm, never phase-locking with the 16s / 34°
 * backdrop or the outer mercury shell behind it.
 */
export const CORE_FLOW_DURATION_S = 6.2;
export const CORE_FLOW_ANGLE_DEG = -52;

export function coreFlowAt(seconds, energy = 0, flare = 0) {
  const clampedEnergy = Math.min(1, Math.max(0, energy));
  const clampedFlare = Math.min(1, Math.max(0, flare));
  const t = seconds * (1 + clampedEnergy * 0.85);
  const phase = (t * Math.PI * 2) / CORE_FLOW_DURATION_S;
  const rad = (CORE_FLOW_ANGLE_DEG * Math.PI) / 180;

  // Dual-harmonic fluid current (Lissajous drift + secondary cross-wave)
  const amp = 0.78 + clampedEnergy * 0.35;
  const u = Math.sin(phase) + Math.sin(phase * 1.7 + 1.3) * 0.35;
  const v = Math.sin(phase * 1.35 + 0.85) * 0.65 + Math.cos(phase * 2.1 - 0.5) * 0.25;
  const x = (u * Math.cos(rad) - v * Math.sin(rad)) * amp;
  const y = (u * Math.sin(rad) + v * Math.cos(rad)) * amp;

  // Organic fluid undulation (volume-preserving stretch, gentle sway, no 360 spin)
  const waveA = Math.sin(phase * 1.25 + 0.6);
  const waveB = Math.cos(phase * 1.65 - 0.9);
  const pulse = (waveA + 1) * 0.5;
  const twist = Math.sin(phase * 0.9 - 0.4) * 0.6 + waveB * 0.4;
  const caustic = Math.min(1, (Math.cos(phase * 1.5 - 0.4) + 1) * 0.5 + clampedEnergy * 0.45);
  const skewX = Math.sin(phase * 1.4 + 0.3) * (2.6 + clampedEnergy * 2.8 + clampedFlare * 2.2);
  const skewY = Math.cos(phase * 1.15 - 0.7) * (2.2 + clampedEnergy * 2.4 + clampedFlare * 1.8);

  return {
    x,
    y,
    swell: (Math.sin(phase) + 1) * 0.5,
    pulse,
    twist,
    caustic,
    skewX,
    skewY,
  };
}