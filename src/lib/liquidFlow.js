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
export const CORE_FLOW_DURATION_S = 3.4;
export const CORE_FLOW_ANGLE_DEG = -52;

export function coreFlowAt(seconds, energy = 0, flare = 0) {
  const clampedEnergy = Math.min(1, Math.max(0, energy));
  const clampedFlare = Math.min(1, Math.max(0, flare));
  const speed = 1 + clampedEnergy * 0.85 + clampedFlare * 0.6;
  const phase = (seconds * speed * Math.PI * 2) / CORE_FLOW_DURATION_S;
  const rad = (CORE_FLOW_ANGLE_DEG * Math.PI) / 180;
  // Fast figure-8 Lissajous orbit rotated onto the core's cross-axis
  const u = Math.sin(phase);
  const v = Math.sin(phase * 2 + 0.85) * 0.58;
  const x = u * Math.cos(rad) - v * Math.sin(rad);
  const y = u * Math.sin(rad) + v * Math.cos(rad);
  // Rapid radial breath, torsional twist, and continuous core spin
  const pulse = (Math.sin((seconds * speed * Math.PI * 2) / 2.3 + 1.1) + 1) * 0.5;
  const twist = Math.sin((seconds * speed * Math.PI * 2) / 3.2 - 0.6);
  const caustic = (Math.cos(phase * 2.2 - 0.4) + 1) * 0.5;
  const spin = (seconds * 96 * speed + clampedFlare * 54) % 360;
  return {
    x,
    y,
    swell: (u + 1) * 0.5,
    pulse,
    twist,
    caustic,
    spin,
  };
}