import * as THREE from 'three';

// Actual sphere vertices, including a recessed front face; light is evaluated
// from the deformed surface normal, not painted onto a circular image.
export const vertexShader = `
  uniform float uTime;
  uniform float uEnergy;
  varying vec3 vPoint;
  varying vec3 vView;
  void main() {
    vec3 p = position;
    float wave = sin(p.y * 5.0 + uTime * 1.2) * sin(p.x * 4.0 - uTime * .8)
               + .45 * sin(p.z * 7.0 + p.y * 3.0 + uTime);
    p *= 1.0 + (.025 + .05 * uEnergy) * wave;
    float hollow = exp(-dot(p.xy, p.xy) * 5.5) * smoothstep(.1, .8, p.z);
    p.z -= .62 * hollow;
    vPoint = p;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vView = mv.xyz;
    gl_Position = projectionMatrix * mv;
  }
`;

export const fragmentShader = `
  uniform float uTime;
  uniform float uAmber;
  uniform float uEnergy;
  varying vec3 vPoint;
  varying vec3 vView;
  void main() {
    vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
    vec3 eye = normalize(-vView);
    vec3 p = vPoint * 3.0;
    p += .5 * sin(p.yzx * 1.8 + vec3(uTime * .55, -uTime * .4, uTime * .3));
    float flow = sin(p.x + sin(p.y * 1.3 + uTime * .6))
               * cos(p.z * 1.4 - uTime * .45) + sin(p.y + p.z + uTime * .35) * .5;
    vec3 frost = vec3(.40, .80, .83);
    vec3 amber = vec3(.95, .46, .10);
    vec3 ink = vec3(.012, .025, .035);
    float bands = .5 + .5 * sin(flow * 5.0 + p.z * 1.8);
    vec3 tint = mix(frost, amber, clamp(uAmber + flow * .27, 0.0, 1.0));
    float diffuse = max(dot(n, normalize(vec3(-.6, .8, 1.3))), 0.0);
    float rim = pow(1.0 - max(dot(n, eye), 0.0), 2.6);
    vec3 reflection = reflect(-eye, n);
    float softbox = pow(max(dot(reflection, normalize(vec3(-.65, .85, 1.0))), 0.0), 18.0);
    float strip = pow(max(dot(reflection, normalize(vec3(.85, -.35, .5))), 0.0), 45.0);
    float pool = exp(-dot(vPoint.xy - vec2(.06, -.12), vPoint.xy - vec2(.06, -.12)) * 8.0);
    vec3 color = mix(ink, tint * .48, bands * .62) * (.2 + diffuse * .9);
    color += tint * rim * .72 + vec3(.9, .98, 1.0) * softbox * .95;
    color += amber * strip * .95 + amber * pool * (.12 + .12 * bands);
    color += frost * pow(bands, 18.0) * .17;
    color += tint * uEnergy * (.18 * rim + .22 * pool);
    gl_FragColor = vec4(color, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;

export default function createOrbSurface(amber = .4) {
  return new THREE.ShaderMaterial({
    uniforms: { uTime: { value: 0 }, uAmber: { value: amber }, uEnergy: { value: 0 } },
    vertexShader, fragmentShader,
  });
}