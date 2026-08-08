import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import type { Role } from "@/lib/generated/prisma/enums";

/**
 * Page-level session check. Redirects to /login if unauthenticated.
 * Memoized per request so calling it from a layout and a page doesn't
 * re-decode the JWT twice.
 */
export const requireUser = cache(async () => {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return session.user;
});

/**
 * Page-level role gate. Use in route-group layouts (app/(manager)/layout.tsx etc.)
 * — this is the "secure" check the Proxy's optimistic check is a fast-path in front of.
 */
export async function requirePageRole(allowed: Role[]) {
  const user = await requireUser();
  if (!allowed.includes(user.role)) {
    redirect("/");
  }
  return user;
}
