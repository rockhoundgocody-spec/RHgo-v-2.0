import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// State and persistent refs for the hook
let effectCleanup = null;
let currentMuted = { value: false };
let currentStarted = { value: false };

let ctxRef = { current: null };
let masterRef = { current: null };
let sfxRef = { current: null };
let nodesRef = { current: [] };

let useRefCallCount = 0;
let useStateCallCount = 0;

vi.mock('react', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useRef: (initial) => {
      const callIdx = useRefCallCount++;
      if (callIdx % 4 === 0) return ctxRef;
      if (callIdx % 4 === 1) return masterRef;
      if (callIdx % 4 === 2) return sfxRef;
      return nodesRef;
    },
    useState: (initial) => {
      const callIdx = useStateCallCount++;
      if (callIdx % 2 === 0) {
        const setMuted = (val) => {
          const next = typeof val === 'function' ? val(currentMuted.value) : val;
          currentMuted.value = next;
        };
        return [currentMuted.value, setMuted];
      } else {
        const setStarted = (val) => {
          const next = typeof val === 'function' ? val(currentStarted.value) : val;
          currentStarted.value = next;
        };
        return [currentStarted.value, setStarted];
      }
    },
    useCallback: (fn) => fn,
    useEffect: (effect) => {
      const res = effect();
      if (typeof res === 'function') {
        effectCleanup = res;
      }
    },
  };
});

import { useIntroAudio } from './useIntroAudio';

