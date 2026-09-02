"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { NAV_ICONS } from "@/components/ui/icons";
import type { NavLeaf } from "@/lib/nav/items";

function score(item: NavLeaf, query: string): number | null {
  const q = query.trim().toLowerCase();
  if (q === "") return 0;

  const label = item.label.toLowerCase();
  if (label.startsWith(q)) return 3;
  if (label.includes(q)) return 2;
  if (item.keywords?.some((k) => k.toLowerCase().includes(q))) return 1;
  return null;
}

/**
 * ⌘K / Ctrl-K jump-to-page.
 *
 * Only ever navigates — it deliberately has no actions that change data, so
 * there's nothing here to trigger by accident while typing fast.
 */
export function CommandPalette({ items }: { items: NavLeaf[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightRequest, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    return items
      .map((item) => ({ item, s: score(item, query) }))
      .filter((r): r is { item: NavLeaf; s: number } => r.s !== null)
      .sort((a, b) => b.s - a.s)
      .map((r) => r.item);
  }, [items, query]);

  // Clamped at render rather than corrected in an effect: typing shrinks the
  // result list, and storing the correction back to state costs a second
  // render pass on every keystroke.
  const highlighted = Math.min(highlightRequest, Math.max(0, results.length - 1));

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHighlighted(0);
  }, []);

  const go = useCallback(
    (item: NavLeaf | undefined) => {
      if (!item) return;
      close();
      router.push(item.href);
    },
    [close, router],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
        return;
      }
      if (!open) return;
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        aria-label="Search pages"
        className="hidden items-center gap-2 rounded-[var(--radius-sm)] border border-border-strong bg-surface-2 px-2.5 py-1.5 text-xs text-text-tertiary transition-colors hover:bg-surface-3 hover:text-text-secondary md:inline-flex"
      >
        <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5" aria-hidden>
          <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        Jump to
        <kbd className="rounded border border-border bg-surface-1 px-1 font-mono text-[10px] text-text-tertiary">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 px-4 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Jump to page"
        className="w-full max-w-lg overflow-hidden rounded-[var(--radius-lg)] border border-border bg-gradient-to-b from-surface-2/60 to-surface-1 shadow-[var(--shadow-elevated)]"
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlighted((h) => (results.length === 0 ? 0 : (h + 1) % results.length));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlighted((h) => (results.length === 0 ? 0 : (h - 1 + results.length) % results.length));
            } else if (e.key === "Enter") {
              e.preventDefault();
              go(results[highlighted]);
            }
          }}
          placeholder="Jump to a page…"
          className="w-full border-b border-border-subtle bg-transparent px-4 py-3.5 text-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
        />

        {results.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-tertiary">No pages match “{query}”.</p>
        ) : (
          <ul className="max-h-80 overflow-y-auto p-1.5">
            {results.map((item, i) => (
              <li key={item.href}>
                <button
                  onMouseEnter={() => setHighlighted(i)}
                  onClick={() => go(item)}
                  className={cn(
                    "flex w-full items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-left text-sm transition-colors",
                    i === highlighted ? "bg-surface-3 text-text-primary" : "text-text-secondary",
                  )}
                >
                  {NAV_ICONS[item.href] && (
                    <span className="shrink-0 text-text-tertiary [&>svg]:h-4 [&>svg]:w-4">{NAV_ICONS[item.href]!(false)}</span>
                  )}
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-3 border-t border-border-subtle px-4 py-2 text-[11px] text-text-tertiary">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
