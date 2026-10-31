import * as THREE from 'three';
import createOrbSurface from '@/components/visuals/orbSurface';

const PLACEMENTS = [[.02, .17, 230, .25], [.88, .63, 150, .2], [.88, .34, 260, .6], [.16, .84, 120, .85], [.83, .06, 150, .35]];

// getLive (optional) returns { energy: 0-1, amber: 0-1 } so Clover's surface
// reacts to listening / speaking while sharing the background's motion model.
export default function createOrbScene(canvas, field, getLive, mercury = false) {
  let energy = 0;
  const context = canvas.getContext('webgl2', { alpha: true, antialias: true, powerPreference: 'low-power' });
  if (!context) return null;
  const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 4000);
  camera.position.z = 1500;
  const geometry = new THREE.SphereGeometry(1, 64, 48);
  const shadowGeometry = new THREE.PlaneGeometry(2, 2);
  const shadowMaterial = new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    vertexShader: 'varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying vec2 vUv; uniform float strength; void main(){vec2 p=(vUv-.5)*2.;float a=exp(-dot(p,p)*4.)*(1.-smoothstep(.65,1.,length(p)));gl_FragColor=vec4(.015,.025,.03,a*strength);}',
    uniforms: { strength: { value: .7 } },
  });
  const orbs = (field ? PLACEMENTS : [[.5, .44, 0, .55]]).map((placement, i) => {
    const material = createOrbSurface(placement[3], mercury);
    const mesh = new THREE.Mesh(geometry, material);
    const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial.clone());
    shadow.position.z = -100;
    scene.add(shadow, mesh);
    return { mesh, shadow, placement, phase: i * 1.7, x: 0, y: 0, radius: 1 };
  });
  function resize(width, height) {
    renderer.setSize(width, height, false);
    Object.assign(camera, { left: -width / 2, right: width / 2, top: height / 2, bottom: -height / 2 });
    camera.updateProjectionMatrix();
    orbs.forEach(o => {
      o.x = (o.placement[0] - .5) * width;
      o.y = (.5 - o.placement[1]) * height;
      o.radius = field ? o.placement[2] * Math.min(1, width / 600) / 2 : Math.min(width, height) * .355;
    });
  }
  function draw(time, tilt, reduced) {
    const live = getLive?.();
    if (live) energy += ((live.energy || 0) - energy) * .12;
    orbs.forEach(o => {
      const t = reduced ? o.phase : time + o.phase;
      const lift = reduced ? 0 : Math.sin(t * .9) * o.radius * .12;
      const breath = reduced ? 1 : 1 + .035 * Math.sin(t * 1.5) + energy * (.05 + .03 * Math.sin(t * 7));
      o.mesh.material.uniforms.uEnergy.value = energy;
      if (live?.amber != null) o.mesh.material.uniforms.uAmber.value += (live.amber - o.mesh.material.uniforms.uAmber.value) * .06;
      o.mesh.scale.setScalar(o.radius * breath);
      o.mesh.position.set(o.x + tilt.x * o.radius * .13, o.y + lift - tilt.y * o.radius * .1, 0);
      o.mesh.rotation.set(.12 + tilt.y * .2 + (reduced ? 0 : Math.sin(t * .5) * .12), tilt.x * .35 + (reduced ? 0 : Math.sin(t * .6) * .24), -.12);
      o.mesh.material.uniforms.uTime.value = reduced ? .8 : t;
      o.shadow.position.set(o.x, o.y - o.radius * 1.18, -100);
      o.shadow.scale.set(o.radius * (.82 - lift / o.radius * .3), o.radius * .18, 1);
      o.shadow.material.uniforms.strength.value = .75 - lift / o.radius;
    });
    renderer.render(scene, camera);
  }
  return { resize, draw, dispose() {
    geometry.dispose(); shadowGeometry.dispose(); shadowMaterial.dispose();
    orbs.forEach(o => { o.mesh.material.dispose(); o.shadow.material.dispose(); });
    renderer.dispose();
  } };
}