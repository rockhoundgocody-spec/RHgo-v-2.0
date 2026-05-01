import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

/**
 * Layer 6 — Wispy gas/smoke effect.
 * Soft, translucent volumetric tendrils that drift across the orb surface.
 * Designed to be stacked on top via mix-blend-screen at low opacity.
 */
export default function GasSmokeShader({ speed = 0.15, getAmplitude }) {
  const mountRef = useRef(null);
  const ampGetterRef = useRef(getAmplitude);
  ampGetterRef.current = getAmplitude;

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

        // hash + value noise
        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
        }
        float vnoise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * vnoise(p);
            p *= 2.0;
            a *= 0.5;
          }
          return v;
        }

        void main() {
          vec2 uv = vUv - 0.5;
          float d = length(uv);

          // upward drift + slow swirl — feels like rising smoke
          float t = u_time;
          vec2 q = uv * 2.6;
          q.y += t * 0.35;
          float ang = sin(t * 0.2) * 0.25;
          float ca = cos(ang), sa = sin(ang);
          q = mat2(ca, -sa, sa, ca) * q;

          // domain-warp for billowing wisps
          vec2 warp = vec2(fbm(q + t * 0.15), fbm(q - t * 0.12 + 3.1));
          float smoke = fbm(q + 1.3 * warp);

          // amplitude (voice) thickens the smoke
          float thickness = 0.35 + u_amp * 0.45;
          float wisps = smoothstep(thickness + 0.1, thickness - 0.05, smoke);
          wisps = pow(wisps, 1.4);

          // tint — pale lavender / silver smoke
          vec3 col = mix(vec3(0.78, 0.72, 0.92), vec3(0.92, 0.95, 1.0), wisps * 0.6);

          // edge falloff so smoke fades to orb rim
          float edge = smoothstep(0.5, 0.15, d);

          // overall opacity stays soft so other layers read through
          float alpha = wisps * edge * (0.35 + u_amp * 0.25);

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
      uniforms.u_amp.value = getAmp ? getAmp() : 0;
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