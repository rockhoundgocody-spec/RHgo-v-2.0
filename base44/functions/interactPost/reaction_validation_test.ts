import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { VALID_REACTIONS } from "./reaction_validation.ts";

Deno.test("VALID_REACTIONS set contains all valid reactions", () => {
  assertEquals(VALID_REACTIONS.has('fire'), true);
  assertEquals(VALID_REACTIONS.has('gem'), true);
  assertEquals(VALID_REACTIONS.has('clap'), true);
  assertEquals(VALID_REACTIONS.has('wow'), true);
  assertEquals(VALID_REACTIONS.size, 4);
});

Deno.test("VALID_REACTIONS set rejects invalid reactions", () => {
  assertEquals(VALID_REACTIONS.has('invalid'), false);
  assertEquals(VALID_REACTIONS.has('like'), false);
  assertEquals(VALID_REACTIONS.has(''), false);
});
