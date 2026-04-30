import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Real-time concave liquid glass shader.
 * Renders a fullscreen plane with custom GLSL that simulates:
 * - Concave cavity geometry (raymarched normal field)
 * - Refraction + chromatic aberration
 * - Caustic highlights
 * - Slow viscous breathing motion
 */
export default function LiquidGlassShader({
  className = '',
  hue = 0.78,        // 0..1 — 0.78 = amethyst purple
  intensity = 1.0,
  speed = 0.15,
}) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth;
    const height = mount.clientHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    const uniforms = {
      u_time: { value: 0 },
      u_res: { value: new THREE.Vector2(width, height) },
      u_hue: { value: hue },
      u_intensity: { value: intensity },
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
        uniform vec2 u_res;
        uniform float u_hue;
        uniform float u_intensity;

        // hash & noise
        float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 i = floor(p), f = fract(p);
          float a = hash(i), b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0)), d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }
        float fbm(vec2 p) {
          float v = 0.0, a = 0.5;
          for (int i = 0; i < 5; i++) {
            v += a * noise(p);
            p *= 2.0; a *= 0.5;
          }
          return v;
        }

        // concave cavity height field — multiple lens-like depressions
        float cavities(vec2 p, float t) {
          float h = 0.0;
          // 4 drifting concave wells
          vec2 c1 = vec2(sin(t*0.3)*0.3, cos(t*0.4)*0.25);
          vec2 c2 = vec2(cos(t*0.25)*0.4 - 0.2, sin(t*0.35)*0.3 + 0.15);
          vec2 c3 = vec2(sin(t*0.2 + 1.5)*0.35, cos(t*0.3 + 2.0)*0.3);
          vec2 c4 = vec2(cos(t*0.4 + 3.0)*0.25 + 0.3, sin(t*0.25 + 1.0)*0.4 - 0.1);
          h += smoothstep(0.45, 0.0, length(p - c1));
          h += smoothstep(0.40, 0.0, length(p - c2)) * 0.85;
          h += smoothstep(0.50, 0.0, length(p - c3)) * 0.9;
          h += smoothstep(0.35, 0.0, length(p - c4)) * 0.75;
          // surface micro-detail
          h += fbm(p * 3.0 + t * 0.1) * 0.15;
          return h;
        }

        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
        }

        void main() {
          vec2 uv = (vUv - 0.5) * vec2(u_res.x / u_res.y, 1.0);
          float t = u_time * 0.6;

          // height field & numerical gradient → surface normal
          float eps = 0.005;
          float h  = cavities(uv, t);
          float hx = cavities(uv + vec2(eps, 0.0), t);
          float hy = cavities(uv + vec2(0.0, eps), t);
          vec3 N = normalize(vec3((hx - h) / eps, (hy - h) / eps, 1.0));

          // refraction sample direction (chromatic)
          vec2 refrR = uv - N.xy * 0.15;
          vec2 refrG = uv - N.xy * 0.13;
          vec2 refrB = uv - N.xy * 0.11;

          // base gradient backdrop (sampled by refraction)
          vec3 baseR = hsv2rgb(vec3(u_hue, 0.6, 0.35 + 0.4 * fbm(refrR * 2.0 + t * 0.2)));
          vec3 baseG = hsv2rgb(vec3(u_hue + 0.02, 0.55, 0.35 + 0.4 * fbm(refrG * 2.0 + t * 0.2)));
          vec3 baseB = hsv2rgb(vec3(u_hue + 0.04, 0.5, 0.35 + 0.4 * fbm(refrB * 2.0 + t * 0.2)));
          vec3 refracted = vec3(baseR.r, baseG.g, baseB.b);

          // specular highlight (Blinn-ish)
          vec3 L = normalize(vec3(0.4, 0.6, 0.8));
          float spec = pow(max(dot(N, L), 0.0), 32.0);

          // caustic shimmer
          float caustic = pow(max(0.0, fbm(uv * 4.0 + N.xy * 2.0 + t * 0.3) - 0.55), 2.0) * 4.0;

          // edge fresnel
          float fres = pow(1.0 - max(N.z, 0.0), 3.0);

          vec3 col = refracted;
          col += spec * vec3(1.0, 0.95, 1.1) * 0.7;
          col += caustic * vec3(0.8, 0.6, 1.2);
          col += fres * vec3(0.6, 0.4, 1.0) * 0.5;
          col *= u_intensity;

          // soft vignette
          float vig = smoothstep(1.3, 0.3, length(uv));
          col *= mix(0.5, 1.0, vig);

          gl_FragColor = vec4(col, 1.0);
        }
      `,
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let raf;
    const start = performance.now();
    const animate = () => {
      uniforms.u_time.value = ((performance.now() - start) / 1000) * speed * 6.0;
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      renderer.setSize(w, h);
      uniforms.u_res.value.set(w, h);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [hue, intensity, speed]);

  return <div ref={mountRef} className={`w-full h-full ${className}`} />;
}