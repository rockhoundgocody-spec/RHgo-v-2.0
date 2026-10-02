import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getLuckyMineralOfTheDay, playOrbChime, playOrbBreath, triggerOrbHaptic } from "./orbAudio";

describe("orbAudio", () => {
  let originalWindow;
  let originalAudioContext;

  beforeEach(() => {
    originalWindow = globalThis.window;
    originalAudioContext = globalThis.AudioContext;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
    globalThis.AudioContext = originalAudioContext;
    vi.restoreAllMocks();
  });

  it("returns a deterministic lucky mineral of the day with proper fields", () => {
    const mineral = getLuckyMineralOfTheDay();
    expect(mineral).toBeDefined();
    expect(mineral.name).toBeTruthy();
    expect(mineral.buff).toBeTruthy();
    expect(mineral.tip).toBeTruthy();
    expect(mineral.dateKey).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("runs playOrbChime safely without error in node / jsdom environment", () => {
    expect(() => playOrbChime(528)).not.toThrow();
  });

  it("runs playOrbBreath safely without error", () => {
    expect(() => playOrbBreath()).not.toThrow();
  });

  it("handles suspended AudioContext resume error gracefully when window and AudioContext exist", () => {
    const catchMock = vi.fn();
    class MockAudioContext {
      constructor() {
        this.state = "suspended";
        this.currentTime = 0;

        this.resume = vi.fn().mockReturnValue({
          catch: catchMock,
        });

        this.createOscillator = vi.fn().mockReturnValue({
          type: "",
          frequency: { setValueAtTime: vi.fn() },
          connect: vi.fn(),
          start: vi.fn(),
          stop: vi.fn(),
        });

        this.createGain = vi.fn().mockReturnValue({
          gain: {
            setValueAtTime: vi.fn(),
            linearRampToValueAtTime: vi.fn(),
            exponentialRampToValueAtTime: vi.fn(),
          },
          connect: vi.fn(),
        });

        this.destination = {};
      }
    }

    globalThis.window = globalThis;
    globalThis.AudioContext = MockAudioContext;

    expect(() => playOrbChime()).not.toThrow();
    expect(catchMock).toHaveBeenCalled();
  });

  it("runs triggerOrbHaptic safely without error", () => {
    expect(() => triggerOrbHaptic("tap")).not.toThrow();
    expect(() => triggerOrbHaptic("blessing")).not.toThrow();
  });
});
