"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAV_ICONS } from "@/components/ui/icons";
import { isGroup, type NavEntry, type NavLeaf } from "@/lib/nav/items";

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
}

function LeafLink({ item, active, onNavigate }: { item: NavLeaf; active: boolean; onNavigate?: () => void }) {
  const icon = NAV_ICONS[item.href]?.(active);
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors duration-[var(--duration-fast)]",
        active ? "bg-surface-3 text-text-primary" : "text-text-secondary hover:bg-surface-2 hover:text-text-primary",
      )}
    >
      {icon && <span className="shrink-0 text-text-tertiary [&>svg]:h-4 [&>svg]:w-4">{icon}</span>}
      {item.label}
    </Link>
  );
}

function GroupMenu({ label, items }: { label: string; items: NavLeaf[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isActive = useIsActive();
  const containsActive = items.some((i) => isActive(i.href));

  // Click-outside and Escape, rather than hover — a hover menu is easy to lose
  // on the way to the item you wanted, and unusable on a touch screen.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      // Also yield to the command palette, so ⌘K from an open dropdown
      // doesn't leave two overlays stacked on top of each other.
      if (e.key === "Escape" || ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k")) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={cn(
          "inline-flex h-9 items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors duration-[var(--duration-fast)]",
          containsActive || open
            ? "bg-surface-2 text-text-primary"
            : "text-text-tertiary hover:bg-surface-1 hover:text-text-primary",
        )}
      >
        {label}
        <svg viewBox="0 0 16 16" fill="none" className={cn("h-3 w-3 transition-transform", open && "rotate-180")} aria-hidden>
          <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-full z-50 mt-1.5 min-w-56 rounded-[var(--radius-md)] border border-border bg-gradient-to-b from-surface-2/60 to-surface-1 p-1.5 shadow-[var(--shadow-elevated)]"
        >
          {items.map((item) => (
            <LeafLink key={item.href} item={item} active={isActive(item.href)} onNavigate={() => setOpen(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

/** Desktop bar: direct links plus grouped dropdowns. */
export function NavMenu({ entries }: { entries: NavEntry[] }) {
  const isActive = useIsActive();

  return (
    <nav aria-label="Primary" className="flex items-center gap-1">
      {entries.map((entry) =>
        isGroup(entry) ? (
          <GroupMenu key={entry.label} label={entry.label} items={entry.items} />
        ) : (
          <Link
            key={entry.href}
            href={entry.href}
            aria-current={isActive(entry.href) ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors duration-[var(--duration-fast)]",
              isActive(entry.href)
                ? "bg-surface-2 text-text-primary"
                : "text-text-tertiary hover:bg-surface-1 hover:text-text-primary",
            )}
          >
            {NAV_ICONS[entry.href] && (
              <span className="[&>svg]:h-4 [&>svg]:w-4">{NAV_ICONS[entry.href]!(isActive(entry.href))}</span>
            )}
            {entry.label}
          </Link>
        ),
      )}
    </nav>
  );
}

/**
 * Mobile bar: the same destinations flattened into one scrollable row.
 * Dropdowns are a poor fit on a touch screen at this width, and these
 * surfaces are desktop-primary anyway.
 */
export function NavMenuMobile({ items }: { items: NavLeaf[] }) {
  const isActive = useIsActive();

  return (
    <nav aria-label="Primary" className="flex items-center gap-1 overflow-x-auto py-2">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={cn(
            "inline-flex h-9 shrink-0 items-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors duration-[var(--duration-fast)]",
            isActive(item.href) ? "bg-surface-2 text-text-primary" : "text-text-tertiary hover:text-text-primary",
          )}
        >
          {NAV_ICONS[item.href] && (
            <span className="[&>svg]:h-4 [&>svg]:w-4">{NAV_ICONS[item.href]!(isActive(item.href))}</span>
          )}
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
