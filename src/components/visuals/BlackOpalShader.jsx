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

          // domain-warped flow field — feeds noise into itself for liquid currents
          float t = u_time * 0.5;
          vec2 q = uv * 1.8;

          // multi-step warp creates smooth, drifting currents (like ink in water)
          vec2 warp1 = vec2(fbm(q + vec2(t * 0.2, t * 0.15)),
                            fbm(q + vec2(-t * 0.18, t * 0.22) + 5.2));
          vec2 warp2 = vec2(fbm(q + 1.6 * warp1 + vec2(t * 0.25, 0.0)),
                            fbm(q + 1.6 * warp1 + vec2(0.0, -t * 0.3) + 3.7));
          float flow = fbm(q + 2.2 * warp2);

          // smooth iridescent palette — flowing bands of color
          float band = flow * 4.5 + u_hueShift + t * 0.6 + length(warp2) * 1.2;
          float h = fract(0.6 + 0.45 * sin(band) + warp1.x * 0.2);

          // soft luminance — no hard edges, just gentle pooling of light
          float pool = smoothstep(0.1, 0.95, flow);
          float shimmer = 0.5 + 0.5 * sin(flow * 8.0 + t * 1.4);

          float s = 0.75;
          float v = (pool * 1.2 + shimmer * 0.35) * u_intensity;

          vec3 liquid = hsv2rgb(vec3(h, s, v));

          // base = dark with violet/blue depth (less black)
          vec3 base = vec3(0.04, 0.025, 0.08) + 0.10 * vec3(0.25, 0.2, 0.5) * (1.0 - d * 1.2);

          vec3 col = base + liquid;

          // gentler inner shadow so it stays luminous
          float shade = smoothstep(0.5, 0.05, d);
          col *= mix(0.78, 1.05, shade);

          // brighter specular hint
          float spec = smoothstep(0.28, 0.0, length(uv - vec2(-0.15, 0.18)));
          col += spec * 0.25;

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