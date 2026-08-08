"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

export interface NavItem {
  label: string;
  href: string;
}

export function NavLinks({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <ul className="flex items-center gap-1 overflow-x-auto py-2 md:py-0">
      {items.map((item) => {
        const active = pathname === item.href || pathname?.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              className={cn(
                "inline-flex h-9 items-center whitespace-nowrap rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors duration-[var(--duration-fast)]",
                active
                  ? "text-text-primary bg-surface-2"
                  : "text-text-tertiary hover:text-text-primary hover:bg-surface-1",
              )}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
