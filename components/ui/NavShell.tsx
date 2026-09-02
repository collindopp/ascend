import type { ReactNode } from "react";
import Link from "next/link";
import { NavLinks, type NavItem } from "@/components/ui/NavLinks";
import { NavMenu, NavMenuMobile } from "@/components/ui/NavMenu";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { MobileTabBar } from "@/components/ui/MobileTabBar";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { Logo } from "@/components/ui/Logo";
import { cn } from "@/lib/utils/cn";
import { flattenNav, type NavEntry } from "@/lib/nav/items";

interface NavShellProps {
  /** Grouped nav for the management surfaces. */
  entries?: NavEntry[];
  /** Flat nav for the setter surfaces, which use the bottom tab bar. */
  items?: NavItem[];
  roleLabel: string;
  userName: string;
  children: ReactNode;
  /**
   * "bottom-tabs" swaps the mobile nav for a fixed bottom tab bar (thumb-reachable,
   * deliberate mobile design per section 36 of the spec) instead of shrinking the
   * desktop top nav — used for setter routes, where most usage is on a phone.
   * "top" (default) keeps the existing horizontal nav at every size, better suited
   * to the manager/admin surfaces which have more nav items and are desktop-primary.
   */
  variant?: "top" | "bottom-tabs";
}

export function NavShell({ entries, items, roleLabel, userName, children, variant = "top" }: NavShellProps) {
  const bottomTabs = variant === "bottom-tabs";
  const flat = entries ? flattenNav(entries) : [];

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-0/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-text-primary" aria-label="ASCEND home">
              <Logo className="h-4 w-auto" />
            </Link>
            <div className="hidden md:block">
              {entries ? <NavMenu entries={entries} /> : items ? <NavLinks items={items} /> : null}
            </div>
          </div>
          <div className="flex items-center gap-4">
            {entries && <CommandPalette items={flat} />}
            <div className="hidden text-right sm:block">
              <p className="text-sm text-text-primary">{userName}</p>
              <p className="text-xs uppercase tracking-wider text-text-tertiary">{roleLabel}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
        {!bottomTabs && (
          <div className="border-t border-border-subtle px-4 md:hidden">
            {entries ? <NavMenuMobile items={flat} /> : items ? <NavLinks items={items} /> : null}
          </div>
        )}
      </header>
      <main
        className={cn(
          "mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8",
          bottomTabs && "pb-24 md:pb-8",
        )}
      >
        {children}
      </main>
      {bottomTabs && items && <MobileTabBar items={items} />}
    </div>
  );
}
