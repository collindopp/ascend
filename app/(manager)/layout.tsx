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
  { label: "Goals", href: "/manager/goals" },
  { label: "Sessions", href: "/manager/sessions" },
];

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["MANAGER", "ADMIN"]);

  // Only admins also have setter access and admin-section access (see the
  // (setter) and (admin) layouts) — a plain manager clicking either would
  // just get bounced, so keep both admin-only. Admins now land on this
  // manager view by default (see roleHomePath), so without these two links
  // there'd be no way back into Tally or the Admin section (Users, Teams,
  // Lead Lists, etc.) short of typing the URL.
  const items =
    user.role === "ADMIN"
      ? [{ label: "Tally", href: "/home" }, ...NAV_ITEMS, { label: "Admin", href: "/admin/users" }]
      : NAV_ITEMS;

  return (
    <NavShell items={items} roleLabel={roleLabel(user.role)} userName={user.name ?? user.email ?? ""}>
      {children}
    </NavShell>
  );
}
