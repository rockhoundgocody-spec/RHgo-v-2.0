/**
 * GalaxyScene — the Three.js side of the Vault Galaxy.
 *
 * One draw call for every star (a custom glow shader on THREE.Points), one
 * for every link, one for the background sky. Imperative on purpose: React
 * owns the HUD, this class owns the GPU, and they talk through a few methods.
 *
 * Mobile-first: capped pixel ratio, render loop paused when hidden or off
 * screen, touch orbit/pinch via OrbitControls, taps picked with a
 * screen-space radius, reduced-motion respected, every GPU resource disposed.
 */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const STAR_VERT = /* glsl */ `
  attribute float size;
  attribute float alpha;
  attribute vec3 color;
  uniform float uPixelRatio;
  uniform float uScale;
  uniform float uMaxSize;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Perspective size, clamped: far stars stay visible, near ones never flood the screen.
    gl_PointSize = clamp(size * uPixelRatio * (uScale / max(-mv.z, 0.1)), 1.5 * uPixelRatio, uMaxSize);
    gl_Position = projectionMatrix * mv;
  }
`;

const STAR_FRAG = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float core = smoothstep(0.16, 0.0, d);
    float glow = pow(smoothstep(0.5, 0.0, d), 1.6);
    vec3 col = vColor * glow + vec3(1.0) * core * 0.9;
    gl_FragColor = vec4(col, (glow * 0.8 + core) * vAlpha);
  }
