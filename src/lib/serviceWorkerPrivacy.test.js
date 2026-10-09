import { describe, it, expect, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
const source = readFileSync(new URL('../../public/service-worker.js', import.meta.url), 'utf8');
describe('private responses bypass offline caches', () => {
  it('never reads or writes an API cache even if the request fails', async () => {
    const handlers = {}; const fetch = vi.fn().mockRejectedValue(new Error('Offline'));
    const caches = { match: vi.fn(), open: vi.fn() };
    runInNewContext(source, { self: { addEventListener: (name, fn) => { handlers[name] = fn; }, location: { origin: 'https://example.test' } }, URL, fetch, caches, Response });
    let response;
    handlers.fetch({ request: { method: 'GET', url: 'https://example.test/api/private' }, respondWith: promise => { response = promise; } });
    await expect(response).rejects.toThrow('Offline'); expect(caches.match).not.toHaveBeenCalled(); expect(caches.open).not.toHaveBeenCalled();
  });
  it('bumps the shell cache so old cached account responses are purged on activation', () => {
    expect(source).toContain("rhgo-shell-v3");
    expect(source).toContain('keys.filter((k) => k !== SHELL_CACHE)');
  });
});