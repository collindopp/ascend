import { startOfDay, endOfDay, subDays } from "date-fns";

export type DateRangePreset = "today" | "yesterday" | "7d" | "30d" | "90d" | "custom";

export interface DateRange {
  start: Date;
  end: Date;
}

/** Resolves a preset (or explicit custom bounds) into a concrete [start, end] range, inclusive. */
export function resolveDateRange(
  preset: DateRangePreset,
  custom?: { start: string; end: string },
): DateRange {
  const now = new Date();

  switch (preset) {
    case "today":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "yesterday": {
      const yesterday = subDays(now, 1);
      return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
    }
    case "7d":
      return { start: startOfDay(subDays(now, 6)), end: endOfDay(now) };
    case "30d":
      return { start: startOfDay(subDays(now, 29)), end: endOfDay(now) };
    case "90d":
      return { start: startOfDay(subDays(now, 89)), end: endOfDay(now) };
    case "custom": {
      if (!custom) return { start: startOfDay(now), end: endOfDay(now) };
      return { start: startOfDay(new Date(custom.start)), end: endOfDay(new Date(custom.end)) };
    }
  }
}

/** Same-length range immediately preceding the given one — used for period-over-period comparisons. */
export function previousPeriod({ start, end }: DateRange): DateRange {
  const lengthMs = end.getTime() - start.getTime();
  return {
    start: new Date(start.getTime() - lengthMs - 1),
    end: new Date(start.getTime() - 1),
  };
}

const VALID_PRESETS: DateRangePreset[] = ["today", "yesterday", "7d", "30d", "90d", "custom"];

/** Reads the `range` search param and resolves it to a concrete DateRange, defaulting to 30 days. */
export function parseRangeParam(searchParams: Record<string, string | string[] | undefined>): {
  preset: DateRangePreset;
  range: DateRange;
} {
  const raw = searchParams.range;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const preset: DateRangePreset = VALID_PRESETS.includes(value as DateRangePreset) ? (value as DateRangePreset) : "30d";
  return { preset, range: resolveDateRange(preset) };
}

export const DATE_RANGE_LABELS: Record<DateRangePreset, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "7d": "7 Days",
  "30d": "30 Days",
  "90d": "90 Days",
  custom: "Custom",
};
