// The canvas owns its own clock; CSS animation and transform overrides cannot
// freeze the surface. Tilt remains optional and never gates ambient motion.
let tiltPermission;
export default function attachOrbMotion(host, canvas, scene) {
  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  const target = { x: 0, y: 0 }, tilt = { x: 0, y: 0 };
  let frame = 0, time = 0, last = 0, inView = true, lost = false, disposed = false;
  const active = () => !disposed && !lost && inView && !document.hidden;
  const tick = now => {
    frame = 0;
    if (!active()) return;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0;
    last = now;
    if (!preference.matches) time += dt;
    const ease = 1 - Math.exp(-dt * 7);
    tilt.x += ((preference.matches ? 0 : target.x) - tilt.x) * ease;
    tilt.y += ((preference.matches ? 0 : target.y) - tilt.y) * ease;
    scene.draw(time, preference.matches ? { x: 0, y: 0 } : tilt, preference.matches);
    host.dataset.orbRenderer = 'webgl';
    host.dataset.orbMotion = preference.matches ? 'reduced' : 'running';
    host.dataset.orbTime = time.toFixed(2);
    if (!preference.matches) frame = requestAnimationFrame(tick);
  };
  const resume = () => { cancelAnimationFrame(frame); frame = 0; last = 0; if (active()) frame = requestAnimationFrame(tick); };
  const resize = () => { scene.resize(Math.max(1, host.clientWidth), Math.max(1, host.clientHeight)); resume(); };
  const pointer = e => { target.x = e.clientX / window.innerWidth * 2 - 1; target.y = e.clientY / window.innerHeight * 2 - 1; };
  const orient = e => {
    if (e.gamma == null || e.beta == null) return;
    target.x = Math.max(-1, Math.min(1, e.gamma / 32));
    target.y = Math.max(-1, Math.min(1, (e.beta - 40) / 32));
  };
  const orientation = window.DeviceOrientationEvent;
  const requestTilt = () => {
    if (preference.matches || disposed) return;
    // Permission denial leaves automatic fluid motion and touch parallax intact.
    tiltPermission ||= orientation.requestPermission();
    tiltPermission.then(result => {
      if (result === 'granted' && !disposed) window.addEventListener('deviceorientation', orient);
    }, () => {});
  };
  const contextLost = e => { e.preventDefault(); lost = true; host.dataset.orbRenderer = 'fallback'; resume(); };
  const contextRestored = () => { lost = false; resize(); };
  const observer = new IntersectionObserver(([entry]) => { inView = entry.isIntersecting; resume(); });
  const sizes = new ResizeObserver(resize);
  observer.observe(host); sizes.observe(host);
  window.addEventListener('pointermove', pointer, { passive: true });
  if (orientation?.requestPermission) window.addEventListener('pointerdown', requestTilt, { once: true });
  else if (orientation) window.addEventListener('deviceorientation', orient);
  document.addEventListener('visibilitychange', resume);
  preference.addEventListener('change', resume);
  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', contextRestored);
  resize();
  return () => {
    disposed = true; cancelAnimationFrame(frame); observer.disconnect(); sizes.disconnect();
    window.removeEventListener('pointermove', pointer); window.removeEventListener('pointerdown', requestTilt);
    window.removeEventListener('deviceorientation', orient); document.removeEventListener('visibilitychange', resume);
    preference.removeEventListener('change', resume);
    canvas.removeEventListener('webglcontextlost', contextLost); canvas.removeEventListener('webglcontextrestored', contextRestored);
    scene.dispose();
  };
}