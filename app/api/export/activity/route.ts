import { requireActionRole } from "@/lib/auth/guard";
import { getActivityFeedForExport, EVENT_TYPE_LABELS } from "@/lib/analytics/activity";
import { parseRangeParam } from "@/lib/utils/date-range";
import { toCsv, csvResponse } from "@/lib/utils/csv";

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

  const rows = await getActivityFeedForExport({ range, setterId });

  const csv = toCsv(rows, [
    { key: "time", label: "Time", value: (r) => r.createdAt.toISOString() },
    { key: "setter", label: "Rep", value: (r) => r.setterName },
    { key: "type", label: "Event", value: (r) => EVENT_TYPE_LABELS[r.type] ?? r.type },
    { key: "leadList", label: "Lead List", value: (r) => r.leadListName },
    { key: "note", label: "Note", value: (r) => r.note },
    { key: "sessionId", label: "Session ID", value: (r) => r.sessionId },
  ]);

  const filename = `ascend-rep-activity-${new Date().toISOString().slice(0, 10)}.csv`;
  return csvResponse(csv, filename);
}
