import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('standaloneClient Supabase initialization', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv('VITE_BACKEND', 'supabase');
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('does not initialize supabase client when publishable or anon key env vars are missing', async () => {
    const { supabase } = await import('./standaloneClient.js');
    expect(supabase).toBeNull();
  });

  it('initializes supabase client when VITE_SUPABASE_ANON_KEY is provided', async () => {
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'sb_anon_test_key_123');

    const { supabase } = await import('./standaloneClient.js');
    expect(supabase).not.toBeNull();
  });
});
