import { describe, it, expect, vi, beforeEach } from "vitest";
// @vitest-environment jsdom
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import AREncounterScreen, { calculateCatchOutcome, getCelebrationOptions, saveCatchToCollection } from "./AREncounterScreen.jsx";
import { base44 } from "@/api/base44Client";

// Mock framer-motion to simplify DOM testing
vi.mock("framer-motion", () => ({
  motion: {
    div: React.forwardRef(({ children, ...props }, ref) => <div ref={ref} {...props}>{children}</div>),
    button: React.forwardRef(({ children, ...props }, ref) => <button ref={ref} {...props}>{children}</button>),
  },
  AnimatePresence: ({ children }) => <>{children}</>,
}));

vi.mock("canvas-confetti", () => ({
  default: vi.fn(),
}));

vi.mock("@/api/base44Client", () => ({
  base44: {
    auth: {
      me: vi.fn(),
    },
    functions: {
      invoke: vi.fn(() => Promise.resolve({ data: { newXP: 150 } })),
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
    if (typeof window !== "undefined") {
      window.matchMedia = window.matchMedia || vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }));
    }
  });

  it("creates a Specimen entity and asks the server to award verified XP", async () => {
    const spawn = {
      mineral_name: "Quartz",
      rarity: "common",
      is_shiny: false,
    };

    base44.auth.me.mockResolvedValue({ email: "geologist@example.com" });
    base44.entities.Specimen.create.mockResolvedValue({ id: "spec-1" });

    await saveCatchToCollection(spawn, "success");

    expect(base44.auth.me).toHaveBeenCalled();
    expect(base44.entities.Specimen.create).toHaveBeenCalledWith(
      expect.objectContaining({
        mineral_name: "Quartz",
        rarity: "common",
        xp_awarded: 50,
      })
    );
    expect(base44.functions.invoke).toHaveBeenCalledWith("awardVerifiedXP", {
      event_type: "ar_catch",
      event_id: "spec-1",
    });
    // The browser never writes total_xp directly.
    expect(base44.entities.PlayerProfile.update).not.toHaveBeenCalled();
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

describe("AREncounterScreen Component UX & Accessibility", () => {
  const dummySpawn = {
    mineral_name: "Amethyst",
    rarity: "rare",
    catch_chance: 0.6,
    xp: 200,
    emoji: "🔮",
    is_shiny: false,
  };

  it("renders dialog with correct ARIA attributes, tooltips, and responds to Escape key", () => {
    const onDismiss = vi.fn();
    render(<AREncounterScreen spawn={dummySpawn} onDismiss={onDismiss} />);

    const dialog = screen.getByRole("dialog");
    expect(dialog.getAttribute("aria-label")).toBe("Amethyst AR encounter");
    expect(dialog.getAttribute("aria-modal")).toBe("true");

    const closeBtn = screen.getByRole("button", { name: "Close encounter" });
    expect(closeBtn.getAttribute("title")).toBe("Close encounter (Esc)");

    const catchBtn = screen.getByRole("button", { name: "Catch Amethyst" });
    expect(catchBtn.getAttribute("title")).toBe("Throw Field Lens to catch Amethyst");

    // Test Escape key press via focus trap
    fireEvent.keyDown(document, { key: "Escape" });
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
