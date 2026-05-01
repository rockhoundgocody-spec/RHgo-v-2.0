import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Black-opal shader: deep black base with iridescent gas/flame fire.
 * Props:
 *  - intensity: brightness of iridescence (default 1.0)
 *  - speed: animation speed (default 0.25)
 *  - hueShift: shifts the iridescence palette (default 0)
 */
export default function BlackOpalShader({ intensity = 1.0, speed = 0.25, hueShift = 0, getAmplitude, getSpectrum }) {
  const mountRef = useRef(null);
  const ampGetterRef = useRef(getAmplitude);
  const specGetterRef = useRef(getSpectrum);
  ampGetterRef.current = getAmplitude;
  specGetterRef.current = getSpectrum;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 300;
    const height = mount.clientHeight || 300;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0 },
      u_intensity: { value: intensity },
      u_hueShift: { value: hueShift },
      u_amp: { value: 0 },
      u_bass: { value: 0 },
      u_mid: { value: 0 },
      u_treble: { value: 0 },
      u_resolution: { value: new THREE.Vector2(width, height) },
    };

    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        varying vec2 vUv;
        uniform float u_time;
        uniform float u_intensity;
        uniform float u_hueShift;
        uniform float u_amp;
        uniform float u_bass;
        uniform float u_mid;
        uniform float u_treble;

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        // 2D hash + value noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float vnoise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * vnoise(p);
            p *= 2.02;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float d = length(uv);
          if (d > 0.5) { gl_FragColor = vec4(0.0); return; }

          // FREQUENCY-REACTIVE flow field
          //   bass    → low-freq billows / large-scale swirl
          //   mid     → flow speed + warp magnitude
          //   treble  → high-freq shimmer + hue jitter
          float amp = u_amp;
          float bass = u_bass;
          float mid = u_mid;
          float treble = u_treble;

          float t = u_time * (0.5 + mid * 0.7);
          vec2 q = uv * (1.8 - bass * 0.25); // bass = bigger billows (zoom in)

          // global swirl driven by mid frequencies
          float ang = t * 0.15 + mid * 0.7 + bass * 0.4;
          float ca = cos(ang), sa = sin(ang);
          q = mat2(ca, -sa, sa, ca) * q;

          // multi-step domain warp — magnitude scales with mid band
          float warpAmt = 1.6 + mid * 1.0;
          vec2 warp1 = vec2(fbm(q + vec2(t * 0.2, t * 0.15)),
                            fbm(q + vec2(-t * 0.18, t * 0.22) + 5.2));
          vec2 warp2 = vec2(fbm(q + warpAmt * warp1 + vec2(t * 0.25, 0.0)),
                            fbm(q + warpAmt * warp1 + vec2(0.0, -t * 0.3) + 3.7));
          float flow = fbm(q + (2.2 + bass * 1.4) * warp2);

          // iridescent palette — treble widens hue spread, mid shifts band frequency
          float band = flow * (4.5 + treble * 4.0) + u_hueShift + t * 0.6 + length(warp2) * 1.2;
          float h = fract(0.6 + 0.5 * sin(band) + warp1.x * 0.25 + treble * 0.25);

          // pooling — bass thickens, treble adds high-freq shimmer
          float pool = smoothstep(0.1 - bass * 0.05, 0.95 - bass * 0.1, flow);
          float shimmer = 0.5 + 0.5 * sin(flow * (8.0 + treble * 12.0) + t * (1.4 + treble * 2.0));

          // higher saturation + lower brightness = neon UV glow vs. white wash
          float s = 0.92 + amp * 0.08;
          float v = (pool * (0.75 + bass * 0.5) + shimmer * (0.22 + treble * 0.4)) * u_intensity;

          vec3 liquid = hsv2rgb(vec3(h, s, v));

          // darker base — deep violet-black core
          vec3 base = vec3(0.02, 0.012, 0.05) + 0.06 * vec3(0.25, 0.15, 0.55) * (1.0 - d * 1.2);

          vec3 col = base + liquid;

          // deeper inner shadow for richer contrast
          float shade = smoothstep(0.5, 0.05, d);
          col *= mix(0.55, 0.92, shade);

          // dim specular — barely a hint, no white blowout
          float spec = smoothstep(0.28, 0.0, length(uv - vec2(-0.15, 0.18)));
          col += spec * 0.08;

          // alpha falls off at the very edge for clean rim
          float a = smoothstep(0.5, 0.46, d);

          gl_FragColor = vec4(col, a);
        }
      `,
    });

    const geometry = new THREE.PlaneGeometry(2, 2);
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    let raf;
    const start = performance.now();
    const animate = () => {
      uniforms.u_time.value = ((performance.now() - start) / 1000) * speed * Math.PI;
      const getAmp = ampGetterRef.current;
      const getSpec = specGetterRef.current;
      uniforms.u_amp.value = getAmp ? getAmp() : 0;
      if (getSpec) {
        const s = getSpec();
        uniforms.u_bass.value = s.bass || 0;
        uniforms.u_mid.value = s.mid || 0;
        uniforms.u_treble.value = s.treble || 0;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      uniforms.u_resolution.value.set(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [intensity, speed, hueShift]);

  return <div ref={mountRef} className="absolute inset-0" />;
}