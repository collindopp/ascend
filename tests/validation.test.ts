import { describe, it, expect } from "vitest";
import { loginSchema } from "@/lib/validation/auth";
import { recordEventSchema, startSessionSchema } from "@/lib/validation/sessions";
import { createUserSchema } from "@/lib/validation/admin";

describe("loginSchema", () => {
  it("normalizes email casing and whitespace", () => {
    const result = loginSchema.safeParse({ email: "  Test@Example.com  ", password: "x" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("test@example.com");
  });

  it("rejects a malformed email", () => {
    expect(loginSchema.safeParse({ email: "not-an-email", password: "x" }).success).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(loginSchema.safeParse({ email: "a@b.com", password: "" }).success).toBe(false);
  });
});

describe("recordEventSchema", () => {
  it("only accepts the four tappable event types", () => {
    expect(recordEventSchema.safeParse({ sessionId: "s1", type: "CONVERSATION" }).success).toBe(true);
    expect(recordEventSchema.safeParse({ sessionId: "s1", type: "APPOINTMENT" }).success).toBe(true);
    expect(recordEventSchema.safeParse({ sessionId: "s1", type: "DQ" }).success).toBe(true);
    expect(recordEventSchema.safeParse({ sessionId: "s1", type: "WRONG_NUMBER" }).success).toBe(true);
  });

  it("rejects DIAL — dials come from the external dialer, never a manual tap", () => {
    expect(recordEventSchema.safeParse({ sessionId: "s1", type: "DIAL" }).success).toBe(false);
  });

  it("rejects an arbitrary client-supplied event type — never trust the client (section 30)", () => {
    expect(recordEventSchema.safeParse({ sessionId: "s1", type: "UNDO" }).success).toBe(false);
    expect(recordEventSchema.safeParse({ sessionId: "s1", type: "DROP_TABLE" }).success).toBe(false);
  });

  it("rejects a missing sessionId", () => {
    expect(recordEventSchema.safeParse({ type: "CONVERSATION" }).success).toBe(false);
  });
});

describe("startSessionSchema", () => {
  it("requires a non-empty leadListId", () => {
    expect(startSessionSchema.safeParse({ leadListId: "" }).success).toBe(false);
    expect(startSessionSchema.safeParse({ leadListId: "list-1" }).success).toBe(true);
  });
});

describe("createUserSchema", () => {
  it("enforces a minimum password length", () => {
    expect(
      createUserSchema.safeParse({ name: "A", email: "a@b.com", password: "short", role: "SETTER" }).success,
    ).toBe(false);
  });

  it("only accepts known roles", () => {
    expect(
      createUserSchema.safeParse({ name: "A", email: "a@b.com", password: "longenough1", role: "SUPERADMIN" })
        .success,
    ).toBe(false);
  });

  it("accepts a well-formed payload", () => {
    expect(
      createUserSchema.safeParse({ name: "A", email: "a@b.com", password: "longenough1", role: "SETTER" }).success,
    ).toBe(true);
  });
});
