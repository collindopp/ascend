import type { ReactNode } from "react";
import Link from "next/link";
import { NavLinks, type NavItem } from "@/components/ui/NavLinks";
import { LogoutButton } from "@/components/ui/LogoutButton";

interface NavShellProps {
  items: NavItem[];
  roleLabel: string;
  userName: string;
  children: ReactNode;
}

export function NavShell({ items, roleLabel, userName, children }: NavShellProps) {
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
        <nav className="border-t border-border-subtle px-4 md:hidden">
          <NavLinks items={items} />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 md:px-6 md:py-8">
        {children}
      </main>
    </div>
  );
}
