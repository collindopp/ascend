export type StatusTone = "default" | "warning" | "danger";

/**
 * Thresholds are a judgment call, not a statistical derivation (unlike
 * lib/metrics/thresholds.ts's sample-size gates) — picked to flag numbers
 * worth a manager's attention without crying wolf on ordinary variance.
 * Adjust here if they don't match how this team actually runs.
 */
const DQ_RATE_WARNING = 12;
const DQ_RATE_DANGER = 22;
const WRONG_NUMBER_RATE_WARNING = 8;
const WRONG_NUMBER_RATE_DANGER = 15;

export function dqRateTone(rate: number | null): StatusTone {
  if (rate === null) return "default";
  if (rate >= DQ_RATE_DANGER) return "danger";
  if (rate >= DQ_RATE_WARNING) return "warning";
  return "default";
}

export function wrongNumberRateTone(rate: number | null): StatusTone {
  if (rate === null) return "default";
  if (rate >= WRONG_NUMBER_RATE_DANGER) return "danger";
  if (rate >= WRONG_NUMBER_RATE_WARNING) return "warning";
  return "default";
}

/** Tailwind text-color class for a status tone — for raw table cells, not routed through MetricDisplay. */
export function toneTextClass(tone: StatusTone): string {
  switch (tone) {
    case "danger":
      return "text-danger";
    case "warning":
      return "text-warning";
    case "default":
      return "text-text-primary";
  }
}
