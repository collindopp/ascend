import { requirePageRole } from "@/lib/auth/dal";
import { NavShell } from "@/components/ui/NavShell";
import { roleLabel } from "@/lib/auth/roles";
import { navFor } from "@/lib/nav/items";
import { sweepStaleActiveSessions } from "@/lib/sessions/auto-timeout";

/**
 * Renders the same nav as the manager surfaces (see lib/nav/items.ts): the
 * admin pages are a group inside it rather than a separate bar, so entering
 * this section no longer swaps the whole navigation out.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["ADMIN"]);

  // Opportunistic sweep — see (setter)/layout.tsx for why this lives here
  // instead of a cron job.
  await sweepStaleActiveSessions();

  return (
    <NavShell
      entries={navFor(user.role)}
      roleLabel={roleLabel(user.role)}
      userName={user.name ?? user.email ?? ""}
    >
      {children}
    </NavShell>
  );
}
