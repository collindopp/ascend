import { requirePageRole } from "@/lib/auth/dal";
import { NavShell } from "@/components/ui/NavShell";
import { roleLabel } from "@/lib/auth/roles";

const NAV_ITEMS = [
  { label: "Home", href: "/home" },
  { label: "History", href: "/history" },
  { label: "Performance", href: "/performance" },
  { label: "Leaderboard", href: "/leaderboard" },
];

export default async function SetterLayout({ children }: { children: React.ReactNode }) {
  // Admins can also use the calling/tally flow themselves, not just view analytics.
  const user = await requirePageRole(["SETTER", "ADMIN"]);

  return (
    <NavShell
      items={NAV_ITEMS}
      roleLabel={roleLabel(user.role)}
      userName={user.name ?? user.email ?? ""}
      variant="bottom-tabs"
    >
      {children}
    </NavShell>
  );
}
