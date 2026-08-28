/**
 * The timezone the team actually works in. Vercel runs functions in UTC, which
 * rolls over to the next day around 5-6pm local — so anything reasoning about
 * "today" from the server's own clock is wrong for the whole back half of a
 * working afternoon. Day boundaries that a person will read as a day need to
 * be computed against this instead.
 */
export const BUSINESS_TIMEZONE = "America/Denver";

/** How far `zone` sits from UTC at a given instant, DST included. */
function zoneOffsetMs(zone: string, at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: zone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(at);

  const get = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  // Rebuild the wall-clock reading as if it were UTC; the gap is the offset.
  // Hour 24 shows up in some implementations at midnight — normalize it to 0.
  const asIfUtc = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour") % 24, get("minute"), get("second"));
  return asIfUtc - at.getTime();
}

/** Midnight in `BUSINESS_TIMEZONE`, as the UTC instant that corresponds to it. */
export function startOfBusinessDay(at: Date = new Date()): Date {
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: BUSINESS_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);

  const [year, month, day] = ymd.split("-").map(Number);
  const midnightAsUtc = Date.UTC(year!, month! - 1, day!, 0, 0, 0);

  // Resolve the offset *at that local midnight*, not "now", so a day that
  // begins on one side of a DST change still starts at the right instant.
  const provisional = new Date(midnightAsUtc);
  return new Date(midnightAsUtc - zoneOffsetMs(BUSINESS_TIMEZONE, provisional));
}
