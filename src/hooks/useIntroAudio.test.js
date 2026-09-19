import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Hook state harness for testing useIntroAudio as a pure function
let hookState = { stateCounter: 0, values: {} };
let cleanupFn = null;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRef: (initial) => ({ current: initial }),
    useState: (initial) => {
      const id = hookState.stateCounter++;
      if (!(id in hookState.values)) {
        hookState.values[id] = typeof initial === 'function' ? initial() : initial;
      }
      const setter = vi.fn((action) => {
        const prev = hookState.values[id];
        const next = typeof action === 'function' ? action(prev) : action;
        hookState.values[id] = next;
      });
      return [hookState.values[id], setter];
    },
    useCallback: (fn) => fn,
    useEffect: (fn) => {
      cleanupFn = fn();
    },
  };
});

import { useIntroAudio } from './useIntroAudio';

function createMockGainNode() {
  return {
    gain: {
      value: 1.0,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
}

function createMockBiquadFilterNode() {
  return {
    type: 'lowpass',
    frequency: {
      value: 300,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    Q: { value: 1.0 },
    connect: vi.fn(),
  };
}

function createMockDelayNode() {
  return {
    delayTime: { value: 0 },
    connect: vi.fn(),
  };
}

function createMockOscillatorNode() {
  return {
    type: 'sine',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    detune: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockAudioBufferSourceNode() {
  return {
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
}

function createMockAudioBuffer(channels, size, sampleRate) {
  const data = new Float32Array(size);
  return {
    getChannelData: vi.fn(() => data),
  };
}

class MockAudioContext {
  constructor() {
    this.state = 'running';
    this.currentTime = 0.5;
    this.sampleRate = 44100;
    this.destination = {};
    this.resume = vi.fn().mockResolvedValue(undefined);
    this.close = vi.fn().mockResolvedValue(undefined);

    this.createdGains = [];
    this.createdOscillators = [];
    this.createdFilters = [];
    this.createdDelays = [];
    this.createdBuffers = [];
    this.createdBufferSources = [];
  }

  createGain() {
    const gain = createMockGainNode();
    this.createdGains.push(gain);
    return gain;
  }

  createBiquadFilter() {
    const filter = createMockBiquadFilterNode();
    this.createdFilters.push(filter);
    return filter;
  }

  createDelay(maxDelay) {
    const delay = createMockDelayNode();
    this.createdDelays.push(delay);
    return delay;
  }

  createOscillator() {
    const osc = createMockOscillatorNode();
    this.createdOscillators.push(osc);
    return osc;
  }

  createBuffer(channels, size, sampleRate) {
    const buffer = createMockAudioBuffer(channels, size, sampleRate);
    this.createdBuffers.push(buffer);
    return buffer;
  }

  createBufferSource() {
    const source = createMockAudioBufferSourceNode();
    this.createdBufferSources.push(source);
    return source;
  }
}

describe('useIntroAudio', () => {
  let originalAudioContext;
  let originalWebkitAudioContext;
  let warnSpy;

  beforeEach(() => {
    hookState = { stateCounter: 0, values: {} };
    cleanupFn = null;

    originalAudioContext = globalThis.window?.AudioContext;
    originalWebkitAudioContext = globalThis.window?.webkitAudioContext;

    if (!globalThis.window) {
      globalThis.window = {};
    }

    globalThis.window.AudioContext = MockAudioContext;
    globalThis.window.webkitAudioContext = undefined;

    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (originalAudioContext !== undefined) {
      globalThis.window.AudioContext = originalAudioContext;
    } else {
      delete globalThis.window.AudioContext;
    }
    if (originalWebkitAudioContext !== undefined) {
      globalThis.window.webkitAudioContext = originalWebkitAudioContext;
    } else {
      delete globalThis.window.webkitAudioContext;
    }
  });

  describe('Error Handling and Initialization', () => {
    it('catches and logs error when AudioContext constructor throws', () => {
      const err = new Error('AudioContext creation blocked by browser policy');
      globalThis.window.AudioContext = function () {
        throw err;
      };

      hookState.stateCounter = 0;
      const { initAudio } = useIntroAudio();

      expect(() => initAudio()).not.toThrow();

      expect(warnSpy).toHaveBeenCalledWith('Intro audio init failed:', err);

      hookState.stateCounter = 0;
      const { started } = useIntroAudio();
      expect(started).toBe(false);
    });

    it('catches and logs error when webkitAudioContext constructor throws', () => {
      const err = new Error('webkitAudioContext failure');
      globalThis.window.AudioContext = undefined;
      globalThis.window.webkitAudioContext = function () {
        throw err;
      };

      hookState.stateCounter = 0;
      const { initAudio } = useIntroAudio();

      expect(() => initAudio()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith('Intro audio init failed:', err);

      hookState.stateCounter = 0;
      const { started } = useIntroAudio();
      expect(started).toBe(false);
    });

    it('catches and logs error when audio node creation fails during init', () => {
      const err = new Error('Failed to create GainNode: max limit exceeded');
      const CustomContext = class extends MockAudioContext {
        createGain() {
          throw err;
        }
      };
      globalThis.window.AudioContext = CustomContext;

      hookState.stateCounter = 0;
      const { initAudio } = useIntroAudio();

      expect(() => initAudio()).not.toThrow();
      expect(warnSpy).toHaveBeenCalledWith('Intro audio init failed:', err);

      hookState.stateCounter = 0;
      const { started } = useIntroAudio();
      expect(started).toBe(false);
    });

    it('successfully initializes Web Audio API nodes and sets started to true on happy path', () => {
      hookState.stateCounter = 0;
      const { initAudio } = useIntroAudio();

      initAudio();

      expect(warnSpy).not.toHaveBeenCalled();

      hookState.stateCounter = 0;
      const { started } = useIntroAudio();
      expect(started).toBe(true);
    });

    it('resumes suspended audio context and avoids re-initializing when initAudio is called repeatedly', () => {
      let createdCtx;
      const CustomContext = class extends MockAudioContext {
        constructor() {
          super();
          this.state = 'suspended';
          createdCtx = this;
        }
      };
      globalThis.window.AudioContext = CustomContext;

      hookState.stateCounter = 0;
      const { initAudio } = useIntroAudio();

      initAudio();

      expect(createdCtx.resume).not.toHaveBeenCalled();

      // Call initAudio a second time while state is suspended
      initAudio();

      expect(createdCtx.resume).toHaveBeenCalledTimes(1);
    });
  });

  describe('SFX Playback', () => {
    it('safely ignores SFX triggers when uninitialized', () => {
      hookState.stateCounter = 0;
      const { playChime, playClick, playWhoosh } = useIntroAudio();

      expect(() => playChime()).not.toThrow();
      expect(() => playClick()).not.toThrow();
      expect(() => playWhoosh()).not.toThrow();
    });

    it('ignores SFX triggers when muted is true', () => {
      let createdCtx;
      const CustomContext = class extends MockAudioContext {
        constructor() {
          super();
          createdCtx = this;
        }
      };
      globalThis.window.AudioContext = CustomContext;

      hookState.stateCounter = 0;
      const { initAudio, playChime, playClick, playWhoosh } = useIntroAudio();

      initAudio();

      // Mark muted state as true (index 0)
      hookState.values[0] = true;

      const oscCountBefore = createdCtx.createdOscillators.length;
      const bufferSourceCountBefore = createdCtx.createdBufferSources.length;

      hookState.stateCounter = 0;
      const audioMuted = useIntroAudio();

      audioMuted.playChime();
      audioMuted.playClick();
      audioMuted.playWhoosh();

      expect(createdCtx.createdOscillators.length).toBe(oscCountBefore);
      expect(createdCtx.createdBufferSources.length).toBe(bufferSourceCountBefore);
    });

    it('plays chime, click, and whoosh SFX when initialized and unmuted', () => {
      let createdCtx;
      const CustomContext = class extends MockAudioContext {
        constructor() {
          super();
          createdCtx = this;
        }
      };
      globalThis.window.AudioContext = CustomContext;

      hookState.stateCounter = 0;
      const { initAudio, playChime, playClick, playWhoosh } = useIntroAudio();

      initAudio();

      const oscCountBeforeChime = createdCtx.createdOscillators.length;
      playChime();
      expect(createdCtx.createdOscillators.length).toBe(oscCountBeforeChime + 3);

      const oscCountBeforeClick = createdCtx.createdOscillators.length;
      playClick();
      expect(createdCtx.createdOscillators.length).toBe(oscCountBeforeClick + 1);

      const bufferSourceCountBeforeWhoosh = createdCtx.createdBufferSources.length;
      playWhoosh();
      expect(createdCtx.createdBufferSources.length).toBe(bufferSourceCountBeforeWhoosh + 1);
      expect(createdCtx.createdBuffers.length).toBe(1);
    });
  });

  describe('Mute Toggling', () => {
    it('toggles muted state and ramps master gain', () => {
      let createdCtx;
      const CustomContext = class extends MockAudioContext {
        constructor() {
          super();
          createdCtx = this;
        }
      };
      globalThis.window.AudioContext = CustomContext;

      hookState.stateCounter = 0;
      const { initAudio, toggleMute } = useIntroAudio();

      initAudio();

      const masterGain = createdCtx.createdGains[0];

      // First toggle: unmuted (false) -> muted (true)
      toggleMute();

      expect(hookState.values[0]).toBe(true);
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0, createdCtx.currentTime + 0.2);

      // Second toggle: muted (true) -> unmuted (false)
      toggleMute();

      expect(hookState.values[0]).toBe(false);
      expect(masterGain.gain.linearRampToValueAtTime).toHaveBeenLastCalledWith(0.5, createdCtx.currentTime + 0.2);
    });

    it('toggles muted state when uninitialized without throwing', () => {
      hookState.stateCounter = 0;
      const { toggleMute } = useIntroAudio();

      expect(() => toggleMute()).not.toThrow();
      expect(hookState.values[0]).toBe(true);
    });
  });

  describe('Unmount Cleanup', () => {
    it('stops active nodes and closes AudioContext on cleanup', () => {
      let createdCtx;
      const CustomContext = class extends MockAudioContext {
        constructor() {
          super();
          createdCtx = this;
        }
      };
      globalThis.window.AudioContext = CustomContext;

      hookState.stateCounter = 0;
      const { initAudio } = useIntroAudio();

      initAudio();

      expect(cleanupFn).toBeTypeOf('function');
      cleanupFn();

      createdCtx.createdOscillators.forEach((osc) => {
        expect(osc.stop).toHaveBeenCalled();
      });
      expect(createdCtx.close).toHaveBeenCalled();
    });

    it('safely catches errors thrown by oscillator.stop during cleanup', () => {
      const CustomContext = class extends MockAudioContext {
        createOscillator() {
          const osc = createMockOscillatorNode();
          osc.stop = vi.fn().mockImplementation(() => {
            throw new Error('Oscillator already stopped');
          });
          this.createdOscillators.push(osc);
          return osc;
        }
      };
      globalThis.window.AudioContext = CustomContext;

      hookState.stateCounter = 0;
      const { initAudio } = useIntroAudio();

      initAudio();

      expect(() => cleanupFn()).not.toThrow();
    });
  });
});
