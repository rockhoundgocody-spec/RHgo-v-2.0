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