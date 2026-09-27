// Under jsdom, @vitejs/plugin-react's Fast Refresh wrapper throws "can't detect
// preamble" unless the preamble flag the dev server normally injects is present.
// Tests never hot-reload, so declaring it installed is enough.
globalThis.__vite_plugin_react_preamble_installed__ = true;
if (typeof globalThis.window !== 'undefined') {
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
