import { assertEquals } from "https://deno.land/std@0.203.0/assert/mod.ts";

Deno.test("CI verification test", () => {
  assertEquals(1 + 1, 2);
});
