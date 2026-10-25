import { describe, it, expect, vi } from "vitest";
import TestSelector from "./TestSelector.jsx";

describe("TestSelector component", () => {
  it("returns null if nextTest is not provided", () => {
    const element = TestSelector({ nextTest: null });
    expect(element).toBeNull();
  });

  it("renders correct element tree when nextTest is provided", () => {
    const nextTest = {
      test_name: "Hardness Test",
      category: "non_destructive",
      expected_info_gain: 0.75,
      cost: "$5",
      time: "5 mins",
      risk: "Low",
      rationale: "Quick field check",
      expected_outcome_leading: "Quartz hardness >= 7",
      expected_outcome_alternative: "Calcite hardness ~ 3",
    };

    const element = TestSelector({
      nextTest,
      onEnterResult: vi.fn(),
      loading: false,
    });

    expect(element).not.toBeNull();
    expect(element.type).toBeDefined();
  });

  it("handles missing category with fallback configuration", () => {
    const nextTest = {
      test_name: "Unknown Test",
      category: "non_existent_category",
      expected_info_gain: 0.123,
    };

    const element = TestSelector({ nextTest });
    expect(element).not.toBeNull();
  });

  it("handles loading state correctly", () => {
    const nextTest = { test_name: "Acid Test", category: "home" };
    const element = TestSelector({ nextTest, loading: true });
    expect(element).not.toBeNull();
  });
});