`;

const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl')));
  } catch {
    return false;
  }
}

export class GalaxyScene {
  constructor(container, { onSelect, onHover, onError, reducedMotion = false } = {}) {
    this.container = container;
    this.onSelect = onSelect || (() => {});
    this.onHover = onHover || (() => {});
    this.onError = onError || (() => {});
    this.reducedMotion = reducedMotion;
    this.nodes = [];
    this.index = new Map();
    this.labelEls = new Map();
    this.selectedId = null;
    this.hoverId = null;
    this.matchIds = null;
    this.flight = null;
    this.running = false;
    this.visible = true;
    this.onScreen = true;
    this.disposed = false;
    this.lastInteraction = 0;
    this._tmp = new THREE.Vector3();

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.setClearColor(0x000000, 0);
    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.touchAction = 'none';
    canvas.setAttribute('aria-hidden', 'true');
    container.appendChild(canvas);

    this.scene = new THREE.Scene();
    this.scene.fog = new THREE.FogExp2(0x05040c, 0.0032);
    this.camera = new THREE.PerspectiveCamera(55, width / height, 0.5, 2000);
    this.camera.position.set(0, 55, 190);

    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.55;
    this.controls.zoomSpeed = 0.8;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 420;
    this.controls.enablePan = true;
    this.controls.autoRotate = !reducedMotion;
    this.controls.autoRotateSpeed = 0.28;
    this.controls.addEventListener('start', () => {
      this.lastInteraction = performance.now();
      this.controls.autoRotate = false;
      this.flight = null;
    });

    this.group = new THREE.Group();
    this.scene.add(this.group);
    this._buildSky();

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();

    this._onPointerDown = this._onPointerDown.bind(this);
    this._onPointerUp = this._onPointerUp.bind(this);
    this._onPointerMove = this._onPointerMove.bind(this);
    this._onContextLost = this._onContextLost.bind(this);
    this._onVisibility = this._onVisibility.bind(this);
    this._loop = this._loop.bind(this);

    canvas.addEventListener('pointerdown', this._onPointerDown);
    canvas.addEventListener('pointerup', this._onPointerUp);
    canvas.addEventListener('pointermove', this._onPointerMove);
    canvas.addEventListener('webglcontextlost', this._onContextLost, false);
    document.addEventListener('visibilitychange', this._onVisibility);

    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.intersection = new IntersectionObserver(([entry]) => {
      this.onScreen = entry.isIntersecting;
      this._syncLoop();
    });
    this.intersection.observe(container);

    this._syncLoop();
  }

  // ── Build ──────────────────────────────────────────────────────────────
  _buildSky() {
    const count = 1400;
    const pos = new Float32Array(count * 3);
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < count; i++) {
      const r = 420 + rand() * 520;
      const theta = rand() * Math.PI * 2;
      const phi = Math.acos(2 * rand() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.cos(phi) * 0.7;
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.sky = new THREE.Points(geo, new THREE.PointsMaterial({
      color: 0x9aa6ff, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.55, depthWrite: false, fog: false,
    }));
    this.scene.add(this.sky);
  }

  setGraph(graph) {
    this._disposeGraph();
    this.nodes = graph.nodes;
    this.index = new Map(this.nodes.map((n, i) => [n.id, i]));
    const n = this.nodes.length;

    const pos = new Float32Array(n * 3);
    const col = new Float32Array(n * 3);
    const size = new Float32Array(n);
    const alpha = new Float32Array(n);
    const c = new THREE.Color();
    this.nodes.forEach((node, i) => {
      pos.set(node.position, i * 3);
      c.set(node.color);
      col.set([c.r, c.g, c.b], i * 3);
      size[i] = node.size;
      alpha[i] = 1;
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('size', new THREE.BufferAttribute(size, 1));
    geo.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
    geo.computeBoundingSphere();
    this.starMaterial = new THREE.ShaderMaterial({
      vertexShader: STAR_VERT,
      fragmentShader: STAR_FRAG,
      uniforms: {
        uPixelRatio: { value: this.renderer.getPixelRatio() },
        uScale: { value: 420 },
        uMaxSize: { value: 58 * this.renderer.getPixelRatio() },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });
    this.stars = new THREE.Points(geo, this.starMaterial);
    this.group.add(this.stars);

    // Links
    this.links = graph.links
      .map((l) => ({ ...l, a: this.index.get(l.source), b: this.index.get(l.target) }))
      .filter((l) => l.a != null && l.b != null);
    const lp = new Float32Array(this.links.length * 6);
    const lc = new Float32Array(this.links.length * 6);
    this.links.forEach((l, i) => {
      lp.set(this.nodes[l.a].position, i * 6);
      lp.set(this.nodes[l.b].position, i * 6 + 3);
    });
    const lgeo = new THREE.BufferGeometry();
    lgeo.setAttribute('position', new THREE.BufferAttribute(lp, 3));
    lgeo.setAttribute('color', new THREE.BufferAttribute(lc, 3));
    this.linkMaterial = new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.9, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.lines = new THREE.LineSegments(lgeo, this.linkMaterial);
    this.group.add(this.lines);

    // Selection halo: a single glowing point that breathes.
    const hgeo = new THREE.BufferGeometry();
    hgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(3), 3));
    hgeo.setAttribute('color', new THREE.BufferAttribute(new Float32Array([1, 1, 1]), 3));
    hgeo.setAttribute('size', new THREE.BufferAttribute(new Float32Array([0]), 1));
    hgeo.setAttribute('alpha', new THREE.BufferAttribute(new Float32Array([0.32]), 1));
    this.haloMaterial = this.starMaterial.clone();
    this.haloMaterial.uniforms.uMaxSize.value = 120 * this.renderer.getPixelRatio();
    this.halo = new THREE.Points(hgeo, this.haloMaterial);
    this.halo.visible = false;
    this.group.add(this.halo);

    this._applyEmphasis();
    this.frameAll(false);
  }

  _disposeGraph() {
    for (const obj of [this.stars, this.lines, this.halo]) {
      if (!obj) continue;
      this.group.remove(obj);
      obj.geometry.dispose();
    }
    this.starMaterial?.dispose();
    this.haloMaterial?.dispose();
    this.linkMaterial?.dispose();
    this.stars = this.lines = this.halo = null;
  }

  // ── Emphasis: search matches, selection, neighbours ────────────────────
  setMatches(ids) {
    this.matchIds = ids && ids.length ? new Set(ids) : null;
    this._applyEmphasis();
  }

  _neighbours(id) {
    const set = new Set();
    if (!id) return set;
    for (const l of this.links || []) {
      if (l.source === id) set.add(l.target);
      if (l.target === id) set.add(l.source);
    }
    return set;
  }

  _applyEmphasis() {
    if (!this.stars) return;
    const alpha = this.stars.geometry.getAttribute('alpha');
    const near = this._neighbours(this.selectedId);
    this.nodes.forEach((n, i) => {
      let a = 1;
      if (this.matchIds) a = this.matchIds.has(n.id) ? 1 : 0.12;
      if (this.selectedId) {
        if (n.id === this.selectedId || near.has(n.id)) a = 1;
        else if (!this.matchIds) a = 0.35;
      }
      alpha.setX(i, a);
    });
    alpha.needsUpdate = true;

    const col = this.lines.geometry.getAttribute('color');
    const c1 = new THREE.Color();
    const c2 = new THREE.Color();
    this.links.forEach((l, i) => {
      const hot = this.selectedId && (l.source === this.selectedId || l.target === this.selectedId);
      const faded = (this.matchIds && !(this.matchIds.has(l.source) || this.matchIds.has(l.target))) ||
        (this.selectedId && !hot);
      const k = hot ? 0.95 : faded ? 0.05 : l.kind === 'species' ? 0.2 : 0.13;
      c1.set(this.nodes[l.a].color).multiplyScalar(k);
      c2.set(this.nodes[l.b].color).multiplyScalar(k);
      col.setXYZ(i * 2, c1.r, c1.g, c1.b);
      col.setXYZ(i * 2 + 1, c2.r, c2.g, c2.b);
    });
    col.needsUpdate = true;

    const sel = this.selectedId != null ? this.index.get(this.selectedId) : undefined;
    if (sel != null && this.halo) {
      const p = this.halo.geometry.getAttribute('position');
      p.setXYZ(0, ...this.nodes[sel].position);
      p.needsUpdate = true;
      // Halo takes the star's own color, lifted toward white.
      const hc = new THREE.Color(this.nodes[sel].color).lerp(new THREE.Color(0xffffff), 0.45);
      this.halo.geometry.getAttribute('color').setXYZ(0, hc.r, hc.g, hc.b);
      this.halo.geometry.getAttribute('color').needsUpdate = true;
      this.halo.visible = true;
    } else if (this.halo) {
      this.halo.visible = false;
    }
  }

  // ── Selection + camera flights ─────────────────────────────────────────
  select(id, { fly = true } = {}) {
    if (id != null && !this.index.has(id)) return;
    this.selectedId = id;
    this._applyEmphasis();
    if (id != null && fly) {
      const node = this.nodes[this.index.get(id)];
      const distance = node.kind === 'species' || node.kind === 'site' ? 34 : 18;
      this.flyTo(node.position, distance);
    }
    this._wake();
  }

  flyTo(point, distance = 24) {
    const target = new THREE.Vector3(...point);
    // Approach from outside the galaxy, slightly above, so the star sits in
    // front of its constellation instead of behind it.
    const outward = target.clone().normalize();
    if (outward.lengthSq() < 0.01) outward.set(0, 0.3, 1).normalize();
    const dir = outward.add(new THREE.Vector3(0, 0.35, 0)).normalize();
    const endPos = target.clone().add(dir.multiplyScalar(distance));
    this.controls.autoRotate = false;
    this.lastInteraction = performance.now();
    if (this.reducedMotion) {
      this.camera.position.copy(endPos);
      this.controls.target.copy(target);
      this.controls.update();
      this.flight = null;
    } else {
      this.flight = {
        start: performance.now(),
        duration: 1400,
        fromPos: this.camera.position.clone(),
        toPos: endPos,
        fromTarget: this.controls.target.clone(),
        toTarget: target,
      };
    }
    this._wake();
  }

  frameAll(animate = true) {
    if (!this.nodes.length) return;
    const box = new THREE.Box3();
    for (const n of this.nodes) box.expandByPoint(this._tmp.set(...n.position));
    const center = box.getCenter(new THREE.Vector3());
    const radius = Math.max(box.getSize(new THREE.Vector3()).length() / 2, 20);
    const dist = radius / Math.sin((this.camera.fov * Math.PI) / 360) * 0.62;
    const endPos = center.clone().add(new THREE.Vector3(0, radius * 0.35, dist));
    if (!animate || this.reducedMotion) {
      this.camera.position.copy(endPos);
      this.controls.target.copy(center);
      this.controls.update();
    } else {
      this.flight = {
        start: performance.now(), duration: 1200,
        fromPos: this.camera.position.clone(), toPos: endPos,
        fromTarget: this.controls.target.clone(), toTarget: center,
      };
    }
    this.controls.autoRotate = !this.reducedMotion;
    this._wake();
  }

  // ── Labels (HTML, positioned each frame) ───────────────────────────────
  setLabelElements(map) {
    this.labelEls = map;
    this._wake();
  }

  _updateLabels() {
    if (!this.labelEls.size) return;
    const w = this.renderer.domElement.clientWidth;
    const h = this.renderer.domElement.clientHeight;
    for (const [id, el] of this.labelEls) {
      const i = this.index.get(id);
      if (i == null || !el) continue;
      const node = this.nodes[i];
      this._tmp.set(...node.position).project(this.camera);
      const behind = this._tmp.z > 1;
      const x = (this._tmp.x * 0.5 + 0.5) * w;
      const y = (-this._tmp.y * 0.5 + 0.5) * h;
      const dist = this.camera.position.distanceTo(new THREE.Vector3(...node.position));
      const emphasized = id === this.selectedId || id === this.hoverId;
      const fade = emphasized ? 1 : Math.max(0, Math.min(1, (340 - dist) / 170));
      const dim = this.matchIds && !this.matchIds.has(id) ? 0.15 : 1;
      // Hide labels that would be cut off at the screen edge.
      const offscreen = x < 36 || x > w - 36 || y < 12 || y > h - 4;
      el.style.opacity = behind || (offscreen && !emphasized) ? '0' : String(fade * dim);
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -140%)`;
    }
  }

  // ── Input ──────────────────────────────────────────────────────────────
  _pick(clientX, clientY) {
    if (!this.stars) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    let best = null;
    let bestD = Infinity;
    const alpha = this.stars.geometry.getAttribute('alpha');
    const touchRadius = 26;
    for (let i = 0; i < this.nodes.length; i++) {
      if (alpha.getX(i) < 0.3) continue;
      this._tmp.set(...this.nodes[i].position).project(this.camera);
      if (this._tmp.z > 1) continue;
      const x = (this._tmp.x * 0.5 + 0.5) * rect.width + rect.left;
      const y = (-this._tmp.y * 0.5 + 0.5) * rect.height + rect.top;
      const d = Math.hypot(x - clientX, y - clientY);
      // Bigger stars are easier to hit; nearer ones win ties.
      const reach = touchRadius + this.nodes[i].size * 0.6;
      if (d < reach && d - this.nodes[i].size * 0.4 + this._tmp.z * 4 < bestD) {
        bestD = d - this.nodes[i].size * 0.4 + this._tmp.z * 4;
        best = this.nodes[i];
      }
    }
    return best;
  }

  _onPointerDown(e) {
    this._down = { x: e.clientX, y: e.clientY, t: performance.now() };
  }

  _onPointerUp(e) {
    const d = this._down;
    this._down = null;
    if (!d) return;
    const moved = Math.hypot(e.clientX - d.x, e.clientY - d.y);
    if (moved > 8 || performance.now() - d.t > 500) return;
    const node = this._pick(e.clientX, e.clientY);
    this.onSelect(node ? node.id : null);
  }

  _onPointerMove(e) {
    if (e.pointerType !== 'mouse' || this._down) return;
    if (this._hoverRaf) return;
    this._hoverRaf = requestAnimationFrame(() => {
      this._hoverRaf = null;
      const node = this._pick(e.clientX, e.clientY);
      const id = node ? node.id : null;
      if (id !== this.hoverId) {
        this.hoverId = id;
        this.renderer.domElement.style.cursor = id ? 'pointer' : 'grab';
        this.onHover(id);
      }
    });
  }

  _onContextLost(e) {
    e.preventDefault();
    this.running = false;
    this.onError(new Error('WebGL context lost'));
  }

  _onVisibility() {
    this.visible = document.visibilityState !== 'hidden';
    this._syncLoop();
  }

  // ── Loop ───────────────────────────────────────────────────────────────
  _syncLoop() {
    const should = !this.disposed && this.visible && this.onScreen;
    if (should && !this.running) {
      this.running = true;
      this._raf = requestAnimationFrame(this._loop);
    } else if (!should && this.running) {
      this.running = false;
      cancelAnimationFrame(this._raf);
    }
  }

  _wake() {
    this._syncLoop();
  }

  _loop(now) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this._loop);

    if (this.flight) {
      const f = this.flight;
      const t = Math.min(1, (now - f.start) / f.duration);
      const k = easeInOutCubic(t);
      this.camera.position.lerpVectors(f.fromPos, f.toPos, k);
      this.controls.target.lerpVectors(f.fromTarget, f.toTarget, k);
      if (t >= 1) this.flight = null;
    }
    // Resume the slow drift after a while without input.
    if (!this.reducedMotion && !this.flight && !this.controls.autoRotate && !this.selectedId &&
        now - this.lastInteraction > 9000) {
      this.controls.autoRotate = true;
    }
    this.controls.update();

    if (this.halo?.visible) {
      const s = this.halo.geometry.getAttribute('size');
      const node = this.nodes[this.index.get(this.selectedId)];
      const base = node ? node.size * 2.2 : 20;
      s.setX(0, base * (this.reducedMotion ? 1 : 1 + Math.sin(now * 0.004) * 0.18));
      s.needsUpdate = true;
    }
    if (this.sky && !this.reducedMotion) this.sky.rotation.y += 0.00008;

    this._updateLabels();
    this.renderer.render(this.scene, this.camera);
  }

  resize() {
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this._wake();
  }

  dispose() {
    this.disposed = true;
    this.running = false;
    cancelAnimationFrame(this._raf);
    if (this._hoverRaf) cancelAnimationFrame(this._hoverRaf);
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this._onPointerDown);
    canvas.removeEventListener('pointerup', this._onPointerUp);
    canvas.removeEventListener('pointermove', this._onPointerMove);
    canvas.removeEventListener('webglcontextlost', this._onContextLost);
    document.removeEventListener('visibilitychange', this._onVisibility);
    this.resizeObserver.disconnect();
    this.intersection.disconnect();
    this.controls.dispose();
    this._disposeGraph();
    this.sky.geometry.dispose();
    this.sky.material.dispose();
    this.renderer.dispose();
    canvas.remove();
  }
}
