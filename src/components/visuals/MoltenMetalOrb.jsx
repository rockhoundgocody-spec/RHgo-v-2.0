import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * MoltenMetalOrb — mirror-polished mercury sphere with concentric fluid
 * ripples radiating from a camera-facing pole and pearlescent gold /
 * lavender / teal chromatic aberration. Drop-in replacement for
 * PhysicalCrystalOrb: same prop interface, same interaction loop.
 *
 * Visual reference: molten liquid-metal concept — chrome highlight #C8D4DC,
 * mercury body #8A9AA8, cyan reflection #4FD3E8, deep shadow #1A2030,
 * with pearlescent gold #f2e8d9 / lavender #d4b5e0 / minty teal #8cd3c5
 * shifting across the surface and gunmetal-teal shadows #3e5659 / #2a3e42
 * in the ripple channels.
 */
export default function MoltenMetalOrb({
  size = 220,
  orbState = 'idle',
  getAmplitude,
  getSpectrum,
  getInteraction,
}) {
  const mountRef = useRef(null);
  const ampRef = useRef(getAmplitude);
  const specRef = useRef(getSpectrum);
  const ixRef = useRef(getInteraction);
  ampRef.current = getAmplitude;
  specRef.current = getSpectrum;
  ixRef.current = getInteraction;

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || size;
    const height = mount.clientHeight || size;

    // ── 3D SCENE & PERSPECTIVE CAMERA ──
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.z = 2.7;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // ── 3D ICOSAHEDRON SPHERE GEOMETRY ── smooth enough for fine concentric ripples
    const geometry = new THREE.IcosahedronGeometry(0.92, 42);

    // ── UNIFORMS ──
    const uniforms = {
      u_time:         { value: 0 },
      u_amplitude:    { value: 0 },
      u_bass:         { value: 0 },
      u_mid:          { value: 0 },
      u_treble:       { value: 0 },
      u_state:        { value: 0.0 },
      u_touch:        { value: new THREE.Vector2(0, 0) },
      u_velocity:     { value: 0.0 },
      u_resolution:   { value: new THREE.Vector2(width, height) },
    };

    // ── GPU SHADERS: concentric fluid ripples + pearlescent metal ──
    const material = new THREE.ShaderMaterial({
      uniforms,
      transparent: true,
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vRipple;
        varying float vAngDist;

        uniform float u_time;
        uniform float u_amplitude;
        uniform float u_bass;
        uniform float u_mid;
        uniform float u_treble;
        uniform vec2 u_touch;
        uniform float u_velocity;

        void main() {
          vNormal = normalize(normalMatrix * normal);
          vec3 pos = position;
          vec3 nrm = normalize(pos);

          // Angular distance from the camera-facing pole (+Z)
          float angDist = acos(clamp(dot(nrm, vec3(0.0, 0.0, 1.0)), -1.0, 1.0));
          vAngDist = angDist;

          // Concentric fluid ripples radiating outward from the front pole
          float flow = u_time * (0.5 + u_mid * 0.6);
          float freq = 14.0 + u_treble * 6.0;
          float ripple = sin(angDist * freq - flow * 3.0) * (0.012 + u_amplitude * 0.035 + u_treble * 0.018);

          // Slow large liquid bulge driven by bass
          float billow = sin(angDist * 3.0 - flow * 0.8) * (0.008 + u_bass * 0.045);

          // Touch ripple — emanates from the touched point on the sphere
          vec3 touchPole = normalize(vec3(u_touch, 0.8));
          float touchAng = acos(clamp(dot(nrm, touchPole), -1.0, 1.0));
          float touchRipple = sin(touchAng * 22.0 - u_time * 6.0)
                           * smoothstep(1.2, 0.0, touchAng)
                           * u_velocity * 0.05;

          float disp = ripple + billow + touchRipple;
          vRipple = ripple;

          vec3 displacedPos = pos + normal * disp;
          vec4 mvPos = modelViewMatrix * vec4(displacedPos, 1.0);
          vViewPosition = -mvPos.xyz;
          gl_Position = projectionMatrix * mvPos;
        }
      `,
      fragmentShader: `
        precision highp float;

        varying vec3 vNormal;
        varying vec3 vViewPosition;
        varying float vRipple;
        varying float vAngDist;

        uniform float u_time;
        uniform float u_amplitude;
        uniform float u_bass;
        uniform float u_state;

        void main() {
          vec3 N = normalize(vNormal);
          vec3 V = normalize(vViewPosition);
          float NdotV = max(0.0, dot(N, V));
          float fresnel = pow(1.0 - NdotV, 2.5);

          // ── METALLIC GUNMETAL-TEAL BASE ──
          vec3 shadowDeep = vec3(0.165, 0.235, 0.259);   // #2a3e42
          vec3 shadowMid  = vec3(0.243, 0.337, 0.349);    // #3e5659
          vec3 steelLit   = vec3(0.50, 0.58, 0.62);       // polished mercury midtone
          vec3 base = mix(shadowMid, shadowDeep, fresnel);

          // ── PEARLESCENT IRIDESCENCE: gold → lavender → teal ──
          vec3 paleGold = vec3(0.949, 0.910, 0.851);      // #f2e8d9
          vec3 lavender = vec3(0.831, 0.710, 0.878);      // #d4b5e0
          vec3 mintTeal = vec3(0.549, 0.827, 0.773);      // #8cd3c5

          // Smooth chromatic shift driven by view angle + position, flowing slowly with time
          float iridPhase = fresnel * 1.6 + vAngDist * 2.2 + u_time * 0.25;
          float ip = 0.5 + 0.5 * sin(iridPhase * 6.28318);
          vec3 irid = mix(paleGold, lavender, smoothstep(0.0, 0.5, ip));
          irid = mix(irid, mintTeal, smoothstep(0.5, 1.0, ip));

          // Concentric ridge specular — bright on ripple peaks
          float ridge = smoothstep(0.2, 1.0, vRipple);

          // ── STUDIO LIGHTING ── key from upper-left, cool fill from below-right
          vec3 keyDir = normalize(vec3(-0.5, 0.6, 1.0));
          vec3 keyH = normalize(keyDir + V);
          float keySpec = pow(max(0.0, dot(N, keyH)), 52.0);
          float keyDiff = max(0.0, dot(N, keyDir));

          vec3 fillDir = normalize(vec3(0.4, -0.45, 0.7));
          float fillDiff = max(0.0, dot(N, fillDir)) * 0.45;

          // Channels (low vRipple) stay gunmetal; crests + rim carry the pearlescence
          float iridMask = smoothstep(-0.35, 0.35, vRipple);

          // ── ASSEMBLE METALLIC SURFACE ──
          // Lit midtones rise toward polished steel where the key light strikes the crests
          base = mix(base, steelLit, smoothstep(0.25, 0.85, keyDiff) * (0.4 + 0.5 * ridge));
          vec3 col = base;
          col += irid * (0.14 + fresnel * 0.55) * (0.35 + 0.65 * iridMask); // pearlescent sheen, stronger on crests/rim
          col += irid * ridge * 0.30;                      // iridescent ridge crests
          col += vec3(1.0) * keySpec * (0.65 + ridge * 0.3); // tight chrome specular
          col += irid * keyDiff * 0.18 * iridMask;         // warm key diffuse on crests
          col += vec3(0.50, 0.62, 0.68) * fillDiff;         // cool fill bounce

          // ── STATE TINT (subtle, keeps voice/state reactivity) ──
          vec3 stateTint = vec3(0.0);
          if (u_state > 0.5 && u_state < 1.5) stateTint = vec3(0.0, 0.28, 0.22);     // listening teal
          else if (u_state > 1.5 && u_state < 2.5) stateTint = vec3(0.0, 0.10, 0.28); // thinking blue
          else if (u_state > 2.5 && u_state < 3.5) stateTint = vec3(0.28, 0.10, 0.18); // speaking rose
          else if (u_state > 3.5 && u_state < 4.5) stateTint = vec3(0.30, 0.24, 0.0);  // blessing gold
          else if (u_state > 4.5) stateTint = vec3(0.0, 0.20, 0.28);                   // radar cyan
          col += stateTint * (0.14 + u_amplitude * 0.3);

          // Subtle chromatic aberration at the rim
          float rim = smoothstep(0.5, 0.0, NdotV);
          col += vec3(0.06, -0.02, 0.06) * rim * fresnel;

          gl_FragColor = vec4(col, 0.97);
        }
      `,
    });

    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // ── ANIMATION & INTERACTION LOOP ──
    let raf;
    let inViewport = true;
    let paused = false;
    const start = performance.now();

    const io = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
    }, { threshold: 0.05 });
    io.observe(mount);

    const onVis = () => { paused = !!document.hidden; };
    document.addEventListener('visibilitychange', onVis);

    const onContextLost = (e) => { e.preventDefault(); paused = true; };
    const onContextRestored = () => { paused = false; };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost, false);
    renderer.domElement.addEventListener('webglcontextrestored', onContextRestored, false);

    const stateMap = { idle: 0, listening: 1, thinking: 2, speaking: 3, blessing: 4, radar: 5 };

    const animate = () => {
      if (paused || !inViewport) {
        raf = requestAnimationFrame(animate);
        return;
      }

      const t = (performance.now() - start) * 0.001;
      uniforms.u_time.value = t;

      const getAmp = ampRef.current;
      const getSpec = specRef.current;
      uniforms.u_amplitude.value = getAmp ? getAmp() || 0 : 0;
      if (getSpec) {
        const s = getSpec();
        uniforms.u_bass.value = s.bass || 0;
        uniforms.u_mid.value = s.mid || 0;
        uniforms.u_treble.value = s.treble || 0;
      }

      uniforms.u_state.value = stateMap[orbState] ?? 0;

      const getIx = ixRef.current;
      if (getIx) {
        const ix = getIx();
        if (ix) {
          const rect = mount.getBoundingClientRect();
          if (rect.width > 0) {
            const nx = ((ix.pointerX - rect.left) / rect.width) * 2 - 1;
            const ny = -(((ix.pointerY - rect.top) / rect.height) * 2 - 1);
            uniforms.u_touch.value.set(nx, ny);
            uniforms.u_velocity.value = ix.velocity || 0;
          }
        }
      }

      // Keep the ripple pole roughly camera-facing — only a gentle wobble
      mesh.rotation.y = Math.sin(t * 0.10) * 0.05;
      mesh.rotation.x = Math.sin(t * 0.08) * 0.04;

      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      const w = mount.clientWidth;
      const h = mount.clientHeight;
      if (w > 0 && h > 0) {
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        uniforms.u_resolution.value.set(w, h);
      }
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(mount);

    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      renderer.domElement.removeEventListener('webglcontextrestored', onContextRestored);
      io.disconnect();
      ro.disconnect();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [size, orbState]);

  return <div ref={mountRef} className="absolute inset-0" />;
}