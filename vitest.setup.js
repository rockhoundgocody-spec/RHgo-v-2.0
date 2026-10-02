// Under jsdom, @vitejs/plugin-react wraps every component module in a Fast
// Refresh header that throws "can't detect preamble" unless the dev server's
// refresh hooks are on `window`. Tests never hot-reload, so no-op stubs are
// enough to let component modules import.
if (typeof globalThis.window !== 'undefined') {
  globalThis.window.$RefreshReg$ = globalThis.window.$RefreshReg$ || (() => {});
  globalThis.window.$RefreshSig$ = globalThis.window.$RefreshSig$ || (() => (type) => type);
  globalThis.window.__vite_plugin_react_preamble_installed__ = true;
}

// Node < 21 has no global `navigator`; several tests (and react-dom) expect
// one, as in Node 22+ and browsers. Provide a minimal stand-in.
if (typeof globalThis.navigator === 'undefined') {
  Object.defineProperty(globalThis, 'navigator', {
    value: { userAgent: 'node', platform: 'node', language: 'en-US', languages: ['en-US'], onLine: true, maxTouchPoints: 0 },
    configurable: true,
    writable: true,
  });
}
