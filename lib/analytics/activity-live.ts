"use server";

import { requireActionRole } from "@/lib/auth/guard";
import { getActiveNow, type ActiveNowRow } from "@/lib/analytics/activity";

export type FetchActiveNowResult = { ok: true; data: ActiveNowRow[] } | { ok: false; error: string };

/** Polled by the Active Now panel so managers see idle/working status without a manual refresh. */
export async function fetchActiveNow(): Promise<FetchActiveNowResult> {
  await requireActionRole(["MANAGER", "ADMIN"]);
  const data = await getActiveNow();
  return { ok: true, data };
}
