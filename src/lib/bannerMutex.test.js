// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useBannerSlot } from './bannerMutex.js';

describe('useBannerSlot (Banner Mutex)', () => {
  let mountedHooks = [];

  const createBannerHook = (name) => {
    const hook = renderHook(() => useBannerSlot(name));
    mountedHooks.push(hook);
    return hook;
  };

  beforeEach(() => {
    mountedHooks = [];
  });

  afterEach(() => {
    mountedHooks.forEach((hook) => {
      try {
        act(() => {
          hook.result.current.release();
        });
      } catch {
        // ignore if already unmounted or errored
      }
      try {
        hook.unmount();
      } catch {
        // ignore if already unmounted
      }
    });
    mountedHooks = [];
  });

  it('exports useBannerSlot as a function', () => {
    expect(useBannerSlot).toBeTypeOf('function');
  });

  it('initializes with slotFree true and isOwner false when slot is free', () => {
    const { result } = createBannerHook('streakBanner');

    expect(result.current.slotFree).toBe(true);
    expect(result.current.isOwner).toBe(false);
  });

  it('initializes owner state when hook mounts while slot is occupied', () => {
    const { result: bannerA } = createBannerHook('bannerA');
    act(() => {
      bannerA.current.tryAcquire();
    });

    // Now bannerC mounts while bannerA is active
    const { result: bannerC } = createBannerHook('bannerC');

    expect(bannerC.current.slotFree).toBe(false);
    expect(bannerC.current.isOwner).toBe(false);

    // Banner A releases slot
    act(() => {
      bannerA.current.release();
    });

    expect(bannerC.current.slotFree).toBe(true);
  });

  it('successfully acquires slot when free', () => {
    const { result } = createBannerHook('streakBanner');

    let acquired;
    act(() => {
      acquired = result.current.tryAcquire();
    });

    expect(acquired).toBe(true);
    expect(result.current.isOwner).toBe(true);
    expect(result.current.slotFree).toBe(false);
  });

  it('maintains ownership when acquiring an already held slot', () => {
    const { result } = createBannerHook('streakBanner');

    let firstAcquire;
    let secondAcquire;
    act(() => {
      firstAcquire = result.current.tryAcquire();
      secondAcquire = result.current.tryAcquire();
    });

    expect(firstAcquire).toBe(true);
    expect(secondAcquire).toBe(true);
    expect(result.current.isOwner).toBe(true);
    expect(result.current.slotFree).toBe(false);
  });

  it('rejects acquisition when slot is held by another banner', () => {
    const { result: bannerA } = createBannerHook('streakBanner');
    const { result: bannerB } = createBannerHook('discountBanner');

    act(() => {
      bannerA.current.tryAcquire();
    });

    let acquiredB;
    act(() => {
      acquiredB = bannerB.current.tryAcquire();
    });

    expect(acquiredB).toBe(false);
    expect(bannerB.current.isOwner).toBe(false);
    expect(bannerB.current.slotFree).toBe(false);
    expect(bannerA.current.isOwner).toBe(true);
  });

  it('releases slot when owner calls release()', () => {
    const { result: bannerA } = createBannerHook('streakBanner');
    act(() => {
      bannerA.current.tryAcquire();
    });

    expect(bannerA.current.isOwner).toBe(true);

    act(() => {
      bannerA.current.release();
    });

    expect(bannerA.current.slotFree).toBe(true);
    expect(bannerA.current.isOwner).toBe(false);
  });

  it('ignores release() calls from non-owner banners', () => {
    const { result: bannerA } = createBannerHook('streakBanner');
    const { result: bannerB } = createBannerHook('discountBanner');

    act(() => {
      bannerA.current.tryAcquire();
    });

    // Banner B attempts to release Banner A's slot
    act(() => {
      bannerB.current.release();
    });

    expect(bannerA.current.isOwner).toBe(true);
    expect(bannerB.current.isOwner).toBe(false);
  });

  it('synchronizes state across multiple concurrent subscribers', () => {
    const { result: banner1 } = createBannerHook('banner1');
    const { result: banner2 } = createBannerHook('banner2');
    const { result: banner3 } = createBannerHook('banner3');

    expect(banner1.current.slotFree).toBe(true);
    expect(banner2.current.slotFree).toBe(true);
    expect(banner3.current.slotFree).toBe(true);

    act(() => {
      banner2.current.tryAcquire();
    });

    expect(banner1.current.isOwner).toBe(false);
    expect(banner2.current.isOwner).toBe(true);
    expect(banner3.current.isOwner).toBe(false);

    expect(banner1.current.slotFree).toBe(false);
    expect(banner2.current.slotFree).toBe(false);
    expect(banner3.current.slotFree).toBe(false);

    act(() => {
      banner2.current.release();
    });

    expect(banner1.current.slotFree).toBe(true);
    expect(banner2.current.slotFree).toBe(true);
    expect(banner3.current.slotFree).toBe(true);
  });

  it('allows sequential slot handover between banners', () => {
    const { result: bannerA } = createBannerHook('bannerA');
    const { result: bannerB } = createBannerHook('bannerB');

    // Banner A acquires
    let acquiredA;
    let acquiredBInitial;
    act(() => {
      acquiredA = bannerA.current.tryAcquire();
      acquiredBInitial = bannerB.current.tryAcquire();
    });

    expect(acquiredA).toBe(true);
    expect(acquiredBInitial).toBe(false);

    // Banner A releases
    act(() => {
      bannerA.current.release();
    });

    // Banner B acquires now that slot is free
    let acquiredBNext;
    act(() => {
      acquiredBNext = bannerB.current.tryAcquire();
    });

    expect(acquiredBNext).toBe(true);
    expect(bannerB.current.isOwner).toBe(true);
    expect(bannerA.current.isOwner).toBe(false);

    // Banner B releases
    act(() => {
      bannerB.current.release();
    });

    expect(bannerA.current.slotFree).toBe(true);
    expect(bannerB.current.slotFree).toBe(true);
  });

  it('removes listeners on unmount', () => {
    const bannerA = createBannerHook('bannerA');
    const { result: bannerB } = createBannerHook('bannerB');

    bannerA.unmount();

    // Banner B acquiring should notify without throwing or updating unmounted bannerA
    let acquiredB;
    act(() => {
      acquiredB = bannerB.current.tryAcquire();
    });

    expect(acquiredB).toBe(true);
    expect(bannerB.current.isOwner).toBe(true);
  });
});
