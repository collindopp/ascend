import type { ReactNode } from "react";
import Link from "next/link";
import { NavLinks, type NavItem } from "@/components/ui/NavLinks";
import { MobileTabBar } from "@/components/ui/MobileTabBar";
import { LogoutButton } from "@/components/ui/LogoutButton";
import { cn } from "@/lib/utils/cn";

interface NavShellProps {
  items: NavItem[];
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

export function NavShell({ items, roleLabel, userName, children, variant = "top" }: NavShellProps) {
  const bottomTabs = variant === "bottom-tabs";

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border-subtle bg-surface-0/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold tracking-[0.2em] text-text-primary">
              ASCEND
            </Link>
            <nav className="hidden md:block">
              <NavLinks items={items} />
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden text-right sm:block">
              <p className="text-sm text-text-primary">{userName}</p>
              <p className="text-xs uppercase tracking-wider text-text-tertiary">{roleLabel}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
        {!bottomTabs && (
          <nav className="border-t border-border-subtle px-4 md:hidden">
            <NavLinks items={items} />
          </nav>
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
      {bottomTabs && <MobileTabBar items={items} />}
    </div>
  );
}
