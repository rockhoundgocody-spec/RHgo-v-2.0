import React, { useEffect, useRef } from "react";

/** GPU-light crystalline field. Canvas 2D, 30fps cap, pauses offscreen. */
export default function AuthChamberCanvas() {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: true });
    let raf = 0;
    let running = true;
    let last = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize, { passive: true });

    const vis = () => {
      running = document.visibilityState === "visible";
      if (running) tick(performance.now());
    };
    document.addEventListener("visibilitychange", vis);

    const tick = (now) => {
      if (!running) return;
      raf = requestAnimationFrame(tick);
      if (now - last < 33) return;
      last = now;
      const w = window.innerWidth;
      const h = window.innerHeight;
      const t = now * 0.00018;
      ctx.clearRect(0, 0, w, h);

      const g = ctx.createRadialGradient(w * 0.82, h * -0.04, 20, w * 0.7, 80, w * 0.7);
      g.addColorStop(0, "rgba(167,139,250,0.22)");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const g2 = ctx.createRadialGradient(w * 0.08, h * 1.05, 10, w * 0.2, h, w * 0.55);
      g2.addColorStop(0, "rgba(46,230,166,0.14)");
      g2.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < 7; i++) {
        const x = w * (0.15 + 0.12 * i) + Math.sin(t * 1.4 + i) * 28;
        const y = h * (0.22 + (i % 3) * 0.2) + Math.cos(t * 1.1 + i * 0.7) * 22;
        const r = 40 + (i % 3) * 18;
        const blob = ctx.createRadialGradient(x, y, 0, x, y, r);
        blob.addColorStop(0, i % 2 ? "rgba(232,195,106,0.08)" : "rgba(46,230,166,0.07)");
        blob.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = blob;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    };
    raf = requestAnimationFrame(tick);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="fixed inset-0 -z-10 pointer-events-none"
      style={{ background: "linear-gradient(180deg,#05070B,#0B1020)" }}
    />
  );
}
