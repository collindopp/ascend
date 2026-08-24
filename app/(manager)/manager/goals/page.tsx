import { getWeeklyGoalProgress, getCurrentWeekRange } from "@/lib/goals/queries";
import { WeeklyGoalRow } from "@/components/manager/WeeklyGoalRow";
import { Table, TableHead, TableHeadCell, TableBody } from "@/components/ui/Table";
import { LocalDateTime } from "@/components/ui/LocalDateTime";

export default async function GoalsPage() {
  const rows = await getWeeklyGoalProgress();
  const week = getCurrentWeekRange();
  const byName = [...rows].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-lg font-semibold text-text-primary">Weekly Sets Goal</h1>
        <p className="mt-1 text-sm text-text-tertiary">
          Set each rep&rsquo;s target for the week of <LocalDateTime iso={week.start.toISOString()} options={{ month: "short", day: "numeric" }} /> –{" "}
          <LocalDateTime iso={week.end.toISOString()} options={{ month: "short", day: "numeric" }} />. Everyone sees their
          progress on the Leaderboard.
        </p>
      </div>

      <Table>
        <TableHead>
          <tr>
            <TableHeadCell>Rep</TableHeadCell>
            <TableHeadCell>This Week</TableHeadCell>
            <TableHeadCell>Goal</TableHeadCell>
          </tr>
        </TableHead>
        <TableBody>
          {byName.map((row) => (
            <WeeklyGoalRow key={row.id} setterId={row.id} setterName={row.name} currentSets={row.current} initialTarget={row.target} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
