import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateCatchOutcome, getCelebrationOptions, saveCatchToCollection } from "./AREncounterScreen.jsx";
import { base44 } from "@/api/base44Client";

vi.mock("@/api/base44Client", () => ({
  base44: {
    auth: {
      me: vi.fn(),
    },
    entities: {
      Specimen: {
        create: vi.fn(),
      },
      PlayerProfile: {
        filter: vi.fn(),
        update: vi.fn(),
      },
    },
  },
}));

describe("calculateCatchOutcome", () => {
  const commonSpawn = { catch_chance: 0.5, is_shiny: false };
  const shinySpawn = { catch_chance: 0.5, is_shiny: true };

  it("returns shiny when shiny spawn roll is below catch_chance + 0.2", () => {
    expect(calculateCatchOutcome(shinySpawn, 0, 0.1)).toBe("shiny");
  });

  it("returns escape when shiny spawn roll exceeds catch_chance + 0.2 threshold", () => {
    expect(calculateCatchOutcome(shinySpawn, 0, 0.8)).toBe("escape");
  });

  it("returns critical when roll is below 15% of catch_chance", () => {
    expect(calculateCatchOutcome(commonSpawn, 0, 0.05)).toBe("critical");
  });

  it("returns success when roll is below catch_chance", () => {
    expect(calculateCatchOutcome(commonSpawn, 0, 0.3)).toBe("success");
  });

  it("returns escape on first or second failed throw", () => {
    expect(calculateCatchOutcome(commonSpawn, 0, 0.8)).toBe("escape");
    expect(calculateCatchOutcome(commonSpawn, 1, 0.8)).toBe("escape");
  });

  it("returns success on third throw due to mercy rule", () => {
    expect(calculateCatchOutcome(commonSpawn, 2, 0.8)).toBe("success");
  });
});

describe("getCelebrationOptions", () => {
  it("uses a bounded celebration for normal catches", () => {
    expect(getCelebrationOptions("success", "#22d3ee")).toEqual(expect.objectContaining({
      particleCount: 70,
      spread: 65,
      colors: ["#22d3ee", "#ffffff"],
      disableForReducedMotion: true,
    }));
  });

  it("amplifies critical and shiny celebrations", () => {
    expect(getCelebrationOptions("critical", "#fbbf24").particleCount).toBe(150);
    expect(getCelebrationOptions("shiny", "#fbbf24").spread).toBe(85);
  });
});

describe("saveCatchToCollection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a Specimen entity and updates total_xp on player profile", async () => {
    const spawn = {
      mineral_name: "Quartz",
      rarity: "common",
      is_shiny: false,
    };

    base44.auth.me.mockResolvedValue({ email: "geologist@example.com" });
    base44.entities.Specimen.create.mockResolvedValue({ id: "spec-1" });
    base44.entities.PlayerProfile.filter.mockResolvedValue([
      { id: "profile-1", total_xp: 100 },
    ]);
    base44.entities.PlayerProfile.update.mockResolvedValue({ id: "profile-1", total_xp: 150 });

    await saveCatchToCollection(spawn, "success");

    expect(base44.auth.me).toHaveBeenCalled();
    expect(base44.entities.Specimen.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mineral_name: "Quartz",
        rarity: "common",
        xp_awarded: 50,
      })
    );
    expect(base44.entities.PlayerProfile.filter).toHaveBeenCalledWith(
      { owner_email: "geologist@example.com" },
      "-created_date",
      1
    );
    expect(base44.entities.PlayerProfile.update).toHaveBeenCalledWith("profile-1", {
      total_xp: 150,
    });
  });

  it("doubles XP for shiny or critical catches", async () => {
    const spawn = {
      mineral_name: "Diamond",
      rarity: "rare",
      is_shiny: true,
    };

    base44.auth.me.mockResolvedValue({ email: "geologist@example.com" });
    base44.entities.Specimen.create.mockResolvedValue({ id: "spec-2" });
    base44.entities.PlayerProfile.filter.mockResolvedValue([
      { id: "profile-1", total_xp: 200 },
    ]);

    await saveCatchToCollection(spawn, "shiny");

    // RARITY_XP_MAP[rare] is 400. 400 * 2 for shiny = 800 XP.
    expect(base44.entities.Specimen.create).toHaveBeenCalledWith(
      expect.objectContaining({
        xp_awarded: 800,
      })
    );
  });

  it("gracefully catches errors without throwing", async () => {
    base44.auth.me.mockRejectedValue(new Error("Network error"));

    await expect(saveCatchToCollection({ mineral_name: "Gold", rarity: "rare" }, "success")).resolves.not.toThrow();
  });
});
