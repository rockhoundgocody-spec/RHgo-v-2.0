// Tiny external store — tracks whether the onboarding/intro cinematic is
// currently active so the bottom nav (portaled to document.body, outside
// #root's stacking context) can hide itself during the immersive sequence.

let active = false;
const listeners = new Set();

export const onboardingStore = {
  set(v) {
    if (active === v) return;
    active = v;
    listeners.forEach((l) => l(active));
  },
  get() {
    return active;
  },
  subscribe(l) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
};