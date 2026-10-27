import { describe, it, expect, vi } from 'vitest';
const state = vi.hoisted(() => ({ scene: null, camera: null }));
vi.mock('three', async importOriginal => {
  const actual = await importOriginal();
  return { ...actual, WebGLRenderer: class {
    setPixelRatio() {} setClearColor() {} setSize() {} dispose() {}
    render(scene, camera) { state.scene = scene; state.camera = camera; }
  } };
});
import createOrbScene from './orbScene';

describe('landing liquid geometry', () => {
  it('renders five real spheres with animated surface, volume and grounded shadows', () => {
    const scene = createOrbScene({ getContext: () => ({}) }, true);
    scene.resize(374, 812); scene.draw(1, { x: 0, y: 0 }, false);
    const spheres = state.scene.children.filter(m => m.geometry.type === 'SphereGeometry');
    expect(spheres).toHaveLength(5);
    expect(state.scene.children).toHaveLength(10);
    const orb = spheres[0];
    expect(orb.geometry.attributes.position.count).toBeGreaterThan(3000);
    expect(orb.material.vertexShader).toContain('p.z -= .62 * hollow');
    expect(orb.material.fragmentShader).toContain('dFdx(vView)');
    const before = orb.position.clone(), scale = orb.scale.x;
    scene.draw(2, { x: .7, y: .4 }, false);
    expect(orb.position.equals(before)).toBe(false);
    expect(orb.scale.x).not.toBe(scale);
    expect(orb.material.uniforms.uTime.value).toBe(2);
    const shadow = state.scene.children[0];
    expect(shadow.position.z).toBeLessThan(orb.position.z);
    expect(shadow.position.y).toBeLessThan(orb.position.y);
    scene.dispose();
  });
  it('keeps static volume but stops autonomous movement in reduced motion', () => {
    const scene = createOrbScene({ getContext: () => ({}) }, false);
    scene.resize(144, 144); scene.draw(1, { x: 0, y: 0 }, true);
    const orb = state.scene.children[1], before = orb.matrixWorld.clone();
    const position = orb.position.clone();
    scene.draw(20, { x: 0, y: 0 }, true);
    expect(orb.position.equals(position)).toBe(true);
    expect(orb.material.uniforms.uTime.value).toBe(.8);
    expect(orb.matrixWorld.equals(before)).toBe(true);
    expect(orb.scale.x).toBeCloseTo(51.12);
    scene.dispose();
  });
  it('leaves the shaded fallback when WebGL is unavailable', () => {
    expect(createOrbScene({ getContext: () => null }, false)).toBeNull();
  });
});