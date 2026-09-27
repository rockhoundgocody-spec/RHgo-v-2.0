import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSupabaseClient = { mockSupabase: true, auth: {}, from: vi.fn() };

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

vi.mock("./base44Legacy", () => ({
  base44: { mockLegacy: true },
}));

describe("standaloneClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete import.meta.env.VITE_BACKEND;
    delete import.meta.env.VITE_SUPABASE_URL;
    delete import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    delete import.meta.env.VITE_SUPABASE_ANON_KEY;
  });

  it("exports null supabase and base44Legacy when VITE_BACKEND is not supabase", async () => {
    import.meta.env.VITE_BACKEND = "base44";
    const { createClient } = await import("@supabase/supabase-js");
    const { supabase, base44 } = await import("./standaloneClient.js");

    expect(createClient).not.toHaveBeenCalled();
    expect(supabase).toBeNull();
    expect(base44).toEqual({ mockLegacy: true });
  });

  it("exports null supabase and base44Legacy when VITE_BACKEND is supabase but env keys are missing", async () => {
    import.meta.env.VITE_BACKEND = "supabase";
    const { createClient } = await import("@supabase/supabase-js");
    const { supabase, base44 } = await import("./standaloneClient.js");

    expect(createClient).not.toHaveBeenCalled();
    expect(supabase).toBeNull();
    expect(base44).toEqual({ mockLegacy: true });
  });

  it("initializes supabase client when VITE_BACKEND is supabase and env vars are provided", async () => {
    import.meta.env.VITE_BACKEND = "supabase";
    import.meta.env.VITE_SUPABASE_URL = "https://custom-project.supabase.co";
    import.meta.env.VITE_SUPABASE_ANON_KEY = "custom-anon-key-123";

    const { createClient } = await import("@supabase/supabase-js");
    const { supabase, base44 } = await import("./standaloneClient.js");

    expect(createClient).toHaveBeenCalledWith(
      "https://custom-project.supabase.co",
      "custom-anon-key-123"
    );
    expect(supabase).toBe(mockSupabaseClient);
    expect(base44).toBeDefined();
    expect(base44.auth).toBeDefined();
  });
});
