import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Layer 6 — Wispy gas/smoke effect.
 * Soft, translucent volumetric tendrils that drift across the orb surface.
 * Designed to be stacked on top via mix-blend-screen at low opacity.
 */
export default function GasSmokeShader({ speed = 0.15, getAmplitude, getSpectrum }) {
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
        uniform float u_amp;
        uniform float u_bass;
        uniform float u_mid;
        uniform float u_treble;

        // simplex-like gradient noise — smoother than value noise
        vec2 hash2(vec2 p) {
          p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
          return -1.0 + 2.0 * fract(sin(p) * 43758.5453);
        }
        float gnoise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(dot(hash2(i), f),
                         dot(hash2(i + vec2(1.0, 0.0)), f - vec2(1.0, 0.0)), u.x),
                     mix(dot(hash2(i + vec2(0.0, 1.0)), f - vec2(0.0, 1.0)),
                         dot(hash2(i + vec2(1.0, 1.0)), f - vec2(1.0, 1.0)), u.x), u.y);
        }
        // 6-octave fbm for finer wisp detail
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
          for (int i = 0; i < 6; i++) {
            v += a * gnoise(p);
            p = rot * p * 2.02;
            a *= 0.5;
          }
          return v * 0.5 + 0.5;
        }
        // curl noise — produces divergence-free flow (real swirling currents)
        vec2 curl(vec2 p) {
          float e = 0.08;
          float n1 = fbm(p + vec2(0.0, e));
          float n2 = fbm(p - vec2(0.0, e));
          float n3 = fbm(p + vec2(e, 0.0));
          float n4 = fbm(p - vec2(e, 0.0));
          return vec2(n1 - n2, -(n3 - n4)) / (2.0 * e);
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float d = length(uv);
          float t = u_time;

          // base coords with gentle upward drift + slow rotation
          vec2 q = uv * 2.4;
          q.y += t * 0.22;
          float ang = sin(t * 0.18) * 0.3 + t * 0.04;
          float ca = cos(ang), sa = sin(ang);
          q = mat2(ca, -sa, sa, ca) * q;

          // curl-driven flow — bass = stronger swirling currents
          vec2 flow = curl(q * 0.7 + vec2(0.0, t * 0.1));
          q += flow * (0.5 + u_bass * 0.7);

          // two-tier smoke: bass = big billows, treble = fine wisps
          float bigBillow = fbm(q + flow * (0.3 + u_bass * 0.3));
          float fineWisps = fbm(q * (2.6 + u_treble * 1.5) - flow * 0.4 + t * (0.15 + u_treble * 0.4));
          float smoke = bigBillow * (0.65 + u_bass * 0.15) + fineWisps * (0.35 + u_treble * 0.2);

          // sharper density — mid frequencies thicken the cloud
          float thickness = 0.42 - u_mid * 0.16;
          float wisps = smoothstep(thickness, thickness + 0.32, smoke);
          // rim — treble sharpens edge highlights
          float rim = smoothstep(0.04 + u_treble * 0.02, 0.0, abs(smoke - thickness - 0.04));

          // iridescent tint — shifts toward emerald/cyan when speaking
          vec3 cool = vec3(0.78, 0.72, 0.95);    // lavender
          vec3 warm = vec3(0.95, 0.92, 1.00);    // bright silver
          vec3 reactive = mix(vec3(0.55, 0.95, 0.85), vec3(0.85, 0.7, 1.0), 0.5 + 0.5 * sin(t + smoke * 4.0));
          vec3 base = mix(cool, warm, wisps);
          vec3 col = mix(base, reactive, u_amp * 0.6);
          // rim highlight punches brightness on wisp edges
          col += rim * (0.35 + u_amp * 0.4) * vec3(1.0, 0.95, 1.0);

          // soft inner-edge falloff
          float edge = smoothstep(0.5, 0.12, d);
          // tiny breath of opacity variation for living feel
          float breath = 0.85 + 0.15 * sin(t * 0.6);

          float alpha = (wisps * 0.85 + rim * 0.5) * edge * breath * (0.42 + u_amp * 0.3);

          gl_FragColor = vec4(col, alpha);
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
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [speed]);

  return <div ref={mountRef} className="absolute inset-0" />;
}