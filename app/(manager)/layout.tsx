import { requirePageRole } from "@/lib/auth/dal";
import { NavShell } from "@/components/ui/NavShell";
import { roleLabel } from "@/lib/auth/roles";

const NAV_ITEMS = [
  { label: "Overview", href: "/manager/overview" },
  { label: "Setters", href: "/manager/setters" },
  { label: "Rep Activity", href: "/manager/activity" },
  { label: "Lead Intelligence", href: "/manager/lead-intelligence" },
  { label: "Matrix", href: "/manager/matrix" },
  { label: "Leaderboard", href: "/manager/leaderboard" },
  { label: "Sessions", href: "/manager/sessions" },
];

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["MANAGER", "ADMIN"]);

  // Only admins also have setter access (see the (setter) layout) — a plain
  // manager clicking this would just get bounced, so keep it admin-only.
  const items = user.role === "ADMIN" ? [{ label: "Tally", href: "/home" }, ...NAV_ITEMS] : NAV_ITEMS;

  return (
    <NavShell items={items} roleLabel={roleLabel(user.role)} userName={user.name ?? user.email ?? ""}>
      {children}
    </NavShell>
  );
}
