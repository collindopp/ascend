"use client";

import { useEffect, useState } from "react";

/**
 * Formats a timestamp in the *viewer's* local timezone. Plain `Date#toLocaleString`
 * calls inside Server Components render using the server's timezone (UTC on
 * Vercel), not the viewer's — this fixes that by formatting client-side instead.
 *
 * Renders a blank placeholder on the server and on the client's first paint
 * (identical on both, so no hydration mismatch), then fills in the real
 * value from an effect once the component has mounted in the browser.
 * `suppressHydrationWarning` alone isn't enough here: React keeps whatever
 * text the server sent on the initial hydration pass and only replaces it
 * on a genuine re-render, so a static mismatched string would stick.
 */
export function LocalDateTime({ iso, options }: { iso: string; options?: Intl.DateTimeFormatOptions }) {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    setFormatted(new Date(iso).toLocaleString("en-US", options));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `options` is an inline object literal at call sites; comparing by iso is sufficient
  }, [iso]);

  return <span suppressHydrationWarning>{formatted ?? " "}</span>;
}
