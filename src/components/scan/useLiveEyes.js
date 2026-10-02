import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import {
  BUDGET, SCENE_CHANGE_DIFF, STEADY_DIFF, THUMB,
  cleanCandidates, coverCrop, frameDiff, lightingOf, lumaOf, settleReason, shouldClassify, toGray,
} from '@/lib/liveEyes';

const TICK_MS = 250;
const FRAME_EDGE = 448;
const ERROR_BACKOFF_MS = 6000;
const OFF = { status: 'off', candidates: [], quality: null, reason: null, meter: null, stale: false };

/**
 * useLiveEyes — Live Specimen Eyes for the scanner.
 *
 * Samples the camera into a 32×32 thumbnail four times a second, works out
 * whether the hunter is holding steady on something new in usable light
 * (src/lib/liveEyes.js), and only then sends the aiming square to
 * quickClassifySpecimen for a fast preview label.
 *
 * @param {object} opts
 * @param {React.RefObject<HTMLVideoElement>} opts.videoRef
 * @param {boolean} opts.enabled  Eyes toggled on (and the scanner is showing the camera)
 * @param {boolean} opts.ready    camera stream is playing
 * @param {string}  [opts.region] place name, a weak hint for the model
 * @param {'wet'|'dry'} [opts.wetDry]
 * @param {() => void} [opts.onUnauthorized]
 * @returns {{ status: 'off'|'watching'|'thinking'|'paused', candidates: Array, quality: string|null, reason: string|null, meter: object|null, stale: boolean }}
 *   `stale` is true while the camera points somewhere other than the frame the labels describe.
 */
