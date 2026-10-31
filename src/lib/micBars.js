/**
 * micBars — turns an AnalyserNode into the bar heights the voice waveform
 * draws. Shared by the live-mic meter and the recorder fallback so there is
 * exactly one implementation.
 */

const SMOOTH = 0.4;

/** Spectrum → bar heights, smoothed frame to frame. Pull-based: no timers. */
export function createBarSampler({ gain = 5.5 } = {}) {
  let bins = null;
  let state = [];

  return {
    /** Fills `out` with 0..1 bar heights from the analyser's live spectrum. */
    sample(analyser, out) {
      const n = out.length;
      if (state.length !== n) state = new Array(n).fill(0);
      if (analyser) {
        if (!bins || bins.length !== analyser.frequencyBinCount) {
          bins = new Uint8Array(analyser.frequencyBinCount);
        }
        analyser.getByteFrequencyData(bins);

        // Skip the lowest bins (room rumble) and the top (near-empty).
        const from = 2;
        const to = Math.max(from + n, Math.floor(bins.length * 0.62));
        const step = (to - from) / n;

        for (let i = 0; i < n; i++) {
          const start = from + Math.floor(i * step);
          const end = Math.max(start + 1, from + Math.floor((i + 1) * step));
          let peak = 0;
          for (let j = start; j < end && j < bins.length; j++) if (bins[j] > peak) peak = bins[j];
          const target = Math.min(1, (peak / 255) * gain);
          state[i] += (target - state[i]) * SMOOTH;
          out[i] = state[i];
        }
      } else {
        for (let i = 0; i < n; i++) {
          state[i] *= 0.9;
          out[i] = state[i];
        }
      }
      return out;
    },
  };
}

/** Time-domain → a single smoothed 0..1 loudness, for level-driven visuals. */
export function createLevelSampler({ gain = 5.5 } = {}) {
  let wave = null;
  let smooth = 0;

  return {
    sample(analyser) {
      if (!analyser) {
        smooth *= 0.9;
        return smooth;
      }
      if (!wave || wave.length !== analyser.fftSize) wave = new Uint8Array(analyser.fftSize);
      analyser.getByteTimeDomainData(wave);

      let sum = 0;
      for (let i = 0; i < wave.length; i++) {
        const v = (wave[i] - 128) / 128;
        sum += v * v;
      }
      const target = Math.min(1, Math.sqrt(sum / wave.length) * gain);
      smooth += (target - smooth) * 0.35;
      if (smooth < 0.001) smooth = 0;
      return smooth;
    },
  };
}