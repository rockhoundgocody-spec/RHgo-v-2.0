import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Black-opal shader: deep black base with iridescent gas/flame fire.
 * Props:
 *  - intensity: brightness of iridescence (default 1.0)
 *  - speed: animation speed (default 0.25)
 *  - hueShift: shifts the iridescence palette (default 0)
 */
export default function BlackOpalShader({ intensity = 1.0, speed = 0.25, hueShift = 0 }) {
  const mountRef = useRef(null);

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

          // distorted polar coords for swirling gas/fire
          float t = u_time * 0.6;
          vec2 q = uv * 2.2;
          float n = fbm(q + vec2(t * 0.3, -t * 0.25));
          float n2 = fbm(q * 1.8 - vec2(n, t * 0.4));
          float swirl = fbm(q * 3.0 + vec2(n2 * 1.2, n * 1.4));

          // iridescent palette: cycles through cyan/magenta/green/orange
          float band = swirl * 6.2831 + u_hueShift + t * 0.8;
          float h = fract(0.55 + 0.5 * sin(band) + n2 * 0.25);

          // sharp flame-like highlights (the opal "fire")
          float flame = pow(smoothstep(0.45, 0.85, swirl), 2.0);
          float sparkle = pow(smoothstep(0.7, 1.0, fbm(q * 6.0 + t)), 4.0);

          float s = 0.85;
          float v = (flame * 0.95 + sparkle * 1.4) * u_intensity;

          vec3 fire = hsv2rgb(vec3(h, s, v));

          // base = near-black with faint blueish depth
          vec3 base = vec3(0.012, 0.008, 0.025) + 0.04 * vec3(0.1, 0.15, 0.3) * (1.0 - d * 1.5);

          vec3 col = base + fire;

          // soft inner shadow toward edge so it reads as a sphere
          float shade = smoothstep(0.5, 0.05, d);
          col *= mix(0.55, 1.0, shade);

          // faint specular hint (subtle, the highlight comes from the overlay layer)
          float spec = smoothstep(0.22, 0.0, length(uv - vec2(-0.15, 0.18)));
          col += spec * 0.12;

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