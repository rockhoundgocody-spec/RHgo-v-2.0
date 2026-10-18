// @vitest-environment jsdom
import React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import WebGPUOpalShader from './WebGPUOpalShader';
import WebGPUFluidOverlay from './WebGPUFluidOverlay';
const state = vi.hoisted(() => ({ resolve: null, dispose: vi.fn(), init: vi.fn() }));
vi.mock('three/webgpu', () => ({ WebGPURenderer: class {
  constructor() { this.domElement = document.createElement('canvas'); }
  init() { state.init(); return new Promise((resolve) => { state.resolve = resolve; }); }
  dispose() { state.dispose(); }
} }));
afterEach(() => { cleanup(); vi.clearAllMocks(); vi.unstubAllGlobals(); });

describe.each([['opal', WebGPUOpalShader], ['fluid', WebGPUFluidOverlay]])('%s lifecycle', (_name, Component) => {
  it('waits for initialization before disposing after unmount', async () => {
    vi.stubGlobal('navigator', { gpu: {} });
    const view = render(<Component />);
    expect(state.init).toHaveBeenCalledTimes(1);
    view.unmount();
    expect(state.dispose).not.toHaveBeenCalled();
    await act(async () => { state.resolve(); });
    expect(state.dispose).toHaveBeenCalledTimes(1);
  });
  it('does not rebuild a renderer for changing audio intensity', async () => {
    vi.stubGlobal('navigator', { gpu: {} });
    const view = render(<Component intensity={1} />);
    view.rerender(<Component intensity={1.2} />);
    expect(state.init).toHaveBeenCalledTimes(1);
    view.unmount();
    await act(async () => { state.resolve(); });
    expect(state.dispose).toHaveBeenCalledTimes(1);
  });
});