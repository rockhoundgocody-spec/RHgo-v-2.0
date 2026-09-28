import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn((url, key) => ({
    url,
    key,
    auth: {},
    from: vi.fn(),
  })),
}));

vi.mock("./base44Legacy", () => ({
  base44: { legacy: true },
}));

describe("standaloneClient Supabase initialization", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it("returns base44Legacy when VITE_BACKEND is not supabase", async () => {
    vi.stubEnv("VITE_BACKEND", "base44");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "sb_anon_123");

    const { supabase, base44 } = await import("./standaloneClient.js");
    expect(supabase).toBeNull();
    expect(base44).toEqual({ legacy: true });
  });

  it("does not create supabase client if env vars are missing even if VITE_BACKEND is supabase", async () => {
    vi.stubEnv("VITE_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "");

    const { supabase, base44 } = await import("./standaloneClient.js");
    expect(supabase).toBeNull();
    expect(base44).toEqual({ legacy: true });
  });

  it("creates supabase client when VITE_BACKEND is supabase and credentials are provided via env", async () => {
    const { createClient } = await import("@supabase/supabase-js");

    vi.stubEnv("VITE_BACKEND", "supabase");
    vi.stubEnv("VITE_SUPABASE_URL", "https://custom.supabase.co");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "custom_anon_key");

    const { supabase, base44 } = await import("./standaloneClient.js");
    expect(createClient).toHaveBeenCalledWith(
      "https://custom.supabase.co",
      "custom_anon_key"
    );
    expect(supabase).not.toBeNull();
    expect(base44).not.toEqual({ legacy: true });
  });
});
