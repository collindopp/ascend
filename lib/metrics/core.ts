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

/**
 * Every worked lead resolves to exactly one outcome: a logged conversation,
 * a DQ, or a wrong number.
 *
 * Appointment, Not Interested and Follow Up are all *additional* taps layered
 * on top of an existing conversation rather than outcomes in their own right,
 * so they're excluded here — counting them would divide by the same lead more
 * than once and understate both quality rates.
 */
export function outcomesWorked(conversations: number, dq: number, wrongNumber: number): number {
  return conversations + dq + wrongNumber;
}

/**
 * Not Interested ÷ Conversations × 100.
 *
 * Both of the rates below describe what happens *inside* a real conversation,
 * which is why conversations is the denominator: the rep reached a person and
 * pitched, and this is how it landed. Read alongside set rate they account for
 * the outcome of a conversation — booked, rejected, or deferred.
 */
export function notInterestedRate(notInterested: number, conversations: number): number | null {
  const rate = safeDivide(notInterested, conversations);
  return rate === null ? null : rate * 100;
}

/** Follow Up ÷ Conversations × 100 — share of conversations parked for a callback. */
export function followUpRate(followUp: number, conversations: number): number | null {
  const rate = safeDivide(followUp, conversations);
  return rate === null ? null : rate * 100;
}

/** DQ ÷ (Conversations + DQ + Wrong#) × 100 — disqualified share of worked leads, a list-quality signal */
export function dqRate(dq: number, conversations: number, wrongNumber: number): number | null {
  const rate = safeDivide(dq, outcomesWorked(conversations, dq, wrongNumber));
  return rate === null ? null : rate * 100;
}

/** Wrong# ÷ (Conversations + DQ + Wrong#) × 100 — bad-contact-info share of worked leads, a list-quality signal */
export function wrongNumberRate(wrongNumber: number, conversations: number, dq: number): number | null {
  const rate = safeDivide(wrongNumber, outcomesWorked(conversations, dq, wrongNumber));
  return rate === null ? null : rate * 100;
}

export interface RawTotals {
  dials: number;
  conversations: number;
  appointments: number;
  dq: number;
  wrongNumber: number;
  /**
   * Tapped when someone answers. Currently logged inconsistently — far fewer
   * pick ups exist than outcomes — so it's carried as a count and deliberately
   * not used as the denominator of any rate until the habit is reliable.
   */
  pickUps: number;
  notInterested: number;
  followUp: number;
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
  dqRate: number | null;
  wrongNumberRate: number | null;
  notInterestedRate: number | null;
  followUpRate: number | null;
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
    dqRate: dqRate(totals.dq, totals.conversations, totals.wrongNumber),
    wrongNumberRate: wrongNumberRate(totals.wrongNumber, totals.conversations, totals.dq),
    notInterestedRate: notInterestedRate(totals.notInterested, totals.conversations),
    followUpRate: followUpRate(totals.followUp, totals.conversations),
  };
}

export const EMPTY_TOTALS: RawTotals = {
  dials: 0,
  conversations: 0,
  appointments: 0,
  dq: 0,
  wrongNumber: 0,
  pickUps: 0,
  notInterested: 0,
  followUp: 0,
  durationSeconds: 0,
};

export function sumTotals(rows: RawTotals[]): RawTotals {
  return rows.reduce<RawTotals>(
    (acc, row) => ({
      dials: acc.dials + row.dials,
      conversations: acc.conversations + row.conversations,
      appointments: acc.appointments + row.appointments,
      dq: acc.dq + row.dq,
      wrongNumber: acc.wrongNumber + row.wrongNumber,
      pickUps: acc.pickUps + row.pickUps,
      notInterested: acc.notInterested + row.notInterested,
      followUp: acc.followUp + row.followUp,
      durationSeconds: acc.durationSeconds + row.durationSeconds,
    }),
    { ...EMPTY_TOTALS },
  );
}
