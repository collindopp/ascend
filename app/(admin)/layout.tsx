import { requirePageRole } from "@/lib/auth/dal";
import { NavShell } from "@/components/ui/NavShell";
import { roleLabel } from "@/lib/auth/roles";

const NAV_ITEMS = [
  { label: "Users", href: "/admin/users" },
  { label: "Teams", href: "/admin/teams" },
  { label: "Lead Lists", href: "/admin/lead-lists" },
  { label: "Integrations", href: "/admin/integrations" },
  { label: "Audit Log", href: "/admin/audit-log" },
  { label: "Settings", href: "/admin/settings" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["ADMIN"]);

  return (
    <NavShell items={NAV_ITEMS} roleLabel={roleLabel(user.role)} userName={user.name ?? user.email ?? ""}>
      {children}
    </NavShell>
  );
}
