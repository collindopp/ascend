import { requireActionRole } from "@/lib/auth/guard";
import { getSessionsForExport } from "@/lib/analytics/sessions-explorer";
import { parseRangeParam } from "@/lib/utils/date-range";
import { toCsv, csvResponse } from "@/lib/utils/csv";
import { deriveMetrics } from "@/lib/metrics/core";

export async function GET(request: Request) {
  try {
    await requireActionRole(["MANAGER", "ADMIN"]);
  } catch {
    return new Response("Not authorized", { status: 403 });
  }

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  const { range } = parseRangeParam(params);
  const setterId = typeof params.setter === "string" ? params.setter : undefined;
  const leadListId = typeof params.leadList === "string" ? params.leadList : undefined;

  const sessions = await getSessionsForExport({ range, setterId, leadListId });

  const csv = toCsv(sessions, [
    { key: "setter", label: "Setter", value: (s) => s.setter.name },
    { key: "leadList", label: "Lead List", value: (s) => s.leadList.name },
    { key: "startedAt", label: "Started At", value: (s) => s.startedAt.toISOString() },
    { key: "endedAt", label: "Ended At", value: (s) => (s.endedAt ? s.endedAt.toISOString() : null) },
    {
      key: "durationMinutes",
      label: "Duration (min)",
      value: (s) => Math.round(((s.endedAt ?? new Date()).getTime() - s.startedAt.getTime()) / 60000),
    },
    { key: "status", label: "Status", value: (s) => s.status },
    { key: "conversations", label: "Conversations", value: (s) => s.conversations },
    { key: "appointments", label: "Appointments", value: (s) => s.appointments },
    { key: "dq", label: "DQ", value: (s) => s.dq },
    { key: "wrongNumber", label: "Wrong #", value: (s) => s.wrongNumber },
    {
      key: "setRate",
      label: "Set Rate (%)",
      value: (s) => {
        const durationSeconds = Math.max(0, Math.round(((s.endedAt ?? new Date()).getTime() - s.startedAt.getTime()) / 1000));
        const m = deriveMetrics({
          dials: s.dials,
          conversations: s.conversations,
          appointments: s.appointments,
          dq: s.dq,
          wrongNumber: s.wrongNumber,
          durationSeconds,
        });
        return m.setRateFromConversations !== null ? m.setRateFromConversations.toFixed(1) : null;
      },
    },
  ]);

  const filename = `ascend-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  return csvResponse(csv, filename);
}
