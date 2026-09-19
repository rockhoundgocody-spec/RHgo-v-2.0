import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { useFocusTrap } from './useFocusTrap';

let stateStore = {};
let effectStore = [];

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useState: (initial) => {
      const id = stateStore.currentId++;
      if (!(id in stateStore.values)) {
        stateStore.values[id] = typeof initial === 'function' ? initial() : initial;
      }
      const setState = (val) => {
        stateStore.values[id] = typeof val === 'function' ? val(stateStore.values[id]) : val;
      };
      return [stateStore.values[id], setState];
    },
    useEffect: (fn, deps) => {
      effectStore.push({ fn, deps });
    },
    useRef: (initial) => ({ current: initial }),
  };
});

describe('useFocusTrap', () => {
  let activeElement;
  let eventListeners;
  let container;
  let btn1;
  let btn2;
  let input1;
  let triggerBtn;
  let cleanups = [];

  beforeEach(() => {
    vi.clearAllMocks();
    stateStore = { currentId: 0, values: {} };
    effectStore = [];
    cleanups = [];
    eventListeners = {};

    btn1 = { id: 'btn1', focus: vi.fn(() => { activeElement = btn1; }) };
    btn2 = { id: 'btn2', focus: vi.fn(() => { activeElement = btn2; }) };
    input1 = { id: 'input1', focus: vi.fn(() => { activeElement = input1; }) };
    triggerBtn = { id: 'trigger', focus: vi.fn(() => { activeElement = triggerBtn; }) };
    activeElement = triggerBtn;

    const elements = [btn1, input1, btn2];

    container = {
      querySelectorAll: vi.fn((selector) => {
        if (selector.includes('button')) return elements;
        return [];
      }),
      querySelector: vi.fn((selector) => {
        if (selector === '#input1') return input1;
        return null;
      }),
    };

    globalThis.document = {
      get activeElement() {
        return activeElement;
      },
      addEventListener: vi.fn((event, handler) => {
        eventListeners[event] = handler;
      }),
      removeEventListener: vi.fn((event, handler) => {
        if (eventListeners[event] === handler) {
          delete eventListeners[event];
        }
      }),
    };
  });

  afterEach(() => {
    cleanups.forEach((cleanup) => cleanup?.());
    delete globalThis.document;
  });

  function renderHook(containerRef, isActive, options) {
    effectStore = [];
    useFocusTrap(containerRef, isActive, options);
    const effectsToRun = [...effectStore];
    effectStore = [];
    effectsToRun.forEach(({ fn }) => {
      const cleanup = fn();
      if (typeof cleanup === 'function') cleanups.push(cleanup);
    });
  }

  it('auto-focuses the first focusable element inside the container when active', () => {
    const containerRef = { current: container };
    renderHook(containerRef, true);

    expect(btn1.focus).toHaveBeenCalled();
    expect(activeElement).toBe(btn1);
  });

  it('focuses element matching initialFocusSelector if provided', () => {
    const containerRef = { current: container };
    renderHook(containerRef, true, { initialFocusSelector: '#input1' });

    expect(input1.focus).toHaveBeenCalled();
    expect(activeElement).toBe(input1);
  });

  it('handles Escape key press and triggers onEscape callback', () => {
    const onEscape = vi.fn();
    const containerRef = { current: container };
    renderHook(containerRef, true, { onEscape });

    const preventDefault = vi.fn();
    eventListeners.keydown({ key: 'Escape', preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(onEscape).toHaveBeenCalled();
  });

  it('traps focus when tabbing forward from last element to first element', () => {
    const containerRef = { current: container };
    renderHook(containerRef, true);

    activeElement = btn2;
    const preventDefault = vi.fn();
    eventListeners.keydown({ key: 'Tab', shiftKey: false, preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(btn1.focus).toHaveBeenCalled();
  });

  it('traps focus when shift-tabbing backward from first element to last element', () => {
    const containerRef = { current: container };
    renderHook(containerRef, true);

    activeElement = btn1;
    const preventDefault = vi.fn();
    eventListeners.keydown({ key: 'Tab', shiftKey: true, preventDefault });

    expect(preventDefault).toHaveBeenCalled();
    expect(btn2.focus).toHaveBeenCalled();
  });

  it('restores focus to triggerRef or previously focused element on unmount', () => {
    const containerRef = { current: container };
    const triggerRef = { current: triggerBtn };

    renderHook(containerRef, true, { triggerRef });

    // Trigger cleanups (simulating component unmount / deactivate)
    cleanups.forEach((cleanup) => cleanup?.());
    cleanups = [];

    expect(triggerBtn.focus).toHaveBeenCalled();
  });
});
