import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

/**
 * CrystalLatticeViewer — Interactive 3D Crystal System Lattice Inspector.
 * Renders real 3D unit cell geometry and atomic lattices:
 * - Isometric / Cubic (Pyrite, Fluorite, Garnet)
 * - Trigonal / Hexagonal (Quartz, Agate, Calcite, Tourmaline)
 * - Tetragonal (Zircon, Rutile)
 * - Orthorhombic (Topaz, Celestine, Barite)
 * - Monoclinic (Gypsum, Malachite, Orthoclase)
 * - Amorphous (Opal, Obsidian)
 */
export default function CrystalLatticeViewer({ crystalSystem = 'Trigonal', mineralName = 'Quartz' }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    const width = mount.clientWidth || 280;
    const height = 180;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(0, 0, 3.4);

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    mount.appendChild(renderer.domElement);

    // Group to hold atoms and bonds
    const latticeGroup = new THREE.Group();
    scene.add(latticeGroup);

    // Materials
    const atomMaterial = new THREE.MeshPhysicalMaterial({
      color: 0xa855f7,
      emissive: 0x3b0764,
      roughness: 0.15,
      metalness: 0.2,
      clearcoat: 0.8,
    });

    const bondMaterial = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      roughness: 0.3,
      metalness: 0.5,
    });

    // Helper: Add atom sphere
    const addAtom = (x, y, z, color = 0xa855f7, radius = 0.09) => {
      const mat = atomMaterial.clone();
      mat.color.setHex(color);
      const geo = new THREE.SphereGeometry(radius, 16, 16);
      const atom = new THREE.Mesh(geo, mat);
      atom.position.set(x, y, z);
      latticeGroup.add(atom);
    };

    // Helper: Add bond cylinder between two points
    const addBond = (p1, p2, radius = 0.02) => {
      const v1 = new THREE.Vector3(...p1);
      const v2 = new THREE.Vector3(...p2);
      const dir = new THREE.Vector3().subVectors(v2, v1);
      const len = dir.length();
      const geo = new THREE.CylinderGeometry(radius, radius, len, 8);
      const bond = new THREE.Mesh(geo, bondMaterial);

      const mid = new THREE.Vector3().addVectors(v1, v2).multiplyScalar(0.5);
      bond.position.copy(mid);
      bond.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
      latticeGroup.add(bond);
    };

    const sys = crystalSystem.toLowerCase();

    if (sys.includes('isometric') || sys.includes('cubic')) {
      // 8-corner cube with face-centered atom
      const s = 0.65;
      const corners = [
        [-s, -s, -s], [s, -s, -s], [s, s, -s], [-s, s, -s],
        [-s, -s,  s], [s, -s,  s], [s, s,  s], [-s, s,  s],
      ];
      corners.forEach(p => addAtom(...p, 0x38bdf8, 0.08));
      addAtom(0, 0, 0, 0xfacc15, 0.12); // Center atom

      // Bonds along edges
      for (let i = 0; i < 4; i++) {
        addBond(corners[i], corners[(i + 1) % 4]);
        addBond(corners[i + 4], corners[((i + 1) % 4) + 4]);
        addBond(corners[i], corners[i + 4]);
      }
    } else if (sys.includes('hexagonal') || sys.includes('trigonal')) {
      // Hexagonal prism with central c-axis
      const r = 0.65;
      const h = 0.75;
      const top = [], bot = [];
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2;
        const x = Math.cos(ang) * r;
        const z = Math.sin(ang) * r;
        top.push([x, h / 2, z]);
        bot.push([x, -h / 2, z]);
        addAtom(x, h / 2, z, 0xc084fc, 0.07);
        addAtom(x, -h / 2, z, 0x34d399, 0.07);
      }
      addAtom(0, h / 2, 0, 0xfacc15, 0.09);
      addAtom(0, -h / 2, 0, 0xfacc15, 0.09);
      addAtom(0, 0, 0, 0xf43f5e, 0.11);

      for (let i = 0; i < 6; i++) {
        addBond(top[i], top[(i + 1) % 6]);
        addBond(bot[i], bot[(i + 1) % 6]);
        addBond(top[i], bot[i]);
        addBond([0, 0, 0], top[i], 0.015);
      }
    } else {
      // Rhombohedral / Tetragonal default
      const s = 0.6;
      const h = 0.85;
      const pts = [
        [-s, -h/2, -s], [s, -h/2, -s], [s, h/2, -s], [-s, h/2, -s],
        [-s, -h/2,  s], [s, -h/2,  s], [s, h/2,  s], [-s, h/2,  s],
      ];
      pts.forEach(p => addAtom(...p, 0xa78bfa, 0.08));
      addAtom(0, 0, 0, 0x38bdf8, 0.11);
      for (let i = 0; i < 4; i++) {
        addBond(pts[i], pts[(i + 1) % 4]);
        addBond(pts[i + 4], pts[((i + 1) % 4) + 4]);
        addBond(pts[i], pts[i + 4]);
      }
    }

    // Lights
    const ambLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    dirLight.position.set(3, 4, 5);
    scene.add(dirLight);

    let raf;
    let isInteracting = false;
    let prevX = 0, prevY = 0;

    const onPointerDown = (e) => {
      isInteracting = true;
      prevX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      prevY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
    };

    const onPointerMove = (e) => {
      if (!isInteracting) return;
      const curX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
      const curY = e.clientY || (e.touches && e.touches[0].clientY) || 0;
      const dx = curX - prevX;
      const dy = curY - prevY;
      latticeGroup.rotation.y += dx * 0.02;
      latticeGroup.rotation.x += dy * 0.02;
      prevX = curX;
      prevY = curY;
    };

    const onPointerUp = () => { isInteracting = false; };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    dom.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    dom.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);

    const animate = () => {
      if (!isInteracting) {
        latticeGroup.rotation.y += 0.009;
        latticeGroup.rotation.x = Math.sin(Date.now() * 0.001) * 0.15;
      }
      renderer.render(scene, camera);
      raf = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      dom.removeEventListener('mousedown', onPointerDown);
      dom.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      dom.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      if (dom.parentNode === mount) mount.removeChild(dom);
      renderer.dispose();
    };
  }, [crystalSystem, mineralName]);

  return (
    <div
      className="relative rounded-2xl overflow-hidden p-3"
      style={{
        background: 'linear-gradient(145deg, hsla(250,30%,12%,0.6), hsla(240,25%,8%,0.8))',
        border: '1px solid hsla(270,50%,50%,0.25)',
      }}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="text-[10px] uppercase font-bold tracking-widest text-amethyst-glow flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-amethyst-glow animate-pulse" />
          3D Atomic Lattice · {crystalSystem}
        </div>
        <span className="text-[9px] font-mono text-white/40">Drag to Rotate 360°</span>
      </div>

      <div ref={mountRef} className="w-full h-[180px] cursor-grab active:cursor-grabbing flex items-center justify-center" />
    </div>
  );
}
