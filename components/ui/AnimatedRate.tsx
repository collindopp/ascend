"use client";

import { AnimatedNumber } from "@/components/ui/AnimatedNumber";
import { formatPercent, formatRate, formatSignedPercent } from "@/lib/format/number";

type RateFormat = "percent" | "rate" | "signedPercent";

interface AnimatedRateProps {
  metricValue: number | null;
  formatType: RateFormat;
  durationMs?: number;
}

// Resolved locally, inside client code, rather than accepted as a prop —
// Server Components can't pass functions as props to Client Components
// (they aren't part of the serializable RSC payload), so callers pass a
// plain formatType string instead and this component maps it internally.
const FORMATTERS: Record<RateFormat, (n: number) => string> = {
  percent: (n) => formatPercent(n),
  rate: (n) => formatRate(n),
  signedPercent: (n) => formatSignedPercent(n),
};

const NULL_FALLBACKS: Record<RateFormat, string> = {
  percent: formatPercent(null),
  rate: formatRate(null),
  signedPercent: formatSignedPercent(null),
};

/** A percentage/rate metric that counts up from 0 on mount, or falls back to a plain em dash when there's nothing to animate toward. */
export function AnimatedRate({ metricValue, formatType, durationMs = 900 }: AnimatedRateProps) {
  if (metricValue === null) return <>{NULL_FALLBACKS[formatType]}</>;
  return <AnimatedNumber value={metricValue} initialValue={0} durationMs={durationMs} format={FORMATTERS[formatType]} />;
}
