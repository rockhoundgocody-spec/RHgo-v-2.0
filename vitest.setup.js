// Node < 21 has no global `navigator`; several tests (and react-dom) expect
// one, as in Node 22+ and browsers. Provide a minimal stand-in.
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', platform: 'node', language: 'en-US', languages: ['en-US'], onLine: true, maxTouchPoints: 0 },
    configurable: true,
    writable: true,
  });
}
