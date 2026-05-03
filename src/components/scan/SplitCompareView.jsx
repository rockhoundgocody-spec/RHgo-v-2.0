import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeftRight } from 'lucide-react';

/**
 * SplitCompareView — draggable diagonal slider that reveals the live scan
 * image on the left and a high-def library 3D specimen on the right.
 *
 * Both panes get a parallax tilt on pointer move so the right side feels
 * like a 3D hologram. The clip line is controlled by `split` (0..1).
 */
export default function SplitCompareView({ leftImageUrl, rightImageUrl, leftLabel = 'Your Scan', rightLabel = 'Library Model' }) {
  const wrapRef = useRef(null);
  const tiltRef = useRef(null);
  const [split, setSplit] = useState(0.5);
  const dragging = useRef(false);

  // Tilt parallax (right pane only).
  useEffect(() => {
    const el = tiltRef.current;
    if (!el) return;
    const target = { x: 0, y: 0 };
    const cur = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const px = e.touches ? e.touches[0].clientX : e.clientX;
      const py = e.touches ? e.touches[0].clientY : e.clientY;
      target.x = ((py - cy) / r.height) * -8;
      target.y = ((px - cx) / r.width) * 8;
    };
    let raf;
    const tick = () => {
      cur.x += (target.x - cur.x) * 0.08;
      cur.y += (target.y - cur.y) * 0.08;
      el.style.transform = `perspective(1000px) rotateX(${cur.x}deg) rotateY(${cur.y}deg)`;
      raf = requestAnimationFrame(tick);
    };
    tick();
    window.addEventListener('mousemove', onMove);
    window.addEventListener('touchmove', onMove);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('touchmove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Drag handle for the divider.
  const setFromClientX = (clientX) => {
    const r = wrapRef.current?.getBoundingClientRect();
    if (!r) return;
    const v = (clientX - r.left) / r.width;
    setSplit(Math.max(0.05, Math.min(0.95, v)));
  };
  const onDown = (e) => {
    dragging.current = true;
    e.preventDefault();
  };
  useEffect(() => {
    const onMove = (e) => {
      if (!dragging.current) return;
      const x = e.touches ? e.touches[0].clientX : e.clientX;
      setFromClientX(x);
    };
    const onUp = () => { dragging.current = false; };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="relative aspect-square w-full rounded-lg overflow-hidden hud-grid-bg select-none"
      style={{ perspective: '1000px' }}
    >
      {/* RIGHT — library hologram (full background, tilted) */}
      <div
        ref={tiltRef}
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d', willChange: 'transform' }}
      >
        {rightImageUrl && (
          <img src={rightImageUrl} alt="library" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div
          className="absolute inset-0 mix-blend-screen pointer-events-none"
          style={{
            background:
              'radial-gradient(circle at 50% 40%, hsla(280,100%,70%,0.35), transparent 70%), linear-gradient(180deg, hsla(195,100%,55%,0.18), transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-25 mix-blend-overlay"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, hsla(195,100%,70%,0.3) 0 1px, transparent 1px 3px)',
          }}
        />
      </div>

      {/* LEFT — your scan, clipped */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `polygon(0 0, ${split * 100}% 0, ${split * 100}% 100%, 0 100%)` }}
      >
        {leftImageUrl && (
          <img src={leftImageUrl} alt="scan" className="absolute inset-0 w-full h-full object-cover" />
        )}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, hsla(220,80%,4%,0.2), transparent 30%, transparent 70%, hsla(220,80%,4%,0.4))',
          }}
        />
      </div>

      {/* Pane labels */}
      <div className="absolute top-3 left-3 text-[9px] font-mono uppercase tracking-[0.3em] text-hud-cyan/90 glow-hud">
        ◀ {leftLabel}
      </div>
      <div className="absolute top-3 right-3 text-[9px] font-mono uppercase tracking-[0.3em] text-amethyst-glow glow-amethyst">
        {rightLabel} ▶
      </div>

      {/* Divider line + handle */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: `${split * 100}%`,
          width: 2,
          background: 'linear-gradient(180deg, transparent, hsl(280 100% 75%), transparent)',
          boxShadow: '0 0 14px hsla(280,100%,70%,0.7)',
          transform: 'translateX(-1px)',
        }}
      />
      <div
        onMouseDown={onDown}
        onTouchStart={onDown}
        className="absolute top-1/2 -translate-y-1/2 cursor-ew-resize"
        style={{
          left: `${split * 100}%`,
          transform: `translate(-50%, -50%)`,
          width: 38,
          height: 38,
          borderRadius: 999,
          background: 'hsla(220,40%,5%,0.85)',
          border: '1px solid hsla(280,100%,70%,0.7)',
          boxShadow: '0 0 18px hsla(280,100%,60%,0.6), inset 0 0 12px hsla(280,100%,60%,0.3)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 5,
        }}
      >
        <ArrowLeftRight className="text-amethyst-glow" size={16} />
      </div>

      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 text-[8px] font-mono uppercase tracking-[0.3em] text-white/40">
        Drag · to · compare
      </div>
    </div>
  );
}