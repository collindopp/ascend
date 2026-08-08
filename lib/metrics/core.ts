/**
 * Centralized metric calculations. Every screen that displays a derived
 * metric (rates, per-hour figures, ratios) must compute it through here —
 * never re-derive the same formula inline on a page.
 *
 * All functions take raw stored integers and return `number | null`.
 * `null` means "insufficient data to compute," which the UI renders as an
 * em dash (see lib/format/number.ts) — never NaN, never Infinity, never a
 * silently wrong 0%.
 */

function safeDivide(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return null;
  if (denominator <= 0) return null;
  return numerator / denominator;
}

/** Conversations ÷ Dials × 100 */
export function conversionRate(conversations: number, dials: number): number | null {
  const rate = safeDivide(conversations, dials);
  return rate === null ? null : rate * 100;
}

/** Appointments ÷ Conversations × 100 */
export function setRateFromConversations(appointments: number, conversations: number): number | null {
  const rate = safeDivide(appointments, conversations);
  return rate === null ? null : rate * 100;
}

/** Appointments ÷ Dials × 100 */
export function setRateFromDials(appointments: number, dials: number): number | null {
  const rate = safeDivide(appointments, dials);
  return rate === null ? null : rate * 100;
}

/** Dials ÷ Appointments */
export function dialsPerAppointment(dials: number, appointments: number): number | null {
  return safeDivide(dials, appointments);
}

/** Conversations ÷ Appointments */
export function conversationsPerAppointment(conversations: number, appointments: number): number | null {
  return safeDivide(conversations, appointments);
}

/** count ÷ (durationSeconds / 3600) — dials/conversations/appointments per hour */
export function perHour(count: number, durationSeconds: number): number | null {
  const hours = durationSeconds / 3600;
  return safeDivide(count, hours);
}

export interface RawTotals {
  dials: number;
  conversations: number;
  appointments: number;
  durationSeconds: number;
}

export interface DerivedMetrics {
  conversionRate: number | null;
  setRateFromConversations: number | null;
  setRateFromDials: number | null;
  dialsPerAppointment: number | null;
  conversationsPerAppointment: number | null;
  dialsPerHour: number | null;
  conversationsPerHour: number | null;
  appointmentsPerHour: number | null;
}

/** Computes the full standard metric set from a raw totals bucket in one call. */
export function deriveMetrics(totals: RawTotals): DerivedMetrics {
  return {
    conversionRate: conversionRate(totals.conversations, totals.dials),
    setRateFromConversations: setRateFromConversations(totals.appointments, totals.conversations),
    setRateFromDials: setRateFromDials(totals.appointments, totals.dials),
    dialsPerAppointment: dialsPerAppointment(totals.dials, totals.appointments),
    conversationsPerAppointment: conversationsPerAppointment(totals.conversations, totals.appointments),
    dialsPerHour: perHour(totals.dials, totals.durationSeconds),
    conversationsPerHour: perHour(totals.conversations, totals.durationSeconds),
    appointmentsPerHour: perHour(totals.appointments, totals.durationSeconds),
  };
}

export function sumTotals(rows: RawTotals[]): RawTotals {
  return rows.reduce<RawTotals>(
    (acc, row) => ({
      dials: acc.dials + row.dials,
      conversations: acc.conversations + row.conversations,
      appointments: acc.appointments + row.appointments,
      durationSeconds: acc.durationSeconds + row.durationSeconds,
    }),
    { dials: 0, conversations: 0, appointments: 0, durationSeconds: 0 },
  );
}
