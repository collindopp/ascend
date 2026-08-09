"use client";

import { useEffect, useRef, useState } from "react";

interface AnimatedNumberProps {
  value: number;
  /** Starting point to animate from on first mount. Omit to show `value` immediately with no mount animation. */
  initialValue?: number;
  format?: (n: number) => string;
  durationMs?: number;
  className?: string;
}

const defaultFormat = (n: number) => String(Math.round(n));

/**
 * Counts smoothly from its previous value to `value` (ease-out) instead of
 * snapping — used for the setter's live tap counters and the session-end
 * summary reveal (section 38 of the spec: "Session ends → Performance
 * numbers animate into the summary"). Skips the animation entirely under
 * prefers-reduced-motion, jumping straight to the final value.
 */
export function AnimatedNumber({
  value,
  initialValue,
  format = defaultFormat,
  durationMs = 600,
  className,
}: AnimatedNumberProps) {
  const start0 = initialValue ?? value;
  const [display, setDisplay] = useState(start0);
  const displayRef = useRef(start0);

  useEffect(() => {
    const prefersReduced =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const from = displayRef.current;
    const to = value;

    if (prefersReduced || from === to) {
      displayRef.current = to;
      setDisplay(to);
      return;
    }

    let rafId: number;
    const start = performance.now();

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      const eased = 1 - Math.pow(1 - t, 3); // ease-out-cubic
      const current = from + (to - from) * eased;
      displayRef.current = current;
      setDisplay(current);
      if (t < 1) {
        rafId = requestAnimationFrame(tick);
      }
    }
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `from` intentionally reads the ref at effect-start, not a reactive dep
  }, [value, durationMs]);

  return <span className={className}>{format(display)}</span>;
}
