import { requirePageRole } from "@/lib/auth/dal";
import { NavShell } from "@/components/ui/NavShell";
import { roleLabel } from "@/lib/auth/roles";

const NAV_ITEMS = [
  { label: "Overview", href: "/manager/overview" },
  { label: "Setters", href: "/manager/setters" },
  { label: "Lead Intelligence", href: "/manager/lead-intelligence" },
  { label: "Matrix", href: "/manager/matrix" },
  { label: "Leaderboard", href: "/manager/leaderboard" },
  { label: "Sessions", href: "/manager/sessions" },
];

export default async function ManagerLayout({ children }: { children: React.ReactNode }) {
  const user = await requirePageRole(["MANAGER", "ADMIN"]);

  return (
    <NavShell items={NAV_ITEMS} roleLabel={roleLabel(user.role)} userName={user.name ?? user.email ?? ""}>
      {children}
    </NavShell>
  );
}