export default function useLiveEyes({ videoRef, enabled, ready, region, wetDry, onUnauthorized }) {
  const [state, setState] = useState(OFF);
  const argsRef = useRef({ region, wetDry, onUnauthorized });
  argsRef.current = { region, wetDry, onUnauthorized };
  // Survives toggling so the rolling budget and the daily pause stick.
  const memory = useRef({ callTimes: [], pausedUntil: 0, pauseReason: null });

  useEffect(() => {
    if (!enabled) {
      setState((s) => (s.status === 'off' ? s : OFF));
      return undefined;
    }
    if (!ready) return undefined;

    const mem = memory.current;
    const r = {
      thumb: document.createElement('canvas'),
      frame: document.createElement('canvas'),
      prevGray: null,
      lastGray: null,
      steadySince: null,
      busy: false,
      lastCallAt: null,
      topName: null,
      stale: false,
      settle: { shown: null, pending: null, count: 0 },
    };
    let cancelled = false;

    const draw = (canvas, edge, readBack) => {
      const v = videoRef.current;
      if (!v || !v.videoWidth || v.readyState < 2) return null;
      const crop = coverCrop({ videoW: v.videoWidth, videoH: v.videoHeight, viewW: v.clientWidth, viewH: v.clientHeight });
      if (!crop.size) return null;
      if (canvas.width !== edge) { canvas.width = edge; canvas.height = edge; }
      const ctx = canvas.getContext('2d', readBack ? { willReadFrequently: true } : undefined);
      if (!ctx) return null;
      ctx.drawImage(v, crop.sx, crop.sy, crop.size, crop.size, 0, 0, edge, edge);
      return ctx;
    };

    const showReason = (reason) => {
      const next = settleReason(r.settle, reason);
      const changed = next.shown !== r.settle.shown;
      r.settle = next;
      if (changed) setState((s) => ({ ...s, reason: next.shown }));
    };

    const classify = async (gray) => {
      r.busy = true;
      const startedAt = Date.now();
      r.lastCallAt = startedAt;
      mem.callTimes = [...mem.callTimes.filter((t) => startedAt - t < BUDGET.windowMs), startedAt];
      setState((s) => ({ ...s, status: 'thinking' }));
      try {
        if (!draw(r.frame, FRAME_EDGE, false)) throw new Error('No camera frame');
        const blob = await new Promise((resolve) => r.frame.toBlob(resolve, 'image/jpeg', 0.72));
        if (!blob) throw new Error('Could not encode frame');
        if (cancelled) return;
        const file = new File([blob], 'live-eyes.jpg', { type: 'image/jpeg' });
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        if (cancelled) return;
        const { region: place, wetDry: wet } = argsRef.current;
        const res = await base44.functions.invoke('quickClassifySpecimen', {
          file_url,
          ...(place ? { region: place } : {}),
          wet_dry: wet === 'wet' ? 'wet' : 'dry',
        });
        if (cancelled) return;
        const data = res?.data || {};
        const candidates = data.specimen_visible === false ? [] : cleanCandidates(data.candidates);
        r.lastGray = gray;
        r.stale = false;
        const top = candidates[0];
        if (top && top.confidence >= 0.5 && top.name.toLowerCase() !== (r.topName || '').toLowerCase()) {
          try { navigator.vibrate?.(12); } catch { /* unsupported */ }
        }
        r.topName = top?.name || null;
        setState((s) => ({
          ...s,
          status: 'watching',
          candidates,
          quality: typeof data.quality === 'string' ? data.quality : null,
          meter: data.meter || s.meter,
          stale: false,
        }));
      } catch (err) {
        if (cancelled) return;
        const status = err?.status ?? err?.response?.status;
        const body = err?.data ?? err?.response?.data ?? {};
        if (status === 401) {
          setState(OFF);
          argsRef.current.onUnauthorized?.();
          return;
        }
        if (body?.code === 'live_budget') {
          const resetAt = Date.parse(body?.meter?.resetAt || '');
          mem.pausedUntil = Number.isFinite(resetAt) ? resetAt : Date.now() + 60 * 60 * 1000;
          mem.pauseReason = 'daily';
          setState((s) => ({ ...s, status: 'paused', reason: 'daily', meter: body?.meter || s.meter }));
          return;
        }
        // Too fast, or a transient failure: wait a little longer before the next try.
        const wait = body?.code === 'live_burst' ? Number(body?.retry_after_ms) || 2000 : ERROR_BACKOFF_MS;
        r.lastCallAt = Date.now() + wait;
        setState((s) => ({ ...s, status: 'watching' }));
      } finally {
        r.busy = false;
      }
    };

    const tick = () => {
      if (cancelled) return;
      const now = Date.now();
      if (mem.pausedUntil > now) {
        setState((s) => (s.status === 'paused' ? s : { ...s, status: 'paused', reason: mem.pauseReason }));
        return;
      }
      if (mem.pauseReason) {
        mem.pauseReason = null;
        setState((s) => ({ ...s, status: 'watching', reason: null }));
      }
      const ctx = draw(r.thumb, THUMB, true);
      if (!ctx) return;
      let rgba;
      try {
        rgba = ctx.getImageData(0, 0, THUMB, THUMB).data;
      } catch {
        return; // tainted or lost canvas; try again next tick
      }
      const gray = toGray(rgba);
      const diff = frameDiff(gray, r.prevGray);
      r.prevGray = gray;
      if (diff <= STEADY_DIFF) {
        if (r.steadySince == null) r.steadySince = now;
      } else {
        r.steadySince = null;
      }
      const sceneDiff = frameDiff(gray, r.lastGray);
      const stale = !!r.lastGray && sceneDiff >= SCENE_CHANGE_DIFF;
      if (stale !== r.stale) {
        r.stale = stale;
        setState((s) => ({ ...s, stale }));
      }
      const decision = shouldClassify({
        now,
        steadySince: r.steadySince,
        busy: r.busy,
        lastCallAt: r.lastCallAt,
        lighting: lightingOf(lumaOf(rgba)),
        sceneDiff,
        callTimes: mem.callTimes,
        hidden: typeof document !== 'undefined' && document.hidden,
      });
      showReason(decision.reason);
      if (decision.go) classify(gray);
    };

    setState((s) => (s.status === 'off' ? { ...OFF, status: 'watching' } : s));
    const id = setInterval(tick, TICK_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, ready, videoRef]);

  return state;
}