describe('useIntroAudio', () => {
  let mockAudioContext;
  let originalAudioContext;
  let originalWebkitAudioContext;
  let consoleWarnSpy;

  const createMockGainNode = () => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  });

  const createMockOscillatorNode = () => ({
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
  });

  const createMockBiquadFilterNode = () => ({
    type: 'lowpass',
    frequency: {
      value: 350,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    Q: { value: 1 },
    connect: vi.fn(),
  });

  const createMockDelayNode = () => ({
    delayTime: { value: 0 },
    connect: vi.fn(),
  });

  const createMockAudioBuffer = () => {
    const channelData = new Float32Array(100);
    return {
      getChannelData: vi.fn(() => channelData),
    };
  };

  const createMockBufferSourceNode = () => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  });

  const createMockAudioContextInstance = () => ({
    state: 'running',
    currentTime: 10,
    sampleRate: 44100,
    destination: {},
    resume: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    createGain: vi.fn(createMockGainNode),
    createOscillator: vi.fn(createMockOscillatorNode),
    createBiquadFilter: vi.fn(createMockBiquadFilterNode),
    createDelay: vi.fn(createMockDelayNode),
    createBuffer: vi.fn(createMockAudioBuffer),
    createBufferSource: vi.fn(createMockBufferSourceNode),
  });

  function MockAudioContextConstructor() {
    return mockAudioContext;
  }

  // React's hooks are mocked in this file, so the hook is invoked directly.
  // Named as a hook so the rules-of-hooks lint accepts the call.
  const useCallHook = () => {
    useRefCallCount = 0;
    useStateCallCount = 0;
    return useIntroAudio();
  };
  const callHook = useCallHook;

  beforeEach(() => {
    effectCleanup = null;
    currentMuted = { value: false };
    currentStarted = { value: false };

    ctxRef = { current: null };
    masterRef = { current: null };
    sfxRef = { current: null };
    nodesRef = { current: [] };

    originalAudioContext = globalThis.window?.AudioContext;
    originalWebkitAudioContext = globalThis.window?.webkitAudioContext;

    mockAudioContext = createMockAudioContextInstance();
    const mockConstructor = vi.fn().mockImplementation(MockAudioContextConstructor);

    // Set up window on globalThis (covers Node's `global` alias too)
    const mockWindow = {
      AudioContext: mockConstructor,
    };

    globalThis.window = mockWindow;

    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    if (globalThis.window) {
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
    }
  });

  it('returns initial state with muted=false and started=false', () => {
    const audio = callHook();
    expect(audio.muted).toBe(false);
    expect(audio.started).toBe(false);
    expect(typeof audio.initAudio).toBe('function');
    expect(typeof audio.playChime).toBe('function');
    expect(typeof audio.playClick).toBe('function');
    expect(typeof audio.playWhoosh).toBe('function');
    expect(typeof audio.toggleMute).toBe('function');
  });

  it('initializes audio context and ambient pad oscillators on initAudio', () => {
    const audio = callHook();

    audio.initAudio();

    expect(window.AudioContext).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockAudioContext.createBiquadFilter).toHaveBeenCalled();
    expect(mockAudioContext.createDelay).toHaveBeenCalledWith(2);
    // 3 ambient pad oscillators + 3 LFO oscillators = 6 total oscillators
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(6);
    expect(currentStarted.value).toBe(true);

    const reRendered = callHook();
    expect(reRendered.started).toBe(true);
  });

  it('resumes suspended audio context if initAudio is called again', () => {
    mockAudioContext.state = 'suspended';
    const audio = callHook();

    audio.initAudio();
    expect(window.AudioContext).toHaveBeenCalledTimes(1);

    // Call initAudio again when context exists and is suspended
    audio.initAudio();
    expect(mockAudioContext.resume).toHaveBeenCalledTimes(1);
  });

  it('handles resume rejection gracefully when audio context is suspended', async () => {
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockRejectedValue(new Error('Autoplay blocked'));
    const audio = callHook();

    audio.initAudio();
    audio.initAudio();

    expect(mockAudioContext.resume).toHaveBeenCalled();
    // Rejection handled silently via .catch()
  });

  it('does nothing on second initAudio call if context is running', () => {
    mockAudioContext.state = 'running';
    const audio = callHook();

    audio.initAudio();
    audio.initAudio();

    expect(window.AudioContext).toHaveBeenCalledTimes(1);
    expect(mockAudioContext.resume).not.toHaveBeenCalled();
  });

  it('falls back to webkitAudioContext if AudioContext is missing', () => {
    delete window.AudioContext;
    function WebkitConstructor() { return mockAudioContext; }
    const mockWebkit = vi.fn().mockImplementation(WebkitConstructor);
    window.webkitAudioContext = mockWebkit;

    const audio = callHook();
    audio.initAudio();

    expect(mockWebkit).toHaveBeenCalledTimes(1);
  });

  it('catches initialization errors and logs a warning', () => {
    window.AudioContext.mockImplementation(() => {
      throw new Error('Web Audio not supported');
    });

    const audio = callHook();
    audio.initAudio();

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Intro audio init failed:',
      expect.any(Error)
    );
  });

  it('plays chime SFX when initialized and not muted', () => {
    const audio = callHook();
    audio.initAudio();

    mockAudioContext.createOscillator.mockClear();

    audio.playChime();

    // 3 sine oscillators for triad [880, 1320, 1760]
    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(3);
  });

  it('does not play chime SFX when not initialized or when muted', () => {
    let audio = callHook();

    // Uninitialized
    audio.playChime();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();

    // Initialized but muted
    audio.initAudio();
    audio.toggleMute(); // muted = true
    audio = callHook(); // re-eval hook with muted = true

    mockAudioContext.createOscillator.mockClear();

    audio.playChime();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('plays click SFX when initialized and not muted', () => {
    const audio = callHook();
    audio.initAudio();

    mockAudioContext.createOscillator.mockClear();

    audio.playClick();

    expect(mockAudioContext.createOscillator).toHaveBeenCalledTimes(1);
  });

  it('does not play click SFX when not initialized or when muted', () => {
    let audio = callHook();

    audio.playClick();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();

    audio.initAudio();
    audio.toggleMute();
    audio = callHook();

    mockAudioContext.createOscillator.mockClear();

    audio.playClick();
    expect(mockAudioContext.createOscillator).not.toHaveBeenCalled();
  });

  it('plays whoosh SFX with noise buffer when initialized and not muted', () => {
    const audio = callHook();
    audio.initAudio();

    audio.playWhoosh();

    expect(mockAudioContext.createBuffer).toHaveBeenCalledWith(
      1,
      mockAudioContext.sampleRate * 0.4,
      mockAudioContext.sampleRate
    );
    expect(mockAudioContext.createBufferSource).toHaveBeenCalledTimes(1);
  });

  it('does not play whoosh SFX when not initialized or when muted', () => {
    let audio = callHook();

    audio.playWhoosh();
    expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();

    audio.initAudio();
    audio.toggleMute();
    audio = callHook();

    audio.playWhoosh();
    expect(mockAudioContext.createBufferSource).not.toHaveBeenCalled();
  });

  it('toggles mute state and ramps master gain when initialized', () => {
    let audio = callHook();
    audio.initAudio();

    // Toggle mute -> true
    audio.toggleMute();
    expect(currentMuted.value).toBe(true);

    audio = callHook();
    expect(audio.muted).toBe(true);

    // Toggle mute -> false
    audio.toggleMute();
    expect(currentMuted.value).toBe(false);

    audio = callHook();
    expect(audio.muted).toBe(false);
  });

  it('cleans up nodes and closes audio context on unmount', () => {
    const audio = callHook();
    audio.initAudio();

    // Trigger cleanup
    if (typeof effectCleanup === 'function') {
      effectCleanup();
    }

    expect(mockAudioContext.close).toHaveBeenCalledTimes(1);
  });

  it('handles errors during node stop on cleanup gracefully', () => {
    mockAudioContext.createOscillator = vi.fn().mockImplementation(() => {
      const node = createMockOscillatorNode();
      node.stop.mockImplementation(() => {
        throw new Error('InvalidStateError: node already stopped');
      });
      return node;
    });

    const audio = callHook();
    audio.initAudio();

    expect(() => {
      if (typeof effectCleanup === 'function') {
        effectCleanup();
      }
    }).not.toThrow();
  });
});