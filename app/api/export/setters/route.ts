import { requireActionRole } from "@/lib/auth/guard";
import { getSetterRows } from "@/lib/analytics/setters";
import { parseRangeParam } from "@/lib/utils/date-range";
import { toCsv, csvResponse } from "@/lib/utils/csv";
import { formatPercent, formatRate } from "@/lib/format/number";

export async function GET(request: Request) {
  try {
    await requireActionRole(["MANAGER", "ADMIN"]);
  } catch {
    return new Response("Not authorized", { status: 403 });
  }

  const url = new URL(request.url);
  const params = Object.fromEntries(url.searchParams);
  const { range } = parseRangeParam(params);

  const rows = await getSetterRows(range);

  const csv = toCsv(rows, [
    { key: "name", label: "Setter", value: (r) => r.name },
    { key: "conversations", label: "Conversations", value: (r) => r.conversations },
    { key: "appointments", label: "Appointments", value: (r) => r.appointments },
    { key: "dq", label: "DQ", value: (r) => r.dq },
    { key: "wrongNumber", label: "Wrong #", value: (r) => r.wrongNumber },
    { key: "textAppointments", label: "Text Appointments", value: (r) => r.textAppointments },
    { key: "totalSets", label: "Total Sets", value: (r) => r.appointments + r.textAppointments },
    { key: "pickUps", label: "Pick Ups", value: (r) => r.pickUps },
    { key: "notInterested", label: "Not Interested", value: (r) => r.notInterested },
    { key: "followUp", label: "Follow Up", value: (r) => r.followUp },
    { key: "sessionsCount", label: "Sessions", value: (r) => r.sessionsCount },
    { key: "setRate", label: "Set Rate", value: (r) => formatPercent(r.metrics.setRateFromConversations) },
    { key: "dqRate", label: "DQ Rate", value: (r) => formatPercent(r.metrics.dqRate) },
    { key: "wrongNumberRate", label: "Wrong # Rate", value: (r) => formatPercent(r.metrics.wrongNumberRate) },
    { key: "notInterestedRate", label: "Not Interested Rate", value: (r) => formatPercent(r.metrics.notInterestedRate) },
    { key: "followUpRate", label: "Follow Up Rate", value: (r) => formatPercent(r.metrics.followUpRate) },
    { key: "appointmentsPerHour", label: "Appts / Hour", value: (r) => formatRate(r.metrics.appointmentsPerHour) },
  ]);

  const filename = `ascend-setters-${new Date().toISOString().slice(0, 10)}.csv`;
  return csvResponse(csv, filename);
}
