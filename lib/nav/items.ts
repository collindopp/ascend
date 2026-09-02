import type { Role } from "@/lib/generated/prisma/enums";

export interface NavLeaf {
  label: string;
  href: string;
  roles: Role[];
  /** Extra terms the command palette should match on, beyond the label. */
  keywords?: string[];
}

export interface NavGroup {
  label: string;
  /** Groups are containers only — access is decided per leaf. */
  items: NavLeaf[];
}

export type NavEntry = NavLeaf | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

const MANAGER_AND_UP: Role[] = ["MANAGER", "ADMIN"];
const ADMIN_ONLY: Role[] = ["ADMIN"];

/**
 * One nav for every management surface.
 *
 * Admin used to live behind its own separate bar, so entering it replaced the
 * whole navigation and you lost your bearings. It's a group here instead: the
 * bar stays put, and only the open dropdown changes.
 *
 * Grouping follows the question being asked — "how are my people doing"
 * (Team) versus "how are my campaigns doing" (Lists) — which is why viewing a
 * list's performance and editing that list finally sit together.
 */
const ENTRIES: NavEntry[] = [
  { label: "Overview", href: "/manager/overview", roles: MANAGER_AND_UP, keywords: ["dashboard", "home", "team"] },
  {
    label: "Team",
    items: [
      { label: "Setters", href: "/manager/setters", roles: MANAGER_AND_UP, keywords: ["reps", "people", "individual"] },
      { label: "Rep Activity", href: "/manager/activity", roles: MANAGER_AND_UP, keywords: ["audit", "idle", "live", "feed"] },
      { label: "Goals", href: "/manager/goals", roles: MANAGER_AND_UP, keywords: ["target", "weekly", "sets"] },
      { label: "Leaderboard", href: "/manager/leaderboard", roles: MANAGER_AND_UP, keywords: ["rank", "standings"] },
      { label: "Sessions", href: "/manager/sessions", roles: MANAGER_AND_UP, keywords: ["explorer", "calls", "history"] },
    ],
  },
  {
    label: "Lists",
    items: [
      {
        label: "Lead Intelligence",
        href: "/manager/lead-intelligence",
        roles: MANAGER_AND_UP,
        keywords: ["campaign", "quality", "set rate", "dq"],
      },
      { label: "Matrix", href: "/manager/matrix", roles: MANAGER_AND_UP, keywords: ["grid", "cross", "heatmap"] },
      { label: "Manage Lists", href: "/admin/lead-lists", roles: ADMIN_ONLY, keywords: ["assign", "archive", "add list"] },
    ],
  },
  {
    label: "Admin",
    items: [
      { label: "Users", href: "/admin/users", roles: ADMIN_ONLY, keywords: ["accounts", "add user", "deactivate", "password"] },
      { label: "Teams", href: "/admin/teams", roles: ADMIN_ONLY },
      { label: "Integrations", href: "/admin/integrations", roles: ADMIN_ONLY, keywords: ["quickbase", "dialer", "scout"] },
      { label: "Audit Log", href: "/admin/audit-log", roles: ADMIN_ONLY, keywords: ["history", "changes"] },
      { label: "Settings", href: "/admin/settings", roles: ADMIN_ONLY },
    ],
  },
  // Admins can also work the tally flow themselves; a plain manager can't.
  { label: "Tally", href: "/home", roles: ADMIN_ONLY, keywords: ["call", "dial", "session", "start"] },
];

/** The nav as `role` should see it, with empty groups dropped entirely. */
export function navFor(role: Role): NavEntry[] {
  const visible: NavEntry[] = [];
  for (const entry of ENTRIES) {
    if (isGroup(entry)) {
      const items = entry.items.filter((i) => i.roles.includes(role));
      if (items.length > 0) visible.push({ label: entry.label, items });
    } else if (entry.roles.includes(role)) {
      visible.push(entry);
    }
  }
  return visible;
}

/** Every destination `role` can reach, flattened — for the command palette and mobile. */
export function flattenNav(entries: NavEntry[]): NavLeaf[] {
  return entries.flatMap((e) => (isGroup(e) ? e.items : [e]));
}
