import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three/webgpu';
import {
  Fn, vec2, vec3, vec4, float, int, uniform, uv, mix, fract,
  length, smoothstep, mx_fractal_noise_float, abs, clamp,
  textureStore, textureLoad, instanceIndex, ivec2, time,
} from 'three/tsl';

/**
 * WebGPU compute fluid simulation, rendered as additive overlay.
 * Proper ping-pong: each frame reads from one buffer and writes to the other,
 * then swaps. No race conditions, no strobe.
 */
export default function WebGPUFluidOverlay({
  resolution = 128,
  intensity = 1.0,
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

        // Two storage textures for true ping-pong
        const fieldA = new THREE.StorageTexture(resolution, resolution);
        const fieldB = new THREE.StorageTexture(resolution, resolution);
        fieldA.type = THREE.FloatType;
        fieldB.type = THREE.FloatType;

        const uAmp = uniform(0);
        const uBass = uniform(0);
        const uMid = uniform(0);
        const uTreble = uniform(0);
        const uIntensity = uniform(intensity);
        const uRes = uniform(float(resolution));

        // Build a step kernel that reads from `src` and writes to `dst`.
        const buildStep = (src, dst) => Fn(() => {
          const idx = instanceIndex;
          const res = int(resolution);
          const x = idx.mod(res);
          const y = idx.div(res);
          const coord = ivec2(x, y);

          const prev = textureLoad(src, coord);

          const p = vec2(
            float(x).div(uRes).mul(2.0).sub(1.0),
            float(y).div(uRes).mul(2.0).sub(1.0),
          );
          const r = length(p);

          // Backward advection — sample upstream from src
          const upPos = p.sub(prev.xy.mul(0.024));
          const upCoord = ivec2(
            int(upPos.x.add(1.0).mul(0.5).mul(uRes)).clamp(int(0), res.sub(1)),
            int(upPos.y.add(1.0).mul(0.5).mul(uRes)).clamp(int(0), res.sub(1)),
          );
          const advected = textureLoad(src, upCoord);

          // Audio-reactive forces
          const t = time;
          const bassForce = vec2(
            float(0.0),
            uBass.mul(2.5).mul(smoothstep(float(0.5), float(0.0), r)),
          );
          const tangent = vec2(p.y.negate(), p.x);
          const midForce = tangent.mul(uMid.mul(3.0)).mul(smoothstep(float(0.7), float(0.1), r));
          const nx = mx_fractal_noise_float(vec3(p.x.mul(4.0), p.y.mul(4.0), t.mul(2.0)));
          const ny = mx_fractal_noise_float(vec3(p.x.mul(4.0).add(7.3), p.y.mul(4.0).add(2.1), t.mul(2.0)));
          const trebForce = vec2(nx, ny).mul(uTreble.mul(2.0));
          const force = bassForce.add(midForce).add(trebForce);

          const newVel = advected.xy.mul(0.96).add(force.mul(0.02));

          const inject = uAmp.mul(2.5).mul(smoothstep(float(0.45), float(0.0), r))
            .add(uTreble.mul(1.2).mul(abs(nx).mul(smoothstep(float(0.6), float(0.0), r))));
          const newDens = advected.z.mul(0.95).add(inject.mul(0.05));

          const newHue = fract(advected.w.add(uTreble.mul(0.01)).add(float(0.0008)));

          // Circular boundary — clean alpha falloff
          const masked = smoothstep(float(0.5), float(0.42), r);
          const outVal = vec4(
            newVel.x.mul(masked),
            newVel.y.mul(masked),
            newDens.mul(masked),
            newHue,
          );

          textureStore(dst, coord, outVal).toWriteOnly();
        })().compute(resolution * resolution);

        const stepAtoB = buildStep(fieldA, fieldB);
        const stepBtoA = buildStep(fieldB, fieldA);

        // Render samples whichever buffer was written last via uReadFromB flag.
        const uReadFromB = uniform(0);
        const fragColor = Fn(() => {
          const p = uv();
          const c = ivec2(
            int(p.x.mul(uRes)).clamp(int(0), int(resolution - 1)),
            int(p.y.mul(uRes)).clamp(int(0), int(resolution - 1)),
          );
          const sA = textureLoad(fieldA, c);
          const sB = textureLoad(fieldB, c);
          const s = mix(sA, sB, uReadFromB);

          const dens = s.z;
          const hueBase = s.w;
          const speed = length(s.xy);

          const h = fract(hueBase.add(speed.mul(0.4)).add(0.55));
          const sat = float(0.85);
          const val = clamp(dens.mul(uIntensity).mul(2.0), float(0.0), float(1.4));

          const K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          const pp = abs(fract(vec3(h, h, h).add(K.xyz)).mul(6.0).sub(K.www));
          const rgb = val.mul(mix(K.xxx, pp.sub(K.xxx).clamp(0, 1), sat));

          const centered = uv().sub(0.5);
          const r = length(centered);
          const a = smoothstep(0.5, 0.42, r).mul(clamp(dens.mul(2.5), float(0.0), float(1.0)));

          return vec4(rgb, a);
        });

        const material = new THREE.MeshBasicNodeMaterial({
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        material.colorNode = fragColor();
        const geom = new THREE.PlaneGeometry(2, 2);
        mesh = new THREE.Mesh(geom, material);
        scene.add(mesh);
        setReady(true);

        let writeToB = true; // start by writing A -> B
        const tick = async () => {
          if (disposed) return;
          const amp = ampRef.current ? ampRef.current() || 0 : 0;
          const sp = specRef.current ? specRef.current() : { bass: 0, mid: 0, treble: 0 };
          uAmp.value = amp;
          uBass.value = sp.bass || 0;
          uMid.value = sp.mid || 0;
          uTreble.value = sp.treble || 0;

          if (writeToB) {
            await renderer.computeAsync(stepAtoB);
            uReadFromB.value = 1;
          } else {
            await renderer.computeAsync(stepBtoA);
            uReadFromB.value = 0;
          }
          await renderer.renderAsync(scene, camera);
          writeToB = !writeToB;
          raf = requestAnimationFrame(tick);
        };
        tick();

        ro = new ResizeObserver(() => {
          if (!renderer || disposed) return;
          renderer.setSize(mount.clientWidth, mount.clientHeight);
        });
        ro.observe(mount);
      } catch (err) {
        console.warn('[WebGPUFluidOverlay] init failed', err);
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

  }, [resolution, intensity]);

  return (
    <div
      ref={mountRef}
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: ready ? 0.7 : 0, mixBlendMode: 'screen' }}
    />
  );
}