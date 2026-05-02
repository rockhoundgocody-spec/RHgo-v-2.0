import React, { useEffect, useRef } from 'react';

/**
 * WebGLTrackingLayer — placeholder for the real-time object tracking
 * pipeline. Renders a transparent canvas sized to its parent and mocks
 * detection boxes that drift around the frame.
 *
 * Replace the `mockDetections` loop with a real ML pipeline (TF.js,
 * MediaPipe, ONNX Runtime Web, etc.) that consumes the <video> element
 * and emits bounding boxes + class labels.
 */
export default function WebGLTrackingLayer({ active = true }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let raf;
    let t = 0;

    const resize = () => {
      const r = canvas.getBoundingClientRect();
      canvas.width = r.width * devicePixelRatio;
      canvas.height = r.height * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // === MOCK DETECTIONS ===
    // Each box drifts on a sinusoid to suggest live tracking.
    const detections = [
      { id: 'A1', label: 'CANDIDATE·A', cx: 0.5, cy: 0.5, w: 0.42, h: 0.42, conf: 0.0, color: 'hsl(195 100% 60%)' },
      { id: 'B7', label: 'EDGE·MARKER', cx: 0.22, cy: 0.7, w: 0.18, h: 0.14, conf: 0.0, color: 'hsl(180 100% 55%)' },
      { id: 'C3', label: 'TEXTURE·NODE', cx: 0.78, cy: 0.28, w: 0.16, h: 0.12, conf: 0.0, color: 'hsl(210 100% 65%)' },
    ];

    const draw = () => {
      t += 0.016;
      const w = canvas.width / devicePixelRatio;
      const h = canvas.height / devicePixelRatio;
      ctx.clearRect(0, 0, w, h);
      if (!active) {
        raf = requestAnimationFrame(draw);
        return;
      }

      detections.forEach((d, i) => {
        // drift
        const dx = Math.sin(t * 0.6 + i * 1.7) * 0.04;
        const dy = Math.cos(t * 0.5 + i * 2.3) * 0.04;
        const conf = Math.max(0, Math.min(1, 0.5 + Math.sin(t * 0.7 + i) * 0.5));
        d.conf += (conf - d.conf) * 0.08;

        const bx = (d.cx + dx - d.w / 2) * w;
        const by = (d.cy + dy - d.h / 2) * h;
        const bw = d.w * w;
        const bh = d.h * h;

        // bracket-style bounding box
        const cornerLen = Math.min(bw, bh) * 0.18;
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = d.color;
        ctx.shadowBlur = 8;

        // four L-corners
        const corners = [
          [bx, by, bx + cornerLen, by, bx, by + cornerLen],
          [bx + bw, by, bx + bw - cornerLen, by, bx + bw, by + cornerLen],
          [bx + bw, by + bh, bx + bw - cornerLen, by + bh, bx + bw, by + bh - cornerLen],
          [bx, by + bh, bx + cornerLen, by + bh, bx, by + bh - cornerLen],
        ];
        corners.forEach(([x1, y1, x2, y2, x3, y3]) => {
          ctx.beginPath();
          ctx.moveTo(x2, y2);
          ctx.lineTo(x1, y1);
          ctx.lineTo(x3, y3);
          ctx.stroke();
        });

        // faint center crosshair
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh / 2, 2, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.fill();

        // label tag (top-left)
        ctx.shadowBlur = 0;
        const tag = `${d.id} · ${d.label} · ${(d.conf * 100).toFixed(0)}%`;
        ctx.font = '9px ui-monospace, SFMono-Regular, monospace';
        const tw = ctx.measureText(tag).width + 8;
        const th = 14;
        ctx.fillStyle = 'hsla(220,40%,5%,0.75)';
        ctx.fillRect(bx, by - th - 2, tw, th);
        ctx.strokeStyle = d.color;
        ctx.lineWidth = 1;
        ctx.strokeRect(bx + 0.5, by - th - 1.5, tw, th);
        ctx.fillStyle = d.color;
        ctx.fillText(tag, bx + 4, by - 5);

        // confidence bar
        ctx.fillStyle = 'hsla(220,40%,5%,0.6)';
        ctx.fillRect(bx, by + bh + 4, bw, 3);
        ctx.fillStyle = d.color;
        ctx.fillRect(bx, by + bh + 4, bw * d.conf, 3);
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [active]);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ mixBlendMode: 'screen' }}
      />
      {/* placeholder watermark */}
      <div className="absolute bottom-2 right-2 text-[8px] font-mono uppercase tracking-[0.3em] text-hud-cyan/40 pointer-events-none">
        WebGL·Tracking · Placeholder
      </div>
    </>
  );
}