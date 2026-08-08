import "server-only";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/generated/prisma/enums";
import type { Session } from "next-auth";

/**
 * Thrown by requireActionRole when a Server Action is invoked by a user who
 * isn't authenticated or doesn't hold an allowed role. Server actions should
 * not redirect() mid-mutation (see Next.js auth guide) — they throw instead,
 * and the caller shows an error via the centralized error handling in lib/errors.
 */
export class AuthorizationError extends Error {
  constructor(message = "Not authorized") {
    super(message);
    this.name = "AuthorizationError";
  }
}

/**
 * Server Action / Route Handler authorization check. Every mutating action
 * must call this independently — UI hiding a button is never sufficient
 * (section 28 of the ASCEND spec).
 */
export async function requireActionRole(allowed: Role[]): Promise<Session["user"]> {
  const session = await auth();
  if (!session?.user) throw new AuthorizationError("Not authenticated");
  if (!allowed.includes(session.user.role)) throw new AuthorizationError("Not authorized");
  return session.user;
}
