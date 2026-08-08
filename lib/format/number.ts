const EM_DASH = "—";

/** Formats a raw integer with thousands separators. Never called on a null metric — use formatMetricInt for that. */
export function formatInt(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

/** Formats a metric that may be null (insufficient data) as an integer, falling back to an em dash. */
export function formatMetricInt(value: number | null): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return formatInt(value);
}

/** Formats a 0-100 percentage metric that may be null, falling back to an em dash — never NaN%/Infinity%. */
export function formatPercent(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return `${value.toFixed(decimals)}%`;
}

/** Formats a decimal-rate metric (e.g. dials/hour) that may be null. */
export function formatRate(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  return value.toFixed(decimals);
}

/** Formats a signed percentage delta, e.g. "+21.7%" / "-4.2%", for comparison callouts. */
export function formatSignedPercent(value: number | null, decimals = 1): string {
  if (value === null || !Number.isFinite(value)) return EM_DASH;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(decimals)}%`;
}

/** Formats a duration in seconds as H:MM:SS (or M:SS under an hour). */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Formats a duration in seconds as compact "1h 42m" for summaries/history rows. */
export function formatDurationCompact(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}
