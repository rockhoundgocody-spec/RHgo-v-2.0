import { assertEquals } from "https://deno.land/std@0.208.0/assert/mod.ts";

Deno.test("CI Verification", () => {
  assertEquals(1 + 1, 2);
});
