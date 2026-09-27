import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn((url, key) => ({
    url,
    key,
    auth: {},
    from: vi.fn(),
    functions: {},
  })),
}));

vi.mock('./base44Legacy', () => ({
  base44: { legacy: true, entities: {} },
}));

describe('standaloneClient', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('defaults to base44Legacy when VITE_BACKEND is not supabase', async () => {
    vi.stubEnv('VITE_BACKEND', 'base44');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');

    const { supabase, base44 } = await import('./standaloneClient.js');

    expect(supabase).toBeNull();
    expect(base44).toEqual({ legacy: true, entities: {} });
  });

  it('creates supabase client when VITE_BACKEND is supabase and credentials are set', async () => {
    const { createClient } = await import('@supabase/supabase-js');
    vi.stubEnv('VITE_BACKEND', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_testkey123');

    const { supabase } = await import('./standaloneClient.js');

    expect(createClient).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'sb_publishable_testkey123'
    );
    expect(supabase).not.toBeNull();
  });

  it('does not create supabase client when keys are missing (no hardcoded fallback)', async () => {
    vi.stubEnv('VITE_BACKEND', 'supabase');
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');

    const { supabase } = await import('./standaloneClient.js');

    expect(supabase).toBeNull();
  });
});
