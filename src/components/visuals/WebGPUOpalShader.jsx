import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import {
  Fn, vec2, vec3, vec4, float, uniform, uv, mix, sin, cos, fract, length, smoothstep, mx_fractal_noise_float, time, abs,
} from 'three/tsl';

/**
 * WebGPU + TSL black-opal shader with real compute-driven flow.
 * Falls back to null if WebGPU unavailable — caller renders WebGL shader instead.
 *
 * Audio-reactive: bass=billows, mid=swirl, treble=shimmer.
 */
export default function WebGPUOpalShader({
  intensity = 1.0,
  speed = 0.3,
  hueShift = 0,
  getAmplitude,
  getSpectrum,
  onUnsupported,
}) {
  const mountRef = useRef(null);
  const ampRef = useRef(getAmplitude);
  const specRef = useRef(getSpectrum);
  const [ready, setReady] = useState(false);
  ampRef.current = getAmplitude;
  specRef.current = getSpectrum;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    if (typeof navigator === 'undefined' || !navigator.gpu) {
      onUnsupported?.();
      return;
    }

    let renderer, scene, camera, mesh, raf, ro;
    let disposed = false;

    const init = async () => {
      try {
        renderer = new THREE.WebGPURenderer({ alpha: true, antialias: true });
        await renderer.init();
        if (disposed) { renderer.dispose(); return; }

        const w = mount.clientWidth || 300;
        const h = mount.clientHeight || 300;
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);

        scene = new THREE.Scene();
        camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        // Audio uniforms — driven each frame from getAmplitude/getSpectrum
        const uAmp = uniform(0);
        const uBass = uniform(0);
        const uMid = uniform(0);
        const uTreble = uniform(0);
        const uIntensity = uniform(intensity);
        const uHueShift = uniform(hueShift);
        const uSpeed = uniform(speed);

        // HSV → RGB in TSL
        const hsv2rgb = Fn(([c]) => {
          const K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          const p = abs(fract(c.xxx.add(K.xyz)).mul(6.0).sub(K.www));
          return c.z.mul(mix(K.xxx, p.sub(K.xxx).clamp(0, 1), c.y));
        });

        // Fragment color computation — TSL node graph (compiles to WGSL)
        const fragColor = Fn(() => {
          const p = uv().sub(0.5);
          const d = length(p);

          // Time scaled by mid-frequency energy
          const t = time.mul(uSpeed).mul(float(0.5).add(uMid.mul(0.7)));

          // Domain coordinates — bass zooms in for bigger billows
          const q0 = p.mul(float(1.8).sub(uBass.mul(0.25)));

          // Swirl rotation by mid + bass
          const ang = t.mul(0.15).add(uMid.mul(0.7)).add(uBass.mul(0.4));
          const ca = cos(ang);
          const sa = sin(ang);
          const q = vec2(
            q0.x.mul(ca).sub(q0.y.mul(sa)),
            q0.x.mul(sa).add(q0.y.mul(ca)),
          );

          // Multi-octave domain warp using built-in MaterialX noise
          const warpAmt = float(1.6).add(uMid.mul(1.0));
          const w1x = mx_fractal_noise_float(vec3(q.x.add(t.mul(0.2)), q.y.add(t.mul(0.15)), float(0.0)));
          const w1y = mx_fractal_noise_float(vec3(q.x.sub(t.mul(0.18)), q.y.add(t.mul(0.22)), float(5.2)));
          const warp1 = vec2(w1x, w1y);

          const qw = q.add(warp1.mul(warpAmt));
          const w2x = mx_fractal_noise_float(vec3(qw.x.add(t.mul(0.25)), qw.y, float(1.7)));
          const w2y = mx_fractal_noise_float(vec3(qw.x, qw.y.sub(t.mul(0.3)), float(3.7)));
          const warp2 = vec2(w2x, w2y);

          const flowAmt = float(2.2).add(uBass.mul(1.4));
          const flow = mx_fractal_noise_float(vec3(
            q.x.add(warp2.x.mul(flowAmt)),
            q.y.add(warp2.y.mul(flowAmt)),
            t.mul(0.3),
          ));

          // Iridescent palette
          const band = flow.mul(float(4.5).add(uTreble.mul(4.0)))
            .add(uHueShift)
            .add(t.mul(0.6))
            .add(length(warp2).mul(1.2));
          const h = fract(float(0.5).add(sin(band).mul(0.6)).add(warp1.x.mul(0.28)).add(uTreble.mul(0.3)));

          // Pooling + shimmer
          const pool = smoothstep(
            float(0.1).sub(uBass.mul(0.05)),
            float(0.95).sub(uBass.mul(0.1)),
            flow,
          );
          const shimmer = float(0.5).add(
            sin(flow.mul(float(8.0).add(uTreble.mul(12.0))).add(t.mul(float(1.4).add(uTreble.mul(2.0))))).mul(0.5),
          );

          const s = float(0.95).add(uAmp.mul(0.05));
          const v = pool.mul(float(0.72).add(uBass.mul(0.4)))
            .add(shimmer.mul(float(0.24).add(uTreble.mul(0.35))))
            .mul(uIntensity);

          const liquid = hsv2rgb(vec3(h, s, v));

          // Deep violet-black core
          const base = vec3(0.03, 0.04, 0.06).add(
            vec3(0.2, 0.28, 0.32).mul(0.05).mul(float(1.0).sub(d.mul(1.2))),
          );
          let col = base.add(liquid);

          // Inner shadow
          const shade = smoothstep(0.5, 0.05, d);
          col = col.mul(mix(float(0.55), float(1.0), shade));

          // Tiny specular highlight
          const specP = p.sub(vec2(-0.15, 0.18));
          const spec = smoothstep(0.28, 0.0, length(specP));
          col = col.add(spec.mul(0.09));

          // Edge alpha + circular mask
          const a = smoothstep(0.5, 0.46, d);
          return vec4(col, a);
        });

        const material = new THREE.MeshBasicNodeMaterial({ transparent: true });
        material.colorNode = fragColor();
        material.opacityNode = float(1.0); // alpha already in fragColor.w
        // Use the fragment node's alpha for transparency
        material.transparent = true;

        const geom = new THREE.PlaneGeometry(2, 2);
        mesh = new THREE.Mesh(geom, material);
        scene.add(mesh);
        setReady(true);

        const tick = () => {
          if (disposed) return;
          const amp = ampRef.current ? ampRef.current() || 0 : 0;
          const sp = specRef.current
            ? specRef.current()
            : { bass: 0, mid: 0, treble: 0 };
          uAmp.value = amp;
          uBass.value = sp.bass || 0;
          uMid.value = sp.mid || 0;
          uTreble.value = sp.treble || 0;
          renderer.renderAsync(scene, camera);
          raf = requestAnimationFrame(tick);
        };
        tick();

        ro = new ResizeObserver(() => {
          if (!renderer || disposed) return;
          renderer.setSize(mount.clientWidth, mount.clientHeight);
        });
        ro.observe(mount);
      } catch (err) {
        console.warn('[WebGPUOpalShader] init failed, falling back', err);
        onUnsupported?.();
      }
    };

    init();

    return () => {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      if (renderer) {
        if (renderer.domElement?.parentNode === mount) {
          mount.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
    };
     
  }, [intensity, speed, hueShift]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0"
      style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.4s' }}
    />
  );
}