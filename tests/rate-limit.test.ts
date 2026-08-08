import { describe, it, expect } from "vitest";
import { checkRateLimit } from "@/lib/rate-limit/memory";

describe("checkRateLimit", () => {
  it("allows requests up to the max within the window", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      expect(checkRateLimit(key, { windowMs: 60_000, max: 5 }).allowed).toBe(true);
    }
  });

  it("blocks the request once the max is exceeded", () => {
    const key = `test-${Math.random()}`;
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, { windowMs: 60_000, max: 5 });
    }
    const sixth = checkRateLimit(key, { windowMs: 60_000, max: 5 });
    expect(sixth.allowed).toBe(false);
    expect(sixth.retryAfterMs).toBeGreaterThan(0);
  });

  it("tracks independent keys separately", () => {
    const keyA = `test-a-${Math.random()}`;
    const keyB = `test-b-${Math.random()}`;
    for (let i = 0; i < 5; i++) checkRateLimit(keyA, { windowMs: 60_000, max: 5 });
    expect(checkRateLimit(keyA, { windowMs: 60_000, max: 5 }).allowed).toBe(false);
    expect(checkRateLimit(keyB, { windowMs: 60_000, max: 5 }).allowed).toBe(true);
  });
});
