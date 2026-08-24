import { requirePageRole } from "@/lib/auth/dal";
import { NavShell } from "@/components/ui/NavShell";
import { roleLabel } from "@/lib/auth/roles";
import { closeStaleActiveSessions } from "@/lib/sessions/auto-timeout";

const NAV_ITEMS = [
  { label: "Tally", href: "/home" },
  { label: "Users", href: "/admin/users" },
  { label: "Teams", href: "/admin/teams" },
  { label: "Lead Lists", href: "/admin/lead-lists" },
  { label: "Integrations", href: "/admin/integrations" },
  { label: "Audit Log", href: "/admin/audit-log" },
  { label: "Settings", href: "/admin/settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["ADMIN"]);

  // Opportunistic sweep — see (setter)/layout.tsx for why this lives here
  // instead of a cron job.
  await closeStaleActiveSessions();

  return (
    <NavShell items={NAV_ITEMS} roleLabel={roleLabel(user.role)} userName={user.name ?? user.email ?? ""}>
      {children}
    </NavShell>
  );
}
