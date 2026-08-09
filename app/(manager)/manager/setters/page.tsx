import Link from "next/link";
import { getSetterRows } from "@/lib/analytics/setters";
import { parseRangeParam, DATE_RANGE_LABELS } from "@/lib/utils/date-range";
import { DateRangeFilter } from "@/components/manager/DateRangeFilter";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatInt, formatPercent, formatRate } from "@/lib/format/number";

export default async function SettersPage({ searchParams }: PageProps<"/manager/setters">) {
  const params = await searchParams;
  const { preset, range } = parseRangeParam(params);
  const rows = await getSetterRows(range);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Setters</h1>
          <p className="mt-1 text-sm text-text-tertiary">Individual performance — {DATE_RANGE_LABELS[preset]}.</p>
        </div>
        <DateRangeFilter />
      </div>

      {rows.length === 0 ? (
        <EmptyState title="No activity in this range" description="Try a wider date range." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Setter</TableHeadCell>
              <TableHeadCell>Conversations</TableHeadCell>
              <TableHeadCell>Appointments</TableHeadCell>
              <TableHeadCell>Set Rate</TableHeadCell>
              <TableHeadCell>DQ Rate</TableHeadCell>
              <TableHeadCell>Wrong # Rate</TableHeadCell>
              <TableHeadCell>Appts / Hour</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                <TableCell>
                  <Link href={`/manager/setters/${row.id}`} className="font-medium text-text-primary hover:text-accent">
                    {row.name}
                  </Link>
                </TableCell>
                <TableCell className="font-mono tabular-nums">{formatInt(row.conversations)}</TableCell>
                <TableCell className="font-mono tabular-nums text-accent">{formatInt(row.appointments)}</TableCell>
                <TableCell className="font-mono tabular-nums">{formatPercent(row.metrics.setRateFromConversations)}</TableCell>
                <TableCell className="font-mono tabular-nums">{formatPercent(row.metrics.dqRate)}</TableCell>
                <TableCell className="font-mono tabular-nums">{formatPercent(row.metrics.wrongNumberRate)}</TableCell>
                <TableCell className="font-mono tabular-nums">{formatRate(row.metrics.appointmentsPerHour)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
