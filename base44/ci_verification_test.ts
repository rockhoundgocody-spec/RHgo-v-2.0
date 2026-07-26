import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";

Deno.test("CI verification test for Deno", () => {
  assertEquals(1 + 1, 2);
});
