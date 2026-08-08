import { getTeamsForAdmin } from "@/lib/admin/queries";
import { AddTeamModal } from "@/components/admin/AddTeamModal";
import { Table, TableHead, TableHeadCell, TableBody, TableRow, TableCell } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatInt } from "@/lib/format/number";

export default async function TeamsPage() {
  const teams = await getTeamsForAdmin();

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-text-primary">Teams</h1>
          <p className="mt-1 text-sm text-text-tertiary">{teams.length} teams.</p>
        </div>
        <AddTeamModal />
      </div>

      {teams.length === 0 ? (
        <EmptyState title="No teams yet" description="Create a team to start organizing users." />
      ) : (
        <Table>
          <TableHead>
            <tr>
              <TableHeadCell>Name</TableHeadCell>
              <TableHeadCell>Members</TableHeadCell>
            </tr>
          </TableHead>
          <TableBody>
            {teams.map((team) => (
              <TableRow key={team.id}>
                <TableCell className="font-medium text-text-primary">{team.name}</TableCell>
                <TableCell className="font-mono tabular-nums">{formatInt(team._count.users)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
