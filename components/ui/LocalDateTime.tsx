"use client";

import { useSyncExternalStore } from "react";

/** The value never changes reactively — it only differs between server and client. */
const subscribe = () => () => {};
const getServerSnapshot = () => null;

/**
 * Formats a timestamp in the *viewer's* local timezone. Plain `Date#toLocaleString`
 * calls inside Server Components render using the server's timezone (UTC on
 * Vercel), not the viewer's — this fixes that by formatting client-side instead.
 *
 * `useSyncExternalStore` is the right primitive for a value that legitimately
 * differs between server and client: it renders the server snapshot (blank)
 * during hydration so the markup matches, then re-renders once with the real
 * local-time string. Formatting in an effect would work too, but costs a
 * cascading render on every instance — and there are a lot of these per table.
 */
export function LocalDateTime({ iso, options }: { iso: string; options?: Intl.DateTimeFormatOptions }) {
  const formatted = useSyncExternalStore(
    subscribe,
    // Returns a string, which React compares by value — stable across calls.
    () => new Date(iso).toLocaleString("en-US", options),
    getServerSnapshot,
  );

  return <span>{formatted ?? " "}</span>;
}
