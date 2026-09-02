import { requirePageRole } from "@/lib/auth/dal";
import { NavShell } from "@/components/ui/NavShell";
import { roleLabel } from "@/lib/auth/roles";
import { navFor } from "@/lib/nav/items";
import { sweepStaleActiveSessions } from "@/lib/sessions/auto-timeout";

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["MANAGER", "ADMIN"]);

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
