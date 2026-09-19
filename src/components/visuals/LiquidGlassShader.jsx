import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * Animated liquid-glass shader rendered with Three.js.
 * Props:
 *  - hue: 0..1 base hue (default 0.78 = amethyst)
 *  - intensity: brightness multiplier (default 1.0)
 *  - speed: animation speed (default 0.2)
 */
export default function LiquidGlassShader({ hue = 0.78, intensity = 1.0, speed = 0.2 }) {
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
      u_hue: { value: hue },
      u_intensity: { value: intensity },
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
        uniform float u_hue;
        uniform float u_intensity;
        uniform vec2 u_resolution;

        // Converts HSV (x: hue [0..1], y: saturation [0..1], z: value [0..1]) to RGB.
        // Uses branchless vector operations for optimal GPU performance.
        vec3 hsv2rgb(vec3 c) {
          vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
          vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
          vec3 rgb = clamp(p - K.xxx, 0.0, 1.0);
          return c.z * mix(K.xxx, rgb, c.y);
        }

        float noise(vec2 p) {
          return sin(p.x * 1.7 + u_time) * cos(p.y * 1.3 - u_time * 0.7);
        }

        void main() {
          vec2 uv = vUv - 0.5;
          uv.x *= u_resolution.x / u_resolution.y;
          float d = length(uv);

          // counter-rotating swirl — flows opposite to the main opal layer
          float ang = -u_time * 0.18 + d * 1.6;
          float ca = cos(ang), sa = sin(ang);
          vec2 suv = mat2(ca, -sa, sa, ca) * uv;

          // domain-warp drift so currents bend organically
          vec2 drift = vec2(
            sin(u_time * 0.4 + suv.y * 3.0),
            cos(u_time * 0.35 - suv.x * 3.0)
          ) * 0.08;
          suv += drift;

          float n1 = noise(suv * 3.0 + u_time * 0.3);
          float n2 = noise(suv * 5.0 - u_time * 0.2);
          float swirl = n1 * 0.5 + n2 * 0.5;

          float h = u_hue + swirl * 0.08;
          float s = 0.7 + 0.2 * sin(u_time + d * 4.0);
          float v = (0.55 + 0.4 * swirl) * u_intensity;

          vec3 col = hsv2rgb(vec3(h, s, v));

          // ULTRA-SOFT edge — wide gaussian-like falloff, no hard rim
          float edge = smoothstep(0.5, 0.0, d);
          edge = edge * edge; // squared for organic, blob-like fade
          col *= edge;

          gl_FragColor = vec4(col, edge);
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
      mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [hue, intensity, speed]);

  return <div ref={mountRef} className="absolute inset-0" />;
}